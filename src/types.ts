export type AssistantState =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "EXECUTING_TOOL"
  | "CALL_MUTED"
  | "ERROR";

export type LanguageMode = "auto" | "en" | "hi";

export interface PermissionsState {
  recordAudio: boolean;
  readContacts: boolean;
  callPhone: boolean;
  postNotifications: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  relationship?: string;
}

export interface InstalledApp {
  packageName: string;
  name: string;
  iconName: string;
  category: "Social" | "Productivity" | "Media" | "Utilities" | "System";
  launchUrl?: string;
  deepLinkScheme?: string;
  fallbackWebUrl?: string;
}

export interface GeneratedFile {
  id: string;
  title: string;
  fileName: string;
  content: string;
  fileType: "code" | "document" | "notes" | "letter" | "text";
  language: string;
  exportFormat?: "pdf" | "zip" | "raw" | "auto";
  deliveryMethod?: "screen" | "download" | "whatsapp" | "email" | "share";
  recipient?: string;
  summary?: string;
  timestamp: number;
}

export type NoiseSuppressionMode = "ultra_isolation" | "high_rejection" | "balanced" | "sensitive";

export interface ToolCallEvent {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: number;
  status: "executing" | "success" | "permission_denied" | "failed";
  resultMessage?: string;
  sassyRemark?: string;
  intentAction?: string;
  intentUri?: string;
  webUrl?: string;
  targetName?: string;
  fileData?: GeneratedFile;
}

export interface LiveTranscriptItem {
  id: string;
  sender: "user" | "avani" | "system";
  text: string;
  timestamp: number;
  isSassy?: boolean;
}

export type VoicePitchCategory = "deep_male" | "melodic_female" | "child_high" | "unknown";

export interface VoiceProfile {
  id: string;
  name: string;
  role: "creator" | "user" | "family" | "friend" | "guest";
  pitchMinHz: number;
  pitchMaxHz: number;
  pitchAverageHz: number;
  timbreLabel: string;
  sampleCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface LiveSpeakerState {
  pitchHz: number;
  pitchCategory: VoicePitchCategory;
  categoryLabel: string;
  matchedSpeakerName: string;
  confidence: number;
  isUniversalActive: boolean;
}

export interface AudioTelemetry {
  inputVolume: number;
  outputVolume: number;
  frequencyData: number[];
  isInterrupted: boolean;
  noiseFloor?: number;
  isSpeechDetected?: boolean;
  liveSpeaker?: LiveSpeakerState;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "avani";
  text: string;
  timestamp: number;
  fileData?: GeneratedFile;
  intentAction?: string;
  intentUri?: string;
  webUrl?: string;
  appName?: string;
  sassyRemark?: string;
  audioBase64?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  messageCount?: number;
}

export interface ActiveAppScreen {
  id: string;
  name: string;
  packageName?: string;
  type: "app" | "web";
  url?: string;
  query?: string;
  title: string;
  hindiName?: string;
  iconName?: string;
  openedAt: number;
}

export interface CallState {
  isCallActive: boolean;
  contactName: string;
  phoneNumber?: string;
  startedAt?: number;
  durationSeconds: number;
  isIncoming?: boolean;
}

export interface RealAppLaunchInfo {
  name: string;
  packageName?: string;
  intentUri: string;
  deepLinkScheme?: string;
  fallbackWebUrl?: string;
  title: string;
}


