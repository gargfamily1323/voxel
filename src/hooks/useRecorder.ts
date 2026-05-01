import { useRef, useState, useCallback, useEffect } from "react";

export type RecorderState = "idle" | "recording" | "processing";

// Minimal types for the Web Speech API (not in lib.dom by default in TS)
type SpeechRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
};
type SpeechRecognitionErrorEvent = { error: string };
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const resolveRef = useRef<((text: string | null) => void) | null>(null);
  const errorRef = useRef<string | null>(null);

  const isSupported = !!getRecognitionCtor();

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      errorRef.current = "unsupported";
      return false;
    }
    try {
      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";

      finalTranscriptRef.current = "";
      errorRef.current = null;

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscriptRef.current += result[0].transcript + " ";
          }
        }
      };

      recognition.onerror = (e) => {
        errorRef.current = e.error;
      };

      recognition.onend = () => {
        const text = finalTranscriptRef.current.trim();
        const resolver = resolveRef.current;
        resolveRef.current = null;
        recognitionRef.current = null;
        if (resolver) resolver(text.length > 0 ? text : null);
        setState("idle");
      };

      recognitionRef.current = recognition;
      recognition.start();
      setState("recording");
      return true;
    } catch (e) {
      console.error("speech recognition start error", e);
      setState("idle");
      return false;
    }
  }, []);

  const stop = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const recognition = recognitionRef.current;
      if (!recognition) {
        resolve(null);
        return;
      }
      resolveRef.current = resolve;
      setState("processing");
      try {
        recognition.stop();
      } catch {
        resolveRef.current = null;
        recognitionRef.current = null;
        setState("idle");
        resolve(null);
      }
    });
  }, []);

  const reset = useCallback(() => setState("idle"), []);

  return { state, start, stop, reset, isSupported, lastError: errorRef };
}
