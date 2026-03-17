# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.14] - 2026-03-18

### Fixed
- Backend Preview Reliability: Improved synchronization in the Elementor Editor using `requestAnimationFrame` to wait for DOM updates before re-initializing the handler.
- Logo Detection: Expanded support for common Elementor widgets like 'Site Logo' and improved the custom CSS selector logic to support IDs and better targeting.
- Frontend Image Settings: Fixed an issue where default values for `object-fit` and `object-position` were being overridden by empty strings in JavaScript.

## [0.1.13] - 2026-03-17

### Fixed
- `object-fit` / `object-position` still not applying: added `frontend_available: true` back to both controls so non-default values are serialised into `data-settings`; JS now reads them and applies as inline styles (which always win over CSS), but only when the value is explicitly present — the CSS `var(--mk-em-logo-fit, contain)` / `var(--mk-em-logo-position, left center)` fallback in `sticky-header.css` covers the default case without JS needing to know the default value

## [0.1.12] - 2026-03-17

### Fixed
- `object-fit` / `object-position` still not applying: Elementor does not reliably generate CSS for selectors targeting dynamically created child classes (`{{WRAPPER}} .mk-em-logo-scrolled`); switched to the same CSS custom-property pattern used by all other controls in this plugin — selectors now write `--mk-em-logo-fit` and `--mk-em-logo-position` onto `{{WRAPPER}}`, which Elementor definitely processes; the static CSS on `.mk-em-logo-scrolled` reads them via `var()` with the correct defaults as fallback

## [0.1.11] - 2026-03-17

### Fixed
- `object-fit` and `object-position` not applying to scrolled logo: removed fragile JS inline assignment (which relied on `data-settings` serialization — broken when value equals control default or when Elementor skips `frontend_available` for `render_type:none` controls); replaced with Elementor `selectors` output targeting `.mk-em-logo-scrolled` directly; CSS default values (`contain` / `left center`) in `sticky-header.css` cover the case where Elementor skips outputting the default

## [0.1.10] - 2026-03-17

### Fixed
- `object-position` not applied on frontend: replaced stale module-level `IS_EDITOR` constant (evaluated before `elementorFrontend` was ready) with the correct Elementor pattern — `$(window).on('elementor/frontend/init')` wrapping `elementorFrontend.hooks.addAction('frontend/element_ready/global')`, where `isEditMode()` is reliably available; `isEditor` is now passed through `initContainer` and stored on the handler instance
- Editor preview switch with no effect or flash: same root cause as above — `isEditor` was always `false` at module load time so the editor branch never ran; now resolved by moving detection inside the `elementor/frontend/init` callback
- `_watchSettings` MutationObserver reinit used stale `isEditor = false` from outer scope: now captures the correctly resolved `isEditor` value in its closure

## [0.1.9] - 2026-03-17

### Fixed
- `object-position` not applied in editor: `render_type: 'none'` controls update the `data-settings` attribute without replacing the element, so the old handler never re-ran with the new value; a per-element `MutationObserver` on `data-settings` now destroys and re-initialises the handler on every live control change
- Editor detection was still unreliable: added three independent checks — `elementor-editor-preview` body class (primary), `elementorFrontend.isEditMode()` (secondary), `window.parent.elementor` iframe parent check (tertiary); evaluated once at module load into `IS_EDITOR` constant
- Preview switch flash: changed `render_type` from `'template'` to `'none'`; now handled by the attribute observer above — no element replacement, no flash

## [0.1.8] - 2026-03-17

### Fixed
- `object-fit` still not applied: Elementor also skips serialising `frontend_available` values that equal the control default — `mk_em_scrolled_logo_fit` and `mk_em_scrolled_logo_position` are now always applied with explicit fallbacks (`contain` / `left center`)
- Editor detection was unreliable: `elementorFrontend` was undefined when our `DOMContentLoaded` handler ran because we had no script dependency; added `elementor-frontend` as a dependency to `wp_register_script` so our code always runs after Elementor's frontend is initialised

### Added
- **Preview Scrolled State** toggle in the editor (`mk_em_preview_scrolled`): when ON, the container shows the scrolled appearance (height, background, shadow, logo swap) as a static preview without affecting frontend behaviour; uses `render_type: template` so toggling it triggers a re-render that the MutationObserver picks up

## [0.1.7] - 2026-03-17

### Fixed
- `object-fit` not applied to scrolled logo: Elementor skips CSS output for default-valued selector controls; `object-fit` and `object-position` are now applied as inline styles by JS (controls marked `frontend_available`)
- Editor preview did nothing: JS now detects `elementorFrontend.isEditMode()` and shows the sticky scrolled state as a static preview (no `position:fixed`) so background, shadow, logo and height are all visible while editing; `MutationObserver` re-initialises containers when Elementor re-renders them after a settings change

## [0.1.6] - 2026-03-17

### Fixed
- Container with background image (no content) was invisible: `offsetHeight` fallback now uses `Math.max(offsetHeight, 80)` so a height-less background-only container gets at least 80px

### Changed
- **Background (scrolled)**: replaced single color control with Elementor `Background` group control — now supports solid color, gradient, and image
- **Box Shadow (scrolled)**: replaced ON/OFF switcher with Elementor `Box Shadow` group control — fully editable (color, blur, spread, offset, inset)
- Removed `mk-em-has-shadow` CSS class; shadow is now applied directly via Elementor selector `{{WRAPPER}}.mk-em-is-scrolled`

### Added
- **Scrolled Logo Position** select (9 options: left/center/right × top/center/bottom) — controls `object-position` of the alternate logo image

## [0.1.5] - 2026-03-17

### Fixed
- Height shrink animation was instant (no transition): all transitions (height, background-color, box-shadow, logo transform/opacity) are now set as inline styles by JS using the configured duration — bypasses Elementor's own `transition` override on `.e-con` containers
- `Transition Duration` control now has `frontend_available: true` so JS can read the configured value

## [0.1.4] - 2026-03-17

### Fixed
- Container height not shrinking (only expanding worked): added `min-height: 0` inline in JS so Elementor's own `min-height` on the container doesn't prevent height reduction

### Added
- **Scrolled Logo Width** slider (px/%) — control the width of the alternate logo image
- **Scrolled Logo Fit** selector (Contain / Cover / Fill / Scale Down / None) — control `object-fit` of the alternate logo image

## [0.1.3] - 2026-03-17

### Changed
- Replaced `min-height` + padding controls with explicit **Starting Height** and **Sticky Height** sliders — height is now set inline via JS enabling reliable CSS transitions in both directions
- Replaced fixed `.elementor-widget-image` logo target with a **Logo CSS Class** text control, supporting any widget, image, or container element
- Removed padding controls (`shrink_padding_top`, `shrink_padding_bottom`) — height now drives the shrink effect directly
- Renamed `mk_em_shrink_logo_scale` → `mk_em_logo_scale`
- Logo Swap Animation control now only shows when an alternate logo is set

### Fixed
- Container height not shrinking on scroll — height transition now works properly with explicit pixel values on both states
- Logo scale animation not reverting on scroll-up — `transition` is now declared on the base state (`.mk-em-is-sticky .mk-em-shrink-target`) so both directions animate
- `transform-origin: left center` on shrink target for natural logo scaling

## [0.1.2] - 2026-03-17

### Added
- GitHub self-updater (`includes/class-updater.php`) — new releases published via GitHub tags appear in the WordPress updates dashboard automatically
- `CHANGELOG.html` for the WordPress update popup
- `MK_EM_PLUGIN_SLUG`, `MK_EM_GITHUB_USER`, `MK_EM_GITHUB_REPO` constants

### Fixed
- z-index not applied: CSS variable `--mk-em-z-index` was overridden by inline styles set during fixed positioning; z-index is now set inline in JS alongside position/width

## [0.1.1] - 2026-03-16

### Fixed
- Container invisible in Elementor header location: replaced `position: sticky` with `position: fixed` applied via inline JS (mirrors Elementor PRO sticky approach)
- JS handler never initialised: replaced `elementorFrontend.hooks.addAction` (hook never fired) with direct DOM scanning on `DOMContentLoaded` + `window.load`
- Added spacer div to maintain document flow when container is taken out by `position: fixed`
- Added `ResizeObserver` to recalculate fixed width on viewport resize

## [0.1.0] - 2026-03-16

### Added
- Initial plugin scaffold for MK Elementor Menu
- Sticky Header extension for Elementor Container element
- Sticky Header controls injected into Container's Advanced tab:
  - Enable toggle for sticky header functionality
  - Scroll threshold (configurable px offset)
  - Transition duration (0-1000ms)
  - Min-height when scrolled (px/vh units)
  - Padding top/bottom when scrolled (px/em/rem units)
  - Logo scale fallback (when no alternate logo is set)
  - Alternate logo image upload
  - Logo animation type selector (fade, shrink, fade-shrink)
  - Background color for scrolled state
  - Optional box shadow when scrolled
  - Custom z-index control
- Vanilla JavaScript scroll handler (no jQuery dependency)
  - IntersectionObserver-based scroll detection (performant)
  - Fallback scroll event listener for older browsers
  - Logo swap functionality with three animation types
  - Automatic cleanup for Elementor editor live reload
- CSS with custom property architecture
  - Smooth transitions on all animated properties
  - GPU-accelerated logo animations (transform-based)
  - Three logo animation presets: fade, shrink, combined fade-shrink
- Compatible with Elementor Free (no Pro features required)
- Minimum requirements: WordPress 6.0+, PHP 7.4+, Elementor 3.0+
