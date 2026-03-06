# Architecture Rules

## State vs Event Bus

Tran-chat uses two cross-module communication paths, and they are not interchangeable.

### State in `core-data`
Use shared state only for persistent or togglable truth:
- translation enabled / disabled
- subtitle visibility settings
- selected languages
- save-memory enabled / disabled
- session status
- connection status

This state is observed through Flow and represents current application reality.

### Event bus
Use the event bus only for immutable, timestamped, ephemeral events:
- subtitle events
- translated subtitle events
- transient media-related notifications

The event bus must not carry persistent configuration or togglable mode state.

### Rule
If the UI should be able to ask “what is true right now?”, the answer must come from state.
If the UI should react to “something happened at a moment in time”, the answer may come from the event bus.
