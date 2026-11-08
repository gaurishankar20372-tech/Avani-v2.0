import React from "react";
import { PhoneCall, PhoneOff, VolumeX, Sparkles } from "lucide-react";
import { CallState } from "../types";

interface CallMutedStatusBarProps {
  callState: CallState;
  onEndCall: () => void;
}

export const CallMutedStatusBar: React.FC<CallMutedStatusBarProps> = ({
  callState,
  onEndCall,
}) => {
  if (!callState.isCallActive) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="bg-slate-900/95 border border-amber-500/40 rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-white">
        {/* Left: Call Pulse Icon & Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-ping" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                <VolumeX className="w-3.5 h-3.5" />
                कॉल चालू • प्राइवेसी शील्ड (माइक बंद)
              </span>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
                {formatDuration(callState.durationSeconds)}
              </span>
            </div>
            <p className="text-xs text-slate-300 truncate font-medium mt-0.5">
              {callState.contactName || "फ़ोन कॉल"}{" "}
              <span className="text-emerald-400 text-[11px] font-mono">
                • 100% प्राइवेट (माइक पूरी तरह बंद)
              </span>
            </p>
          </div>
        </div>

        {/* Right: End Call / Unmute Button */}
        <button
          onClick={onEndCall}
          className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/30 hover:scale-[1.02] active:scale-95 transition-all border border-rose-400/40"
          title="कॉल समाप्त करें और अवनी को चालू करें"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span>कॉल समाप्त</span>
        </button>
      </div>
    </div>
  );
};
