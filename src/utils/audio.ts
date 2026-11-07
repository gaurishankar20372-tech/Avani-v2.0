/**
 * Audio processing utilities for PCM16 conversion, AudioContext management,
 * Adaptive Noise Floor Tracking, Voice Bandpass Filtering, Gapless chunk scheduling,
 * and Noise-Resistant Speech Interruption & Resumption.
 */

import { NoiseSuppressionMode, LiveSpeakerState } from "../types";
import { voiceRecognitionEngine } from "./voiceRecognitionEngine";

export interface AudioCaptureResult {
  success: boolean;
  reason?: "permission_denied" | "not_supported" | "not_found" | "unknown";
  error?: any;
}

export function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return output.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function pcm16ToBase64(input: Float32Array): string {
  const buffer = floatTo16BitPCM(input);
  return arrayBufferToBase64(buffer);
}

export function base64ToFloat32(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const dataView = new DataView(bytes.buffer);
  const numSamples = Math.floor(bytes.byteLength / 2);
  const float32 = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const int16 = dataView.getInt16(i * 2, true);
    float32[i] = int16 / 32768.0;
  }

  return float32;
}

export class LiveAudioManager {
  private inputCtx: AudioContext | null = null;
  private outputCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private voiceFilterNode: BiquadFilterNode | null = null;
  private lowpassFilterNode: BiquadFilterNode | null = null;
  private voiceClarityFilterNode: BiquadFilterNode | null = null;

  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private onAudioChunkCallback: ((base64Chunk: string) => void) | null = null;
  private onInterruptCallback: (() => void) | null = null;

  // Noise Floor & Voice Activity Detection (VAD)
  public noiseMode: NoiseSuppressionMode = "ultra_isolation";
  private noiseFloor = 0.015;
  private consecutiveVoiceFrames = 0;
  private isSpeechActive = false;
  private currentSpeechConfidence = 0;

  // Playback buffer cache for resumption if noise was a false positive
  private speechAudioChunks: string[] = [];
  private currentPlayingIndex = 0;
  private isPaused = false;
  private lastSpokenText = "";

  public isCapturing = false;

  constructor() {}

  public setNoiseMode(mode: NoiseSuppressionMode) {
    this.noiseMode = mode;
  }

  public getNoiseFloor(): number {
    return this.noiseFloor;
  }

  public isHumanVoiceDetected(): boolean {
    return this.isSpeechActive;
  }

  public getSpeechConfidence(): number {
    return this.currentSpeechConfidence;
  }

  // Initialize Input Capture with Voice-Band Filtering & Adaptive Noise Cancellation
  public async startInputCapture(
    onChunk: (base64Chunk: string) => void,
    onUserSpeechDetected?: () => void
  ): Promise<AudioCaptureResult> {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        return {
          success: false,
          reason: "not_supported",
        };
      }

      this.onAudioChunkCallback = onChunk;
      this.inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      if (this.inputCtx.state === "suspended") {
        await this.inputCtx.resume();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = this.inputCtx.createMediaStreamSource(this.mediaStream);

      // Stage 1. Highpass filter (85Hz): eliminates handling rumble, AC hum, sub-bass
      this.voiceFilterNode = this.inputCtx.createBiquadFilter();
      this.voiceFilterNode.type = "highpass";
      this.voiceFilterNode.frequency.setValueAtTime(85, this.inputCtx.currentTime);
      this.voiceFilterNode.Q.setValueAtTime(0.7, this.inputCtx.currentTime);

      // Stage 2. Lowpass filter (3600Hz): cuts high-frequency fan hiss, whistles, typing noise
      this.lowpassFilterNode = this.inputCtx.createBiquadFilter();
      this.lowpassFilterNode.type = "lowpass";
      this.lowpassFilterNode.frequency.setValueAtTime(3600, this.inputCtx.currentTime);
      this.lowpassFilterNode.Q.setValueAtTime(0.7, this.inputCtx.currentTime);

      // Stage 3. Peaking voice clarity filter (1200Hz, +2.5dB): boosts human voice clarity & presence
      this.voiceClarityFilterNode = this.inputCtx.createBiquadFilter();
      this.voiceClarityFilterNode.type = "peaking";
      this.voiceClarityFilterNode.frequency.setValueAtTime(1200, this.inputCtx.currentTime);
      this.voiceClarityFilterNode.Q.setValueAtTime(1.0, this.inputCtx.currentTime);
      this.voiceClarityFilterNode.gain.setValueAtTime(2.5, this.inputCtx.currentTime);

      this.inputAnalyser = this.inputCtx.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      this.inputAnalyser.smoothingTimeConstant = 0.8;

      // 4096 buffer size gives ~256ms chunk @ 16kHz
      this.processorNode = this.inputCtx.createScriptProcessor(4096, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isCapturing) return;
        const channelData = e.inputBuffer.getChannelData(0);

        // 1. Calculate RMS energy
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);

        // 2. Adaptive Noise Floor Tracking (Moving average of quiet intervals)
        if (rms < this.noiseFloor * 1.5 || this.noiseFloor === 0) {
          this.noiseFloor = this.noiseFloor * 0.95 + rms * 0.05;
        } else {
          this.noiseFloor = this.noiseFloor * 0.998 + 0.002 * Math.min(rms, 0.04);
        }
        this.noiseFloor = Math.max(0.006, Math.min(0.07, this.noiseFloor));

        // 3. Autocorrelation & Pitch Periodicity Analysis (distinguishes human vocal cords from noise)
        // Human speech fundamental frequency is 80Hz - 450Hz (periods ~35 to ~200 samples at 16kHz)
        let bestR = 0;
        let sumPower = 0;
        for (let i = 0; i < 512; i++) {
          sumPower += channelData[i] * channelData[i];
        }

        if (sumPower > 0.001) {
          for (let tau = 35; tau <= 190; tau += 2) {
            let r = 0;
            let p1 = 0;
            let p2 = 0;
            for (let i = 0; i < 256; i++) {
              r += channelData[i] * channelData[i + tau];
              p1 += channelData[i] * channelData[i];
              p2 += channelData[i + tau] * channelData[i + tau];
            }
            const denom = Math.sqrt(p1 * p2);
            if (denom > 0.0001) {
              const normR = r / denom;
              if (normR > bestR) {
                bestR = normR;
              }
            }
          }
        }

        // 4. Dynamic Threshold based on selected Noise Suppression Mode
        let multiplier = 3.8;
        let minThreshold = 0.12;
        let minAutocorrelation = 0.38;
        let requiredConsecutiveFrames = 2; // ~500ms

        if (this.noiseMode === "ultra_isolation") {
          // Ultra Voice Shield: complete rejection of background ambient noise; speaker only
          multiplier = 4.2;
          minThreshold = 0.13;
          minAutocorrelation = 0.40;
          requiredConsecutiveFrames = 2;
        } else if (this.noiseMode === "high_rejection") {
          multiplier = 3.2;
          minThreshold = 0.09;
          minAutocorrelation = 0.34;
          requiredConsecutiveFrames = 2;
        } else if (this.noiseMode === "balanced") {
          multiplier = 2.4;
          minThreshold = 0.06;
          minAutocorrelation = 0.28;
          requiredConsecutiveFrames = 2;
        } else if (this.noiseMode === "sensitive") {
          multiplier = 1.7;
          minThreshold = 0.035;
          minAutocorrelation = 0.22;
          requiredConsecutiveFrames = 1;
        }

        const dynamicThreshold = Math.max(minThreshold, this.noiseFloor * multiplier);
        const isVoiceSignal = rms > dynamicThreshold && bestR >= minAutocorrelation;

        const snr = rms / Math.max(0.001, this.noiseFloor);
        this.currentSpeechConfidence = Math.min(1.0, (snr / (multiplier * 2)) * (bestR / minAutocorrelation));

        // 5. Voice Activity State Transition
        if (isVoiceSignal) {
          this.consecutiveVoiceFrames++;
          if (this.consecutiveVoiceFrames >= requiredConsecutiveFrames) {
            this.isSpeechActive = true;
            if (onUserSpeechDetected) {
              onUserSpeechDetected();
            }
          }
        } else {
          this.consecutiveVoiceFrames = Math.max(0, this.consecutiveVoiceFrames - 1);
          if (this.consecutiveVoiceFrames === 0) {
            this.isSpeechActive = false;
          }
        }

        // 6. Real-time Speaker Pitch & Voice Recognition Analysis
        voiceRecognitionEngine.processAudioFrame(channelData, 16000);

        // 7. Dynamic Noise Gate on PCM Stream:
        // When there is NO verified human voice, stream a silenced buffer so ambient noise never triggers AI
        if (this.onAudioChunkCallback) {
          if (this.isSpeechActive || isVoiceSignal) {
            const base64 = pcm16ToBase64(channelData);
            this.onAudioChunkCallback(base64);
          } else {
            const silenced = new Float32Array(channelData.length);
            const base64 = pcm16ToBase64(silenced);
            this.onAudioChunkCallback(base64);
          }
        }
      };

      source.connect(this.voiceFilterNode);
      this.voiceFilterNode.connect(this.lowpassFilterNode);
      this.lowpassFilterNode.connect(this.voiceClarityFilterNode);
      this.voiceClarityFilterNode.connect(this.inputAnalyser);
      this.inputAnalyser.connect(this.processorNode);
      this.processorNode.connect(this.inputCtx.destination);

      this.isCapturing = true;
      return { success: true };
    } catch (err: any) {
      const isPermissionDenied =
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError" ||
        String(err?.message || "").toLowerCase().includes("permission denied") ||
        String(err || "").toLowerCase().includes("permission denied");

      if (isPermissionDenied) {
        console.warn("Audio capture: microphone permission denied by user/browser.");
        return { success: false, reason: "permission_denied", error: err };
      }

      const isNotFound =
        err?.name === "NotFoundError" ||
        err?.name === "DevicesNotFoundError";

      if (isNotFound) {
        console.warn("Audio capture: microphone device not found.");
        return { success: false, reason: "not_found", error: err };
      }

      console.warn("Audio capture initialization error:", err?.message || err);
      return { success: false, reason: "unknown", error: err };
    }
  }

  // Stop Input Capture
  public stopInputCapture() {
    this.isCapturing = false;
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.voiceFilterNode) {
      this.voiceFilterNode.disconnect();
      this.voiceFilterNode = null;
    }
    if (this.lowpassFilterNode) {
      this.lowpassFilterNode.disconnect();
      this.lowpassFilterNode = null;
    }
    if (this.voiceClarityFilterNode) {
      this.voiceClarityFilterNode.disconnect();
      this.voiceClarityFilterNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.inputCtx) {
      this.inputCtx.close();
      this.inputCtx = null;
    }
  }

  // Initialize Output Playback (24kHz for Gemini Live output)
  public initOutput(): AudioContext {
    if (!this.outputCtx || this.outputCtx.state === "closed") {
      this.outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      this.outputAnalyser = this.outputCtx.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputAnalyser.smoothingTimeConstant = 0.8;
      this.outputAnalyser.connect(this.outputCtx.destination);
    }
    if (this.outputCtx.state === "suspended") {
      this.outputCtx.resume();
    }
    return this.outputCtx;
  }

  // Queue and play audio chunk scheduled gaplessly
  public playChunk(base64Audio: string) {
    try {
      this.speechAudioChunks.push(base64Audio);
      if (this.isPaused) return;

      const ctx = this.initOutput();
      const float32Data = base64ToFloat32(base64Audio);
      if (float32Data.length === 0) return;

      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      if (this.outputAnalyser) {
        source.connect(this.outputAnalyser);
      } else {
        source.connect(ctx.destination);
      }

      const currentTime = ctx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.02; // small buffer to avoid glitch
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(source);
      const chunkIndex = this.speechAudioChunks.length - 1;

      source.onended = () => {
        this.currentPlayingIndex = Math.max(this.currentPlayingIndex, chunkIndex + 1);
        const idx = this.activeSources.indexOf(source);
        if (idx > -1) {
          this.activeSources.splice(idx, 1);
        }
      };
    } catch (e) {
      console.error("Error playing audio chunk:", e);
    }
  }

  // Pause playback temporarily without discarding speech buffer
  // (Used when checking if an audio disturbance is a real user query or just ambient noise)
  public pausePlayback() {
    this.isPaused = true;
    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    this.activeSources = [];
    if (this.outputCtx) {
      this.nextStartTime = this.outputCtx.currentTime;
    }
  }

  // Resume playback from where Avani left off
  public resumePlayback() {
    if (!this.isPaused) return;
    this.isPaused = false;
    const remainingChunks = this.speechAudioChunks.slice(this.currentPlayingIndex);
    this.nextStartTime = this.outputCtx ? this.outputCtx.currentTime + 0.05 : 0;
    for (const chunk of remainingChunks) {
      this.playChunkDirect(chunk);
    }
  }

  private playChunkDirect(base64Audio: string) {
    try {
      const ctx = this.initOutput();
      const float32Data = base64ToFloat32(base64Audio);
      if (float32Data.length === 0) return;

      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      if (this.outputAnalyser) {
        source.connect(this.outputAnalyser);
      } else {
        source.connect(ctx.destination);
      }

      const currentTime = ctx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.02;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.activeSources.push(source);

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx > -1) {
          this.activeSources.splice(idx, 1);
        }
      };
    } catch (e) {
      console.error("Error resuming direct chunk:", e);
    }
  }

  // Completely interrupt and clear playback (e.g. when user says "रुक जाओ" / "stop")
  public interrupt() {
    this.isPaused = false;
    this.speechAudioChunks = [];
    this.currentPlayingIndex = 0;
    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    this.activeSources = [];
    if (this.outputCtx) {
      this.nextStartTime = this.outputCtx.currentTime;
    } else {
      this.nextStartTime = 0;
    }
    if (this.onInterruptCallback) {
      this.onInterruptCallback();
    }
  }

  // Has remaining chunks to finish speaking
  public hasPendingChunks(): boolean {
    return this.currentPlayingIndex < this.speechAudioChunks.length;
  }

  public setLastSpokenText(text: string) {
    this.lastSpokenText = text;
  }

  public getLastSpokenText(): string {
    return this.lastSpokenText;
  }

  public resetTurnBuffer() {
    this.speechAudioChunks = [];
    this.currentPlayingIndex = 0;
    this.isPaused = false;
  }

  public setOnInterrupt(cb: () => void) {
    this.onInterruptCallback = cb;
  }

  // Get live frequency spectrum & noise metrics for UI
  public getFrequencyData(): {
    input: number[];
    output: number[];
    inputVol: number;
    outputVol: number;
    noiseFloor: number;
    speechConfidence: number;
    isSpeechDetected: boolean;
    liveSpeaker?: LiveSpeakerState;
  } {
    let inputArr: number[] = new Array(32).fill(0);
    let outputArr: number[] = new Array(32).fill(0);
    let inVol = 0;
    let outVol = 0;

    if (this.inputAnalyser) {
      const buffer = new Uint8Array(this.inputAnalyser.frequencyBinCount);
      this.inputAnalyser.getByteFrequencyData(buffer);
      let sum = 0;
      for (let i = 0; i < 32; i++) {
        const val = buffer[i] / 255;
        inputArr[i] = val;
        sum += val;
      }
      inVol = sum / 32;
    }

    if (this.outputAnalyser && this.activeSources.length > 0) {
      const buffer = new Uint8Array(this.outputAnalyser.frequencyBinCount);
      this.outputAnalyser.getByteFrequencyData(buffer);
      let sum = 0;
      for (let i = 0; i < 32; i++) {
        const val = buffer[i] / 255;
        outputArr[i] = val;
        sum += val;
      }
      outVol = sum / 32;
    }

    return {
      input: inputArr,
      output: outputArr,
      inputVol: inVol,
      outputVol: outVol,
      noiseFloor: this.noiseFloor,
      speechConfidence: this.currentSpeechConfidence,
      isSpeechDetected: this.isSpeechActive,
      liveSpeaker: voiceRecognitionEngine.getLiveSpeaker(),
    };
  }

  public isSpeaking(): boolean {
    return this.activeSources.length > 0 || (this.isPaused && this.hasPendingChunks());
  }
}

export const liveAudio = new LiveAudioManager();
