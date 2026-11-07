/**
 * Lightweight Universal Multi-Voice wake-word detector for "Avani".
 * Adapts to anyone's voice (men, women, children, elders, various accents)
 * using continuous SpeechRecognition with bilingual Hindi/English multi-match and automatic re-arm.
 */

export const AMBIENT_NOISE_TOKENS = new Set([
  "हां", "हाँ", "हूँ", "हुं", "हं", "अ", "आ", "उ", "ओ", "ए", "ऐ",
  "क", "ख", "ग", "घ", "च", "छ", "ज", "झ", "ट", "ठ", "ड", "ढ",
  "त", "थ", "द", "ध", "न", "प", "फ", "ब", "भ", "म", "य", "र",
  "ल", "व", "श", "ष", "स", "ह", "का", "की", "के", "को", "से",
  "में", "पर", "ने", "तो", "भी", "है", "था", "थी", "थे", "हो",
  "hi", "ha", "uh", "um", "hmm", "hmmm", "ah", "oh", "shh", "a",
  "an", "the", "to", "in", "on", "of", "ok", "yes", "no", "yeah"
]);

export function isLikelyAmbientNoise(text: string): boolean {
  const clean = text.trim().toLowerCase().replace(/[.,!?;:'"()।]/g, "");
  if (!clean || clean.length < 2) return true;
  if (AMBIENT_NOISE_TOKENS.has(clean)) return true;
  if (clean.length <= 2 && !/^(गा|लो|दो|जा|पी)/.test(clean)) return true;
  return false;
}

export class WakeWordDetector {
  private recognition: any = null;
  private isListening = false;
  private onWakeCallback: ((phrase: string, trailingQuery?: string) => void) | null = null;
  private onUtteranceCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onErrorCallback: ((err: string) => void) | null = null;
  private isSupported = false;
  private currentLangIndex = 0;
  private readonly supportedLangs = ["hi-IN", "en-IN", "en-US"];

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isSupported = true;
      this.initRecognition(SpeechRecognition);
    }
  }

  private initRecognition(SpeechRecognition: any) {
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      // Alternate or prefer hi-IN for maximum phonetic sensitivity to "अवनी"
      this.recognition.lang = this.supportedLangs[this.currentLangIndex];

      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const rawTranscript = event.results[i][0].transcript.trim();
          const lowerTranscript = rawTranscript.toLowerCase();
          const isFinal = Boolean(event.results[i].isFinal);

          // 1. Filter out isolated ambient noise murmurs before notifying listener
          if (this.onUtteranceCallback && rawTranscript.length > 0 && !isLikelyAmbientNoise(rawTranscript)) {
            this.onUtteranceCallback(rawTranscript, isFinal);
          }

          // 2. Universal phonetic variations covering any speaker's pitch/accent
          const wakeRegex = /^(hey avani|hi avani|hello avani|ok avani|avni|awani|aavni|aavani|avani|हे अवनी|नमस्ते अवनी|सुनो अवनी|अरे अवनी|ओ अवनी|अवनी जी|हलो अवनी|ए अवनी|अवनी|अवनि|वानी|वाणी)[,\s]*/i;
          const isWakeMatch =
            wakeRegex.test(lowerTranscript) ||
            lowerTranscript.includes("avani") ||
            lowerTranscript.includes("अवनी") ||
            lowerTranscript.includes("अवनि");

          if (isWakeMatch) {
            console.log("Universal Wake word detected from speaker:", rawTranscript);
            const extractedQuery = rawTranscript.replace(wakeRegex, "").trim();
            if (this.onWakeCallback) {
              this.onWakeCallback(rawTranscript, extractedQuery.length > 0 ? extractedQuery : undefined);
            }
          }
        }
      };

      this.recognition.onerror = (e: any) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          console.warn("WakeWord recognition permission not granted:", e.error);
          this.isListening = false;
          if (this.onErrorCallback) {
            this.onErrorCallback(e.error);
          }
          return;
        }

        // Switch language mode on idle/no-speech to catch cross-lingual utterances
        if (e.error === "no-speech") {
          this.currentLangIndex = (this.currentLangIndex + 1) % this.supportedLangs.length;
          if (this.recognition) {
            this.recognition.lang = this.supportedLangs[this.currentLangIndex];
          }
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            // Re-arm immediately
            this.recognition.start();
          } catch {
            // Rapid restart debounce
            setTimeout(() => {
              if (this.isListening && this.recognition) {
                try {
                  this.recognition.start();
                } catch {}
              }
            }, 250);
          }
        }
      };
    } catch (e) {
      console.warn("WakeWord engine initialization notice:", e);
    }
  }

  public start(onWake: (phrase: string, trailingQuery?: string) => void, onError?: (err: string) => void) {
    this.onWakeCallback = onWake;
    this.onErrorCallback = onError || null;
    this.isListening = true;
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e: any) {
        if (e.name === "NotAllowedError" || e.message?.includes("denied")) {
          this.isListening = false;
          if (this.onErrorCallback) {
            this.onErrorCallback("not-allowed");
          }
        }
      }
    }
  }

  public setUtteranceListener(callback: ((transcript: string, isFinal: boolean) => void) | null) {
    this.onUtteranceCallback = callback;
  }

  public stop() {
    this.isListening = false;
    this.onUtteranceCallback = null;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // already stopped
      }
    }
  }

  public checkSupport(): boolean {
    return this.isSupported;
  }
}

export const wakeWordDetector = new WakeWordDetector();
