# Direct Native Mobile App Launch & Call Privacy Protection

## Summary
Transform Avani's voice command execution so that saying *"YouTube खोलो"*, *"WhatsApp खोलो"*, or any app command directly opens the real native Android mobile app on the user's phone with zero clicks (eliminating the in-app modal overlay). Keep Avani operating in the background for continuous hands-free voice control. Relocate the Ultra Shield control into the three-dots menu for an uncluttered header, and enforce strict call privacy by completely severing microphone streaming during phone calls until the call finishes.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user in Phase 1:

- **Confirmed Decision 1 (Real App Launching)**: Real mobile phone apps will open directly via Android Intent URIs on voice command. The in-app modal overlay will NOT pop up or hijack the screen. Avani will remain active in the background.
- **Confirmed Decision 2 (Call Privacy)**: During phone calls, Avani will completely mute audio output and stop microphone transmission for total conversation privacy. Avani will automatically resume listening once the call concludes.
- **Confirmed Decision 3 (Header Cleanliness)**: The Ultra Shield / Noise Isolation button will be removed from the top bar and placed cleanly inside the three-dots (More Options) dropdown menu.

---

## 1. Overview & Core Concept

### What It Does
1. **Direct Native Android App Dispatch (`DirectRealAppLauncher`)**:
   - When the user gives a voice command (e.g. *"YouTube खोलो"*, *"कैमरा खोलो"*, *"WhatsApp खोलो"*, *"कैलकुलेटर खोलो"*), Avani speaks immediate confirmation (*"लीजिए, यूट्यूब खोल दिया है!"*) and directly dispatches the real Android Intent URI to the operating system (`window.location.assign(intentUri)` / native deep link).
   - The phone's actual installed application takes over the screen immediately without needing any user taps or showing an emulator modal.
   - Avani's background service stays alive so the user can continue issuing voice commands anytime.
2. **Call Privacy Shield (`CallPrivacyEngine`)**:
   - When a call begins (via voice command *"राहुल को कॉल लगाओ"* or dialer intent dispatch), Avani triggers a total privacy lock:
     - Speech synthesis is immediately cancelled (`window.speechSynthesis.cancel()`).
     - Gemini Live audio is interrupted (`liveAudio.interrupt()`).
     - Microphone capture is gated/disconnected (`liveAudio.stopInputCapture()`) so that zero audio from the private phone call is processed or sent over the network.
   - Once the call is ended, Avani smoothly re-engages the microphone, says *"कॉल समाप्त हो गई है, मैं सुन रही हूँ!"*, and returns to continuous hands-free listening.
3. **Streamlined Minimal Header**:
   - The top bar retains only the sleek Avani 2.O Live branding and Chat Mode trigger.
   - The Ultra Shield / Voice Isolation switcher is housed in the three-dots menu with clear status indicators (*Ultra Shield - Active*).

---

## 2. User Experience & Visual Design

### Key User Flows

```
[ User Voice Command: "YouTube खोलो" ]
                │
                ▼
[ Avani Speaks: "लीजिए, यूट्यूब खोल दिया है!" ]
                │
                ▼
[ Direct Android OS Intent Dispatch (vnd.youtube:// or Intent URI) ]
                │
                ▼
[ Phone's Real Native YouTube App Launches Immediately ]
(No In-App Modal Overlay — Avani remains ready in background)

─────────────────────────────────────────────────────────────

[ User Voice Command: "राहुल को कॉल लगाओ" ]
                │
                ▼
[ Dialer Intent Triggered (`tel:...`) ]
                │
                ▼
[ Privacy Shield Activated ]
      ├── Microphone Input Stream Completely Severed (Zero surveillance)
      ├── Live Audio Output Halted (0ms Latency)
      └── Amber Call Banner: "कॉल चालू है • प्राइवेसी शील्ड सक्रिय (माइक बंद)"
                │
[ Call Ends / User Returns ]
                │
                ▼
[ Automatic Smooth Reactivation ]
      ├── Microphone Re-connected Cleanly
      ├── Avani: "कॉल समाप्त हो गई है! अवनी फिर से सुन रही है।"
      └── Seamless Hands-Free Continuous Voice Mode
```

### Visual Identity & Theme
- **Clean Obsidian Header**: Dark background with vibrant pink accent and emerald live pulse indicator.
- **Three-Dots Menu**:
  1. Avani Memory (`Brain` icon)
  2. Ultra Voice Shield (`Shield` icon with current mode indicator)
  3. Creator Info - Vinay Pratap (`Award` icon)
  4. Device Permissions (`ShieldCheck` icon)
  5. Voice Recognition (`Mic` icon)
  6. Call Privacy Test (`Phone` icon)
- **Call Privacy Indicator**: A subtle, privacy-reassuring status bar displayed during calls: *"कॉल जारी है • प्राइवेसी शील्ड सक्रिय (माइक व स्पीकर बंद हैं)"*.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct OS Intent Navigation without Modal Popups**
  - *Chosen Approach*: On voice commands like *"यूट्यूब खोलो"*, directly navigate to the registered Android Intent URI (`intent://...` or `vnd.youtube://`, `whatsapp://`, `tel:`, etc.). Do not call `setActiveAppScreen(...)`.
  - *Why*: The user explicitly requested the real mobile app to open directly on the phone with zero clicks, instead of having an emulator modal cover Avani's UI.
- **Decision 2: Complete Microphone Stream Disconnection on Calls**
  - *Chosen Approach*: Fully suspend `liveAudio.startInputCapture()` and stop PCM streaming when a phone call is active.
  - *Why*: Privacy is paramount during phone conversations. Ensuring the microphone is not recording or transmitting guarantees user privacy.
- **Decision 3: Three-Dots Integration for Ultra Shield**
  - *Chosen Approach*: Relocate the Ultra Shield button from the sticky top bar into the three-dots popover.
  - *Why*: Keeps the main interface clean, spacious, and focused on the voice orb, while keeping the setting accessible.

---

## 4. Technical Architecture & Data Strategy

### System Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              src/App.tsx                               │
│                                                                        │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │ NativeAppLauncher         │      │ CallPrivacyEngine           │   │
│   │ • Direct Intent Dispatch  │      │ • Full Mic Disconnect       │   │
│   │ • Zero Modal Popups       │      │ • Audio Silence             │   │
│   │ • Background Continuity   │      │ • Auto-Wake on Call End     │   │
│   └─────────────┬─────────────┘      └──────────────┬──────────────┘   │
│                 │                                   │                  │
│                 ▼                                   ▼                  │
│   ┌───────────────────────────┐      ┌─────────────────────────────┐   │
│   │ Three-Dots Menu           │      │ CallMutedStatusBar.tsx      │   │
│   │ • Ultra Voice Shield      │      │ • Privacy Reassurance       │   │
│   │ • Memory & Creator Info   │      │ • Call Timer & End Action   │   │
│   └───────────────────────────┘      └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Modules to Update

1. **`src/utils/nativeAppLauncher.ts`**:
   - Provide `dispatchDirectNativeApp(target: NativeLaunchTarget)`:
     - Directly launches the real Android Intent via standard location navigation / anchor dispatch.
     - Does NOT invoke any in-app fallback modal.
2. **`src/App.tsx`**:
   - Remove automatic `setActiveAppScreen(...)` from voice command flows (`fastCmd.handled`, `directCmd.handled`, `toolCall`).
   - In `directCmd.handled` and `fastCmd.handled`: call `dispatchDirectNativeApp` so the phone's native app launches directly.
   - When a call starts:
     - Call `liveAudio.stopInputCapture()`.
     - Completely cut microphone streaming.
   - When a call ends:
     - Automatically resume `startListeningSession()`.
   - In the header JSX:
     - Remove `#noise-isolation-btn`.
     - Add Ultra Voice Shield selector inside the three-dots popover.
3. **`src/components/CallMutedStatusBar.tsx`**:
   - Update text to emphasize privacy: *"कॉल जारी है • प्राइवेसी शील्ड सक्रिय (माइक व स्पीकर पूरी तरह बंद हैं)"*.
