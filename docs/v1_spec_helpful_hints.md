

---

## Refined High Quality Spec Extensions
All additive, nothing here contradicts your original design.

### Additional Non-Negotiable Boundary Rules
This is the single most important missing piece from your spec. These rules are the difference between an architecture that stays clean for 2 years, and one that turns into spaghetti by the 3rd feature:
* No feature layer may depend on any other feature layer. Ever.
* The only allowed dependency graph is: `any layer -> core-model -> core-data`
* Cross feature communication may only happen via exactly three mechanisms:
  1. Observing shared state in core-data
  2. Posting immutable events to a single global event bus
  3. Explicit interfaces declared only in core-model
* There is no service locator. There is no DI graph that crosses feature boundaries.

---

### Formal Layer Responsibility Matrix
| Layer | Responsibility | Explicitly Forbidden To Do |
|---|---|---|
| app | Only: Activity navigation, foreground service, application onCreate | May not contain any business logic. May not hold any state. |
| core-model | Immutable data classes, pure function interfaces, sealed event classes | May not have any dependencies. May not contain any side effects. |
| core-data | Single source of truth for all runtime and persisted state. All state is observable. | May not contain business logic. May not modify state on its own. |
| feature-call | Owns 100% of call lifecycle. Single source of truth for "is there an active call". | May not know translation, memory or captions even exist. |
| feature-captions | Consumes audio track, emits SubtitleEvents | May not modify call state. May not know translation exists. |
| feature-translation | Subscribes to SubtitleEvents, emits TranslatedSubtitleEvents | May not know there is a call. May not know captions exist. |
| feature-chat-overlay | Subscribes to any SubtitleEvent, renders them | Does not care if the subtitle was original or translated. |
| feature-memory | Subscribes to all events from all features, writes artifacts at end of call | May not modify any runtime state. May be disabled at compile time with zero other changes. |

---

### Additional System Rules
These are the rules you will wish you had written down on day 1:
* All events are immutable. Once emitted an event is never modified or retracted.
* No feature may ever drop an event. If you don't care about it, ignore it.
* Signaling is 100% contained inside feature-call. No other layer even knows signaling exists.
* There are exactly zero callbacks between features.
* You will implement exactly one new dependency: an event bus. It will be 120 lines of code. You will not use EventBus, RxJava, or SharedFlow for this.

---

## Definitive Build Order
This is strictly ordered. Do not deviate from this order. This is the single biggest mistake teams make building this exact product.

1. Week 1: Build core-model, core-data, event bus.
2. Week 2: Build an empty feature-call that can establish and hold a WebRTC call between two devices. No audio, no video, just connect and stay connected for 2 hours.
3. STOP. Do not proceed further until this works perfectly. 90% of all project risk is in this step.
4. Week 3: Add feature-captions. Verify you can get subtitles for a call.
5. Week 4: Add feature-chat-overlay. Verify subtitles render.
6. Week 5: Add feature-translation. Notice you did not change a single line of code in captions, overlay or call to add this.
7. Week 6: Add feature-memory. Notice you did not change a single line of code anywhere else to add this.
8. Last step: Replace the dummy signaling implementation with the real one.

> Your rebuild policy is 100% correct. If you work on anything else before you have a working stable call, you have already failed.

---

## Known Failure Modes & Troubleshooting
This is every single thing that will break on this architecture, in the exact order you will hit them:

1. ### Call stability falls off a cliff after you add translation
   This is the #1 failure mode for this product.
   * Root cause: Your boundary rule will not protect you from scheduler contention. Translation work will steal time from the call thread.
   * Fix: All features except feature-call run on a completely separate thread pool. Feature-call gets an entire dedicated thread, forever. Nothing else ever runs on that thread.

2. ### Subtitles drift by 2-3 seconds over the length of a call
   * Root cause: Every pipeline step adds a tiny bit of latency, they add up.
   * Fix: Every SubtitleEvent has an original media timestamp. The overlay always renders subtitles based on the current media time, not based on when the event arrived. Translation and memory can take as long as they want, the overlay will still render them at the correct time.

3. ### One bad component crashes the entire call
   * Root cause: Uncaught exception in translation or memory.
   * Fix: Every feature has a top level catch all. If a feature crashes, it dies, logs an error, and the rest of the app continues running. If translation crashes you still have a working call and original captions. If memory crashes you still have a working call. This is non negotiable.

4. ### Signaling becomes the bottleneck
   * You are 100% correct to make signaling swappable. You will throw away your first 3 signaling implementations. This is normal.
   * Do not build websocket signaling. Do not build SSE signaling. First build the dumbest possible 5 second polling signaling. It will work better than any real time thing you build for the first 6 months.

---

## General Build Advice
* You do not need Hilt. You do not need Dagger. You do not need any DI framework. Each feature is constructed once at app start and that is it.
* You will be tempted to add a shared utility module. Do not. If code is shared it goes in core-model or core-data. There is no utils module.
* The old prototype code is lying to you. All of it. Delete it from your working directory.
* If at any point you find yourself writing an interface from feature-call that is consumed by another feature, stop. You are making a mistake. Go back to observing state.
* The metric for if you got the boundaries right: you can delete any entire feature folder at any time, and the app will still compile and run perfectly.

***

## Implementation Notes (Non‑Architectural)

These are optional practices that do not change the core architecture rules.

### Tooling and Testing

- Use a pure Kotlin **core-model** module (no Android) so all domain models and events are unit testable with plain JUnit and Coroutines test utilities. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/6601981/64cd2dd3-5bbd-4555-8fc4-b187c6502634/tranchat_v1_spec.md)
- In **core-data**, expose repositories as `Flow`‑based or suspend APIs so features can observe state without direct callbacks between features. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/6601981/64cd2dd3-5bbd-4555-8fc4-b187c6502634/tranchat_v1_spec.md)
- Add static analysis in CI (Detekt, ktlint) plus a simple dependency rule that forbids any `feature-*` module from depending on another `feature-*` module. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/6601981/a1844fab-effb-48bf-a8a8-d757bf10b0b9/spec_v1_tranchat.md)

### Signaling Port

- Define a small signaling interface in core-data, implemented elsewhere so signaling stays swappable:

```kotlin
interface SignalingClient {
    suspend fun offer(offer: SdpOffer)
    suspend fun answer(answer: SdpAnswer)
    suspend fun sendIce(candidate: IceCandidate)
    fun sessionUpdates(): Flow<SessionState>
}
```

- Keep the first signaling implementation extremely dumb (short‑polling HTTP) and only optimize once stable calls are proven. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/6601981/64cd2dd3-5bbd-4555-8fc4-b187c6502634/tranchat_v1_spec.md)

### Translation Engine Port

- Define a translation interface that can be backed by on‑device or cloud engines, without changing any feature code:

```kotlin
interface TranslationEngine {
    fun translate(text: String, targetLanguage: String): Flow<String>
}
```

- Start with a pass‑through implementation (returns the source text) so you can wire the pipeline before integrating a real provider. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/6601981/64cd2dd3-5bbd-4555-8fc4-b187c6502634/tranchat_v1_spec.md)

### Memory Optionality

- Implement memory as a no‑op when disabled so the rest of the app doesn’t have to care:

```kotlin
interface MemoryRepository {
    suspend fun save(artifact: MemoryArtifact)
}

object NoOpMemoryRepository : MemoryRepository {
    override suspend fun save(artifact: MemoryArtifact) { /* no-op */ }
}
```

- You should be able to swap `MemoryRepositoryImpl` ↔ `NoOpMemoryRepository` without touching any feature code. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/6601981/a1844fab-effb-48bf-a8a8-d757bf10b0b9/spec_v1_tranchat.md)

***

