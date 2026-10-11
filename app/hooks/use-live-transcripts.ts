"use client";

import { useCallback, useMemo, useState } from "react";

export type TranscriptSeverity = "correct" | "minor" | "significant";

export type TranscriptAnalysis = {
  severity: TranscriptSeverity;
  correctedText?: string;
};

export type LiveTranscript = {
  id: string;
  participantId: string;
  originalText: string;
  analysis?: TranscriptAnalysis;
};

export type TranscriptManager = {
  receiveTranscript: (participantId: string, originalText: string) => string;
  applyAnalysis: (transcriptId: string, analysis: TranscriptAnalysis) => void;
};

export function useLiveTranscripts(initialTranscripts: LiveTranscript[] = []) {
  const [transcripts, setTranscripts] = useState(initialTranscripts);

  const receiveTranscript = useCallback(
    (participantId: string, originalText: string) => {
      const id = crypto.randomUUID();
      setTranscripts((current) => [
        ...current,
        { id, participantId, originalText },
      ]);
      return id;
    },
    [],
  );

  const applyAnalysis = useCallback(
    (transcriptId: string, analysis: TranscriptAnalysis) => {
      setTranscripts((current) =>
        current.map((transcript) =>
          transcript.id === transcriptId
            ? { ...transcript, analysis }
            : transcript,
        ),
      );
    },
    [],
  );

  const manager = useMemo<TranscriptManager>(
    () => ({ receiveTranscript, applyAnalysis }),
    [receiveTranscript, applyAnalysis],
  );

  return { transcripts, manager };
}
