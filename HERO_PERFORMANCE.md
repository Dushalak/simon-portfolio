# Hero rendering and loading optimization

The Hero uses a native WebGL dissolution shader, SVG/WAAPI text and frame animations, CSS atmosphere layers, and a looping H.264 video. It does not use Three.js or a particle library. Its particle appearance comes from procedural noise, so the device budget controls noise detail, octave count, pixel count and draw cadence rather than an array of particle objects.

The previous movie was 2560 × 1440 with an unused AAC audio track (4,787,662 bytes). It was requested eagerly and video readiness could hold the intro. The shader could render up to 1440 × 1000 pixels, while the master timeline updated every tween even after it had finished. Google Fonts also added external render-blocking requests.

## Device budgets

| Initial device profile | Shader pixel ceiling | Shader draw ceiling | Noise octaves | Background video | Video size |
| --- | ---: | ---: | ---: | --- | ---: |
| Desktop with sufficient reported resources | 786,432 | 40/s | 4 | 1920 × 1080, 24 fps | 1,183,964 bytes |
| Mobile/coarse pointer or limited memory | 360,000 | 30/s | 3 | 1280 × 720, 24 fps | 467,846 bytes |
| ≤4 reported CPU cores, ≤2 GB reported memory, Save-Data or 2G | 160,000 | 24/s | 2 | 854 × 480, 20 fps | 189,297 bytes |

Actual draw cadence also depends on the display refresh rate, visibility and whether an update is needed. These are ceilings, not measured FPS. The selected movie reduces transfer by approximately 75%, 90% or 96% respectively. The clips use the same composition and playback speed, contain no audio, and have their MP4 metadata at the beginning for progressive playback. Desktop encoding compared with the original resized to 1080p and sampled at 24 fps gives SSIM 0.998252; this comparison evaluates encoding fidelity, not identical pixels at the original resolution.

## Loading and rendering changes

- The document no longer hides all main content while scripts initialize. The existing title/frame sequence starts after a paint opportunity, preserving its order and timing.
- The poster remains eager/high priority. Video has no eager source; its selected variant is attached after load/idle/paint opportunities. Video decoding never gates the title or intro completion. A slow poster has a bounded wait.
- WebGL creation is deferred separately. A lightweight curtain preserves the reveal while initialization waits. Initialization is cancelled on teardown and waits while the document is hidden.
- The static noise field remains cached. Desktop can retain Float32; smaller devices and browsers without float framebuffer support use an RGBA8 cache with a 16-bit packed edge. This avoids repeated analytic noise computation and reduces texture memory. A failed framebuffer retains the bounded analytic/fallback path.
- Shader raster dimensions and noise detail adapt to the initial device profile. Dimensions are observed on resize instead of measured on every draw. Noise amplitude is normalized when octave count is reduced.
- The About background shares the device budget. The later personal-strengths optimization adds smaller raster/frame limits and suspends it while scrolling; the scroll transition now uses compositor opacity/translation instead of an optical noise mask. See `BRING_PERFORMANCE.md` for the current limits. The Hero opening optical effect remains intact.
- Master timeline calculations are capped, completed tweens stop receiving writes, pointer input is batched before measurement, and shared scroll output objects are reused. Existing animation clocks and final layout stay intact.
- Video pauses when offscreen, hidden, behind a project/menu, or when the Hero scene has faded out. Manual pause persists across re-entry. Direct project visits skip the Hero video until returning to a visible Hero. Autoplay rejection does not create a retry loop.
- Reduced-motion preference skips the intro and automatic video download; explicit manual playback remains available. Preference changes are handled during the visit.
- DM Sans is self-hosted as WOFF2 using the same source family/weights and preserved metrics; its license is retained. No Google font host is required for rendering. The video edge fade is a single cached SVG mask, and the atmosphere's soft gradient no longer uses an additional full-screen blur filter.

## Validation

`npm run build`, `npm run check`, and existing footer lifecycle/cache regression checks pass. Hero regressions cover device tiers, load/paint/idle ordering, cancellation, hidden documents, intro/video gating, manual pause, offscreen and modal/menu pause, reduced motion, direct project entry, autoplay rejection and completed tween updates. Browser verification covers desktop and a 375 × 812 viewport, WebGL cache format/pixel budget, native movie dimensions, loaded fonts, and console errors.

Lighthouse scores and foreground-device FPS have not been measured in this run. Background in-app preview scheduling is unsuitable for claiming an FPS uplift. Local checks and asset reductions establish reduced work and transfer, not a guaranteed score or connection speed. Netlify/CDN connectivity remains a separate factor for domestic access.
