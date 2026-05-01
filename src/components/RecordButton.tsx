import { Mic, Loader2, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type State = "idle" | "recording" | "processing";

interface Props {
  state: State;
  onPress: () => void;
  onRelease: () => void;
}

export const RecordButton = ({ state, onPress, onRelease }: Props) => {
  const isRecording = state === "recording";
  const isProcessing = state === "processing";

  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <>
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ripple" />
          <span className="absolute inset-0 rounded-full bg-secondary/20 animate-ripple [animation-delay:0.4s]" />
          <span className="absolute inset-0 rounded-full bg-primary/10 animate-ripple [animation-delay:0.8s]" />
        </>
      )}
      <button
        type="button"
        disabled={isProcessing}
        onMouseDown={onPress}
        onMouseUp={onRelease}
        onMouseLeave={() => isRecording && onRelease()}
        onTouchStart={(e) => { e.preventDefault(); onPress(); }}
        onTouchEnd={(e) => { e.preventDefault(); onRelease(); }}
        className={cn(
          "relative z-10 h-20 w-20 rounded-full flex items-center justify-center",
          "bg-gradient-primary text-primary-foreground",
          "transition-all duration-300 select-none",
          "border border-primary/40",
          isRecording && "scale-110 animate-pulse-glow",
          !isRecording && !isProcessing && "glow-record hover:scale-105 active:scale-95",
          isProcessing && "opacity-80 cursor-wait",
        )}
        aria-label={isRecording ? "Release to stop recording" : "Hold to record"}
      >
        {isProcessing ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isRecording ? (
          <Square className="h-7 w-7 fill-current" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </button>
    </div>
  );
};
