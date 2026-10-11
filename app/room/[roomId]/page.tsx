'use client';

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { usePeerVoiceCall } from '../../hooks/use-peer-voice-call';
import { useRoomPresence, type RoomTranscript } from '../../hooks/use-room-presence';

type TranscriptItem = {
  id: number;
  original: string;
  severity: "GREEN" | "ORANGE" | "RED" | "PENDING";
  corrected?: string;
};

function PracticeRoomContent() {
  const { roomId } = useParams<{ roomId: string }>();
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [transcriptsList, setTranscriptsList] = useState<TranscriptItem[]>([]);
  const [mode, setMode] = useState<'INSTANT' | 'MANUAL'>('INSTANT');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const {
    isConnected: isCallConnected,
    isConnecting: isCallJoining,
    error: callError,
    remoteStreams,
    toggleVoiceCall,
  } = usePeerVoiceCall(roomId);
  const {
    userId,
    displayName,
    setDisplayName,
    participants,
    error: roomError,
    publishTranscript,
  } = useRoomPresence(roomId);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptsList, liveTranscript]);

  const shareTranscript = useCallback((item: TranscriptItem) => {
    const transcript: RoomTranscript = {
      id: String(item.id),
      original: item.original,
      severity: item.severity,
      corrected: item.corrected,
    };
    void publishTranscript(transcript).catch((error: unknown) => {
      console.error('Failed to share transcript with the room:', error);
    });
  }, [publishTranscript]);

  const evaluateGrammar = useCallback(async (text: string, sentenceId: number) => {
    try {
      const response = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });
      
      const result = await response.json();

      if (result.success && result.data) {
        const updatedItem: TranscriptItem = {
          id: sentenceId,
          original: text,
          severity: result.data.severity,
          corrected: result.data.corrected,
        };
        setTranscriptsList((prev) =>
          prev.map((item) =>
            item.id === sentenceId
              ? {
                  ...updatedItem,
                }
              : item
          )
        );
        shareTranscript(updatedItem);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Evaluation failed:", error);
      const fallbackItem: TranscriptItem = {
        id: sentenceId,
        original: text,
        severity: "GREEN",
        corrected: text,
      };
      setTranscriptsList((prev) =>
        prev.map((item) =>
          item.id === sentenceId ? fallbackItem : item
        )
      );
      shareTranscript(fallbackItem);
    }
  }, [shareTranscript]);

  const commitManualSentence = useCallback(() => {
    if (!liveTranscript.trim()) return;
    const newId = Date.now();
    const newSentence: TranscriptItem = {
      id: newId,
      original: liveTranscript.trim(),
      severity: "PENDING",
    };
    setTranscriptsList((prev) => [...prev, newSentence]);
    shareTranscript(newSentence);
    const textToEvaluate = liveTranscript.trim();
    setLiveTranscript('');
    
    evaluateGrammar(textToEvaluate, newId);
  }, [evaluateGrammar, liveTranscript, shareTranscript]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser. Use Chrome.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn("Speech recognition notice:", event.error);
      }
    };

    recognition.onresult = (event: any) => {
      let interimText = '';
      let finalingText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalingText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (mode === 'INSTANT') {
        if (finalingText.trim()) {
          const newId = Date.now();
          const textFinal = finalingText.trim();
          const newSentence: TranscriptItem = {
            id: newId,
            original: textFinal,
            severity: "PENDING",
          };
          setTranscriptsList((prev) => [...prev, newSentence]);
          shareTranscript(newSentence);
          setLiveTranscript('');
          
          evaluateGrammar(textFinal, newId);
        } else {
          setLiveTranscript(interimText);
        }
      } else {
        setLiveTranscript(interimText || finalingText);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {}
  }, [evaluateGrammar, mode, shareTranscript]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'INSTANT' ? 'MANUAL' : 'INSTANT';
    setMode(newMode);
    setLiveTranscript('');
    if (isListening) {
      stopListening();
      setTimeout(() => startListening(), 200);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-cyberBlack text-white p-4">
      {remoteStreams.map(({ peerId, stream }) => (
        <RemoteAudio key={peerId} stream={stream} />
      ))}

      {/* Room Header */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-widest text-cyberYellow">VOXORA // ROOM: {roomId}</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/20 bg-zinc-800 px-4 py-1.5 text-xs font-bold text-zinc-300 transition hover:bg-zinc-700"
          >
            ← HOME
          </Link>

          <label className="flex items-center gap-2 text-xs text-zinc-400">
            Name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={40}
              aria-label="Your display name"
              className="w-32 rounded-full border border-white/20 bg-zinc-800 px-3 py-1.5 text-xs text-white outline-none focus:border-cyberYellow"
            />
          </label>

          <button 
            onClick={toggleMode}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition border ${
              mode === 'MANUAL' 
                ? 'bg-cyberYellow/20 border-cyberYellow text-cyberYellow' 
                : 'bg-blue-500/20 border-blue-500 text-blue-500'
            }`}
          >
            MODE: {mode}
          </button>
          
          <button 
            onClick={toggleListening}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition border ${
              isListening 
                ? 'bg-cyberRed/20 border-cyberRed text-cyberRed animate-pulse' 
                : 'bg-cyberGreen/20 border-cyberGreen text-cyberGreen'
            }`}
          >
            {isListening ? '🔴 MIC LIVE (STOP)' : '🎙️ START SPEAKING'}
          </button>

          <button
            onClick={toggleVoiceCall}
            disabled={isCallJoining}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition border ${
              isCallConnected
                ? 'bg-cyberGreen/20 border-cyberGreen text-cyberGreen animate-pulse'
                : 'bg-zinc-800 border-white/20 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {isCallJoining
              ? '📞 CONNECTING...'
              : isCallConnected
                ? '📞 IN VOICE CALL (LEAVE)'
                : '📞 JOIN VOICE CALL'}
          </button>

          {(callError || roomError) && (
            <span role="alert" className="text-xs text-cyberRed">
              {callError || roomError}
            </span>
          )}
        </div>
      </div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-[minmax(280px,1fr)] gap-4 flex-1 overflow-y-auto">
        {/* User Panel */}
        <div className="flex flex-col bg-cyberDark border border-cyberYellow text-cyberYellow rounded-xl p-4 overflow-hidden">
          <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3">
            <div>
              <span className="block font-bold tracking-wider">{displayName || 'Guest'} (You) - [{mode}]</span>
              <span className="block text-xs text-zinc-500">{userId || 'Connecting to room...'}</span>
            </div>
            <span className={`size-2 rounded-full ${isListening ? 'bg-cyberRed animate-ping' : 'bg-cyberGreen animate-pulse'}`} />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm">
            {transcriptsList.map((item) => {
              const borderColor = 
                item.severity === 'RED' ? 'border-cyberRed/40 text-cyberRed' :
                item.severity === 'ORANGE' ? 'border-orange-500/40 text-orange-400' :
                item.severity === 'GREEN' ? 'border-cyberGreen/40 text-cyberGreen' :
                'border-cyberYellow/30 text-cyberYellow';

              return (
                <div key={item.id} className={`p-3 bg-black/40 rounded border ${borderColor} space-y-2`}>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">[Original]</p>
                    <p>{item.original}</p>
                  </div>
                  {item.corrected && item.severity !== 'GREEN' && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-xs text-cyberGreen mb-1">[AI Corrected Version]</p>
                      <p className="text-cyberGreen font-semibold">{item.corrected}</p>
                    </div>
                  )}
                  {item.severity === "PENDING" && (
                    <div className="pt-2 border-t border-white/5 text-xs text-cyberYellow animate-pulse">
                      ⚡ Analyzing grammar...
                    </div>
                  )}
                </div>
              );
            })}
            
            {isListening && liveTranscript && (
              <div className="p-3 bg-black/50 rounded border border-cyberYellow animate-pulse space-y-2">
                <p className="text-xs text-cyberYellow mb-1">[Speaking Live...]</p>
                <p className="text-white">{liveTranscript}</p>
                
                {mode === 'MANUAL' && (
                  <div className="pt-2 border-t border-white/10 flex justify-end">
                    <button 
                      onClick={commitManualSentence}
                      className="px-3 py-1 bg-cyberYellow text-black font-bold text-xs rounded hover:bg-yellow-400 transition"
                    >
                      ✓ COMMIT SENTENCE
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
        </div>

        {participants.map((participant) => (
          <div
            key={participant.userId}
            className="flex flex-col bg-cyberDark border border-cyberGreen text-cyberGreen rounded-xl p-4 overflow-hidden"
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3">
              <div className="min-w-0">
                <span className="block truncate font-bold tracking-wider">{participant.displayName}</span>
                <span className="block truncate text-xs text-zinc-500">{participant.userId}</span>
              </div>
              <span className="size-2 shrink-0 rounded-full bg-cyberGreen animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-sm">
              {participant.transcripts.length ? participant.transcripts.map((item) => (
                <div key={item.id} className="p-3 bg-black/40 rounded border border-cyberGreen/30 space-y-2">
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">[Original]</p>
                    <p>{item.original}</p>
                  </div>
                  {item.corrected && item.severity !== 'GREEN' && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-xs text-cyberGreen mb-1">[AI Corrected Version]</p>
                      <p className="font-semibold">{item.corrected}</p>
                    </div>
                  )}
                  {item.severity === 'PENDING' && (
                    <div className="pt-2 border-t border-white/5 text-xs text-cyberYellow animate-pulse">
                      ⚡ Analyzing grammar...
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-xs text-zinc-500">Waiting for this participant to speak...</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.srcObject = stream;
    void audio.play().catch((error: unknown) => {
      console.warn('Remote audio playback was blocked by the browser:', error);
    });
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}

export default function PracticeRoom() {
  return (
    <Suspense fallback={<div className="p-4 text-white">Loading room...</div>}>
      <PracticeRoomContent />
    </Suspense>
  );
}