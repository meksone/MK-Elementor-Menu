# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
