"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TranscriptFeed } from "./transcript-feed";
import {
  useLiveTranscripts,
  type LiveTranscript,
  type TranscriptManager,
} from "../hooks/use-live-transcripts";

type Participant = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

type PracticeRoomProps = {
  roomId: string;
  participants: Participant[];
  initialTranscripts: LiveTranscript[];
  onTranscriptManager?: (manager: TranscriptManager) => void;
};

export function PracticeRoom({
  roomId,
  participants,
  initialTranscripts,
  onTranscriptManager,
}: PracticeRoomProps) {
  const { transcripts, manager } = useLiveTranscripts(initialTranscripts);

  useEffect(() => {
    onTranscriptManager?.(manager);
  }, [manager, onTranscriptManager]);

  const panelCount = participants.length;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col px-4 pb-6 pt-4 sm:px-8 sm:pt-6">
      <header className="flex items-center justify-between border-b border-white/[0.07] pb-4">
        <Link href="/" className="flex items-center gap-3" aria-label="Voxora home">
          <span className="grid size-9 place-items-center rounded-lg border border-cyberYellow/20 bg-cyberYellow/[0.08] text-sm font-bold text-cyberYellow shadow-neon-yellow">
            V
          </span>
          <span className="text-sm font-semibold tracking-[0.18em] text-white">
            VOXORA
          </span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-400 sm:gap-3">
          <span className="hidden sm:inline">PRACTICE ROOM</span>
          <span className="text-zinc-700">/</span>
          <span className="font-mono text-zinc-300">{roomId}</span>
          <span className="ml-1 flex items-center gap-2 rounded-full border border-cyberGreen/15 bg-cyberGreen/[0.06] px-2.5 py-1.5 text-cyberGreen">
            <span className="size-1.5 rounded-full bg-cyberGreen shadow-neon-green" />
            LIVE
          </span>
        </div>
      </header>

      <section
        aria-label="Participant panels"
        className={`room-panel-grid room-panel-grid--${panelCount} mt-4 flex-1`}
      >
        {participants.map((participant) => {
          const participantTranscripts = transcripts.filter(
            (transcript) => transcript.participantId === participant.id,
          );

          return (
            <article
              key={participant.id}
              className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-cyberDark shadow-[0_0_26px_rgba(250,204,21,0.045)] transition-colors hover:border-cyberYellow/20"
            >
              <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.07] px-4 py-3.5 sm:px-5">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${participant.color} text-[10px] font-bold text-white`}
                >
                  {participant.initials}
                </span>
                <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-100">
                  {participant.name}
                </h2>
                <span className="size-2 rounded-full bg-cyberGreen shadow-neon-green" aria-label="Active" />
              </header>
              <TranscriptFeed
                transcripts={participantTranscripts}
                label={participant.name}
              />
            </article>
          );
        })}
      </section>
    </main>
  );
}
