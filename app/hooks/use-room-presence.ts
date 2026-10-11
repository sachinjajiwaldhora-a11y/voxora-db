'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseClient, getSupabaseConfig } from '../lib/supabase-client';

export type RoomTranscript = {
  id: string;
  original: string;
  severity: 'GREEN' | 'ORANGE' | 'RED' | 'PENDING';
  corrected?: string;
};

export type RoomParticipant = {
  userId: string;
  displayName: string;
  transcripts: RoomTranscript[];
};

type PresencePayload = {
  userId: string;
  displayName: string;
};

type TranscriptBroadcast = {
  senderId: string;
  senderName: string;
  transcript: RoomTranscript;
};

function isTranscript(value: unknown): value is RoomTranscript {
  if (typeof value !== 'object' || value === null) return false;
  const transcript = value as Record<string, unknown>;
  return (
    typeof transcript.id === 'string' &&
    typeof transcript.original === 'string' &&
    ['GREEN', 'ORANGE', 'RED', 'PENDING'].includes(String(transcript.severity)) &&
    (transcript.corrected === undefined || typeof transcript.corrected === 'string')
  );
}

function getOrCreateUserId() {
  const storageKey = 'voxora-room-user-id';
  const savedUserId = sessionStorage.getItem(storageKey);
  if (savedUserId) return savedUserId;

  const userId = crypto.randomUUID();
  sessionStorage.setItem(storageKey, userId);
  return userId;
}

export function useRoomPresence(roomId: string) {
  const [userId, setUserId] = useState('');
  const [displayName, setDisplayName] = useState('Guest');
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [error, setError] = useState('');
  const supabaseConfig = getSupabaseConfig();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const displayNameRef = useRef(displayName);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    displayNameRef.current = displayName;
  }, [displayName]);

  useEffect(() => {
    const id = getOrCreateUserId();
    const savedName = localStorage.getItem('voxora-display-name');
    // Browser storage is read after hydration to keep server and client markup consistent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserId(id);
    setDisplayName(savedName || `Guest-${id.slice(0, 4)}`);
  }, []);

  useEffect(() => {
    if (!userId) return;

    if (supabaseConfig.error) return;

    const supabaseResult = getSupabaseClient();
    if (!supabaseResult.client) {
      queueMicrotask(() => setError(supabaseResult.error));
      return;
    }

    let active = true;
    const client = supabaseResult.client;
    const channel = client.channel(`room-presence:${roomId}`, {
      config: {
        presence: { key: userId },
        broadcast: { self: false },
      },
    });
    channelRef.current = channel;
    isSubscribedRef.current = false;

    const syncParticipants = () => {
      if (!active) return;

      const presenceState = channel.presenceState<PresencePayload>();
      const activeParticipants = Object.values(presenceState)
        .flat()
        .filter((presence) => presence.userId !== userId)
        .reduce<RoomParticipant[]>((result, presence) => {
          if (!result.some((participant) => participant.userId === presence.userId)) {
            result.push({
              userId: presence.userId,
              displayName: presence.displayName,
              transcripts: [],
            });
          }
          return result;
        }, []);

      setParticipants((current) =>
        activeParticipants.map((participant) => {
          const existing = current.find((item) => item.userId === participant.userId);
          return existing
            ? { ...participant, transcripts: existing.transcripts }
            : participant;
        })
      );
    };

    channel
      .on('presence', { event: 'sync' }, syncParticipants)
      .on('broadcast', { event: 'transcript' }, ({ payload }) => {
        if (!active || typeof payload !== 'object' || payload === null) return;
        const message = payload as Partial<TranscriptBroadcast>;
        if (
          typeof message.senderId !== 'string' ||
          message.senderId === userId ||
          typeof message.senderName !== 'string' ||
          !isTranscript(message.transcript)
        ) {
          return;
        }

        const incomingTranscript = message.transcript;
        setParticipants((current) => {
          const participant = current.find((item) => item.userId === message.senderId);
          if (!participant) {
            return [
              ...current,
              {
                userId: message.senderId!,
                displayName: message.senderName!,
                transcripts: [incomingTranscript],
              },
            ];
          }

          const existingIndex = participant.transcripts.findIndex(
            (item) => item.id === incomingTranscript.id
          );
          const transcripts = [...participant.transcripts];
          if (existingIndex === -1) {
            transcripts.push(incomingTranscript);
          } else {
            transcripts[existingIndex] = incomingTranscript;
          }

          return current.map((item) =>
            item.userId === message.senderId
              ? { ...item, displayName: message.senderName!, transcripts }
              : item
          );
        });
      });

    channel.subscribe((status, subscriptionError) => {
      if (!active) return;
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
        setError('');
        const currentName = displayNameRef.current.trim().slice(0, 40) || `Guest-${userId.slice(0, 4)}`;
        void channel.track({ userId, displayName: currentName })
          .then((result) => {
            if (result !== 'ok') {
              setError(`Could not announce your presence to the room: ${result}`);
            }
          })
          .catch((trackError: unknown) => {
            setError(trackError instanceof Error ? trackError.message : 'Could not announce your presence.');
          });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setError(subscriptionError?.message ?? `Room connection failed: ${status}`);
      }
    });

    return () => {
      active = false;
      isSubscribedRef.current = false;
      channelRef.current = null;
      setParticipants([]);
      void client.removeChannel(channel).then((result) => {
        if (result !== 'ok') {
          console.error(`Room channel cleanup failed: ${result}`);
        }
      }).catch((cleanupError: unknown) => {
        console.error('Room channel cleanup failed:', cleanupError);
      });
    };
  }, [roomId, supabaseConfig.error, userId]);

  useEffect(() => {
    if (!userId) return;

    const safeName = displayName.trim().slice(0, 40) || `Guest-${userId.slice(0, 4)}`;
    localStorage.setItem('voxora-display-name', safeName);
    const channel = channelRef.current;
    if (channel && isSubscribedRef.current) {
      void channel.track({ userId, displayName: safeName }).then((result) => {
        if (result !== 'ok') setError(`Could not update your room name: ${result}`);
      }).catch((trackError: unknown) => {
        setError(trackError instanceof Error ? trackError.message : 'Could not update your room name.');
      });
    }
  }, [displayName, userId]);

  const publishTranscript = useCallback(async (transcript: RoomTranscript) => {
    const channel = channelRef.current;
    if (!channel || !userId) {
      const message = 'Room connection is not ready. Transcript could not be shared.';
      setError(message);
      throw new Error(message);
    }

    const senderName = displayName.trim().slice(0, 40) || `Guest-${userId.slice(0, 4)}`;
    const status = await channel.send({
      type: 'broadcast',
      event: 'transcript',
      payload: { senderId: userId, senderName, transcript } satisfies TranscriptBroadcast,
    });
    if (status !== 'ok') {
      const message = `Transcript could not be shared: ${status}`;
      setError(message);
      throw new Error(message);
    }
  }, [displayName, userId]);

  return {
    userId,
    displayName,
    setDisplayName,
    participants,
    error: error || supabaseConfig.error,
    publishTranscript,
  };
}
