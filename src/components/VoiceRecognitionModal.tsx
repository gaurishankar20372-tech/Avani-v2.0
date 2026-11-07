import React, { useState, useEffect } from "react";
import {
  Mic,
  X,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Volume2,
  Trash2,
  Plus,
  Check,
  Activity,
  Award,
  Users,
} from "lucide-react";
import { VoiceProfile, LiveSpeakerState } from "../types";
import { voiceRecognitionEngine } from "../utils/voiceRecognitionEngine";

interface VoiceRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveSpeaker?: LiveSpeakerState;
  onSpeakSample?: (text: string) => void;
}

export const VoiceRecognitionModal: React.FC<VoiceRecognitionModalProps> = ({
  isOpen,
  onClose,
  liveSpeaker,
  onSpeakSample,
}) => {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [isUniversalActive, setIsUniversalActive] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [newSpeakerName, setNewSpeakerName] = useState<string>("");
  const [newSpeakerRole, setNewSpeakerRole] = useState<
    "user" | "friend" | "family" | "guest"
  >("user");
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  // Sync profiles and universal mode on open
  useEffect(() => {
    if (isOpen) {
      setProfiles(voiceRecognitionEngine.getProfiles());
      setIsUniversalActive(voiceRecognitionEngine.getUniversalMode());
      voiceRecognitionEngine.syncWithFirestore().then((synced) => {
        setProfiles(synced);
      });
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleUniversal = () => {
    const nextState = !isUniversalActive;
    setIsUniversalActive(nextState);
    voiceRecognitionEngine.setUniversalMode(nextState);
  };

  const handleRegisterNewSpeaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpeakerName.trim()) return;

    const detectedPitch = liveSpeaker?.pitchHz || 160;
    const created = await voiceRecognitionEngine.registerSpeaker(
      newSpeakerName.trim(),
      newSpeakerRole,
      detectedPitch > 0 ? detectedPitch : undefined
    );
    setProfiles(voiceRecognitionEngine.getProfiles());
    setIsRegistering(false);
    setNewSpeakerName("");

    const remark = `बधाई हो! ${created.name} की आवाज़ अवनी की मेमोरी में रजिस्टर हो गई है (${created.pitchAverageHz} Hz)। अब अवनी उन्हें सीधे पहचान लेगी!`;
    setTestSuccessMessage(remark);
    if (onSpeakSample) {
      onSpeakSample(remark);
    }
  };

  const handleDeleteProfile = async (id: string, name: string) => {
    await voiceRecognitionEngine.deleteSpeaker(id);
    setProfiles(voiceRecognitionEngine.getProfiles());
    setTestSuccessMessage(`${name} की वॉयस प्रोफाइल हटा दी गई।`);
  };

  const currentPitch = liveSpeaker?.pitchHz || 0;
  const currentCategory = liveSpeaker?.categoryLabel || "शांति / तैयार (Listening)";
  const matchedName = liveSpeaker?.matchedSpeakerName || "यूनिवर्सल लिसनर";

  return (
    <div
      id="voice-recognition-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-black border border-neutral-800 text-white shadow-[0_25px_70px_rgba(0,0,0,0.95)] ring-1 ring-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-modal-title"
      >
        {/* Header - Pitch Black */}
        <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between bg-black shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="voice-modal-title" className="text-base font-bold text-white tracking-tight">
                  यूनिवर्सल आवाज़ पहचान
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  Universal Voice
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                किसी की भी आवाज़ पहचानना & रियल-टाइम पिच एडॉप्टेशन
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
            title="बंद करें"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm bg-black custom-scrollbar">
          {/* Universal Voice Toggle Card */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3 shadow-inner">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  यूनिवर्सल मोड (Universal Voice Recognition)
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                सक्रिय होने पर अवनी परिवार, दोस्तों, बच्चों, बड़ों और किसी भी नए व्यक्ति की आवाज़ को तुरंत पहचान कर स्वीकार करती है।
              </p>
            </div>

            <button
              onClick={handleToggleUniversal}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isUniversalActive ? "bg-emerald-500" : "bg-neutral-800"
              }`}
              role="switch"
              aria-checked={isUniversalActive}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isUniversalActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Real-Time Live Voice & Pitch Meter */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <Activity className="w-4 h-4 text-pink-400 animate-pulse" />
                लाइव वॉयस पिच डिटेक्टर (Live Voice Analyzer)
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/30">
                {currentPitch > 0 ? `${currentPitch} Hz` : "आवाज़ का इंतज़ार..."}
              </span>
            </div>

            {/* Pitch Gauge Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2.5 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-pink-500 to-amber-400 transition-all duration-150"
                  style={{
                    width: currentPitch > 0 ? `${Math.min(100, (currentPitch / 400) * 100)}%` : "0%",
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>पुरुष स्वर (85-165 Hz)</span>
                <span>महिला स्वर (165-255 Hz)</span>
                <span>बच्चा स्वर (260+ Hz)</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-black border border-neutral-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-neutral-300 font-medium">पहचाना गया वक्ता:</span>
              </div>
              <span className="font-bold text-white font-mono truncate max-w-[200px]">
                {matchedName}
              </span>
            </div>

            <div className="text-[11px] text-neutral-400 italic">
              वर्तमान फ्रीक्वेंसी वर्गीकरण: <strong className="text-pink-300 not-italic">{currentCategory}</strong>
            </div>
          </div>

          {/* Notice Feedback Message */}
          {testSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-2 animate-in fade-in">
              <span>{testSuccessMessage}</span>
              <button
                onClick={() => setTestSuccessMessage(null)}
                className="text-emerald-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Registered Voice Profiles List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
                पंजीकृत आवाज़ प्रोफाइल (Voice Profiles):
              </h4>
              <button
                onClick={() => setIsRegistering((prev) => !prev)}
                className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-pink-400" />
                <span>नई आवाज़ जोड़ें</span>
              </button>
            </div>

            {/* Inline Registration Form */}
            {isRegistering && (
              <form
                onSubmit={handleRegisterNewSpeaker}
                className="p-3.5 rounded-2xl bg-neutral-950 border border-pink-500/40 space-y-3 animate-in fade-in zoom-in-95"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">नई आवाज़ प्रोफाइल रजिस्टर करें:</span>
                  <span className="text-[10px] text-pink-300 font-mono">
                    लाइव सैंपल: {currentPitch > 0 ? `${currentPitch} Hz` : "डिफ़ॉल्ट 160 Hz"}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-400 block">
                    वक्ता का नाम (Speaker Name):
                  </label>
                  <input
                    type="text"
                    value={newSpeakerName}
                    onChange={(e) => setNewSpeakerName(e.target.value)}
                    placeholder="उदा. राहुल, प्रिया, माँ, दोस्त"
                    required
                    className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    आवाज़ सेव करें (Save Voice)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-semibold"
                  >
                    रद्द करें
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="space-y-2">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/90 flex items-center justify-between gap-3 group hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-pink-400 shrink-0 font-bold text-xs">
                      {profile.role === "creator" ? (
                        <Award className="w-4 h-4 text-amber-400" />
                      ) : (
                        profile.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {profile.name}
                        </span>
                        {profile.role === "creator" && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Creator
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 font-mono truncate">
                        {profile.timbreLabel} • {profile.pitchAverageHz} Hz
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {profile.role !== "creator" && profile.id !== "vp_universal_listener" && (
                      <button
                        onClick={() => handleDeleteProfile(profile.id, profile.name)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="प्रोफाइल हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer - Pitch Black */}
        <div className="px-5 py-3.5 border-t border-neutral-800/80 bg-black flex items-center justify-between shrink-0">
          <span className="text-[11px] text-neutral-500">
            अवनी 2.O • सभी एक्सेंट & पिच सपोर्ट
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/80 text-xs font-bold transition-all active:scale-95"
          >
            ठीक है (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
