"use client";

import { useLayoutEffect, useRef } from "react";
import type { LiveTranscript } from "../hooks/use-live-transcripts";

type TranscriptFeedProps = {
  transcripts: LiveTranscript[];
  label: string;
};

const severityClasses = {
  correct: "text-cyberGreen",
  minor: "text-cyberOrange",
  significant: "text-cyberRed",
} as const;

export function TranscriptFeed({ transcripts, label }: TranscriptFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const shouldFollowBottom = useRef(true);

  useLayoutEffect(() => {
    const feed = feedRef.current;
    if (feed && shouldFollowBottom.current) {
      feed.scrollTo({ top: feed.scrollHeight, behavior: "smooth" });
    }
  }, [transcripts.length]);

  return (
    <div
      ref={feedRef}
      role="log"
      aria-label={`${label} transcripts`}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth px-4 py-4"
      onScroll={(event) => {
        const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
        shouldFollowBottom.current =
          scrollHeight - scrollTop - clientHeight <= 48;
      }}
    >
      <ol className="space-y-4">
        {transcripts.map((transcript) => (
          <li key={transcript.id}>
            <p
              className={`break-words text-sm leading-6 ${
                transcript.analysis
                  ? severityClasses[transcript.analysis.severity]
                  : "text-cyberYellow"
              }`}
            >
              {transcript.originalText}
            </p>
            {transcript.analysis?.correctedText && (
              <p className="mt-1 break-words border-l-2 border-cyberGreen pl-2 text-sm leading-6 text-cyberGreen">
                {transcript.analysis.correctedText}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
