import React, { useState, useEffect } from "react";
import {
  X,
  ArrowLeft,
  RotateCw,
  ExternalLink,
  Search,
  Globe,
  Youtube,
  Smartphone,
  Play,
  ThumbsUp,
  Share2,
  Camera,
  MessageCircle,
  MapPin,
  Music,
  Settings,
  Image,
  PhoneCall,
  Check,
  Send,
} from "lucide-react";
import { ActiveAppScreen, AssistantState } from "../types";
import { forceLaunchNativeApp } from "../utils/nativeAppLauncher";

interface ActiveAppScreenModalProps {
  appScreen: ActiveAppScreen | null;
  onClose: () => void;
  assistantState: AssistantState;
  latestSubtitle: string;
  onVoiceCommand: (query: string) => void;
  onStopSpeaking: () => void;
}

export const ActiveAppScreenModal: React.FC<ActiveAppScreenModalProps> = ({
  appScreen,
  onClose,
  assistantState,
  latestSubtitle,
  onVoiceCommand,
  onStopSpeaking: _onStopSpeaking,
}) => {
  // Common Navigation State
  const [_currentUrl, setCurrentUrl] = useState("");
  const [_searchInput, setSearchInput] = useState("");

  // YouTube Specific State
  const [activeVideoId, setActiveVideoId] = useState("jfKfPfyJRdk");
  const [youtubeSearch, setYoutubeSearch] = useState("");
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});

  // Calculator State
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcFormula, setCalcFormula] = useState("");
  const [calcHistory, setCalcHistory] = useState<string[]>([]);

  // Camera State
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [cameraFlash, setCameraFlash] = useState(false);

  // WhatsApp / Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "me" | "contact"; text: string; time: string }>>([
    { sender: "contact", text: "नमस्ते! अवनी असिस्टेंट से चैट कनेक्टेड है।", time: "10:30 AM" },
    { sender: "me", text: "हाय! अवनी ने मुझे यहाँ कनेक्ट किया है।", time: "10:31 AM" },
  ]);
  const [newChatText, setNewChatText] = useState("");

  // Web Browser State
  const [webSearchQuery, setWebSearchQuery] = useState("");
  const [isWebLoading, setIsWebLoading] = useState(false);

  useEffect(() => {
    if (appScreen) {
      setCurrentUrl(appScreen.url || "");
      setSearchInput(appScreen.query || "");
      if (appScreen.query) {
        setWebSearchQuery(appScreen.query);
        setYoutubeSearch(appScreen.query);
      }
    }
  }, [appScreen]);

  if (!appScreen) return null;

  const appKey = (appScreen.name || appScreen.title || "").toLowerCase();
  const isYouTube = appKey.includes("youtube") || appKey.includes("यूट्यूब");
  const isWeb =
    appScreen.type === "web" ||
    appKey.includes("google") ||
    appKey.includes("गूगल") ||
    appKey.includes("search") ||
    appKey.includes("web") ||
    appKey.includes("browser") ||
    appKey.includes("chatgpt");
  const isCalc = appKey.includes("calc") || appKey.includes("कैलकुलेटर");
  const isCamera = appKey.includes("camera") || appKey.includes("कैमरा");
  const isWhatsApp = appKey.includes("whatsapp") || appKey.includes("व्हाट्सएप") || appKey.includes("chat");
  const isMaps = appKey.includes("map") || appKey.includes("मैप");
  const isSpotify = appKey.includes("spotify") || appKey.includes("music") || appKey.includes("गाना");
  const isSettings = appKey.includes("setting") || appKey.includes("सेटिंग");
  const isInstagram = appKey.includes("instagram") || appKey.includes("insta") || appKey.includes("इंस्टाग्राम");

  // YouTube curated videos list
  const youtubeVideos = [
    {
      id: "jfKfPfyJRdk",
      title: "lofi hip hop radio 📚 - beats to relax/study to",
      channel: "Lofi Girl",
      views: "68M views",
      thumb: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "dQw4w9WgXcQ",
      title: "Rick Astley - Never Gonna Give You Up (Official Music Video)",
      channel: "Rick Astley",
      views: "1.5B views",
      thumb: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "k3Vfj-e1Ma4",
      title: "Python Full Course for Beginners [2026 Tutorial]",
      channel: "Programming with Mosh",
      views: "38M views",
      thumb: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "aircAruvnKk",
      title: "Neural Networks & AI Explained from Scratch",
      channel: "3Blue1Brown",
      views: "18M views",
      thumb: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80",
    },
  ];

  // Calculator button press handler
  const handleCalcButton = (btn: string) => {
    if (btn === "C") {
      setCalcDisplay("0");
      setCalcFormula("");
    } else if (btn === "=") {
      try {
        const sanitized = calcFormula.replace(/×/g, "*").replace(/÷/g, "/");
        // Safe arithmetic expression evaluation without arbitrary code
        const safeEval = Function(`"use strict"; return (${sanitized})`)();
        const resStr = String(Number(safeEval.toFixed(8)));
        setCalcHistory((prev) => [`${calcFormula} = ${resStr}`, ...prev.slice(0, 4)]);
        setCalcDisplay(resStr);
        setCalcFormula(resStr);
      } catch {
        setCalcDisplay("Error");
      }
    } else if (["+", "-", "×", "÷"].includes(btn)) {
      setCalcFormula((prev) => `${prev} ${btn} `);
      setCalcDisplay(btn);
    } else {
      setCalcDisplay((prev) => (prev === "0" || ["+", "-", "×", "÷"].includes(prev) ? btn : prev + btn));
      setCalcFormula((prev) => (prev === "0" ? btn : prev + btn));
    }
  };

  // Camera take snapshot
  const handleSnapPhoto = () => {
    setCameraFlash(true);
    setTimeout(() => setCameraFlash(false), 200);
    const mockSnap = `https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80`;
    setCapturedPhotos((prev) => [mockSnap, ...prev]);
  };

  // WhatsApp send message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setChatMessages((prev) => [...prev, { sender: "me", text: newChatText.trim(), time }]);
    const current = newChatText.trim();
    setNewChatText("");

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "contact",
          text: `अवनी के ज़रिए आपका संदेश प्राप्त हुआ: "${current}"!`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1000);
  };

  return (
    <div
      id="active-app-screen-container"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-in slide-in-from-bottom-5 duration-300 overflow-hidden font-sans"
    >
      {/* 1. Android Simulated System Status Bar */}
      <div className="w-full bg-black/90 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="text-[10px] text-pink-400 font-bold">Avani Device View</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            5G
          </span>
          <span className="text-slate-300">100%</span>
        </div>
      </div>

      {/* 2. Top Interactive App Header & Navigation Bar */}
      <div className="w-full bg-slate-900/95 border-b border-slate-800 px-3.5 py-2.5 flex items-center justify-between gap-3 shrink-0 shadow-lg">
        {/* Left: Back / Exit and App Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold shrink-0"
            title="स्क्रीन बंद करें / वापस जाएँ"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">होम</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
              {isYouTube ? (
                <Youtube className="w-4 h-4 text-red-400 fill-current" />
              ) : isWeb ? (
                <Globe className="w-4 h-4 text-cyan-300" />
              ) : isCalc ? (
                <span className="font-mono text-xs font-bold">+-</span>
              ) : isCamera ? (
                <Camera className="w-4 h-4 text-emerald-300" />
              ) : isWhatsApp ? (
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              ) : isMaps ? (
                <MapPin className="w-4 h-4 text-amber-400" />
              ) : isSpotify ? (
                <Music className="w-4 h-4 text-emerald-400" />
              ) : isSettings ? (
                <Settings className="w-4 h-4 text-slate-300" />
              ) : (
                <Smartphone className="w-4 h-4 text-pink-300" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate leading-tight">
                {appScreen.title || appScreen.name}
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 block truncate leading-none">
                ● Live Screen Active
              </span>
            </div>
          </div>
        </div>

        {/* Center / Search bar for Web or YouTube */}
        {(isWeb || isYouTube) && (
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <div className="w-full relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={isYouTube ? youtubeSearch : webSearchQuery}
                onChange={(e) => {
                  if (isYouTube) setYoutubeSearch(e.target.value);
                  else setWebSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (isYouTube && youtubeSearch.trim()) {
                      onVoiceCommand(`यूट्यूब पर खोजो ${youtubeSearch.trim()}`);
                    } else if (webSearchQuery.trim()) {
                      onVoiceCommand(`गूगल पर खोजो ${webSearchQuery.trim()}`);
                    }
                  }
                }}
                placeholder={isYouTube ? "यूट्यूब पर वीडियो खोजें..." : "वेब पर खोजें या URL डालें..."}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500 transition"
              />
            </div>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Real Phone App Launch Button */}
          <button
            onClick={() => {
              forceLaunchNativeApp({
                name: appScreen.name,
                packageName: appScreen.packageName,
                intentUri: appScreen.url,
                deepLinkScheme: appScreen.url,
                fallbackWebUrl: appScreen.url,
                query: appScreen.query,
                title: appScreen.title,
                hindiName: appScreen.hindiName,
              });
            }}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 text-xs font-semibold shadow-md shadow-emerald-950/40 hover:scale-[1.02] active:scale-95"
            title="मोबाइल के रियल ऐप में खोलें (Open in Native Mobile App)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">फोन के रियल ऐप में</span>
            <span className="sm:hidden">रियल ऐप</span>
          </button>

          {appScreen.url && (
            <a
              href={appScreen.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="नए ब्राउज़र टैब में खोलें"
            >
              <span className="hidden sm:inline">ब्राउज़र में</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition-colors"
            title="बंद करें"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Main Dynamic App Viewport Content */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-2 sm:p-4 pb-36">
        {/* VIEW 1: YOUTUBE APP INTERFACE */}
        {isYouTube && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Embedded Responsive YouTube Player */}
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1`}
                title="YouTube Video Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* Video Controls & Info Bar */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {youtubeVideos.find((v) => v.id === activeVideoId)?.title || "YouTube Live Stream & Music"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">
                      {youtubeVideos.find((v) => v.id === activeVideoId)?.channel || "YouTube Channel"}
                    </span>
                    <span>•</span>
                    <span>{youtubeVideos.find((v) => v.id === activeVideoId)?.views || "Live"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      setLikedVideos((prev) => ({
                        ...prev,
                        [activeVideoId]: !prev[activeVideoId],
                      }))
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                      likedVideos[activeVideoId]
                        ? "bg-pink-600 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{likedVideos[activeVideoId] ? "Liked" : "Like"}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: "YouTube Video", url: `https://youtu.be/${activeVideoId}` });
                      }
                    }}
                    className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    title="शेयर करें"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Recommended & Trending Videos Feed */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  ट्रेंडिंग & संबंधित वीडियो (Trending Videos)
                </span>
                <span className="text-xs text-pink-400 font-medium">क्लिक करके बदलें</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {youtubeVideos.map((vid) => (
                  <button
                    key={vid.id}
                    onClick={() => {
                      setActiveVideoId(vid.id);
                    }}
                    className={`text-left p-2.5 rounded-2xl border transition-all flex gap-3 group active:scale-[0.99] ${
                      activeVideoId === vid.id
                        ? "bg-pink-950/40 border-pink-500/60 ring-1 ring-pink-500/40"
                        : "bg-slate-900/70 hover:bg-slate-800 border-slate-800"
                    }`}
                  >
                    <div className="w-28 h-18 rounded-xl bg-slate-800 overflow-hidden relative shrink-0">
                      <img src={vid.thumb} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white/90 drop-shadow" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-pink-300 transition-colors">
                        {vid.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">{vid.channel}</p>
                      <p className="text-[10px] text-slate-500">{vid.views}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: WEB BROWSER / GOOGLE SEARCH INTERFACE */}
        {isWeb && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Web Search Bar Header */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative flex items-center">
                  <Search className="w-4 h-4 text-cyan-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={webSearchQuery}
                    onChange={(e) => setWebSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && webSearchQuery.trim()) {
                        setIsWebLoading(true);
                        setTimeout(() => setIsWebLoading(false), 400);
                      }
                    }}
                    placeholder="Google पर खोजें या कोई भी वेबसाइट URL दर्ज करें..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
                <button
                  onClick={() => {
                    if (webSearchQuery.trim()) {
                      setIsWebLoading(true);
                      setTimeout(() => setIsWebLoading(false), 400);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shrink-0 transition"
                >
                  सर्च करें
                </button>
              </div>

              {/* Quick Suggestion Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] text-slate-400 shrink-0 font-medium">त्वरित सर्च:</span>
                {["Google AI News", "Today Weather", "Tech News Hindi", "Stock Market", "ChatGPT Web"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setWebSearchQuery(tag);
                      setIsWebLoading(true);
                      setTimeout(() => setIsWebLoading(false), 400);
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/60 shrink-0 transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Live Web Search Results & Viewport */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-cyan-300 font-mono">
                    Google Web Engine • {webSearchQuery || "Live Portal"}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">0.08 seconds</span>
              </div>

              {isWebLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">वेब परिणाम लोड हो रहे हैं...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top Featured Knowledge Card */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-cyan-400">
                      वेब सर्च रिजल्ट • Google
                    </span>
                    <h4 className="text-sm font-bold text-white hover:text-cyan-300 cursor-pointer transition">
                      {webSearchQuery ? `${webSearchQuery} - Official Results & Information` : "Google Search & Web Intelligence"}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      अवनी 2.O असिस्टेंट ने आपके कहने पर वेब पेज को तुरंत स्क्रीन पर लोड कर दिया है। आप यहाँ सीधे खोज सकते हैं या ऊपर दिए बटन से किसी भी एक्सटर्नल ब्राउज़र में सीधे स्विच कर सकते हैं।
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <a
                        href={appScreen.url || `https://www.google.com/search?q=${encodeURIComponent(webSearchQuery || "Google")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        Google पर पूरा पेज खोलें <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Multiple Web Results */}
                  {[
                    {
                      title: "Latest Updates & Overview - 2026",
                      desc: "Complete real-time details, answers, and verified information delivered straight to your screen.",
                      url: "https://www.google.com",
                    },
                    {
                      title: "Direct Access & Interactive Portal",
                      desc: "Explore guides, documentation, multimedia, and articles with zero latency.",
                      url: "https://wikipedia.org",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500 font-mono">{item.url}</span>
                      <h5 className="text-xs font-bold text-white hover:text-cyan-300 cursor-pointer">{item.title}</h5>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: ANDROID CALCULATOR */}
        {isCalc && (
          <div className="max-w-sm mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            {/* Display */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-right space-y-1 min-h-[90px] flex flex-col justify-end">
              <span className="text-xs font-mono text-slate-500">{calcFormula || " "}</span>
              <span className="text-3xl font-mono font-bold text-white tracking-wider truncate">
                {calcDisplay}
              </span>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-2.5">
              {["C", "(", ")", "÷", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "⌫", "="].map((btn) => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === "⌫") {
                      setCalcDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
                      setCalcFormula((prev) => (prev.length > 1 ? prev.slice(0, -1) : ""));
                    } else {
                      handleCalcButton(btn);
                    }
                  }}
                  className={`h-13 rounded-2xl text-base font-bold transition-all active:scale-95 flex items-center justify-center ${
                    btn === "="
                      ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white col-span-1 shadow-lg shadow-pink-600/30"
                      : ["÷", "×", "-", "+"].includes(btn)
                      ? "bg-slate-800 text-pink-400 hover:bg-slate-700"
                      : btn === "C"
                      ? "bg-rose-950/60 text-rose-300 border border-rose-500/40 hover:bg-rose-900/60"
                      : "bg-slate-800/80 hover:bg-slate-700 text-white"
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>

            {/* History Preview */}
            {calcHistory.length > 0 && (
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">पिछला हिसाब:</span>
                {calcHistory.map((h, i) => (
                  <div key={i} className="truncate text-slate-300">{h}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: CAMERA APP */}
        {isCamera && (
          <div className="max-w-md mx-auto space-y-4">
            {/* Viewfinder */}
            <div className="relative w-full aspect-[3/4] bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between p-4">
              {/* Flash overlay */}
              {cameraFlash && <div className="absolute inset-0 bg-white z-20 animate-fade-out duration-200" />}

              {/* Top Camera Controls */}
              <div className="flex items-center justify-between z-10">
                <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-mono border border-white/20">
                  4K • 60FPS
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                  लाइव कैमरा
                </span>
              </div>

              {/* Focus Ring & Reticle */}
              <div className="self-center my-auto w-24 h-24 border-2 border-yellow-400/80 rounded-xl flex items-center justify-center animate-pulse">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
              </div>

              {/* Bottom Shutter Controls */}
              <div className="flex items-center justify-around z-10 pt-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                {/* Gallery thumbnail */}
                <div className="w-11 h-11 rounded-xl bg-slate-800 border border-white/20 overflow-hidden flex items-center justify-center">
                  {capturedPhotos[0] ? (
                    <img src={capturedPhotos[0]} alt="Snap" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                {/* Shutter Button */}
                <button
                  onClick={handleSnapPhoto}
                  className="w-16 h-16 rounded-full bg-white p-1 border-4 border-slate-300 shadow-2xl hover:scale-105 active:scale-95 transition-transform"
                >
                  <div className="w-full h-full rounded-full bg-white border-2 border-black/40" />
                </button>

                {/* Flip lens */}
                <button
                  onClick={() => handleSnapPhoto()}
                  className="w-11 h-11 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition"
                  title="कैमरा पलटें"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: WHATSAPP / INSTAGRAM / MESSAGING */}
        {(isWhatsApp || isInstagram) && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
            {/* Chat header */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {isWhatsApp ? "WA" : "IG"}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {isWhatsApp ? "WhatsApp Chat" : "Instagram Direct"}
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">ऑनलाइन • Online</span>
                </div>
              </div>
              <PhoneCall className="w-4 h-4 text-slate-400" />
            </div>

            {/* Chat messages stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-950/60">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === "me"
                        ? "bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-700/20"
                        : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="text-[9px] opacity-70 block text-right mt-1 font-mono">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat input form */}
            <form onSubmit={handleSendChat} className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
                placeholder="संदेश लिखें... / Type a message"
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!newChatText.trim()}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* VIEW 6: GENERIC APP VIEW (Settings, Maps, Spotify, etc.) */}
        {!isYouTube && !isWeb && !isCalc && !isCamera && !isWhatsApp && !isInstagram && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 mx-auto flex items-center justify-center text-white shadow-xl shadow-pink-600/30">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">{appScreen.title || appScreen.name}</h3>
              <p className="text-xs text-slate-400">
                यह ऐप स्क्रीन पर सक्रिय है। आप अवनी से कोई भी अगला काम बोल सकते हैं!
              </p>
            </div>

            {/* Quick action buttons for generic app */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">ऐप पैकेज</span>
                <span className="text-xs font-mono text-pink-400">{appScreen.packageName || "com.android.app"}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">स्थिति (Status)</span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> रनिंग (Active)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Persistent Floating Avani Voice HUD (NON-STOP CONTINUOUS LISTENING) */}
      <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-50">
        <div className="bg-slate-900/95 border-2 border-pink-500/70 rounded-2xl p-3 shadow-2xl backdrop-blur-xl ring-2 ring-pink-500/20 space-y-2">
          {/* Header of Voice HUD */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500" />
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                अवनी वॉइस मोड (Continuous Voice)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {assistantState === "SPEAKING" ? "बोल रही है..." : assistantState === "THINKING" ? "सोच रही है..." : "सुन रही है..."}
            </span>
          </div>

          {/* Subtitle / User speech transcription */}
          <div className="bg-slate-950/90 rounded-xl px-3 py-2 border border-slate-800 text-xs">
            {latestSubtitle ? (
              <p className="text-pink-200 italic font-medium leading-relaxed">
                "{latestSubtitle}"
              </p>
            ) : (
              <p className="text-slate-400 text-[11px]">
                🎙️ अवनी सुन रही है... कोई भी अगला काम बोलें (उदा: "गूगल खोलो", "कैलकुलेटर खोलो", "स्क्रीन बंद करो")
              </p>
            )}
          </div>

          {/* Quick Voice Prompt Shortcuts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-[11px]">
            <button
              onClick={() => onVoiceCommand("यूट्यूब खोलो")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 shrink-0 font-medium"
            >
              यूट्यूब खोलो
            </button>
            <button
              onClick={() => onVoiceCommand("गूगल खोलो")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 shrink-0 font-medium"
            >
              गूगल खोलो
            </button>
            <button
              onClick={() => onVoiceCommand("कैलकुलेटर खोलो")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 shrink-0 font-medium"
            >
              कैलकुलेटर
            </button>
            <button
              onClick={() => onClose()}
              className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 shrink-0 font-medium"
            >
              स्क्रीन बंद करो
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
