/**
 * Native Android App & Intent Launcher with Intelligent Fallback
 * Launches real native apps on mobile devices using Android Intent URIs and deep links.
 * If the device does not have the app installed or is running in a desktop browser/iframe,
 * it triggers the fallback interactive viewport.
 */

export interface NativeLaunchTarget {
  name: string;
  packageName?: string;
  deepLinkScheme?: string;
  intentUri?: string;
  fallbackWebUrl?: string;
  query?: string;
  title: string;
  hindiName?: string;
}

/**
 * Checks if the current browser environment is on an Android or mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || !navigator) return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  return /android|iphone|ipad|ipod|mobile/i.test(ua);
}

/**
 * Builds standard Android Intent URI for package or action
 */
export function buildAndroidIntentUri(target: NativeLaunchTarget): string {
  if (target.intentUri && target.intentUri.startsWith("intent:")) {
    return target.intentUri;
  }

  const pkg = target.packageName;
  const scheme = target.deepLinkScheme;

  // Specific high-frequency app intents
  if (pkg === "com.google.android.youtube") {
    if (target.query) {
      return `intent://www.youtube.com/results?search_query=${encodeURIComponent(target.query)}#Intent;package=com.google.android.youtube;scheme=https;end`;
    }
    return "intent://#Intent;package=com.google.android.youtube;scheme=vnd.youtube;end";
  }

  if (pkg === "com.whatsapp") {
    return "intent://send#Intent;package=com.whatsapp;scheme=whatsapp;end";
  }

  if (pkg === "com.instagram.android") {
    return "intent://#Intent;package=com.instagram.android;scheme=instagram;end";
  }

  if (pkg === "com.google.android.apps.maps") {
    const q = target.query ? encodeURIComponent(target.query) : "";
    return `intent://maps.google.com/maps?q=${q}#Intent;package=com.google.android.apps.maps;scheme=https;end`;
  }

  if (pkg === "com.spotify.music") {
    return "intent://#Intent;package=com.spotify.music;scheme=spotify;end";
  }

  if (pkg === "com.android.camera") {
    return "intent:#Intent;action=android.media.action.IMAGE_CAPTURE;category=android.intent.category.DEFAULT;end";
  }

  if (pkg === "com.google.android.calculator") {
    return "intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end";
  }

  if (pkg === "com.android.settings") {
    return "intent:#Intent;action=android.settings.SETTINGS;end";
  }

  if (pkg === "com.google.android.dialer") {
    return "intent:#Intent;action=android.intent.action.DIAL;end";
  }

  // Generic Android package launcher intent
  if (pkg) {
    return `intent:#Intent;package=${pkg};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end`;
  }

  if (scheme) {
    return scheme;
  }

  return target.fallbackWebUrl || "https://www.google.com";
}

/**
 * Attempts to launch the real native Android app on the device.
 * If the user's browser stays focused / visible after dispatch, invokes onFallback.
 */
export function launchRealAppOrFallback(
  target: NativeLaunchTarget,
  onFallback?: (target: NativeLaunchTarget) => void
): boolean {
  if (typeof window === "undefined") return false;

  const intentUri = buildAndroidIntentUri(target);
  let didLeaveWindow = false;

  const onBlurOrHidden = () => {
    didLeaveWindow = true;
    console.log("Real native app launched successfully, window blurred/hidden:", target.name);
    cleanup();
  };

  const cleanup = () => {
    window.removeEventListener("blur", onBlurOrHidden);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      onBlurOrHidden();
    }
  };

  window.addEventListener("blur", onBlurOrHidden, { once: true });
  document.addEventListener("visibilitychange", onVisibilityChange, { once: true });

  // Attempt real native launch
  try {
    // 1. Try invisible anchor click
    const anchor = document.createElement("a");
    anchor.href = intentUri;
    anchor.rel = "noreferrer";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // 2. Also try custom scheme iframe if deepLinkScheme exists
    if (target.deepLinkScheme && !target.deepLinkScheme.startsWith("intent:")) {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = target.deepLinkScheme;
      document.body.appendChild(iframe);
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    }
  } catch (err) {
    console.warn("Intent dispatch notice:", err);
  }

  // 3. Fallback verification window:
  // If the browser window is still visible and focused after 650ms,
  // the device either doesn't have the app installed, or browser sandbox blocked direct intent.
  setTimeout(() => {
    cleanup();
    if (!didLeaveWindow) {
      console.log("Browser still visible; showing in-app interactive viewport for:", target.name);
      if (onFallback) {
        onFallback(target);
      }
    }
  }, 650);

  return true;
}

/**
 * Explicit user trigger to launch real native Android app from the in-app screen
 */
export function forceLaunchNativeApp(target: NativeLaunchTarget) {
  const intentUri = buildAndroidIntentUri(target);
  try {
    window.location.href = intentUri;
  } catch (_e) {
    const a = document.createElement("a");
    a.href = intentUri;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  }
}
