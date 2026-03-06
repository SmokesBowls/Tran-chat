

# Private 1:1 Call App Spec v0.1

## Product summary

A premium-feeling Android video call app for exactly two people.

One host creates the session.
One guest joins with a password.
No room list.
No public discovery.
No multi-party calls.
No PiP corner box.
Optional save-at-end memory, controlled only by the host.

The app is intentionally tiny on the surface and high-end in execution.

## Core product promise

This app should feel like a private locked chamber, not a platform.

The user experience goal is:

* fast launch
* one clean call screen
* strong camera/audio quality
* live text overlays
* optional translation
* optional end-of-call memory save

## V1 goals

Ship the smallest serious version first.

### Must have

* Android native app
* Host creates a single session
* Guest joins with password
* 1:1 video + audio call
* Front/back camera switch
* Mic mute / camera mute
* Call status indicators
* On-screen text chat overlay
* No picture-in-picture behavior
* Host can end call for both participants
* Optional save-memory prompt at end
* Host can load previous saved memory before a call

### Nice to have in V1

* Network quality badge
* Call duration timer
* Blur background toggle
* Caption panel placeholder, even if translation is not yet enabled

## V2 goals

### Must have

* Live captions
* English ↔ Vietnamese translation overlay
* English ↔ Filipino/Tagalog translation overlay
* Host controls translation defaults
* Guest can toggle subtitle visibility locally
* Saved memory includes transcript and translated transcript if enabled

### Nice to have

* Per-speaker subtitle styling
* Export transcript
* Call summary artifact

---

## Non-goals

These are explicitly out of scope.

* multi-room system
* group calling
* public profiles
* social feed
* contact graph
* account discovery
* community chat
* mini-player / floating window mode
* desktop client in phase 1
* full web client in phase 1

---

## Technical architecture

## Client

Android native in Android Studio.

Recommended stack:

* Kotlin
* Jetpack Compose
* MVVM
* Hilt
* Room
* Coroutines / Flow

## Media layer

Use WebRTC for live audio/video. WebRTC supports real-time voice, video, and data, and signaling is intentionally not defined by the standard, which means you can keep signaling simple instead of building a giant socket cathedral on day one. ([WebRTC][1])

## Signaling layer

Do not let WebSocket own the whole app.

V1 signaling recommendation:

* HTTPS REST endpoints
* short polling for call state
* optional upgrade to WebSocket later

This is valid because WebRTC does not require a specific signaling protocol. ([MDN Web Docs][2])

## Connectivity

Use:

* STUN/TURN for call reliability
* session state stored server-side
* strict max participants = 2

## Persistence

Room database for:

* host settings
* saved memory artifacts
* subtitle preferences
* recent call metadata

---

## Translation and caption architecture

This is the hard part, so isolate it.

### Separate the system into 4 layers

1. `call-core`
   camera, mic, peer connection, lifecycle

2. `caption-core`
   speech-to-text events with timestamps

3. `translation-core`
   source text → translated subtitle events

4. `memory-core`
   optional save/load session artifacts

### Language support note

Current Google ML Kit translation support includes Tagalog (`tl`) and Vietnamese (`vi`), while Google Cloud Speech-to-Text lists Filipino (`fil-PH`) and Vietnamese (`vi-VN`). So the app should not hardcode “one language code everywhere.” It should use a language mapping layer. ([Google for Developers][3])

### Recommended rollout

* Phase A: subtitles only
* Phase B: English ↔ Vietnamese translation
* Phase C: English ↔ Filipino/Tagalog translation
* Phase D: auto-detect + smarter host presets

### Quality rule

Translation must be replaceable.

Do not bury translation directly inside the call engine. Use an interface so you can swap:

* on-device translation
* cloud translation
* future custom translation path

---

## UI / screen list

## 1. Launch screen

* app logo / title
* `Host Call`
* `Join Call`
* `Load Memory` for host only if applicable

## 2. Host setup screen

* session password
* subtitle language defaults
* translation on/off
* memory load selector
* start call button

## 3. Guest join screen

* password input
* display name optional
* join button

## 4. Main call screen

* full-screen remote video
* local camera preview inset
* mute mic
* mute camera
* switch camera
* end call
* chat overlay button
* subtitle toggle
* translation toggle if available
* network status indicator

## 5. Chat overlay

* translucent overlay
* message input
* lightweight text history
* can be dismissed without leaving call

## 6. End call screen

* save memory toggle
* host-only memory name field
* summary of what will be saved
* confirm / discard

---

## UX rules

* zero room browsing
* zero unnecessary taps
* call screen should open quickly
* controls should disappear when idle
* subtitles should never block essential controls
* translation must be optional, never forced
* memory save must be explicit, never automatic by default

---

## No PiP rule

The app should not shrink into a little floating box. On Android, picture-in-picture support is controlled by the activity manifest via `android:supportsPictureInPicture`, so keep that disabled or unset for this product. ([Android Developers][4])

---

## Security and privacy rules

* password is hashed server-side
* session expires automatically
* max two active participants
* no reusable public room IDs
* all network traffic over TLS
* memory saving is opt-in
* host decides whether memory is saved
* guest should be informed when save-memory is enabled

---

## Backend API sketch

Minimal backend only.

### Session endpoints

* `POST /session/create`
* `POST /session/join`
* `POST /session/end`
* `GET /session/state`

### Signaling endpoints

* `POST /signal/offer`
* `POST /signal/answer`
* `POST /signal/ice`
* `GET /signal/poll`

### Memory endpoints

* `POST /memory/save`
* `GET /memory/list`
* `GET /memory/{id}`
* `DELETE /memory/{id}`

---

## Data model sketch

### Session

* sessionId
* hostId
* passwordHash
* createdAt
* expiresAt
* active
* participantCount

### Message

* messageId
* sessionId
* senderRole
* text
* timestamp

### SubtitleEvent

* subtitleId
* sessionId
* speakerRole
* sourceLanguage
* sourceText
* translatedLanguage
* translatedText
* startMs
* endMs

### MemoryArtifact

* memoryId
* sessionId
* title
* createdAt
* hostNotes
* transcriptIncluded
* translationIncluded
* chatIncluded

---

## Build order

## Phase 1

* Android shell
* host/join flow
* local UI only

## Phase 2

* WebRTC calling
* camera/mic controls
* basic call reliability

## Phase 3

* text chat overlay
* save-memory flow

## Phase 4

* captions in source language

## Phase 5

* Vietnamese translation

## Phase 6

* Filipino/Tagalog translation

---

## Team rules

* transport layer must be replaceable
* translation layer must be replaceable
* no feature may force a rewrite of call-core
* do not start with WebSocket-first architecture
* do not start with web client
* do not add extra room logic “just in case”

---

## Success criteria for V1

The app is successful when:

* host can start a call in under 30 seconds
* guest can join with only password entry
* two devices complete a stable call
* chat overlay works during call
* no PiP appears
* host can optionally save a memory artifact at end

If you want, I can turn this into a tighter Markdown product brief or a Git-ready `SPEC.md` next.

[1]: https://webrtc.org/?utm_source=chatgpt.com "WebRTC"
[2]: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Session_lifetime?utm_source=chatgpt.com "Lifetime of a WebRTC session - Web APIs | MDN"
[3]: https://developers.google.com/ml-kit/language/translation/translation-language-support?utm_source=chatgpt.com "ML Kit translation: supported languages"
[4]: https://developer.android.com/guide/topics/manifest/activity-element?utm_source=chatgpt.com "<activity> | App architecture"
