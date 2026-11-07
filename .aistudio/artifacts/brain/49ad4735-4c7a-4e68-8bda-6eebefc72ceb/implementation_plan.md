# Real Mobile App Launcher & Call Auto-Mute Intelligence

## Summary
Enable Avani to launch real native Android mobile apps directly on the user's phone via Android Intent and Deep Link schemes (falling back gracefully to the interactive in-app viewport if the app is not installed or when previewed on desktop). In addition, implement an intelligent Call & Conversation Auto-Mute system that silences Avani completely during phone calls or conversations, and automatically resumes listening as soon as the call ends.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following two architectural decisions were confirmed with the user via clarifying questions:

- **Confirmed Decision 1 (Real Mobile App Launch)**: Attempt to open the real mobile app installed on the device first using Android Intent URIs and deep link protocols (`intent://`, `vnd.youtube://`, `whatsapp://`, `tel:`, etc.). If the app is not installed on the device or the browser restricts intent execution, immediately display the on-screen interactive screen with a 1-tap "फोन के रियल ऐप में खोलें" (Open in Real Phone App) launch action.
- **Confirmed Decision 2 (Call & Conversation Auto-Mute)**: When a phone call is active or conversation is detected, Avani will completely mute her voice and pause processing. As soon as the call or conversation finishes, Avani will automatically reactivate herself and resume continuous listening mode.

---

## 1. Overview & Core Concept

### What It Does
1. **Real Native Mobile App Launcher (`NativeAppIntentLauncher`)**:
   - When the user says *"YouTube खोलो"*, *"WhatsApp खोलो"*, *"कैमरा खोलो"*, *"कैलकुलेटर खोलो"*, *"कॉल लगाओ"*, *"गूगल मैप्स खोलो"*, or *"सेटिंग्स खोलो"*, Avani triggers the real native Android Intent URI scheme on the device.
   - If running on a smartphone, the actual Android app opens directly.
   - If running on desktop, web sandbox, or if the package is missing, Avani falls back to the in-app interactive viewport with full controls.
2. **Intelligent Call & Conversation Auto-Muter (`CallAutoMuterEngine`)**:
   - Detects active phone calls (via `tel:`, dialer intents, browser focus/visibility state during phone calls, and two-way background conversation patterns).
   - Instantly mutes all speech synthesis, stops active Gemini Live playback, and displays a clean indicator: `"कॉल जारी है — अवनी शांत है"` (Call in progress — Avani is muted).
   - As soon as the phone call ends (or user returns to app), Avani automatically wakes up, says *"कॉल समाप्त हो गई है, मैं तैयार हूँ!"*, and re-enters continuous listening mode without needing any manual button clicks.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[ User Voice Command: "YouTube खोलो" ]
                │
                ▼
[ Mobile Intent Attempt (vnd.youtube:// or Intent URI) ]
      ├── Phone has YouTube Installed ──► [ Real Native YouTube App Opens ]
      └── Desktop / Browser Sandbox ───► [ In-App Interactive Viewport Opens ]
                                            + "रियल ऐप में खोलें" Button

[ User Phone Call or Conversation Begins ]
                │
                ▼
[ Avani Enters "CALL_MUTED" State ]
      ├── Audio Synthesis Cancelled (0ms Latency)
      ├── Live Audio Stream Suspended
      └── Calm Amber Call Banner: "कॉल जारी है — अवनी म्यूट है"
                │
[ Call Finishes / User Returns ]
                │
                ▼
[ Automatic Smooth Reactivation ]
      ├── Avani says: "कॉल समाप्त हो गई, मैं सुन रही हूँ!"
      └── Restores Continuous Hands-Free LISTENING Mode
```

### Visual Identity & Theme
- **Theme**: Futuristic yet minimal Android companion palette (Deep Obsidian `#0b0f19`, Pink `#ec4899`, Emerald `#10b981`, Amber Call Accent `#f59e0b`).
- **Call-Muted HUD Banner**: Sleek status pill anchored at the top when a call is active:
  - Phone icon with soft amber pulse (`lucide-react PhoneCall`).
  - Text: `"कॉल सक्रिय • अवनी म्यूट है (कॉल के बाद अपने आप चालू होगी)"`.
  - Manual "कॉल समाप्त करें" / "Reactivate Now" button.
- **Real App Quick-Trigger**: In the active app viewport header, a prominent emerald button with phone icon: `"रियल फोन ऐप में खोलें"` allowing instant force-launch of the Android intent.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Native Intent Launch with Graceful In-App Fallback**
  - *Chosen Approach*: Use standard Android `intent://` URIs and registered URI schemes (`vnd.youtube://`, `whatsapp://send`, `geo:`, etc.) via an invisible iframe/anchor trigger. If the page remains visible after a short window (meaning native app didn't hijack the viewport), display the in-app interactive UI.
  - *Why*: Web browsers in iframes or sandboxes cannot determine with 100% certainty if an app is installed without trying. This hybrid pattern guarantees the real app opens if available, while eliminating broken white screens.
- **Decision 2: Phone Call & Conversation Detection Engine**
  - *Chosen Approach*: Track phone dialer triggers (`tel:` intents, `makePhoneCall` tool) + Page Visibility API (`visibilitychange` / `blur`) + audio pitch variance for external conversation.
  - *Why*: Web standards restrict querying the Android TelephonyManager directly from JavaScript; combining intent tracking, tab blur/focus state, and audio energy level provides reliable call detection and auto-resume.

---

## 4. Technical Architecture & Data Strategy

### System Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          App.tsx (Main Coordinator)                    │
│                                                                        │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │ NativeAppIntentLauncher   │      │ CallAutoMuterEngine         │   │
│   │ (deviceCommandMatcher.ts) │      │ (telephony & call detector) │   │
│   │ • Android Intent URIs     │      │ • Auto-Mute on Active Call  │   │
│   │ • Real App Deep Links     │      │ • Audio Output Paused       │   │
│   │ • Fallback to Viewport    │      │ • Auto-Resume on Call End   │   │
│   └─────────────┬─────────────┘      └──────────────┬──────────────┘   │
│                 │                                   │                  │
│                 ▼                                   ▼                  │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │ ActiveAppScreenModal.tsx  │      │ CallMutedStatusBar.tsx      │   │
│   │ • "रियल ऐप में खोलें" btn │      │ • Soft Amber Call Status    │   │
│   │ • Interactive Emulator    │      │ • End Call / Unmute Action  │   │
│   └───────────────────────────┘      └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Modules to Create / Update

1. **`src/utils/nativeAppLauncher.ts`**:
   - Comprehensive Android package and Intent mapping (YouTube, WhatsApp, Instagram, Google Maps, Camera, Calculator, Phone Dialer, Settings, Contacts, Spotify).
   - Intent URI builder with fallback handling.
   - Dual-dispatch function: triggers `window.location.href = intentUri` or anchor dispatch, and passes state to `ActiveAppScreen`.

2. **`src/utils/callStateDetector.ts`**:
   - Call state manager tracking:
     - `isCallActive: boolean`
     - `callDuration: number`
     - `callContactName?: string`
   - Window visibility and blur hooks to detect when phone dialer takes over.
   - Auto-pause hook: interrupts `liveAudio`, stops speech synthesis, sets assistant to `CALL_MUTED`.
   - Auto-resume hook: on focus return or call end, speaks brief confirmation and re-engages `startListeningSession()`.

3. **`src/components/CallMutedStatusBar.tsx`**:
   - Beautiful floating call banner showing call status, timer, and auto-reactivation notification.

4. **`src/components/ActiveAppScreenModal.tsx`**:
   - Add top-bar button: `"रियल फोन ऐप में खोलें"` (`Open in Native App`) with package launcher.

5. **`src/App.tsx`**:
   - Wire `callStateDetector` into assistant lifecycle.
   - Wire `NativeAppIntentLauncher` into voice and text command execution.
