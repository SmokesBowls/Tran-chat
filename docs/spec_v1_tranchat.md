# Tran-chat Architecture

## Principle

Tiny product. Strong boundaries.

The user sees a very small app.
The codebase should still be modular enough that call quality, translation, and saved memory do not break each other.

---

## High-level design

### app
Android entry point and navigation container.

### core-model
Shared domain models:
- Session
- Message
- SubtitleEvent
- MemoryArtifact

### core-data
Persistence and repositories.

### feature-call
Call lifecycle, device permissions, call controls, media session integration.

### feature-chat-overlay
In-call text overlay.

### feature-memory
Load/save memory artifacts.

### feature-captions
Caption event handling and subtitle rendering.

### feature-translation
Translation pipeline and engine abstraction.

---

## System rules

- call-core must not depend on translation-core
- translation-core may consume caption data but may not control call lifecycle
- memory-core stores artifacts after the session and should remain optional
- signaling implementation must be swappable
- old prototype code is reference-only, not architectural source of truth

---

## Backend shape

Keep backend minimal.

### Session endpoints
- create session
- join session
- end session
- get session state

### Signaling endpoints
- offer
- answer
- ice candidate
- session poll / update

### Memory endpoints
Optional depending on whether memory is local-only or synced.

---

## Rebuild policy

Do not continue from the old websocket architecture.
Do not let any single dependency become the new bottleneck.
Build local product structure first, then layer communication and translation on top.
