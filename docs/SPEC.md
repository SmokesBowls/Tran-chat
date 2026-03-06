## Translation latency policy

Live translated subtitle overlays must follow a latency threshold.

- if a translated subtitle arrives within the live threshold window, render it in the live overlay
- if a translated subtitle arrives too late to match the current conversation context, do not flash it over live video
- late translations must be routed to transcript/history instead
- the live caption area may show a subtle loading indicator while translation is in progress

Initial default threshold:
- 4 seconds maximum delay for live overlay eligibility
