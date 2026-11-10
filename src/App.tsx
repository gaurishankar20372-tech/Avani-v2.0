import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  ShieldCheck,
  Code,
  Smartphone,
  Radio,
  Volume2,
  VolumeX,
  RefreshCw,
  Terminal,
  Layers,
  Settings,
  HelpCircle,
  ExternalLink,
  MessageSquare,
  Flame,
  Globe,
  Instagram,
  Send,
  Phone,
  FileCode,
  FileText,
  Archive,
  Shield,
  ShieldAlert,
  Power,
  Brain,
  MoreVertical,
  Award,
} from "lucide-react";
import {
  AssistantState,
  GeneratedFile,
  LanguageMode,
  NoiseSuppressionMode,
  PermissionsState,
  ToolCallEvent,
  ChatMessage,
  ChatSession,
  LiveSpeakerState,
  ActiveAppScreen,
  CallState,
} from "./types";
import { liveAudio } from "./utils/audio";
import { wakeWordDetector, isLikelyAmbientNoise } from "./utils/wakeWord";
import { toolEngine } from "./utils/tools";
import { callStateDetector } from "./utils/callStateDetector";
import { launchRealAppOrFallback, dispatchDirectNativeApp, resolveAppTarget } from "./utils/nativeAppLauncher";
import { AvaniOrbCanvas } from "./components/AvaniOrbCanvas";
import { ForegroundServiceNotification } from "./components/ForegroundServiceNotification";
import { PermissionsModal } from "./components/PermissionsModal";
import { IntentExecutionHUD } from "./components/IntentExecutionHUD";
import { AndroidSourceViewer } from "./components/AndroidSourceViewer";
import { DeviceSimulatorDrawer } from "./components/DeviceSimulatorDrawer";
import { GeneratedFileModal } from "./components/GeneratedFileModal";
import { ActiveAppScreenModal } from "./components/ActiveAppScreenModal";
import { CallMutedStatusBar } from "./components/CallMutedStatusBar";
import { AvaniChatModal } from "./components/AvaniChatModal";
import { AvaniMemoryModal } from "./components/AvaniMemoryModal";
import { CreatorModal } from "./components/CreatorModal";
import { VoiceRecognitionModal } from "./components/VoiceRecognitionModal";
import { voiceRecognitionEngine } from "./utils/voiceRecognitionEngine";
import { SASSY_REMARKS } from "./data/mockAndroidData";
import { generateSmartFileForQuery } from "./utils/smartCodeGenerator";
import {
  AvaniMemory,
  subscribeToMemories,
  saveMemory,
  deleteMemory,
  fetchChatHistory,
  saveChatMessage,
  autoExtractAndSaveMemories,
  formatMemoriesForContext,
  findLocalMemoryAnswer,
  getLocalCachedMemories,
  getLocalCachedChat,
  fetchChatSessions,
  saveChatSession,
  deleteChatSession,
  getLocalCachedSessions,
} from "./services/avaniMemoryService";
import { testFirestoreConnection } from "./lib/firebase";
import { matchDeviceCommand } from "./utils/deviceCommandMatcher";

export default function App() {
  // Assistant States
  const [assistantState, setAssistantState] = useState<AssistantState>("IDLE");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("auto");
  const [noiseMode, setNoiseMode] = useState<NoiseSuppressionMode>("ultra_isolation");
  const [statusMessage, setStatusMessage] = useState<string>(
    'Avani is resting. Say "Avani" (या "अवनी") or tap the orb to awaken.'
  );
  const [latestSubtitle, setLatestSubtitle] = useState<string>("");
  const [isForegroundServiceRunning, setIsForegroundServiceRunning] = useState<boolean>(true);
  const [wakeWordCount, setWakeWordCount] = useState<number>(0);
  const [lastWakeWordPhrase, setLastWakeWordPhrase] = useState<string | null>(null);

  // File Generation & Delivery State
  const [activeGeneratedFile, setActiveGeneratedFile] = useState<GeneratedFile | null>(null);
  const [isGeneratedFileModalOpen, setIsGeneratedFileModalOpen] = useState<boolean>(false);

  // Live In-App App & Web Viewport State (YouTube, Google, Calculator, Camera, etc.)
  const [activeAppScreen, setActiveAppScreen] = useState<ActiveAppScreen | null>(null);
  const activeAppScreenRef = useRef<ActiveAppScreen | null>(null);
  useEffect(() => {
    activeAppScreenRef.current = activeAppScreen;
  }, [activeAppScreen]);

  // Active Phone Call & Conversation Auto-Mute State
  const [callState, setCallState] = useState<CallState>(() => callStateDetector.getState());

  // Chat Mode State & Multi-Session History
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const cached = getLocalCachedSessions();
    if (cached && cached.length > 0) return cached;
    const initialSession: ChatSession = {
      id: "session_" + Date.now(),
      title: "नई बातचीत (New Chat)",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: "welcome-1",
          sender: "avani",
          text: "नमस्ते! मैं अवनी हूँ। क्या काम करवाना है? कोई कोड लिखवाना है, लीव लेटर PDF में चाहिए, या किसी को मैसेज भेजना है? बोलो, मैं सब कर दूंगी!",
          timestamp: Date.now(),
        },
      ],
      messageCount: 1,
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const cached = getLocalCachedSessions();
    return cached && cached.length > 0 ? cached[0].id : "session_" + Date.now();
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const cachedSessions = getLocalCachedSessions();
    if (cachedSessions && cachedSessions.length > 0 && cachedSessions[0].messages?.length > 0) {
      return cachedSessions[0].messages;
    }
    const cached = getLocalCachedChat();
    return cached && cached.length > 0
      ? cached
      : [
          {
            id: "welcome-1",
            sender: "avani",
            text: "नमस्ते! मैं अवनी हूँ। क्या काम करवाना है? कोई कोड लिखवाना है, लीव लेटर PDF में चाहिए, या किसी को मैसेज भेजना है? बोलो, मैं सब कर दूंगी!",
            timestamp: Date.now(),
          },
        ];
  });
  const [isChatThinking, setIsChatThinking] = useState<boolean>(false);
  const [isVoiceMutedInChat, setIsVoiceMutedInChat] = useState<boolean>(false);

  // Firebase Persistent Long-Term Memory State
  const [memories, setMemories] = useState<AvaniMemory[]>(() => getLocalCachedMemories());
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);
  const memoriesRef = useRef<AvaniMemory[]>(memories);

  // Sync memoriesRef and inform active Live WebSocket
  useEffect(() => {
    memoriesRef.current = memories;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "updateMemory",
          memoryContext: formatMemoriesForContext(memories),
        })
      );
    }
  }, [memories]);

  // Load persistent memories and chat history & sessions from Firebase on mount
  useEffect(() => {
    // 1. Test connection to Firestore
    testFirestoreConnection().catch(() => {});

    // 2. Real-time memories subscription
    const unsubscribe = subscribeToMemories((mems) => {
      setMemories(mems);
      memoriesRef.current = mems;
    });

    // 3. Load previous chat sessions from Firebase
    fetchChatSessions().then((fetchedSessions) => {
      if (fetchedSessions && fetchedSessions.length > 0) {
        setSessions(fetchedSessions);
        const current = fetchedSessions.find((s) => s.id === activeSessionId) || fetchedSessions[0];
        setActiveSessionId(current.id);
        if (current.messages && current.messages.length > 0) {
          setChatMessages(current.messages);
        }
      } else {
        fetchChatHistory().then((history) => {
          if (history && history.length > 0) {
            setChatMessages(history);
          }
        });
      }
    });

    // 4. Sync persistent voice profiles from Firestore
    voiceRecognitionEngine.syncWithFirestore().catch(() => {});

    return () => {
      unsubscribe();
    };
  }, []);

  // Modals & Panels
  const [isPermissionsOpen, setIsPermissionsOpen] = useState<boolean>(false);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState<boolean>(false);
  const [isVoiceRecognitionModalOpen, setIsVoiceRecognitionModalOpen] = useState<boolean>(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState<boolean>(false);
  const [liveSpeaker, setLiveSpeaker] = useState<LiveSpeakerState>(() => voiceRecognitionEngine.getLiveSpeaker());

  // Poll live speaker pitch & classification
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveSpeaker(voiceRecognitionEngine.getLiveSpeaker());
    }, 200);
    return () => clearInterval(timer);
  }, []);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const [isSourceViewerOpen, setIsSourceViewerOpen] = useState<boolean>(false);
  const [isDeviceDrawerOpen, setIsDeviceDrawerOpen] = useState<boolean>(false);
  const [currentToolEvent, setCurrentToolEvent] = useState<ToolCallEvent | null>(null);
  const [lastLaunchedApp, setLastLaunchedApp] = useState<{
    name: string;
    hindiName?: string;
    primaryUri: string;
    timestamp: number;
  } | null>(null);

  // Listen for direct native app dispatches to provide instant visual confirmation and 1-tap fast access
  useEffect(() => {
    const handleAppLaunched = (e: any) => {
      const detail = e.detail;
      if (detail?.target) {
        setLastLaunchedApp({
          name: detail.target.name,
          hindiName: detail.target.hindiName,
          primaryUri: detail.primaryUri,
          timestamp: Date.now(),
        });
        setTimeout(() => {
          setLastLaunchedApp((curr) => (curr && Date.now() - curr.timestamp >= 7500 ? null : curr));
        }, 8000);
      }
    };
    window.addEventListener("avani-native-app-launched", handleAppLaunched);
    return () => window.removeEventListener("avani-native-app-launched", handleAppLaunched);
  }, []);

  // Close three-dots dropdown menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target as Node)
      ) {
        setIsStatusMenuOpen(false);
      }
    }
    if (isStatusMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isStatusMenuOpen]);

  // Permissions State
  const [permissions, setPermissions] = useState<PermissionsState>({
    recordAudio: true,
    readContacts: true,
    callPhone: true,
    postNotifications: true,
  });

  // WebSocket reference & Speech Resumption State
  const wsRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const stateRef = useRef<AssistantState>(assistantState);
  stateRef.current = assistantState;

  const speechVerificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeechPausedDueToNoiseRef = useRef<boolean>(false);
  // Track if server TTS quota is exhausted so we speak instantly via browser synthesis
  const isServerTtsExhaustedRef = useRef<boolean>(true);
  // Continuous listening mode: keep microphone and listener active after commands
  const isContinuousListeningRef = useRef<boolean>(true);

  // Play text using browser SpeechSynthesis with Hindi/English voice selection
  const playWithNativeSynthesis = useCallback((text: string) => {
    if (callStateDetector.isCallActive()) return;
    if (!("speechSynthesis" in window)) {
      setAssistantState(isContinuousListeningRef.current ? "LISTENING" : "IDLE");
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/```[\s\S]*?```/g, "Code delivered on screen.");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.08;
    const isHindi = /[\u0900-\u097F]/.test(cleanText);
    utterance.lang = isHindi ? "hi-IN" : "en-US";

    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices && availableVoices.length > 0) {
      if (isHindi) {
        const hiVoice = availableVoices.find(
          (v) => v.lang.startsWith("hi") || v.name.toLowerCase().includes("hindi")
        );
        if (hiVoice) utterance.voice = hiVoice;
      } else {
        const femaleVoice = availableVoices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.toLowerCase().includes("female") ||
              v.name.toLowerCase().includes("zira") ||
              v.name.toLowerCase().includes("samantha") ||
              v.name.toLowerCase().includes("natural") ||
              v.name.toLowerCase().includes("kore"))
        );
        if (femaleVoice) utterance.voice = femaleVoice;
      }
    }

    utterance.onend = () => {
      if (callStateDetector.isCallActive()) {
        setAssistantState("CALL_MUTED");
        return;
      }
      if (isContinuousListeningRef.current) {
        setAssistantState("LISTENING");
        setStatusMessage("अवनी सुन रही है... / Avani is listening...");
      } else {
        setAssistantState("IDLE");
      }
    };
    utterance.onerror = () => {
      if (callStateDetector.isCallActive()) {
        setAssistantState("CALL_MUTED");
        return;
      }
      if (isContinuousListeningRef.current) {
        setAssistantState("LISTENING");
      } else {
        setAssistantState("IDLE");
      }
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  // Sync noise mode with audio engine
  useEffect(() => {
    liveAudio.setNoiseMode(noiseMode);
  }, [noiseMode]);

  // Speak fallback text with Avani voice & seamless SpeechSynthesis fallback
  const speakAvaniFallback = useCallback(async (text: string) => {
    if (!text || text.trim() === "") return;
    if (callStateDetector.isCallActive()) {
      console.log("Avani muted due to active call. Suppressing output:", text);
      return;
    }
    try {
      setAssistantState("SPEAKING");
      setStatusMessage("Avani is speaking...");
      setLatestSubtitle(text);

      // If server TTS quota is exhausted, use instant native synthesis directly
      if (isServerTtsExhaustedRef.current) {
        playWithNativeSynthesis(text);
        return;
      }

      let playedAudio = false;

      // Try server-side TTS with short timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch("/api/avani/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text, voice: "Kore" }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data?.quotaExceeded || data?.useClientSpeech) {
            isServerTtsExhaustedRef.current = true;
          }
          if (data && data.audioBase64) {
            liveAudio.playChunk(data.audioBase64);
            playedAudio = true;
          }
        }
      } catch (_fetchErr) {
        // Continue to native synthesis
      }

      if (!playedAudio) {
        playWithNativeSynthesis(text);
      }
    } catch (_e) {
      setAssistantState("IDLE");
    }
  }, [playWithNativeSynthesis]);

  // Subscribe to CallStateDetector for auto-mute and auto-reactivation
  useEffect(() => {
    const unsub = callStateDetector.subscribe((st) => {
      setCallState(st);
      if (st.isCallActive) {
        if (speechVerificationTimerRef.current) {
          clearTimeout(speechVerificationTimerRef.current);
          speechVerificationTimerRef.current = null;
        }
        isSpeechPausedDueToNoiseRef.current = false;
        // Complete Privacy Protection: Cut microphone recording and audio completely
        liveAudio.stopInputCapture();
        liveAudio.interrupt();
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        setAssistantState("CALL_MUTED");
        setStatusMessage(`कॉल जारी है (${st.contactName}) — प्राइवेसी शील्ड सक्रिय (माइक व स्पीकर बंद)`);
        setLatestSubtitle(`[कॉल सक्रिय: ${st.contactName} • माइक बंद]`);
      }
    });

    const unsubEnd = callStateDetector.onCallEnded((finishedCall) => {
      console.log("Call ended; auto-reactivating Avani:", finishedCall);
      const remark = "कॉल समाप्त हो गई है! अवनी फिर से सुन रही है, अगला आदेश दीजिए।";
      setLatestSubtitle(remark);
      setAssistantState("LISTENING");
      setStatusMessage("कॉल समाप्त — अवनी सुन रही है...");
      speakAvaniFallback(remark);
      setTimeout(() => {
        if (isContinuousListeningRef.current) {
          startListeningSession();
        }
      }, 1000);
    });

    return () => {
      unsub();
      unsubEnd();
    };
  }, [speakAvaniFallback]);

  // Connect WebSocket to Gemini Live
  const connectLiveWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnectingRef.current) return;

    isConnectingRef.current = true;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const encodedMemory = encodeURIComponent(formatMemoriesForContext(memoriesRef.current));
    const wsUrl = `${protocol}//${window.location.host}/api/live?memoryContext=${encodedMemory}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to Gemini Live WebSocket");
      isConnectingRef.current = false;
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "ready") {
          console.log("Live session ready:", msg.message);
        }

        if (msg.type === "audio" && msg.audio) {
          setAssistantState("SPEAKING");
          setStatusMessage("Avani is speaking...");
          liveAudio.playChunk(msg.audio);
        }

        if (msg.type === "transcription" && msg.text) {
          // If speech was paused on suspect noise, but real speech transcription arrived:
          if (speechVerificationTimerRef.current) {
            clearTimeout(speechVerificationTimerRef.current);
            speechVerificationTimerRef.current = null;
          }
          isSpeechPausedDueToNoiseRef.current = false;

          setLatestSubtitle((prev) => (prev ? `${prev} ${msg.text}` : msg.text));

          // Instant Fast Open voice command interception (0 latency)
          const fastCmd = matchDeviceCommand(msg.text);
          if (fastCmd.handled) {
            if (fastCmd.toolName === "openApp" || fastCmd.toolName === "openWeb" || fastCmd.isWeb) {
              const targetTitle = fastCmd.targetName || fastCmd.args?.appName || fastCmd.args?.title || "App";
              dispatchDirectNativeApp({
                name: targetTitle,
                packageName: fastCmd.args?.packageName,
                intentUri: fastCmd.intentUri,
                deepLinkScheme: fastCmd.intentUri || fastCmd.webUrl,
                fallbackWebUrl: fastCmd.webUrl || fastCmd.args?.url || fastCmd.fallbackWebUrl,
                query: fastCmd.args?.query || "",
                title: targetTitle,
              });
            }

            if (fastCmd.toolName === "makePhoneCall") {
              const contactName = fastCmd.args?.contactName || fastCmd.targetName || "Contact";
              callStateDetector.notifyCallIntentDispatched(contactName, fastCmd.args?.phoneNumber);
            }

            const eventObj: ToolCallEvent = {
              id: String(Date.now()),
              name: fastCmd.toolName || (fastCmd.isWeb ? "openWeb" : "openApp"),
              args: fastCmd.args || {},
              timestamp: Date.now(),
              status: "success",
              resultMessage: fastCmd.isWeb
                ? `वेबसाइट खोल दी गई: ${fastCmd.targetName || "Web"}`
                : `कमांड पूरा किया गया: ${fastCmd.targetName || fastCmd.toolName}`,
              sassyRemark: fastCmd.replyText,
              intentAction: fastCmd.intentAction || (fastCmd.isWeb ? "android.intent.action.VIEW" : "android.intent.action.MAIN"),
              intentUri: fastCmd.intentUri || fastCmd.webUrl,
              webUrl: fastCmd.webUrl,
              targetName: fastCmd.targetName,
            };
            setCurrentToolEvent(eventObj);
            setLatestSubtitle(fastCmd.replyText || "");
            speakAvaniFallback(fastCmd.replyText || "लीजिए, तुरंत खोल दिया है!");
          }
        }

        if (msg.type === "interrupted") {
          console.log("Gemini detected user interruption");
          // Clear noise pause if server confirmed real interruption
          if (speechVerificationTimerRef.current) {
            clearTimeout(speechVerificationTimerRef.current);
            speechVerificationTimerRef.current = null;
          }
          isSpeechPausedDueToNoiseRef.current = false;
          liveAudio.interrupt();
          setAssistantState("LISTENING");
          setStatusMessage("Avani is listening...");
        }

        if (msg.type === "turnComplete") {
          // Check if still playing audio
          setTimeout(() => {
            if (!liveAudio.isSpeaking() && stateRef.current === "SPEAKING") {
              if (isContinuousListeningRef.current) {
                setAssistantState("LISTENING");
                setStatusMessage("अवनी सुन रही है... / Avani is listening for next command...");
              } else {
                setAssistantState("IDLE");
                setStatusMessage('Avani is listening for wake-word "Avani"...');
              }
            }
          }, 800);
        }

        // Handle tool calls from Gemini
        if (msg.type === "toolCall" && msg.toolCall) {
          setAssistantState("EXECUTING_TOOL");
          setStatusMessage("Avani is executing device tool...");

          const calls = msg.toolCall.functionCalls || [];
          const functionResponses = [];

          for (const call of calls) {
            const toolResult = await toolEngine.executeTool(
              call.name,
              call.args,
              permissions
            );

            const eventObj: ToolCallEvent = {
              id: call.id || String(Date.now()),
              name: call.name,
              args: call.args,
              timestamp: Date.now(),
              status: toolResult.success
                ? "success"
                : toolResult.message.includes("Permission Denied")
                ? "permission_denied"
                : "failed",
              resultMessage: toolResult.message,
              sassyRemark: toolResult.sassyRemark,
              intentAction: toolResult.intentAction,
              intentUri: toolResult.intentUri,
              webUrl: toolResult.webUrl,
              targetName: toolResult.targetName,
              fileData: toolResult.fileData,
            };

            // If app or web was launched, open real native app on phone directly!
            if (call.name === "openApp" || call.name === "openWeb") {
              const targetTitle = call.args?.appName || call.args?.title || "App";
              if (call.name === "openApp") {
                const target = resolveAppTarget(targetTitle || call.args?.packageName || "App");
                dispatchDirectNativeApp(target);
              } else {
                dispatchDirectNativeApp({
                  name: targetTitle,
                  packageName: call.args?.packageName,
                  intentUri: toolResult.intentUri,
                  deepLinkScheme: toolResult.intentUri || toolResult.webUrl,
                  fallbackWebUrl: call.args?.url || toolResult.webUrl,
                  query: call.args?.query || "",
                  title: targetTitle,
                });
              }
            }

            if (call.name === "makePhoneCall") {
              const contactName = call.args?.contactName || "Contact";
              callStateDetector.notifyCallIntentDispatched(contactName, call.args?.phoneNumber);
            }

            // If file was generated, open the dedicated full-screen file view directly!
            if (toolResult.fileData) {
              setActiveGeneratedFile(toolResult.fileData);
              setIsGeneratedFileModalOpen(true);
              setCurrentToolEvent(null);
            } else {
              setCurrentToolEvent(eventObj);
            }
            setLatestSubtitle(toolResult.sassyRemark);

            functionResponses.push({
              id: call.id,
              name: call.name,
              response: {
                result: toolResult.message,
                sassyRemark: toolResult.sassyRemark,
              },
            });
          }

          // Send tool response back to Gemini Live
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "toolResponse",
                response: functionResponses,
              })
            );
          }
        }

        if (msg.type === "error") {
          console.warn("Live session error:", msg.error);
        }
      } catch (err) {
        console.error("Error handling ws message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      isConnectingRef.current = false;
    };

    ws.onclose = () => {
      console.log("Live WebSocket closed");
      isConnectingRef.current = false;
      wsRef.current = null;
    };
  }, [permissions]);

  // Manual Instant Silence / Turn Off Avani
  const handleStopSpeaking = useCallback(() => {
    isContinuousListeningRef.current = false;
    if (speechVerificationTimerRef.current) {
      clearTimeout(speechVerificationTimerRef.current);
      speechVerificationTimerRef.current = null;
    }
    isSpeechPausedDueToNoiseRef.current = false;
    wakeWordDetector.setUtteranceListener(null);
    liveAudio.stopInputCapture();
    liveAudio.interrupt();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setAssistantState("IDLE");
    const stopRemarks =
      languageMode === "hi"
        ? [
            "अवनी बंद हो गई है।",
            "अच्छा ठीक है, मैं रुक गई।",
            "अवनी शांत हो गई है। जब भी ज़रूरत हो, बुला लेना!",
          ]
        : [
            "Avani has stopped.",
            "All quiet now. Avani is idle.",
            "Avani stopped. Tap the orb or say 'Avani' whenever you need me.",
          ];
    const remark = stopRemarks[Math.floor(Math.random() * stopRemarks.length)];
    setLatestSubtitle(remark);
    setStatusMessage(remark);
  }, [languageMode]);

  // Handle direct text/voice query execution with memory-awareness & tools
  const handleSimulatedQuery = useCallback(async (queryText: string) => {
    const trimmed = (queryText || "").trim();
    if (!trimmed) return;

    // Check if query is an explicit stop / silence command
    const isStop =
      /रुक जाओ|रुको|चुप|शांत|बस करो|ठहरो|बंद करो|stop|pause|wait|shut up|quiet/i.test(
        trimmed
      );
    if (isStop) {
      handleStopSpeaking();
      return;
    }

    // Check if query asks to close on-screen app/web screen
    const isCloseScreen =
      /स्क्रीन बंद|स्क्रीन क्लोज|वापस जाओ|पीछे जाओ|होम पर जाओ|क्लोज करो|close screen|back to home|exit screen|screen off/i.test(
        trimmed
      );
    if (isCloseScreen && activeAppScreenRef.current) {
      setActiveAppScreen(null);
      const closeRemark = "लीजिए, स्क्रीन बंद कर दी और होम पर वापस आ गए! मैं लगातार सुन रही हूँ, अगला आदेश दीजिए।";
      setLatestSubtitle(closeRemark);
      speakAvaniFallback(closeRemark);
      return;
    }

    // Check if query is an explicit call disconnect / end call command
    const isEndCall =
      /कॉल काटो|कॉल बंद करो|फोन काटो|फोन रखो|कॉल समाप्त|end call|hang up|disconnect call/i.test(
        trimmed
      );
    if (isEndCall && callStateDetector.isCallActive()) {
      callStateDetector.endCall();
      return;
    }

    if (speechVerificationTimerRef.current) {
      clearTimeout(speechVerificationTimerRef.current);
      speechVerificationTimerRef.current = null;
    }
    isSpeechPausedDueToNoiseRef.current = false;

    setAssistantState("THINKING");
    setStatusMessage("Avani is thinking...");
    setLatestSubtitle(`"${trimmed}"`);

    // 0. Direct Native Android Device & Fast Web Command Execution (0ms latency)
    const directCmd = matchDeviceCommand(trimmed);
    if (directCmd.handled) {
      // If it was an openApp or openWeb command, matchDeviceCommand has already directly dispatched it with full native schemas
      if (directCmd.toolName === "makePhoneCall") {
        const contactName = directCmd.args?.contactName || directCmd.targetName || "Contact";
        callStateDetector.notifyCallIntentDispatched(contactName, directCmd.args?.phoneNumber);
      }

      const eventObj: ToolCallEvent = {
        id: String(Date.now()),
        name: directCmd.toolName || (directCmd.isWeb ? "openWeb" : "openApp"),
        args: directCmd.args || {},
        timestamp: Date.now(),
        status: "success",
        resultMessage: directCmd.isWeb
          ? `वेबसाइट खोल दी गई: ${directCmd.targetName || "Web"}`
          : `फोन में कमांड पूरा किया गया: ${directCmd.targetName || directCmd.toolName}`,
        sassyRemark: directCmd.replyText,
        intentAction: directCmd.intentAction || (directCmd.isWeb ? "android.intent.action.VIEW" : "android.intent.action.MAIN"),
        intentUri: directCmd.intentUri || directCmd.webUrl,
        webUrl: directCmd.webUrl,
        targetName: directCmd.targetName,
      };
      setCurrentToolEvent(eventObj);
      setLatestSubtitle(directCmd.replyText || "");
      speakAvaniFallback(directCmd.replyText || "लीजिए, तुरंत खोल दिया है!");
      return;
    }

    // 1. Direct Instant Custom Memory lookup (0ms latency from Three-Dots Memory)
    const instantMemoryAnswer = findLocalMemoryAnswer(trimmed, memoriesRef.current);
    if (instantMemoryAnswer) {
      console.log("Voice Mode answered immediately from Three-Dots Custom Memory:", instantMemoryAnswer);
      setLatestSubtitle(instantMemoryAnswer);
      speakAvaniFallback(instantMemoryAnswer);

      // Record in conversation history for continuity
      const userMsg: ChatMessage = {
        id: "user-" + Date.now(),
        sender: "user",
        text: trimmed,
        timestamp: Date.now(),
      };
      const avaniMsg: ChatMessage = {
        id: "avani-" + Date.now(),
        sender: "avani",
        text: instantMemoryAnswer,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, userMsg, avaniMsg]);
      saveChatMessage(userMsg).catch(() => {});
      saveChatMessage(avaniMsg).catch(() => {});
      return;
    }

    // 2. Send to Live WebSocket if open
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "text",
          text: trimmed,
        })
      );
    }

    // 3. Robust Gemini Query with fully injected custom memories & tools
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      autoExtractAndSaveMemories(trimmed)
        .then((newMem) => {
          if (newMem) {
            setMemories((prev) => [newMem, ...prev.filter((m) => m.id !== newMem.id)]);
          }
        })
        .catch(() => {});

      const res = await fetch("/api/avani/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: trimmed,
          memoryContext: formatMemoriesForContext(memoriesRef.current),
          chatHistory: chatMessages.slice(-14),
        }),
        signal: controller.signal,
      }).catch((fetchErr) => {
        console.warn("Direct query fetch notice:", fetchErr);
        return null;
      });
      clearTimeout(timeoutId);

      const data = (res && res.ok) ? await res.json().catch(() => null) : null;
      let fileGenerated = false;

      if (data?.functionCalls && data.functionCalls.length > 0) {
        for (const call of data.functionCalls) {
          const toolResult = await toolEngine.executeTool(
            call.name,
            call.args,
            permissions
          );

          const eventObj: ToolCallEvent = {
            id: String(Date.now()),
            name: call.name,
            args: call.args,
            timestamp: Date.now(),
            status: toolResult.success
              ? "success"
              : toolResult.message.includes("Permission Denied")
              ? "permission_denied"
              : "failed",
            resultMessage: toolResult.message,
            sassyRemark: toolResult.sassyRemark,
            intentAction: toolResult.intentAction,
            intentUri: toolResult.intentUri,
            webUrl: toolResult.webUrl,
            targetName: toolResult.targetName,
            fileData: toolResult.fileData,
          };

          // If app or web was launched, open real native app directly on phone!
          if (call.name === "openApp" || call.name === "openWeb") {
            const targetTitle = call.args?.appName || call.args?.title || "App";
            if (call.name === "openApp") {
              const target = resolveAppTarget(targetTitle || call.args?.packageName || "App");
              dispatchDirectNativeApp(target);
            } else {
              dispatchDirectNativeApp({
                name: targetTitle,
                packageName: call.args?.packageName,
                intentUri: toolResult.intentUri,
                deepLinkScheme: toolResult.intentUri || toolResult.webUrl,
                fallbackWebUrl: call.args?.url || toolResult.webUrl,
                query: call.args?.query || "",
                title: targetTitle,
              });
            }
          }

          if (call.name === "makePhoneCall") {
            const contactName = call.args?.contactName || "Contact";
            callStateDetector.notifyCallIntentDispatched(contactName, call.args?.phoneNumber);
          }

          if (toolResult.fileData) {
            setActiveGeneratedFile(toolResult.fileData);
            setIsGeneratedFileModalOpen(true);
            setCurrentToolEvent(null);
            fileGenerated = true;
          } else {
            setCurrentToolEvent(eventObj);
          }

          setLatestSubtitle(toolResult.sassyRemark);
          speakAvaniFallback(toolResult.sassyRemark);
        }
      }

      // If user explicitly asked for code and server gave zero reply, synthesize fallback
      if (!fileGenerated && !data?.replyText) {
        const isCodeOrder = /लिखो|लिखे|बनाओ|generate|create|write/i.test(trimmed);
        if (isCodeOrder) {
          const smartFile = generateSmartFileForQuery(trimmed);
          setActiveGeneratedFile(smartFile);
          setIsGeneratedFileModalOpen(true);
          const remark = `लीजिए! मैंने आपके लिए '${smartFile.title}' तैयार कर दिया है। आप इसे सीधे स्क्रीन पर देख सकते हैं या PDF/ZIP में डाउनलोड कर सकते हैं!`;
          setLatestSubtitle(remark);
          speakAvaniFallback(remark);
          fileGenerated = true;
        }
      }

      if (!fileGenerated) {
        if (data?.replyText) {
          setLatestSubtitle(data.replyText);
          speakAvaniFallback(data.replyText);
        } else {
          const isCreatorQuery = /क्रिएटर|creator|किसने बनाया|who made|who created|developer|मालिक/i.test(trimmed);
          const fallbackRemark = isCreatorQuery
            ? "मुझे विनय प्रताप (Vinay Pratap) ने बनाया है! वो मेरे क्रिएटर और मास्टरमाइंड हैं।"
            : "हाँजी, मैं सुन रही हूँ! बताइए क्या काम करवाना है?";
          setLatestSubtitle(fallbackRemark);
          speakAvaniFallback(fallbackRemark);
        }
      }
    } catch (e) {
      console.warn("Handled query notice:", e);
      const fallbackRemark = "हाँजी! मैं तैयार हूँ, बताइए क्या करना है?";
      setLatestSubtitle(fallbackRemark);
      speakAvaniFallback(fallbackRemark);
    }
  }, [permissions, chatMessages, handleStopSpeaking]);

  // Activate Listening Mode with Intelligent Noise Rejection & Continuous Utterance Recognition
  const startListeningSession = useCallback(async () => {
    if (!permissions.recordAudio) {
      setIsPermissionsOpen(true);
      return;
    }

    isContinuousListeningRef.current = true;
    setAssistantState("LISTENING");
    setStatusMessage("Avani is listening...");
    setLatestSubtitle("");

    // Ensure WebSocket is open with latest memories
    connectLiveWebSocket();

    // Stream user utterances from SpeechRecognition while in listening mode
    let utteranceTimer: any = null;
    let lastTranscript = "";
    let lastHandledCommand = "";
    let lastHandledTime = 0;

    wakeWordDetector.setUtteranceListener((transcript, isFinal) => {
      if (stateRef.current === "SPEAKING") return;
      lastTranscript = transcript;
      setLatestSubtitle(`"${transcript}"`);

      if (speechVerificationTimerRef.current) {
        clearTimeout(speechVerificationTimerRef.current);
        speechVerificationTimerRef.current = null;
      }
      isSpeechPausedDueToNoiseRef.current = false;

      if (utteranceTimer) clearTimeout(utteranceTimer);

      const processUtterance = (rawText: string) => {
        const text = rawText.trim();
        if (!text || text.length < 2) return;
        // Check and reject ambient room noise / single syllable murmurs
        if (isLikelyAmbientNoise(text)) {
          console.log("Filtered out ambient noise murmur in voice mode:", text);
          return;
        }
        // If a call is active, don't execute voice commands unless it's to end call
        if (callStateDetector.isCallActive()) {
          const isEndCall = /कॉल काटो|कॉल बंद करो|फोन काटो|end call|hang up/i.test(text);
          if (isEndCall) {
            callStateDetector.endCall();
          } else {
            console.log("Utterance muted during active call:", text);
          }
          return;
        }
        // Keep listener open for continuous voice commands; reset transcript buffer
        lastTranscript = "";
        lastHandledCommand = text;
        lastHandledTime = Date.now();
        handleSimulatedQuery(text);
      };

      // ⚡ INSTANT ATTENTION & 0MS EXECUTION:
      // If the interim words already match an app or phone command (e.g. "यूट्यूब खोलो", "कैमरा खोलो", "व्हाट्सएप चालू करो", "कैलकुलेटर"),
      // execute IMMEDIATELY at 0ms latency without waiting for speech pause!
      const fastCheck = matchDeviceCommand(transcript);
      if (fastCheck.handled) {
        const isRecentDup =
          lastHandledCommand === transcript && Date.now() - lastHandledTime < 2500;
        if (!isRecentDup) {
          processUtterance(transcript);
          return;
        }
      }

      if (isFinal) {
        processUtterance(transcript);
      } else {
        // Fast 300ms responsiveness for conversational queries once speaker pauses
        utteranceTimer = setTimeout(() => {
          processUtterance(lastTranscript);
        }, 300);
      }
    });

    // Start Audio Capture with 16kHz PCM streaming and voice filtering
    await liveAudio.startInputCapture(
      (pcmBase64) => {
        if (callStateDetector.isCallActive()) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "audio",
              audio: pcmBase64,
            })
          );
        }
      },
      // When voice activity is detected while Avani is speaking:
      () => {
        if (stateRef.current === "SPEAKING") {
          liveAudio.pausePlayback();
          isSpeechPausedDueToNoiseRef.current = true;
          setAssistantState("LISTENING");
          setStatusMessage("अवनी सुन रही है (शोर का परीक्षण)... / Checking speech...");

          if (speechVerificationTimerRef.current) {
            clearTimeout(speechVerificationTimerRef.current);
          }

          speechVerificationTimerRef.current = setTimeout(() => {
            if (isSpeechPausedDueToNoiseRef.current) {
              isSpeechPausedDueToNoiseRef.current = false;
              console.log("Ambient noise rejected: No real user speech detected. Resuming speech!");
              setAssistantState("SPEAKING");
              setStatusMessage("शोर नज़रअंदाज़ किया गया — अवनी बोल रही है...");
              liveAudio.resumePlayback();
            }
          }, 1600);
        }
      }
    );
  }, [connectLiveWebSocket, permissions.recordAudio, handleSimulatedQuery]);

  // Stop Listening / Go Idle
  const stopListeningSession = useCallback(() => {
    isContinuousListeningRef.current = false;
    wakeWordDetector.setUtteranceListener(null);
    if (speechVerificationTimerRef.current) {
      clearTimeout(speechVerificationTimerRef.current);
      speechVerificationTimerRef.current = null;
    }
    isSpeechPausedDueToNoiseRef.current = false;
    liveAudio.stopInputCapture();
    liveAudio.interrupt();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setAssistantState("IDLE");
    setStatusMessage('Avani is resting. Say "Avani" or tap the orb.');
  }, []);

  // Toggle Assistant Orb
  const handleOrbClick = () => {
    if (assistantState === "IDLE") {
      startListeningSession();
      // Greet with sassy opener on direct tap
      const isHindi = languageMode === "hi";
      const remarks = isHindi ? SASSY_REMARKS.greetingsHindi : SASSY_REMARKS.greetings;
      const greeting = remarks[Math.floor(Math.random() * remarks.length)];
      setLatestSubtitle(greeting);
    } else if (assistantState === "LISTENING" || assistantState === "SPEAKING") {
      stopListeningSession();
    }
  };

  // Wake-word detection callback with trailing query support
  const handleWakeWordDetected = useCallback(
    (phrase: string, trailingQuery?: string) => {
      setWakeWordCount((prev) => prev + 1);
      setLastWakeWordPhrase(phrase);
      console.log("Wake word trigger received:", phrase, "Trailing query:", trailingQuery);

      if (trailingQuery && trailingQuery.trim().length > 1) {
        startListeningSession();
        handleSimulatedQuery(trailingQuery.trim());
        return;
      }

      if (stateRef.current === "IDLE") {
        startListeningSession();
        // Play snappy audio wake confirmation
        const isHindiTrigger = /[\u0900-\u097F]/.test(phrase) || languageMode === "hi";
        const remarks = isHindiTrigger ? SASSY_REMARKS.greetingsHindi : SASSY_REMARKS.greetings;
        const randomWakeSass = remarks[Math.floor(Math.random() * remarks.length)];
        setLatestSubtitle(randomWakeSass);
        speakAvaniFallback(randomWakeSass);
      }
    },
    [startListeningSession, languageMode, handleSimulatedQuery]
  );

  // Initialize Foreground Service & Wake-Word Detector on mount
  useEffect(() => {
    if (isForegroundServiceRunning && permissions.recordAudio) {
      wakeWordDetector.start(handleWakeWordDetected);
    } else {
      wakeWordDetector.stop();
    }

    return () => {
      wakeWordDetector.stop();
      liveAudio.stopInputCapture();
      liveAudio.interrupt();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isForegroundServiceRunning, permissions.recordAudio, handleWakeWordDetected]);

  const togglePermission = (key: keyof PermissionsState) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const grantAllPermissions = () => {
    setPermissions({
      recordAudio: true,
      readContacts: true,
      callPhone: true,
      postNotifications: true,
    });
  };

  // Handle Chat Mode messages
  const handleSendChatMessage = async (queryText: string) => {
    // Check if query is an explicit stop / silence command
    const isStop =
      /रुक जाओ|रुको|चुप|शांत|बस करो|ठहरो|बंद करो|stop|pause|wait|shut up|quiet/i.test(
        queryText
      );
    if (isStop) {
      handleStopSpeaking();
      const stopMsg: ChatMessage = {
        id: "avani-" + Date.now(),
        sender: "avani",
        text: "ठीक है, मैं चुप हो गई हूँ। जब भी आवाज़ देनी हो, बुला लेना!",
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [
        ...prev,
        { id: "user-" + Date.now(), sender: "user", text: queryText, timestamp: Date.now() },
        stopMsg,
      ]);
      return;
    }

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: queryText,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    saveChatMessage(userMsg).catch(() => {});
    autoExtractAndSaveMemories(queryText)
      .then((newMem) => {
        if (newMem) {
          setMemories((prev) => [newMem, ...prev.filter((m) => m.id !== newMem.id)]);
        }
      })
      .catch(() => {});

    // Direct Native Android Device & Fast Web Command Recognition (0ms latency)
    const directCmd = matchDeviceCommand(queryText);
    if (directCmd.handled) {
      if (directCmd.toolName === "openApp" || directCmd.toolName === "openWeb" || directCmd.isWeb) {
        const targetTitle = directCmd.targetName || directCmd.args?.appName || directCmd.args?.title || "App";
        dispatchDirectNativeApp({
          name: targetTitle,
          packageName: directCmd.args?.packageName,
          intentUri: directCmd.intentUri,
          deepLinkScheme: directCmd.intentUri || directCmd.webUrl,
          fallbackWebUrl: directCmd.webUrl || directCmd.args?.url || directCmd.fallbackWebUrl,
          query: directCmd.args?.query || "",
          title: targetTitle,
        });
      }

      if (directCmd.toolName === "makePhoneCall") {
        const contactName = directCmd.args?.contactName || directCmd.targetName || "Contact";
        callStateDetector.notifyCallIntentDispatched(contactName, directCmd.args?.phoneNumber);
      }

      const avaniMsg: ChatMessage = {
        id: "avani-" + Date.now(),
        sender: "avani",
        text: directCmd.replyText || "लीजिए, तुरंत खोल दिया गया है!",
        timestamp: Date.now(),
        intentAction: directCmd.intentAction,
        intentUri: directCmd.intentUri || directCmd.webUrl,
        webUrl: directCmd.webUrl,
        appName: directCmd.targetName,
      };

      setChatMessages((prev) => [...prev, avaniMsg]);
      saveChatMessage(avaniMsg).catch(() => {});
      setLatestSubtitle(avaniMsg.text);

      // Persist to active session
      setSessions((prevSessions) => {
        const existing = prevSessions.find((s) => s.id === activeSessionId);
        const title =
          existing && existing.title !== "नई बातचीत (New Chat)"
            ? existing.title
            : queryText.slice(0, 32);

        const currentMsgs = existing?.messages || [];
        const updatedMsgs = [...currentMsgs, userMsg, avaniMsg];

        const updatedSession: ChatSession = {
          id: activeSessionId,
          title,
          createdAt: existing?.createdAt || Date.now(),
          updatedAt: Date.now(),
          messages: updatedMsgs,
          messageCount: updatedMsgs.length,
        };

        saveChatSession(updatedSession).catch(() => {});
        return [updatedSession, ...prevSessions.filter((s) => s.id !== activeSessionId)];
      });

      if (!isVoiceMutedInChat) {
        speakAvaniFallback(avaniMsg.text);
      }
      return;
    }

    setIsChatThinking(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const res = await fetch("/api/avani/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: queryText,
          memoryContext: formatMemoriesForContext(memories),
          chatHistory: chatMessages.slice(-14),
        }),
        signal: controller.signal,
      }).catch((fetchErr) => {
        console.warn("Direct fetch notice:", fetchErr);
        return null;
      });
      clearTimeout(timeoutId);

      let data: any = null;
      if (res && res.ok) {
        data = await res.json().catch(() => null);
      }

      let reply = data?.replyText || "";
      let generatedFile: GeneratedFile | undefined;
      let intentAction: string | undefined;

      if (data?.functionCalls && data.functionCalls.length > 0) {
        for (const call of data.functionCalls) {
          const toolResult = await toolEngine.executeTool(
            call.name,
            call.args,
            permissions
          );

          if (toolResult.fileData) {
            generatedFile = toolResult.fileData;
            setActiveGeneratedFile(toolResult.fileData);
          }
          if (toolResult.intentAction) {
            intentAction = toolResult.intentAction;
          }

          const sassy = toolResult.sassyRemark || toolResult.message;
          reply = reply ? `${reply}\n\n${sassy}` : sassy;
        }
      }

      // Only synthesize fallback file if server gave no reply and user explicitly asked to create/write code
      if (!generatedFile && (!reply || reply.includes("हिकप") || reply.includes("hiccup"))) {
        const isCodeOrder = /लिखो|लिखे|बनाओ|generate|create|write/i.test(queryText);
        if (isCodeOrder) {
          const smartFile = generateSmartFileForQuery(queryText);
          generatedFile = smartFile;
          setActiveGeneratedFile(smartFile);
          reply = `लीजिए! मैंने आपके लिए '${smartFile.title}' तैयार कर दिया है। आप इसे सीधे स्क्रीन पर देख सकते हैं या PDF/ZIP में डाउनलोड कर सकते हैं!`;
        }
      }

      if (!reply) {
        if (/क्रिएटर|creator|किसने बनाया|who made|who created|developer|मालिक/i.test(queryText)) {
          reply = "मुझे विनय प्रताप (Vinay Pratap) ने बनाया है! वो मेरे क्रिएटर और मास्टरमाइंड हैं। उनकी बनाई अवनी 2.O दुनिया की सबसे स्मार्ट और सैसी AI असिस्टेंट है!";
        } else {
          reply = "हाँजी! मैं सुन रही हूँ। हुक्म कीजिए, क्या काम करवाना है?";
        }
      }

      const avaniMsg: ChatMessage = {
        id: "avani-" + Date.now(),
        sender: "avani",
        text: reply,
        timestamp: Date.now(),
        fileData: generatedFile,
        intentAction,
      };

      setChatMessages((prev) => [...prev, avaniMsg]);
      saveChatMessage(avaniMsg).catch(() => {});
      setLatestSubtitle(reply);

      // Persist to active session
      setSessions((prevSessions) => {
        const existing = prevSessions.find((s) => s.id === activeSessionId);
        const title =
          existing && existing.title !== "नई बातचीत (New Chat)"
            ? existing.title
            : queryText.slice(0, 32);

        const currentMsgs = existing?.messages || [];
        const updatedMsgs = [...currentMsgs, userMsg, avaniMsg];

        const updatedSession: ChatSession = {
          id: activeSessionId,
          title,
          createdAt: existing?.createdAt || Date.now(),
          updatedAt: Date.now(),
          messages: updatedMsgs,
          messageCount: updatedMsgs.length,
        };

        saveChatSession(updatedSession).catch(() => {});
        return [updatedSession, ...prevSessions.filter((s) => s.id !== activeSessionId)];
      });

      // Speak if voice in chat is not muted
      if (!isVoiceMutedInChat) {
        speakAvaniFallback(reply);
      }
    } catch (e) {
      console.warn("Handled chat query notice:", e);
      const fallbackMsg: ChatMessage = {
        id: "avani-" + Date.now(),
        sender: "avani",
        text: "हाँजी! मैं सुन रही हूँ। नेटवर्क में थोड़ा समय लग रहा था, बताइए क्या मदद करूँ?",
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsChatThinking(false);
    }
  };

  // Session switching and creation handlers
  const handleSelectSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setChatMessages(session.messages || []);
  };

  const handleNewChat = () => {
    const newSessionId = "session_" + Date.now();
    const welcomeMsg: ChatMessage = {
      id: "welcome-" + Date.now(),
      sender: "avani",
      text: "नमस्ते! नई बातचीत शुरू हो गई है। बताइए आज क्या काम करना है?",
      timestamp: Date.now(),
    };
    const newSession: ChatSession = {
      id: newSessionId,
      title: "नई बातचीत (New Chat)",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [welcomeMsg],
      messageCount: 1,
    };

    setActiveSessionId(newSessionId);
    setChatMessages([welcomeMsg]);
    setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSessionId)]);
    saveChatSession(newSession).catch(() => {});
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteChatSession(sessionId);
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionId);
      if (sessionId === activeSessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          setChatMessages(remaining[0].messages);
        } else {
          setTimeout(() => handleNewChat(), 50);
        }
      }
      return remaining;
    });
  };

  return (
    <div
      id="avani-main-wrapper"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white relative overflow-hidden select-none"
    >
      {/* Background neon ambient gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-purple-900/20 via-pink-900/15 to-cyan-900/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-900/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-pink-900/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Status Bar with Chat Mode button on right side */}
      <header
        id="app-status-bar"
        className={`w-full px-4 py-3 flex items-center justify-between z-30 sticky top-0 bg-slate-950/60 backdrop-blur-md border-b border-slate-800/40 transition-all ${
          isGeneratedFileModalOpen ? "hidden" : ""
        }`}
      >
        {/* Left Side: Brand Indicator - "Avani 2.O" */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-400/50" />
            <span className="absolute w-4 h-4 rounded-full bg-emerald-400/40 animate-ping" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-black tracking-wide text-white drop-shadow-[0_2px_8px_rgba(236,72,153,0.35)] font-sans">
              Avani <span className="text-pink-400 font-extrabold">2.O</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
              LIVE
            </span>
          </div>
        </div>

        {/* Right Side: Chat Mode & Three-Dots Menu */}
        <div className="flex items-center gap-2 relative" ref={statusMenuRef}>
          {/* Chat Mode Button */}
          <button
            id="open-chat-mode-btn"
            onClick={() => setIsChatModalOpen(true)}
            className="px-3 sm:px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-pink-500/50 text-slate-200 hover:text-white flex items-center gap-1.5 sm:gap-2 text-xs font-semibold shadow-md shadow-pink-950/20 transition-all active:scale-95 group"
            title="चैट मोड खोलें (Open Chat Mode)"
            aria-label="Open Chat Mode"
          >
            <MessageSquare className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
            <span>Chat Mode</span>
            {chatMessages.length > 1 && (
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            )}
          </button>

          {/* Three-Dots Menu Button - Pitch Black Dark */}
          <button
            id="status-menu-btn"
            onClick={() => setIsStatusMenuOpen((prev) => !prev)}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-95 shadow-md ${
              isStatusMenuOpen
                ? "bg-black border-pink-500 text-pink-300 shadow-black ring-1 ring-pink-500/40"
                : "bg-black hover:bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-white shadow-black"
            }`}
            title="अधिक विकल्प (More Options)"
            aria-label="More options"
            aria-expanded={isStatusMenuOpen}
          >
            <MoreVertical className="w-4 h-4 text-white" />
          </button>

          {/* Dropdown Popover - Pitch Black Dark */}
          {isStatusMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 py-2 rounded-2xl bg-black border border-neutral-800 shadow-[0_20px_60px_rgba(0,0,0,0.95)] ring-1 ring-white/10 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-neutral-900 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                  Avani 2.O Menu
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/80" />
              </div>

              {/* 0. Noise Isolation / Ultra Voice Shield Toggle */}
              <button
                id="status-menu-noise-shield"
                onClick={() => {
                  const nextMode: NoiseSuppressionMode =
                    noiseMode === "ultra_isolation"
                      ? "high_rejection"
                      : noiseMode === "high_rejection"
                      ? "balanced"
                      : "ultra_isolation";
                  setNoiseMode(nextMode);
                  liveAudio.setNoiseMode(nextMode);
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-900/90 flex items-center justify-between transition-colors group border-b border-neutral-900/80"
                title="Ultra Voice Shield: बाहरी शोर 100% ब्लॉक, केवल आपकी आवाज़ पर फोकस"
              >
                <div className="flex items-center gap-2.5">
                  <Shield
                    className={`w-4 h-4 ${
                      noiseMode === "ultra_isolation"
                        ? "text-emerald-400"
                        : noiseMode === "high_rejection"
                        ? "text-cyan-400"
                        : "text-slate-400"
                    } group-hover:scale-110 transition-transform`}
                  />
                  <div className="flex flex-col">
                    <span className="text-white font-semibold">अल्ट्रा शील्ड (नॉइज़)</span>
                    <span className="text-[10px] text-neutral-400">बाहरी शोर ब्लॉक करें</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    noiseMode === "ultra_isolation"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : noiseMode === "high_rejection"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                      : "bg-neutral-900 text-slate-400 border-neutral-700"
                  }`}
                >
                  {noiseMode === "ultra_isolation"
                    ? "Ultra Shield"
                    : noiseMode === "high_rejection"
                    ? "High Shield"
                    : "Balanced"}
                </span>
              </button>

              {/* 1. Avani Memory */}
              <button
                onClick={() => {
                  setIsStatusMenuOpen(false);
                  setIsMemoryModalOpen(true);
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-900/90 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Brain className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>अवनी की मेमोरी (Memory)</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-neutral-900 text-purple-300 border border-purple-500/30 font-mono font-bold">
                  {memories.length}
                </span>
              </button>

              {/* 2. Creator Vinay Pratap */}
              <button
                onClick={() => {
                  setIsStatusMenuOpen(false);
                  setIsCreatorModalOpen(true);
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-900/90 flex items-center gap-2.5 transition-colors group"
              >
                <Award className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                  <span className="text-white font-semibold">क्रिएटर: विनय प्रताप</span>
                  <span className="text-[10px] text-pink-300/80">Mastermind: Vinay Pratap</span>
                </div>
              </button>

              {/* 3. Device Permissions */}
              <button
                onClick={() => {
                  setIsStatusMenuOpen(false);
                  setIsPermissionsOpen(true);
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-900/90 flex items-center gap-2.5 transition-colors group"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>डिवाइस परमिशन्स (Permissions)</span>
              </button>

              {/* 4. Universal Voice Recognition */}
              <button
                onClick={() => {
                  setIsStatusMenuOpen(false);
                  setIsVoiceRecognitionModalOpen(true);
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-900/90 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Mic className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                  <span>आवाज़ पहचान (Voice Recognition)</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                  Active
                </span>
              </button>

              {/* 5. Call Auto-Mute Simulator */}
              <button
                onClick={() => {
                  setIsStatusMenuOpen(false);
                  if (callState.isCallActive) {
                    callStateDetector.endCall();
                  } else {
                    callStateDetector.startCall("परीक्षण कॉल (Rahul Sharma)", "+91 98765 43210");
                  }
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-900/90 flex items-center justify-between transition-colors group border-t border-neutral-900"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>{callState.isCallActive ? "कॉल समाप्त करें" : "कॉल ऑटो-म्यूट टेस्ट"}</span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                    callState.isCallActive
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-neutral-900 text-slate-400"
                  }`}
                >
                  {callState.isCallActive ? "Muted" : "Test"}
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Minimal Viewport - hidden when viewing full-screen delivered file */}
      <main
        className={`flex-1 flex flex-col items-center justify-center p-4 relative z-20 w-full max-w-xl mx-auto ${
          isGeneratedFileModalOpen ? "hidden" : ""
        }`}
      >
        {/* Floating Fast-Launch Confirmation & 1-Tap Trigger for Native Mobile Apps */}
        {lastLaunchedApp && (
          <div className="mb-3 w-full max-w-sm mx-auto animate-in fade-in slide-in-from-top-3 duration-200">
            <a
              href={lastLaunchedApp.primaryUri}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-neutral-900/95 to-emerald-950/95 border border-emerald-500/50 shadow-xl shadow-emerald-950/60 backdrop-blur-md active:scale-95 transition-all text-left group"
              title="तुरंत ऐप खोलें"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 text-sm animate-pulse">
                  ⚡
                </span>
                <div className="flex flex-col">
                  <span className="text-white text-xs font-bold leading-tight flex items-center gap-1.5">
                    {lastLaunchedApp.hindiName || lastLaunchedApp.name} खोला गया
                    <span className="text-[10px] text-emerald-400 font-mono">(Active)</span>
                  </span>
                  <span className="text-[10px] text-emerald-300/80 font-medium">
                    यदि फोन में न खुला हो, तो यहाँ टैप करें
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        )}

        {/* Central Responsive Voice Orb */}
        <div className="my-auto flex flex-col items-center justify-center text-center">
          {/* Live Universal Voice Recognition Badge */}
          <button
            onClick={() => setIsVoiceRecognitionModalOpen(true)}
            className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/85 hover:bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 text-xs font-semibold shadow-lg shadow-black/80 transition-all active:scale-95 group"
            title="यूनिवर्सल आवाज़ पहचान सेटिंग्स (Universal Voice Recognition)"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-white group-hover:text-emerald-300 transition-colors font-medium">
              यूनिवर्सल वॉयस:
            </span>
            <span className="text-emerald-400 font-mono text-[11px] font-bold">
              {liveSpeaker?.pitchHz && liveSpeaker.pitchHz > 0
                ? `${liveSpeaker.matchedSpeakerName} (${liveSpeaker.pitchHz}Hz)`
                : "सक्रिय • सभी की आवाज़"}
            </span>
          </button>

          <div className="relative">
            <AvaniOrbCanvas
              state={assistantState}
              onClick={handleOrbClick}
              size={320}
            />
          </div>

          {/* Floating Subtle Subtitles (only when Avani speaks or listens) */}
          {latestSubtitle && (
            <div className="mt-6 max-w-md mx-auto px-4 py-3 rounded-2xl bg-slate-900/85 border border-pink-500/30 text-xs sm:text-sm text-pink-200 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 text-center">
              <p className="italic leading-relaxed font-sans font-medium">
                "{latestSubtitle}"
              </p>
            </div>
          )}
        </div>

        {/* Floating Circular On / Off Power Button anchored at bottom */}
        <div className="fixed bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
          <button
            id="avani-power-button"
            onClick={() => {
              if (assistantState === "IDLE") {
                startListeningSession();
              } else {
                handleStopSpeaking();
              }
            }}
            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 border-2 ${
              assistantState !== "IDLE"
                ? "bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-600/50 animate-pulse"
                : "bg-slate-900/95 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border-slate-700/80 hover:border-emerald-500/70 shadow-slate-950/80"
            }`}
            title={assistantState !== "IDLE" ? "अवनी बंद करें (Turn Off)" : "अवनी चालू करें (Turn On)"}
            aria-label={assistantState !== "IDLE" ? "Turn Off Avani" : "Turn On Avani"}
          >
            <Power
              className={`w-7 h-7 sm:w-8 sm:h-8 transition-transform ${
                assistantState !== "IDLE" ? "text-white" : "text-emerald-400"
              }`}
            />
          </button>
          <span className="text-[11px] font-medium tracking-wider uppercase text-slate-400 mt-2 font-mono">
            {assistantState !== "IDLE" ? "Stop / Off" : "Start / On"}
          </span>
        </div>
      </main>

      {/* Active Phone Call & Conversation Auto-Mute Status Bar */}
      <CallMutedStatusBar
        callState={callState}
        onEndCall={() => callStateDetector.endCall()}
      />

      {/* Live Interactive In-App & Web Screen Viewport with Floating Continuous Voice Bar */}
      <ActiveAppScreenModal
        appScreen={activeAppScreen}
        onClose={() => setActiveAppScreen(null)}
        assistantState={assistantState}
        latestSubtitle={latestSubtitle}
        onVoiceCommand={(cmd) => handleSimulatedQuery(cmd)}
        onStopSpeaking={handleStopSpeaking}
      />

      {/* Interactive Generated File & Code Viewer Screen (100% Solid Fullscreen on Demand) */}
      <GeneratedFileModal
        file={activeGeneratedFile}
        isOpen={isGeneratedFileModalOpen}
        onClose={() => setIsGeneratedFileModalOpen(false)}
      />

      {/* Chat Mode Modal / Full Screen View */}
      <AvaniChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendChatMessage}
        isThinking={isChatThinking}
        onOpenFileModal={(f) => {
          setActiveGeneratedFile(f);
          setIsGeneratedFileModalOpen(true);
        }}
        onClearChat={() => setChatMessages([])}
        onSpeakText={(txt) => speakAvaniFallback(txt)}
        isVoiceMuted={isVoiceMutedInChat}
        onToggleVoiceMute={() => setIsVoiceMutedInChat(!isVoiceMutedInChat)}
        onOpenMemory={() => setIsMemoryModalOpen(true)}
        memoriesCount={memories.length}
        onOpenCreator={() => setIsCreatorModalOpen(true)}
        onOpenPermissions={() => setIsPermissionsOpen(true)}
        onOpenVoiceRecognition={() => setIsVoiceRecognitionModalOpen(true)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />

      {/* Universal Voice Recognition Modal */}
      <VoiceRecognitionModal
        isOpen={isVoiceRecognitionModalOpen}
        onClose={() => setIsVoiceRecognitionModalOpen(false)}
        liveSpeaker={liveSpeaker}
        onSpeakSample={speakAvaniFallback}
      />

      {/* Avani Long-Term Memory Modal */}
      <AvaniMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memories={memories}
        onAddMemory={async (content, category) => {
          const newMem = await saveMemory(content, category);
          const updated = [newMem, ...memories.filter((m) => m.id !== newMem.id)];
          setMemories(updated);
          memoriesRef.current = updated;
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "updateMemory",
                memoryContext: formatMemoriesForContext(updated),
              })
            );
          }
        }}
        onDeleteMemory={async (id) => {
          await deleteMemory(id);
          const updated = memories.filter((m) => m.id !== id);
          setMemories(updated);
          memoriesRef.current = updated;
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "updateMemory",
                memoryContext: formatMemoriesForContext(updated),
              })
            );
          }
        }}
      />

      {/* Creator Info Modal - Vinay Pratap */}
      <CreatorModal
        isOpen={isCreatorModalOpen}
        onClose={() => setIsCreatorModalOpen(false)}
      />

      {/* Permissions Modal (Shown if microphone access is needed) */}
      <PermissionsModal
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
        permissions={permissions}
        onTogglePermission={togglePermission}
        onGrantAll={grantAllPermissions}
      />
    </div>
  );
}
