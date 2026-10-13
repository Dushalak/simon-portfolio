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
- Responsive framing is now independent of that raster budget. Desktop retains its previous cover/overscan; tablet and phone use a centered 16:9 media plane with bounded overscan, and the opening shader samples the same composition coordinates. Tablet content uses a wider, centered reading frame. Dark surroundings absorb unused portrait-screen space rather than stretching or heavily cropping the source. ResizeObserver recalculates framing and the raster key includes DPR-derived dimensions.
- Shader raster dimensions and noise detail adapt to the initial device profile. Dimensions are observed on resize instead of measured on every draw. Noise amplitude is normalized when octave count is reduced.
- The About background shares the device budget. The later personal-strengths optimization adds smaller raster/frame limits and suspends it while scrolling; the scroll transition now uses compositor opacity/translation instead of an optical noise mask. See `BRING_PERFORMANCE.md` for the current limits. The Hero opening optical effect remains intact.
- Master timeline calculations are capped, completed tweens stop receiving writes, pointer input is batched before measurement, and shared scroll output objects are reused. Existing animation clocks and final layout stay intact.
- Video pauses when offscreen, hidden, behind a project/menu, or when the Hero scene has faded out. Manual pause persists across re-entry. Direct project visits skip the Hero video until returning to a visible Hero. Autoplay rejection does not create a retry loop.
- Background video starts enabled on desktop, iPad and mobile, as requested. It remains muted and inline, starts after the existing load/paint/idle and intro gates, and keeps the mobile/low-device video budgets. Reduced-motion still skips the opening and other animation sequences; the explicitly requested default-on Hero video is exempt. Manual pause remains available and survives navigation and unrelated gestures.
- Browser autoplay denial no longer becomes a manual pause. Playback retries on the next pointer, touch or keyboard gesture without a timer loop, another media download, or a double toggle action. iOS Low Power Mode or browser policy can still require that first interaction.
- DM Sans is self-hosted as WOFF2 using the same source family/weights and preserved metrics; its license is retained. No Google font host is required for rendering. The video edge fade is a single cached SVG mask, and the atmosphere's soft gradient no longer uses an additional full-screen blur filter.

## Validation

### iPad optical alpha correction (2026-10-13)

The reported iPad/WeChat screenshot showed pale solid islands during the opening where desktop showed thin silver edges. The optical shader used a straight-alpha WebGL canvas and divided edge RGB by very small alpha values. That creates nearly white RGB in transparent pixels and is vulnerable to differences in accelerated canvas compositing. The optical canvas now explicitly requests premultiplied alpha and emits bounded premultiplied RGB (`RGB <= alpha`), keeping the same edge field, timing, device budgets, layout and playback controls. Cached Float32/RGBA8 field textures are offscreen data and retain their existing encoding.

Actual WebGL readback checks ran on desktop (1920 × 1080), iPad landscape (1024 × 768), portrait (768 × 1024), Pro (1366 × 1024) and mobile (375 × 812), across high/balanced/low profiles and four reveal progress samples each. All 20 samples had zero premultiplied-color violations and zero GL errors. Both Float32 and packed RGBA8 paths passed. A paired render of the previous shader confirmed normal composited colors differ by at most 1.165/255 per RGB channel, preserving desktop appearance within quantization. The build regression guards the shader/context alpha pairing. These checks use the available Chromium browser; a physical iPad's WeChat/WebKit compositor has not been tested remotely.

`npm run build`, `npm run check`, and existing footer lifecycle/cache regression checks pass. Hero regressions cover device tiers, load/paint/idle ordering, cancellation, hidden documents, intro/video gating, manual pause, offscreen and modal/menu pause, reduced motion, direct project entry, autoplay rejection and completed tween updates. Browser verification covers desktop and a 375 × 812 viewport, WebGL cache format/pixel budget, native movie dimensions, loaded fonts, and console errors.

Lighthouse scores and foreground-device FPS have not been measured in this run. Background in-app preview scheduling is unsuitable for claiming an FPS uplift. Local checks and asset reductions establish reduced work and transfer, not a guaranteed score or connection speed. Netlify/CDN connectivity remains a separate factor for domestic access.
