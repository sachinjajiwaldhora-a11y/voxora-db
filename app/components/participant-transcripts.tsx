"use client";

import { useEffect } from "react";
import {
  useLiveTranscripts,
  type LiveTranscript,
  type TranscriptManager,
} from "../hooks/use-live-transcripts";

type Participant = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  color: string;
  status: string;
  online: boolean;
};

type ParticipantTranscriptsProps = {
  participants: Participant[];
  initialTranscripts?: LiveTranscript[];
  onTranscriptManager?: (manager: TranscriptManager) => void;
};

const severityClasses = {
  correct: "text-cyberGreen",
  minor: "text-cyberOrange",
  significant: "text-cyberRed",
} as const;

export function ParticipantTranscripts({
  participants,
  initialTranscripts = [],
  onTranscriptManager,
}: ParticipantTranscriptsProps) {
  const { transcripts, manager } = useLiveTranscripts();

  useEffect(() => {
    onTranscriptManager?.(manager);
  }, [manager, onTranscriptManager]);

  const visibleTranscripts = [...initialTranscripts, ...transcripts];

  return (
    <ul className="mt-2 divide-y divide-white/[0.05]">
      {participants.map((participant) => {
        const participantTranscripts = visibleTranscripts.filter(
          (transcript) => transcript.participantId === participant.id,
        );

        return (
          <li key={participant.id} className="py-3.5">
            <div className="flex items-center gap-3">
              <span className={`relative grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${participant.color} text-[11px] font-bold text-white`}>
                {participant.initials}
                <span className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-cyberDark ${participant.online ? "bg-cyberGreen" : "bg-zinc-600"}`} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-zinc-200">{participant.name}</p>
                  {participant.status === "Practicing now" && <span className="rounded bg-cyberYellow/[0.1] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-cyberYellow">In room</span>}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">{participant.handle} <span className="px-0.5 text-zinc-700">·</span> {participant.status}</p>
              </div>
              <button type="button" aria-label={`Invite ${participant.name}`} className="rounded-md p-2 text-zinc-600 transition hover:bg-white/[0.06] hover:text-cyberYellow">
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
                  <path d="M5 15 15 5M6 5h9v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {participantTranscripts.length > 0 && (
              <ul className="ml-[52px] mt-2 space-y-2">
                {participantTranscripts.map((transcript) => (
                  <li key={transcript.id}>
                    <p
                      className={`text-sm leading-5 ${
                        transcript.analysis
                          ? severityClasses[transcript.analysis.severity]
                          : "text-cyberYellow"
                      }`}
                    >
                      {transcript.originalText}
                    </p>
                    {transcript.analysis?.correctedText && (
                      <p className="mt-1 border-l-2 border-cyberGreen pl-2 text-sm leading-5 text-cyberGreen">
                        {transcript.analysis.correctedText}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
