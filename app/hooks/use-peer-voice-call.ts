'use client';

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase-client';

type PeerPresence = {
  peerId: string;
};

type VoiceSignal =
  | { from: string; to: string; type: 'offer' | 'answer'; description: RTCSessionDescriptionInit }
  | { from: string; to: string; type: 'ice'; candidate: RTCIceCandidateInit };

export type RemoteAudioStream = {
  peerId: string;
  stream: MediaStream;
};

function isVoiceSignal(value: unknown): value is VoiceSignal {
  if (typeof value !== 'object' || value === null) return false;

  const signal = value as Record<string, unknown>;
  if (
    typeof signal.from !== 'string' ||
    typeof signal.to !== 'string' ||
    !['offer', 'answer', 'ice'].includes(String(signal.type))
  ) {
    return false;
  }

  if (signal.type === 'ice') {
    return typeof signal.candidate === 'object' && signal.candidate !== null;
  }

  return typeof signal.description === 'object' && signal.description !== null;
}

export function usePeerVoiceCall(roomId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [remoteStreams, setRemoteStreams] = useState<RemoteAudioStream[]>([]);

  const mountedRef = useRef(false);
  const operationRef = useRef(0);
  const peerIdRef = useRef('');
  const clientRef = useRef<SupabaseClient | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());

  const cleanupCall = useCallback(async (updateState = true) => {
    operationRef.current += 1;

    const client = clientRef.current;
    const channel = channelRef.current;
    clientRef.current = null;
    channelRef.current = null;
    peerIdRef.current = '';

    peerConnectionsRef.current.forEach((connection) => connection.close());
    peerConnectionsRef.current.clear();
    pendingIceRef.current.clear();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    if (updateState && mountedRef.current) {
      setIsConnected(false);
      setRemoteStreams([]);
    }

    if (client && channel) {
      const result = await client.removeChannel(channel);
      if (result !== 'ok') {
        throw new Error(`Signaling channel cleanup failed: ${result}`);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      void cleanupCall(false).catch((cleanupError: unknown) => {
        console.error('Failed to clean up peer voice call:', cleanupError);
      });
    };
  }, [cleanupCall]);

  const toggleVoiceCall = useCallback(async () => {
    if (isConnecting) return;

    if (isConnected) {
      setIsConnecting(true);
      setError('');
      try {
        await cleanupCall();
      } catch (cleanupError) {
        setError(cleanupError instanceof Error ? cleanupError.message : 'Could not leave the voice call.');
      } finally {
        setIsConnecting(false);
      }
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase.client) {
      setError(supabase.error);
      return;
    }

    setIsConnecting(true);
    setError('');
    const operationId = ++operationRef.current;
    const peerId = crypto.randomUUID();
    peerIdRef.current = peerId;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (operationRef.current !== operationId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      localStreamRef.current = stream;

      const client = supabase.client;
      const channel = client.channel(`voice-room:${roomId}`, {
        config: {
          presence: { key: peerId },
          broadcast: { self: false },
        },
      });
      clientRef.current = client;
      channelRef.current = channel;

      const sendSignal = async (signal: VoiceSignal) => {
        const status = await channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: signal,
        });
        if (status !== 'ok') {
          throw new Error(`Could not send WebRTC signaling message: ${status}`);
        }
      };

      const createPeerConnection = (remotePeerId: string, shouldOffer: boolean) => {
        const existingConnection = peerConnectionsRef.current.get(remotePeerId);
        if (existingConnection) return existingConnection;

        const connection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        peerConnectionsRef.current.set(remotePeerId, connection);

        stream.getAudioTracks().forEach((track) => {
          connection.addTrack(track, stream);
        });

        connection.onicecandidate = (event) => {
          if (!event.candidate || operationRef.current !== operationId) return;
          void sendSignal({
            from: peerId,
            to: remotePeerId,
            type: 'ice',
            candidate: event.candidate.toJSON(),
          }).catch((signalError: unknown) => {
            if (mountedRef.current) {
              setError(signalError instanceof Error ? signalError.message : 'Could not send network information.');
            }
          });
        };

        connection.ontrack = (event) => {
          const remoteStream = event.streams[0] ?? new MediaStream([event.track]);
          if (mountedRef.current) {
            setRemoteStreams((current) => [
              ...current.filter((item) => item.peerId !== remotePeerId),
              { peerId: remotePeerId, stream: remoteStream },
            ]);
          }
        };

        connection.onconnectionstatechange = () => {
          if (connection.connectionState === 'failed' && mountedRef.current) {
            setError('Peer-to-peer audio connection failed. Your network may require a TURN relay.');
          }
        };

        if (shouldOffer) {
          void (async () => {
            const offer = await connection.createOffer();
            await connection.setLocalDescription(offer);
            await sendSignal({
              from: peerId,
              to: remotePeerId,
              type: 'offer',
              description: offer,
            });
          })().catch((offerError: unknown) => {
            if (mountedRef.current) {
              setError(offerError instanceof Error ? offerError.message : 'Could not start the peer connection.');
            }
          });
        }

        return connection;
      };

      const flushPendingIce = async (remotePeerId: string, connection: RTCPeerConnection) => {
        const candidates = pendingIceRef.current.get(remotePeerId) ?? [];
        pendingIceRef.current.delete(remotePeerId);
        for (const candidate of candidates) {
          await connection.addIceCandidate(candidate);
        }
      };

      const handleSignal = async (value: unknown) => {
        if (!isVoiceSignal(value) || value.to !== peerId || operationRef.current !== operationId) return;

        if (value.type === 'ice') {
          const connection = peerConnectionsRef.current.get(value.from);
          if (!connection || !connection.remoteDescription) {
            const queued = pendingIceRef.current.get(value.from) ?? [];
            queued.push(value.candidate);
            pendingIceRef.current.set(value.from, queued);
          } else {
            await connection.addIceCandidate(value.candidate);
          }
          return;
        }

        const connection =
          peerConnectionsRef.current.get(value.from) ?? createPeerConnection(value.from, false);
        await connection.setRemoteDescription(value.description);
        await flushPendingIce(value.from, connection);

        if (value.type === 'offer') {
          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          await sendSignal({
            from: peerId,
            to: value.from,
            type: 'answer',
            description: answer,
          });
        }
      };

      const syncPeers = () => {
        const presences = channel.presenceState<PeerPresence>();
        const activePeerIds = new Set(
          Object.values(presences)
            .flat()
            .map((presence) => presence.peerId)
            .filter((activePeerId) => activePeerId !== peerId)
        );

        for (const [remotePeerId, connection] of peerConnectionsRef.current) {
          if (!activePeerIds.has(remotePeerId)) {
            connection.close();
            peerConnectionsRef.current.delete(remotePeerId);
            pendingIceRef.current.delete(remotePeerId);
            setRemoteStreams((current) => current.filter((item) => item.peerId !== remotePeerId));
          }
        }

        for (const remotePeerId of activePeerIds) {
          createPeerConnection(remotePeerId, peerId.localeCompare(remotePeerId) < 0);
        }
      };

      channel
        .on('broadcast', { event: 'signal' }, ({ payload }) => {
          void handleSignal(payload).catch((signalError: unknown) => {
            if (mountedRef.current) {
              setError(signalError instanceof Error ? signalError.message : 'WebRTC signaling failed.');
            }
          });
        })
        .on('presence', { event: 'sync' }, syncPeers);

      await new Promise<void>((resolve, reject) => {
        let settled = false;
        channel.subscribe((status, subscriptionError) => {
          if (status === 'SUBSCRIBED' && !settled) {
            settled = true;
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            const failure = subscriptionError ?? new Error(`Could not join the signaling channel: ${status}`);
            if (!settled) {
              settled = true;
              reject(failure);
            } else if (mountedRef.current) {
              setError(failure.message);
            }
          }
        });
      });

      if (operationRef.current !== operationId) return;
      const presenceStatus = await channel.track({ peerId });
      if (presenceStatus !== 'ok') {
        throw new Error(`Could not announce your presence to the room: ${presenceStatus}`);
      }

      syncPeers();
      setIsConnected(true);
    } catch (joinError) {
      const message = joinError instanceof Error ? joinError.message : 'Could not join the voice call.';
      try {
        await cleanupCall();
      } catch (cleanupError) {
        console.error('Failed to clean up after voice-call error:', cleanupError);
      }
      if (mountedRef.current) setError(message);
    } finally {
      if (mountedRef.current) setIsConnecting(false);
    }
  }, [cleanupCall, isConnected, isConnecting, roomId]);

  return { isConnected, isConnecting, error, remoteStreams, toggleVoiceCall };
}
