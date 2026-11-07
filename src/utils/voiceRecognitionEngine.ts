import { VoiceProfile, VoicePitchCategory, LiveSpeakerState } from "../types";
import { db, getCurrentUserId } from "../lib/firebase";
import { doc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";

const LOCAL_VOICE_PROFILES_KEY = "avani_voice_profiles_cache_v1";
const UNIVERSAL_VOICE_MODE_KEY = "avani_universal_voice_mode_v1";

export const DEFAULT_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: "vp_creator_vinay",
    name: "विनय प्रताप (Vinay Pratap)",
    role: "creator",
    pitchMinHz: 95,
    pitchMaxHz: 160,
    pitchAverageHz: 125,
    timbreLabel: "गंभीर व आत्मविश्वासपूर्ण स्वर (Mastermind Voice)",
    sampleCount: 12,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now(),
  },
  {
    id: "vp_universal_listener",
    name: "यूनिवर्सल लिसनर (सभी आवाज़ें)",
    role: "guest",
    pitchMinHz: 70,
    pitchMaxHz: 800,
    pitchAverageHz: 195,
    timbreLabel: "सभी स्वर & एक्सेंट अनुकूलन (All Voices Accepted)",
    sampleCount: 50,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now(),
  },
];

class VoiceRecognitionEngine {
  private profiles: VoiceProfile[] = [];
  private isUniversalVoiceActive = true;
  private currentLiveSpeaker: LiveSpeakerState = {
    pitchHz: 0,
    pitchCategory: "unknown",
    categoryLabel: "शांति / तैयार (Listening)",
    matchedSpeakerName: "यूनिवर्सल लिसनर (Universal Active)",
    confidence: 0,
    isUniversalActive: true,
  };

  // Moving average smoothing for pitch
  private recentPitchSamples: number[] = [];

  constructor() {
    this.loadCachedProfiles();
    this.loadUniversalSetting();
  }

  private loadCachedProfiles() {
    if (typeof window === "undefined" || !window.localStorage) {
      this.profiles = [...DEFAULT_VOICE_PROFILES];
      return;
    }
    try {
      const raw = window.localStorage.getItem(LOCAL_VOICE_PROFILES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.profiles = parsed;
          return;
        }
      }
    } catch {
      // fallback
    }
    this.profiles = [...DEFAULT_VOICE_PROFILES];
  }

  private saveCachedProfiles() {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      window.localStorage.setItem(LOCAL_VOICE_PROFILES_KEY, JSON.stringify(this.profiles));
    } catch (e) {
      console.warn("Notice saving voice profiles cache:", e);
    }
  }

  private loadUniversalSetting() {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(UNIVERSAL_VOICE_MODE_KEY);
      if (raw !== null) {
        this.isUniversalVoiceActive = raw === "true";
      }
    } catch {
      this.isUniversalVoiceActive = true;
    }
  }

  public setUniversalMode(enabled: boolean) {
    this.isUniversalVoiceActive = enabled;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(UNIVERSAL_VOICE_MODE_KEY, String(enabled));
    }
    this.currentLiveSpeaker.isUniversalActive = enabled;
  }

  public getUniversalMode(): boolean {
    return this.isUniversalVoiceActive;
  }

  public getProfiles(): VoiceProfile[] {
    return this.profiles;
  }

  public getLiveSpeaker(): LiveSpeakerState {
    return { ...this.currentLiveSpeaker };
  }

  /**
   * Real-time Fundamental Frequency (F0) estimation via Autocorrelation
   */
  public estimatePitch(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    let sumSquares = 0;
    for (let i = 0; i < SIZE; i++) {
      sumSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSquares / SIZE);
    // Not enough voice energy
    if (rms < 0.015) {
      return 0;
    }

    // Typical human vocal cords fundamental frequency: 70Hz - 500Hz
    const minPeriod = Math.floor(sampleRate / 500); // ~32 samples at 16kHz
    const maxPeriod = Math.floor(sampleRate / 70);  // ~228 samples at 16kHz

    let bestR = 0;
    let bestPeriod = -1;

    for (let tau = minPeriod; tau <= maxPeriod && tau < SIZE / 2; tau++) {
      let r = 0;
      let power1 = 0;
      let power2 = 0;

      for (let i = 0; i < SIZE - tau; i++) {
        r += buffer[i] * buffer[i + tau];
        power1 += buffer[i] * buffer[i];
        power2 += buffer[i + tau] * buffer[i + tau];
      }

      const denominator = Math.sqrt(power1 * power2);
      if (denominator > 0.0001) {
        const normR = r / denominator;
        if (normR > bestR) {
          bestR = normR;
          bestPeriod = tau;
        }
      }
    }

    // High confidence periodic peak indicates human voiced speech
    if (bestR > 0.35 && bestPeriod > 0) {
      return Math.round(sampleRate / bestPeriod);
    }
    return 0;
  }

  /**
   * Process incoming live audio frame to detect pitch, timbre category and match speaker
   */
  public processAudioFrame(buffer: Float32Array, sampleRate: number): LiveSpeakerState {
    const rawPitch = this.estimatePitch(buffer, sampleRate);

    if (rawPitch > 0) {
      this.recentPitchSamples.push(rawPitch);
      if (this.recentPitchSamples.length > 5) {
        this.recentPitchSamples.shift();
      }
    } else if (this.recentPitchSamples.length > 0) {
      // Decay slowly
      this.recentPitchSamples.shift();
    }

    const smoothedPitch =
      this.recentPitchSamples.length > 0
        ? Math.round(
            this.recentPitchSamples.reduce((a, b) => a + b, 0) /
              this.recentPitchSamples.length
          )
        : 0;

    let category: VoicePitchCategory = "unknown";
    let label = "शांति / तैयार";

    if (smoothedPitch > 0) {
      if (smoothedPitch <= 165) {
        category = "deep_male";
        label = `गंभीर / पुरुष स्वर (${smoothedPitch} Hz)`;
      } else if (smoothedPitch <= 255) {
        category = "melodic_female";
        label = `मधुर / महिला स्वर (${smoothedPitch} Hz)`;
      } else {
        category = "child_high";
        label = `तीव्र / बच्चे का स्वर (${smoothedPitch} Hz)`;
      }
    }

    // Match against registered profiles
    let matchedName = this.isUniversalVoiceActive
      ? "यूनिवर्सल लिसनर (कोई भी आवाज़)"
      : "अज्ञात स्वर";
    let confidence = 0.85;

    if (smoothedPitch > 0) {
      for (const p of this.profiles) {
        if (smoothedPitch >= p.pitchMinHz && smoothedPitch <= p.pitchMaxHz) {
          matchedName = p.name;
          confidence = Math.min(
            0.98,
            1 - Math.abs(smoothedPitch - p.pitchAverageHz) / 100
          );
          break;
        }
      }
    }

    this.currentLiveSpeaker = {
      pitchHz: smoothedPitch,
      pitchCategory: category,
      categoryLabel: label,
      matchedSpeakerName: matchedName,
      confidence,
      isUniversalActive: this.isUniversalVoiceActive,
    };

    return { ...this.currentLiveSpeaker };
  }

  /**
   * Register or train a new speaker voice profile
   */
  public async registerSpeaker(
    name: string,
    role: "creator" | "user" | "family" | "friend" | "guest" = "user",
    detectedPitch?: number
  ): Promise<VoiceProfile> {
    const pitch = detectedPitch || this.currentLiveSpeaker.pitchHz || 160;
    const minP = Math.max(70, pitch - 35);
    const maxP = Math.min(500, pitch + 35);

    let timbre = "अनुकूलित स्वर (Custom Voice)";
    if (pitch <= 165) timbre = "गंभीर स्वर (Deep / Male Baritone)";
    else if (pitch <= 255) timbre = "मधुर स्वर (Melodic / Female)";
    else timbre = "तीव्र स्वर (High Pitch / Child)";

    const newProfile: VoiceProfile = {
      id: `vp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      role,
      pitchMinHz: minP,
      pitchMaxHz: maxP,
      pitchAverageHz: pitch,
      timbreLabel: timbre,
      sampleCount: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.profiles = [newProfile, ...this.profiles];
    this.saveCachedProfiles();

    // Persist to Firestore
    try {
      const userId = await getCurrentUserId();
      const profileDoc = doc(db, "users", userId, "voice_profiles", newProfile.id);
      await setDoc(profileDoc, newProfile);
    } catch (err) {
      console.warn("Notice saving voice profile to Firestore:", err);
    }

    return newProfile;
  }

  /**
   * Delete a registered speaker voice profile
   */
  public async deleteSpeaker(profileId: string): Promise<void> {
    this.profiles = this.profiles.filter((p) => p.id !== profileId);
    this.saveCachedProfiles();

    try {
      const userId = await getCurrentUserId();
      const profileDoc = doc(db, "users", userId, "voice_profiles", profileId);
      await deleteDoc(profileDoc);
    } catch (err) {
      console.warn("Notice deleting voice profile from Firestore:", err);
    }
  }

  /**
   * Sync voice profiles from Firestore on app load
   */
  public async syncWithFirestore(): Promise<VoiceProfile[]> {
    try {
      const userId = await getCurrentUserId();
      const colRef = collection(db, "users", userId, "voice_profiles");
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const firestoreProfiles: VoiceProfile[] = [];
        snap.forEach((d) => {
          firestoreProfiles.push(d.data() as VoiceProfile);
        });

        // Merge with defaults
        const existingIds = new Set(firestoreProfiles.map((p) => p.id));
        const merged = [
          ...firestoreProfiles,
          ...DEFAULT_VOICE_PROFILES.filter((p) => !existingIds.has(p.id)),
        ];
        this.profiles = merged;
        this.saveCachedProfiles();
        return merged;
      }
    } catch (e) {
      console.warn("Notice syncing voice profiles from Firestore:", e);
    }
    return this.profiles;
  }
}

export const voiceRecognitionEngine = new VoiceRecognitionEngine();
