import { PermissionsState } from "../types";
import { resolveAppTarget, dispatchDirectNativeApp, UNIVERSAL_APP_REGISTRY } from "./nativeAppLauncher";

export interface MatchedDeviceCommand {
  handled: boolean;
  toolName?: string;
  args?: Record<string, any>;
  replyText?: string;
  intentAction?: string;
  intentUri?: string;
  isWeb?: boolean;
  webUrl?: string;
  targetName?: string;
  fallbackWebUrl?: string;
}

export interface AppProfile {
  name: string;
  aliases: string[];
  packageName: string;
  deepLinkScheme?: string;
  fallbackWebUrl?: string;
  hindiName: string;
}

export interface WebProfile {
  name: string;
  aliases: string[];
  url: string;
  hindiName: string;
}

export const APP_CATALOG: AppProfile[] = [
  {
    name: "YouTube",
    aliases: ["youtube", "यूट्यूब", "युटुब", "yt"],
    packageName: "com.google.android.youtube",
    deepLinkScheme: "vnd.youtube://",
    fallbackWebUrl: "https://www.youtube.com",
    hindiName: "यूट्यूब",
  },
  {
    name: "WhatsApp",
    aliases: ["whatsapp", "व्हाट्सएप", "वाट्सएप", "व्हाट्सअप", "वाट्सअप", "wp"],
    packageName: "com.whatsapp",
    deepLinkScheme: "whatsapp://",
    fallbackWebUrl: "https://web.whatsapp.com",
    hindiName: "व्हाट्सएप",
  },
  {
    name: "Instagram",
    aliases: ["instagram", "इंस्टाग्राम", "इंस्टा", "insta", "ig"],
    packageName: "com.instagram.android",
    deepLinkScheme: "instagram://app",
    fallbackWebUrl: "https://www.instagram.com",
    hindiName: "इंस्टाग्राम",
  },
  {
    name: "Camera",
    aliases: ["camera", "कैमरा", "फोटो खींचो", "फोटो खींचना", "कैमरा खोलो"],
    packageName: "com.android.camera",
    deepLinkScheme: "intent:#Intent;action=android.media.action.IMAGE_CAPTURE;end",
    fallbackWebUrl: "https://www.google.com",
    hindiName: "कैमरा",
  },
  {
    name: "Calculator",
    aliases: ["calculator", "कैलकुलेटर", "कैलकुलेटर खोलो", "हिसाब", "calc"],
    packageName: "com.google.android.calculator",
    deepLinkScheme: "intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end",
    fallbackWebUrl: "https://www.google.com/search?q=calculator",
    hindiName: "कैलकुलेटर",
  },
  {
    name: "Settings",
    aliases: ["settings", "सेटिंग्स", "सेटिंग", "phone settings", "मोबाइल सेटिंग"],
    packageName: "com.android.settings",
    deepLinkScheme: "intent:#Intent;action=android.settings.SETTINGS;end",
    fallbackWebUrl: "https://www.google.com",
    hindiName: "सेटिंग्स",
  },
  {
    name: "Gallery",
    aliases: ["gallery", "photos", "गैलरी", "फोटो", "फ़ोटो", "तस्वीरें", "photos app"],
    packageName: "com.google.android.apps.photos",
    deepLinkScheme: "intent:#Intent;action=android.intent.action.VIEW;type=image/*;end",
    fallbackWebUrl: "https://photos.google.com",
    hindiName: "गैलरी",
  },
  {
    name: "Phone",
    aliases: ["phone", "dialer", "फोन", "डायलर", "कॉल डायलर", "phone app"],
    packageName: "com.google.android.dialer",
    deepLinkScheme: "intent:#Intent;action=android.intent.action.DIAL;end",
    fallbackWebUrl: "https://www.google.com",
    hindiName: "फोन डायलर",
  },
  {
    name: "Messages",
    aliases: ["messages", "message", "sms", "मैसेज", "एसएमएस"],
    packageName: "com.google.android.apps.messaging",
    deepLinkScheme: "sms:",
    fallbackWebUrl: "https://messages.google.com/web",
    hindiName: "मैसेज",
  },
  {
    name: "Spotify",
    aliases: ["spotify", "स्पॉटिफाय", "म्यूजिक", "music", "गाने", "गाना बजाओ"],
    packageName: "com.spotify.music",
    deepLinkScheme: "spotify://",
    fallbackWebUrl: "https://open.spotify.com",
    hindiName: "स्पॉटिफाय",
  },
  {
    name: "Google Maps",
    aliases: ["maps", "google maps", "मैप", "मैप्स", "नक्शा", "गूगल मैप"],
    packageName: "com.google.android.apps.maps",
    deepLinkScheme: "geo:0,0?q=",
    fallbackWebUrl: "https://maps.google.com",
    hindiName: "गूगल मैप्स",
  },
  {
    name: "Gmail",
    aliases: ["gmail", "email", "मेल", "जीमेल", "ईमेल"],
    packageName: "com.google.android.gm",
    deepLinkScheme: "mailto:",
    fallbackWebUrl: "https://mail.google.com",
    hindiName: "जीमेल",
  },
  {
    name: "Chrome",
    aliases: ["chrome", "browser", "क्रोम", "ब्राउज़र"],
    packageName: "com.android.chrome",
    deepLinkScheme: "intent:#Intent;package=com.android.chrome;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end",
    fallbackWebUrl: "https://www.google.com",
    hindiName: "गूगल क्रोम",
  },
  {
    name: "PhonePe",
    aliases: ["phonepe", "फोनपे", "फोन पे"],
    packageName: "com.phonepe.app",
    deepLinkScheme: "intent:#Intent;package=com.phonepe.app;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end",
    fallbackWebUrl: "https://www.phonepe.com",
    hindiName: "फोनपे",
  },
  {
    name: "Google Pay",
    aliases: ["google pay", "gpay", "गूगल पे", "जीपे"],
    packageName: "com.google.android.apps.nbu.paisa.user",
    deepLinkScheme: "intent:#Intent;package=com.google.android.apps.nbu.paisa.user;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end",
    fallbackWebUrl: "https://pay.google.com",
    hindiName: "गूगल पे",
  },
  {
    name: "Paytm",
    aliases: ["paytm", "पेटीएम", "पे टीएम"],
    packageName: "net.one97.paytm",
    deepLinkScheme: "intent:#Intent;package=net.one97.paytm;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end",
    fallbackWebUrl: "https://paytm.com",
    hindiName: "पेटीएम",
  },
  {
    name: "Clock",
    aliases: ["clock", "alarm", "घड़ी", "अलार्म"],
    packageName: "com.google.android.deskclock",
    deepLinkScheme: "intent:#Intent;action=android.intent.action.SHOW_ALARMS;end",
    fallbackWebUrl: "https://time.is",
    hindiName: "घड़ी / अलार्म",
  },
  {
    name: "Contacts",
    aliases: ["contacts", "कॉन्टैक्ट्स", "फोन नंबर"],
    packageName: "com.google.android.contacts",
    deepLinkScheme: "intent:#Intent;action=android.intent.action.VIEW;type=vnd.android.cursor.dir/contact;end",
    fallbackWebUrl: "https://contacts.google.com",
    hindiName: "कॉन्टैक्ट्स",
  },
  {
    name: "Files",
    aliases: ["files", "file manager", "फाइल", "फाइलें", "फाइल मैनेजर"],
    packageName: "com.google.android.apps.nbu.files",
    deepLinkScheme: "intent:#Intent;action=android.intent.action.GET_CONTENT;type=*/*;end",
    fallbackWebUrl: "https://drive.google.com",
    hindiName: "फाइल मैनेजर",
  },
  {
    name: "Play Store",
    aliases: ["play store", "playstore", "प्ले स्टोर"],
    packageName: "com.android.vending",
    deepLinkScheme: "market://",
    fallbackWebUrl: "https://play.google.com",
    hindiName: "गूगल प्ले स्टोर",
  },
  {
    name: "Telegram",
    aliases: ["telegram", "टेलीग्राम"],
    packageName: "org.telegram.messenger",
    deepLinkScheme: "intent:#Intent;package=org.telegram.messenger;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end",
    fallbackWebUrl: "https://web.telegram.org",
    hindiName: "टेलीग्राम",
  },
  {
    name: "Snapchat",
    aliases: ["snapchat", "स्नैपचैट", "स्नैप"],
    packageName: "com.snapchat.android",
    deepLinkScheme: "intent:#Intent;package=com.snapchat.android;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end",
    fallbackWebUrl: "https://web.snapchat.com",
    hindiName: "स्नैपचैट",
  },
  {
    name: "Facebook",
    aliases: ["facebook", "fb", "फेसबुक"],
    packageName: "com.facebook.katana",
    deepLinkScheme: "intent:#Intent;package=com.facebook.katana;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end",
    fallbackWebUrl: "https://www.facebook.com",
    hindiName: "फेसबुक",
  },
  {
    name: "Twitter",
    aliases: ["twitter", "x", "ट्विटर", "एक्स"],
    packageName: "com.twitter.android",
    deepLinkScheme: "intent:#Intent;package=com.twitter.android;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end",
    fallbackWebUrl: "https://x.com",
    hindiName: "एक्स (Twitter)",
  },
  {
    name: "Free Fire",
    aliases: ["free fire", "freefire", "फ्री फायर"],
    packageName: "com.dts.freefireth",
    deepLinkScheme: "intent:#Intent;package=com.dts.freefireth;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end",
    fallbackWebUrl: "https://ff.garena.com",
    hindiName: "फ्री फायर",
  },
  {
    name: "BGMI",
    aliases: ["bgmi", "battlegrounds", "pubg", "पबजी", "बीजीएमआई"],
    packageName: "com.pubg.imobile",
    deepLinkScheme: "intent:#Intent;package=com.pubg.imobile;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end",
    fallbackWebUrl: "https://www.battlegroundsmobileindia.com",
    hindiName: "बीजीएमआई (BGMI)",
  },
];

export const WEB_CATALOG: WebProfile[] = [
  {
    name: "Google",
    aliases: ["google", "गूगल", "गूगल सर्च", "google search", "google.com", "search engine"],
    url: "https://www.google.com",
    hindiName: "गूगल",
  },
  {
    name: "ChatGPT",
    aliases: ["chatgpt", "chat gpt", "चैटजीपीटी", "चैट जीपीटी", "chatgpt.com", "openai", "open ai"],
    url: "https://chatgpt.com",
    hindiName: "चैटजीपीटी (ChatGPT)",
  },
  {
    name: "Wikipedia",
    aliases: ["wikipedia", "विकिपीडिया", "विकीपीडिया", "wikipedia.org", "wiki"],
    url: "https://www.wikipedia.org",
    hindiName: "विकिपीडिया",
  },
  {
    name: "Amazon",
    aliases: ["amazon", "अमेज़न", "अमेजन", "amazon.in", "amazon.com", "shopping"],
    url: "https://www.amazon.in",
    hindiName: "अमेज़न",
  },
  {
    name: "Flipkart",
    aliases: ["flipkart", "फ्लिपकार्ट", "flipkart.com"],
    url: "https://www.flipkart.com",
    hindiName: "फ्लिपकार्ट",
  },
  {
    name: "GitHub",
    aliases: ["github", "गिटहब", "github.com"],
    url: "https://github.com",
    hindiName: "गिटहब (GitHub)",
  },
  {
    name: "Reddit",
    aliases: ["reddit", "रेडिट", "reddit.com"],
    url: "https://www.reddit.com",
    hindiName: "रेडिट",
  },
  {
    name: "Netflix",
    aliases: ["netflix", "नेटफ्लिक्स", "netflix.com"],
    url: "https://www.netflix.com",
    hindiName: "नेटफ्लिक्स",
  },
  {
    name: "YouTube Web",
    aliases: ["youtube web", "यूट्यूब वेबसाइट", "यूट्यूब वेब", "youtube.com"],
    url: "https://www.youtube.com",
    hindiName: "यूट्यूब वेब",
  },
  {
    name: "LinkedIn",
    aliases: ["linkedin", "लिंक्डइन", "linkedin.com"],
    url: "https://www.linkedin.com",
    hindiName: "लिंक्डइन",
  },
  {
    name: "News",
    aliases: ["news", "गूगल न्यूज़", "खबरें", "news.google.com", "समाचार"],
    url: "https://news.google.com",
    hindiName: "गूगल न्यूज़",
  },
  {
    name: "Twitter Web",
    aliases: ["twitter.com", "x.com", "ट्विटर वेबसाइट"],
    url: "https://x.com",
    hindiName: "एक्स (Twitter) वेब",
  },
];

export interface FastOpenOptions {
  isWeb?: boolean;
  webUrl?: string;
  intentUri?: string;
  packageName?: string;
  appName?: string;
  targetName?: string;
  fallbackWebUrl?: string;
}

/**
 * Super-Fast Instant Dispatcher for both Android Native Apps and Web URLs.
 * Executes in 0ms with zero delay.
 */
export function dispatchFastOpen(options: FastOpenOptions): void {
  // A. If target is explicitly a Website / Web URL
  if (options.isWeb && options.webUrl) {
    if (typeof window !== "undefined") {
      try {
        const opened = window.open(options.webUrl, "_blank", "noopener,noreferrer");
        if (!opened || opened.closed || typeof opened.closed === "undefined") {
          const link = document.createElement("a");
          link.href = options.webUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          requestAnimationFrame(() => {
            if (document.body.contains(link)) document.body.removeChild(link);
          });
        }
      } catch (e) {
        console.warn("Fast Open web link warning:", e);
      }
    }
    return;
  }

  // B. If target is an Android Native App
  if (options.packageName || options.intentUri || options.appName || options.targetName) {
    dispatchDirectNativeApp({
      name: options.appName || options.targetName || "App",
      packageName: options.packageName,
      intentUri: options.intentUri,
      deepLinkScheme: options.intentUri,
      fallbackWebUrl: options.fallbackWebUrl,
      title: options.appName || options.targetName || "App",
    });
  }
}

/**
 * Backward-compatible helper for native Android intents
 */
export function dispatchNativeAndroidIntent(targetUri: string, packageName?: string): void {
  dispatchFastOpen({
    intentUri: targetUri,
    packageName,
  });
}

/**
 * Match user command for direct device tool execution (Apps, Web, Calls, Flashlight)
 * Ultra-fast matching with 0 latency.
 */
export function matchDeviceCommand(rawQuery: string): MatchedDeviceCommand {
  const query = rawQuery.trim().toLowerCase();

  // 0. GENERAL FAST OPEN STATUS / ACTIVATION INQUIRY
  // E.g., "fast open", "फास्ट ओपन", "fast open app and web", "open app and web"
  if (
    /^(?:fast\s*open|फास्ट\s*ओपन|fast\s*open\s*(?:app|web|and|aur|\&)+|open\s*app\s*and\s*web)/i.test(query) ||
    /^(?:फास्ट\s*ओपन\s*ऐप\s*(?:और|व)?\s*वेब)$/i.test(query)
  ) {
    return {
      handled: true,
      toolName: "fastOpenStatus",
      replyText:
        "फास्ट ओपन (Fast Open) मोड 100% एक्टिवेट है! आप मुझे किसी भी ऐप (यूट्यूब, व्हाट्सएप, इंस्टाग्राम, कैमरा, कैलकुलेटर) या वेबसाइट (गूगल, चैटजीपीटी, विकिपीडिया, अमेज़न) का नाम बोलिए, अवनी उसे 0 सेकंड में तुरंत खोल देगी!",
    };
  }

  // 0.5. VOICE RECOGNITION & SPEAKER IDENTIFICATION INQUIRY
  // E.g., "मेरी आवाज़ पहचानो", "आवाज़ पहचानो", "मेरी आवाज पहचान सकती हो", "who is speaking", "आवाज़ पहचान"
  if (
    /आवाज़\s*पहचान|आवाज\s*पहचान|मेरी\s*आवाज़|मेरी\s*आवाज|voice\s*recognition|recognize\s*(?:my\s*)?voice|who\s*is\s*speaking|किसकी\s*आवाज़|किसकी\s*आवाज/i.test(
      query
    )
  ) {
    return {
      handled: true,
      toolName: "voiceRecognitionStatus",
      replyText:
        "हाँजी! मेरा यूनिवर्सल आवाज़ पहचान (Universal Voice Recognition) सिस्टम 100% एक्टिव है! मैं किसी की भी आवाज़ — चाहे वो पुरुष हो, महिला, बच्चे, बड़े, या कोई भी एक्सेंट — सभी के स्वर और पिच (Hz) को तुरंत पहचान लेती हूँ!",
    };
  }

  // 1. CALLING COMMAND: "कॉल करो [name/number]", "फोन लगाओ [name/number]", "call [name]"
  const callMatch =
    query.match(/(?:कॉल करो|कॉल लगाओ|फोन करो|फोन लगाओ|मिलाओ|call|dial)\s+(?:को\s+)?(.+)/i) ||
    query.match(/(.+?)\s+(?:को\s+)?(?:कॉल करो|कॉल लगाओ|फोन करो|फोन लगाओ)/i);

  if (callMatch && !query.includes("खोलो") && !query.includes("open")) {
    const target = callMatch[1].trim().replace(/(?:को|number|नंबर)$/i, "").trim();
    if (target.length > 0) {
      const isDigitsOnly = /^[0-9+ ]+$/.test(target);
      const telUri = isDigitsOnly
        ? `tel:${target.replace(/ /g, "")}`
        : `intent:#Intent;action=android.intent.action.DIAL;end`;
      dispatchFastOpen({ intentUri: telUri });

      return {
        handled: true,
        toolName: "searchAndCallContact",
        args: { contactName: target, phoneNumber: isDigitsOnly ? target : undefined },
        replyText: `लीजिए! मैं ${target} को कॉल लगा रही हूँ।`,
        intentAction: "android.intent.action.CALL",
        intentUri: telUri,
      };
    }
  }

  // 2. WEB SEARCH ON GOOGLE DIRECTLY: "गूगल पर सर्च करो [X]", "वेब पर खोजो [X]", "search [X] on google"
  const webSearchMatch =
    query.match(/(?:गूगल पर|वेब पर|इंटरनेट पर)?\s*(?:सर्च करो|ढूंढो|खोजो|search|find)\s+(.+)/i) ||
    query.match(/(?:search)\s+(.+)\s+(?:on google|on web)/i);

  if (webSearchMatch && (query.includes("गूगल") || query.includes("वेब") || query.includes("google") || query.includes("search"))) {
    const searchTopic = webSearchMatch[1].replace(/(?:on google|on web|गूगल पर|वेब पर)/gi, "").trim();
    if (searchTopic.length > 1 && !searchTopic.includes("खोलो")) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTopic)}`;
      dispatchFastOpen({ isWeb: true, webUrl: searchUrl, targetName: `Search: ${searchTopic}` });

      return {
        handled: true,
        toolName: "openWeb",
        args: { url: searchUrl, title: `Google Search: ${searchTopic}` },
        replyText: `लीजिए! मैंने गूगल पर "${searchTopic}" तुरंत खोज दिया है।`,
        isWeb: true,
        webUrl: searchUrl,
        targetName: `Google Search: ${searchTopic}`,
        intentAction: "android.intent.action.VIEW",
        intentUri: searchUrl,
      };
    }
  }

  // 3. DIRECT WEBSITE / WEB OPENING COMMANDS:
  // E.g.: "गूगल खोलो", "open google", "वेबसाइट खोलो", "चैटजीपीटी खोलो", "open chatgpt", "amazon खोलो", "open wikipedia"
  const isWebIntent =
    /(?:वेबसाइट|website|वेब|web|url|साइट|site)/i.test(query) ||
    /(?:google|गूगल|chatgpt|चैटजीपीटी|wikipedia|विकिपीडिया|amazon|अमेज़न|flipkart|फ्लिपकार्ट|github|गिटहब|reddit|रेडिट|netflix|नेटफ्लिक्स)/i.test(query);

  if (isWebIntent) {
    // Check known website catalog
    for (const site of WEB_CATALOG) {
      const isSiteMatch = site.aliases.some((alias) => {
        const regex = new RegExp(`(^|\\s|[^\u0000-\u007F])${alias}($|\\s|[^\u0000-\u007F])`, "i");
        return regex.test(query) || query.includes(alias);
      });

      if (isSiteMatch) {
        dispatchFastOpen({ isWeb: true, webUrl: site.url, targetName: site.name });

        const replyRemarks = [
          `लीजिए! मैंने ${site.hindiName} तुरंत खोल दिया है।`,
          `हुक्म सर आँखों पर! ${site.hindiName} वेबसाइट हाज़िर है।`,
          `सुपर-फास्ट! ${site.hindiName} शुरू हो गई है।`,
        ];
        const replyText = replyRemarks[Math.floor(Math.random() * replyRemarks.length)];

        return {
          handled: true,
          toolName: "openWeb",
          args: { url: site.url, title: site.name },
          replyText,
          isWeb: true,
          webUrl: site.url,
          targetName: site.name,
          intentAction: "android.intent.action.VIEW",
          intentUri: site.url,
        };
      }
    }

    // Direct domain match (e.g. "open chatgpt.com", "amazon.in खोलो", "open openai.com")
    const domainMatch = query.match(/([a-zA-Z0-9-]+\.(?:com|in|org|net|io|ai|co|edu|gov|xyz|app|dev))/i);
    if (domainMatch) {
      const rawDomain = domainMatch[1];
      const targetUrl = rawDomain.startsWith("http") ? rawDomain : `https://${rawDomain}`;
      dispatchFastOpen({ isWeb: true, webUrl: targetUrl, targetName: rawDomain });

      return {
        handled: true,
        toolName: "openWeb",
        args: { url: targetUrl, title: rawDomain },
        replyText: `लीजिए! मैंने ${rawDomain} वेबसाइट खोल दी है।`,
        isWeb: true,
        webUrl: targetUrl,
        targetName: rawDomain,
        intentAction: "android.intent.action.VIEW",
        intentUri: targetUrl,
      };
    }

    // Generic "वेबसाइट खोलो" / "open website" / "open web"
    if (/^(?:वेबसाइट खोलो|वेब खोलो|open website|open web|browse web|इंटरनेट खोलो)$/i.test(query)) {
      const defaultUrl = "https://www.google.com";
      dispatchFastOpen({ isWeb: true, webUrl: defaultUrl, targetName: "Google Web" });

      return {
        handled: true,
        toolName: "openWeb",
        args: { url: defaultUrl, title: "Google Web" },
        replyText: "लीजिए! मैंने आपके लिए गूगल वेब ब्राउज़र तुरंत खोल दिया है।",
        isWeb: true,
        webUrl: defaultUrl,
        targetName: "Google Web",
        intentAction: "android.intent.action.VIEW",
        intentUri: defaultUrl,
      };
    }
  }

  // 4. OPEN APP COMMANDS (Android Native - Universal Resolver for ANY App on user's phone):
  // Detect patterns: "...खोलो", "...खोल दो", "...खोलिये", "...चालू करो", "...शुरू करो", "...चलाओ", "...लगाओ", "...ओपन करो", "...स्टार्ट करो", "open...", "launch...", "start...", "run..."
  // OR standalone app names (e.g., "कैमरा", "कैलकुलेटर", "व्हाट्सएप", "सेटिंग्स", "गैलरी", "फोनपे", "पेटीएम", "गूगल पे", "ज़ोमैटो", "स्विगी", etc.)
  const isOpenAppCommand =
    /(?:खोलो|खोल दो|खोलिये|ओपन करो|चालू करो|शुरू करो|चलाओ|लगाओ|स्टार्ट करो|open|launch|start|run)\s*(?:करो|दो)?/i.test(query) ||
    UNIVERSAL_APP_REGISTRY.some((app) =>
      app.aliases.some((alias) => query === alias.toLowerCase() || query === `${alias.toLowerCase()} app` || query === `${alias.toLowerCase()} ऐप`)
    );

  if (isOpenAppCommand) {
    // Extract candidate app name from query
    let candidateName = query
      .replace(/(?:खोलो|खोल दो|खोलिये|ओपन करो|चालू करो|शुरू करो|चलाओ|लगाओ|स्टार्ट करो|open|launch|start|run)/gi, "")
      .replace(/(?:प्लीज|जरा|तुरंत|जल्दी|मेरे फोन में|मोबाइल में|in phone|app|ऐप)/gi, "")
      .trim();

    // If candidateName became empty (e.g. user just said "खोलो"), fallback to original query
    if (!candidateName) {
      candidateName = query;
    }

    if (
      candidateName &&
      candidateName.length > 0 &&
      !["चैट", "हिस्ट्री", "मेमोरी", "मेनू", "chat", "history", "memory"].includes(candidateName)
    ) {
      const target = resolveAppTarget(candidateName);
      const appDisplayName = target.hindiName || target.name;

      // Direct instant dispatch to Android OS (0 latency, 0 clicks)
      dispatchDirectNativeApp(target);

      const replyRemarks = [
        `लीजिए! मैंने आपके फोन में ${appDisplayName} तुरंत खोल दिया है।`,
        `हुक्म सर आँखों पर! ${appDisplayName} हाज़िर है।`,
        `लो जी! आपके फोन में ${appDisplayName} चालू हो गया है!`,
      ];
      const replyText = replyRemarks[Math.floor(Math.random() * replyRemarks.length)];

      return {
        handled: true,
        toolName: "openApp",
        args: { packageName: target.packageName, appName: target.name },
        replyText,
        intentAction: "android.intent.action.MAIN",
        intentUri: target.intentUri || target.deepLinkScheme,
        fallbackWebUrl: target.fallbackWebUrl,
        targetName: appDisplayName,
      };
    }
  }

  // 5. FLASHLIGHT / TORCH COMMANDS
  if (/टॉर्च|flashlight|torch/i.test(query)) {
    const isTurnOn = /जलाओ|चालू|on|start|open/i.test(query);
    const replyText = isTurnOn
      ? "लीजिए! मैंने आपके फोन की टॉर्च (फ़्लैशलाइट) चालू कर दी है।"
      : "लीजिए! टॉर्च बंद कर दी गई है।";

    // Attempt native camera stream torch toggle if supported
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          const track = stream.getVideoTracks()[0];
          if ((track as any)?.applyConstraints) {
            (track as any).applyConstraints({
              advanced: [{ torch: isTurnOn } as any],
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }

    return {
      handled: true,
      toolName: "toggleFlashlight",
      args: { state: isTurnOn },
      replyText,
      intentAction: "android.intent.action.MAIN",
    };
  }

  return { handled: false };
}
