# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
