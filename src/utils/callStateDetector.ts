/**
 * Call State Detector & Auto-Mute Manager
 * Automatically silences and mutes Avani during phone calls or active conversations,
 * and automatically resumes listening as soon as the call ends.
 */

import { CallState } from "../types";

export type CallStateChangeListener = (state: CallState) => void;
export type CallEndedCallback = (state: CallState) => void;

class CallStateDetector {
  private currentState: CallState = {
    isCallActive: false,
    contactName: "",
    durationSeconds: 0,
  };

  private listeners: Set<CallStateChangeListener> = new Set();
  private callEndedCallbacks: Set<CallEndedCallback> = new Set();
  private timerInterval: NodeJS.Timeout | null = null;
  private pendingCallIntent = false;

  constructor() {
    this.setupWindowListeners();
  }

  private setupWindowListeners() {
    if (typeof window === "undefined") return;

    // Listen for blur/visibility change when a phone call intent was dispatched
    window.addEventListener("blur", () => {
      if (this.pendingCallIntent && !this.currentState.isCallActive) {
        console.log("Phone dialer took over screen; activating call mute mode");
        this.startCall(this.currentState.contactName || "फ़ोन कॉल (Phone Call)");
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.pendingCallIntent && !this.currentState.isCallActive) {
        this.startCall(this.currentState.contactName || "फ़ोन कॉल (Phone Call)");
      } else if (!document.hidden && this.currentState.isCallActive) {
        // User came back from phone dialer - keep call active until user ends or after buffer
        console.log("Returned to Avani while call was active");
      }
    });
  }

  public subscribe(listener: CallStateChangeListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.currentState });
    return () => this.listeners.delete(listener);
  }

  public onCallEnded(cb: CallEndedCallback): () => void {
    this.callEndedCallbacks.add(cb);
    return () => this.callEndedCallbacks.delete(cb);
  }

  public getState(): CallState {
    return { ...this.currentState };
  }

  public isCallActive(): boolean {
    return this.currentState.isCallActive;
  }

  public notifyCallIntentDispatched(contactName: string, phoneNumber?: string) {
    this.pendingCallIntent = true;
    this.currentState = {
      isCallActive: true,
      contactName: contactName || "फ़ोन कॉल",
      phoneNumber,
      startedAt: Date.now(),
      durationSeconds: 0,
    };
    this.startCallTimer();
    this.broadcast();
  }

  public startCall(contactName: string, phoneNumber?: string, isIncoming = false) {
    this.pendingCallIntent = false;
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.currentState = {
      isCallActive: true,
      contactName: contactName || "कॉल (Active Call)",
      phoneNumber,
      startedAt: Date.now(),
      durationSeconds: 0,
      isIncoming,
    };

    this.startCallTimer();
    this.broadcast();
  }

  private startCallTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.currentState.isCallActive || !this.currentState.startedAt) return;
      const elapsed = Math.floor((Date.now() - this.currentState.startedAt) / 1000);
      this.currentState = {
        ...this.currentState,
        durationSeconds: elapsed,
      };
      this.broadcast();
    }, 1000);
  }

  public endCall() {
    if (!this.currentState.isCallActive) return;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const finishedCall = { ...this.currentState };
    this.currentState = {
      isCallActive: false,
      contactName: "",
      durationSeconds: 0,
    };
    this.pendingCallIntent = false;
    this.broadcast();

    // Trigger auto-reactivation callbacks
    this.callEndedCallbacks.forEach((cb) => cb(finishedCall));
  }

  private broadcast() {
    const copy = { ...this.currentState };
    this.listeners.forEach((fn) => fn(copy));
  }
}

export const callStateDetector = new CallStateDetector();
