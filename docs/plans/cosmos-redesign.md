# START: cosmos visual direction

Personal figure against a deep, cinematic star field. Thin Manrope typography, open composition and transparent surfaces. One circular timer acts as the primary action; a single progress arc consumes clockwise, driven by the persisted deadline. No separate rotating satellite. No lime green.

Implementation: opt-in `?design=cosmos` preview reuses the existing App and all mission/push/storage logic. A separate decorative scene and scoped styles change only presentation. Static generated background is compressed to WebP; sparse foreground stars use CSS transforms/opacity, paused when hidden and disabled for reduced motion. A single bounded shooting-star animation appears on victory. No WebGL, video, external font dependency or pointer tracking.

The first generated portrait was rejected for poor likeness and is not used. New back-view photos are available; clothing choice is awaiting user response. Current production skin remains the default until composition is finished. Preserve the existing origin so progress and subscriptions continue to work.

Background v2 uses Topaz High Fidelity enhancement. Delivered variants: 1882×3344 mobile and 3764×6688 desktop, WebP quality 92. The oversized intermediate stays in ignored work/. A 62-star canvas at 24fps adds depth without React updates per frame; DPR is capped at 1.5. Animation pauses on visibility loss and reduced motion is respected.

Checks: production build; mobile widths 375 and 430; desktop containment; mission start/reload/completion; no overflow; motion preference/visibility; unchanged notifications; final generated asset bundled and offline cached.
