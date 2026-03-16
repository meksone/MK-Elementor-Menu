/**
 * Sticky Header Handler - vanilla JS, no jQuery
 * v0.1.1 - Switch to position:fixed + DOM scanning (hook was never firing)
 */
(function() {
	'use strict';

	class StickyHeaderHandler {
		constructor(element, settings) {
			this.element   = element;
			this.settings  = settings;
			this.observer  = null;
			this.sentinel  = null;
			this.logoWrapper = null;
			this.spacer    = null;
			this.originalHeight = 0;
			this.init();
		}

		init() {
			// Record height before any changes
			this.originalHeight = this.element.offsetHeight;

			// Apply position: fixed with calculated dimensions (mirrors Elementor PRO sticky)
			this._applyFixedPosition();

			// Create spacer to fill the gap left by fixed positioning
			this._createSpacer();

			// Add sticky class (enables transitions + scrolled-state CSS)
			this.element.classList.add('mk-em-is-sticky');

			// Setup logo swap if alternate logo is configured
			if (this.settings.mk_em_scrolled_logo && this.settings.mk_em_scrolled_logo.url) {
				this._setupLogoSwap();
			}

			// Scroll detection
			this._createSentinel();
			this._bindScrollObserver();

			// Recalculate width on resize
			this._bindResize();
		}

		_applyFixedPosition() {
			const rect    = this.element.getBoundingClientRect();
			const zIndex  = parseInt(this.settings.mk_em_z_index) || 999;

			this.element.style.position     = 'fixed';
			this.element.style.top          = rect.top + 'px';
			this.element.style.left         = rect.left + 'px';
			this.element.style.width        = rect.width + 'px';
			this.element.style.zIndex       = zIndex;
			this.element.style.marginTop    = '0';
			this.element.style.marginBottom = '0';
		}

		_createSpacer() {
			this.spacer = document.createElement('div');
			this.spacer.className = 'mk-em-sticky-spacer';
			this.spacer.style.height = this.originalHeight + 'px';
			this.spacer.setAttribute('aria-hidden', 'true');
			// Insert after the container so it fills the layout gap
			this.element.parentElement.insertBefore(this.spacer, this.element.nextSibling);
		}

		_bindResize() {
			const recalc = () => {
				// Recalculate from spacer position (spacer stays in normal flow)
				if (!this.spacer) return;
				const rect = this.spacer.getBoundingClientRect();
				this.element.style.left  = rect.left + 'px';
				this.element.style.width = rect.width + 'px';
			};

			if (typeof ResizeObserver !== 'undefined') {
				this._resizeObserver = new ResizeObserver(recalc);
				this._resizeObserver.observe(document.body);
			} else {
				window.addEventListener('resize', recalc, { passive: true });
			}
		}

		_setupLogoSwap() {
			const imageWidget = this.element.querySelector('.elementor-widget-image');
			if (!imageWidget) return;

			const defaultImg = imageWidget.querySelector('img');
			if (!defaultImg) return;

			const originalParent = defaultImg.parentElement;

			this.logoWrapper = document.createElement('span');
			this.logoWrapper.className = 'mk-em-logo-wrapper';
			this.logoWrapper.classList.add('mk-em-logo-anim-' + (this.settings.mk_em_logo_animation || 'fade'));

			defaultImg.classList.add('mk-em-logo-default');

			const scrolledImg = document.createElement('img');
			scrolledImg.src = this.settings.mk_em_scrolled_logo.url;
			scrolledImg.alt = defaultImg.alt;
			scrolledImg.className = 'mk-em-logo-scrolled';
			scrolledImg.setAttribute('aria-hidden', 'true');

			originalParent.insertBefore(this.logoWrapper, defaultImg);
			this.logoWrapper.appendChild(defaultImg);
			this.logoWrapper.appendChild(scrolledImg);
		}

		_createSentinel() {
			const threshold = parseInt(this.settings.mk_em_scroll_threshold) || 80;
			this.sentinel = document.createElement('div');
			this.sentinel.style.cssText = 'position:absolute;top:' + threshold + 'px;height:1px;width:1px;pointer-events:none;opacity:0;';
			this.sentinel.setAttribute('aria-hidden', 'true');
			this.sentinel.className = 'mk-em-sentinel';
			document.body.prepend(this.sentinel);
		}

		_bindScrollObserver() {
			if (typeof IntersectionObserver !== 'undefined') {
				this.observer = new IntersectionObserver(
					(entries) => {
						entries.forEach((entry) => {
							if (!entry.isIntersecting) {
								this._onScrolled();
							} else {
								this._onRestored();
							}
						});
					},
					{ threshold: 0 }
				);
				this.observer.observe(this.sentinel);
			} else {
				this._bindScrollFallback();
			}
		}

		_bindScrollFallback() {
			const threshold = parseInt(this.settings.mk_em_scroll_threshold) || 80;
			let ticking = false;

			window.addEventListener('scroll', () => {
				if (!ticking) {
					requestAnimationFrame(() => {
						const scrollY = window.scrollY || window.pageYOffset;
						if (scrollY > threshold) {
							this._onScrolled();
						} else {
							this._onRestored();
						}
						ticking = false;
					});
					ticking = true;
				}
			}, { passive: true });
		}

		_onScrolled() {
			if (this.element.classList.contains('mk-em-is-scrolled')) return;
			this.element.classList.add('mk-em-is-scrolled');
			if (this.settings.mk_em_scrolled_box_shadow === 'yes') {
				this.element.classList.add('mk-em-has-shadow');
			}
		}

		_onRestored() {
			if (!this.element.classList.contains('mk-em-is-scrolled')) return;
			this.element.classList.remove('mk-em-is-scrolled');
			this.element.classList.remove('mk-em-has-shadow');
		}

		destroy() {
			if (this.observer) this.observer.disconnect();
			if (this._resizeObserver) this._resizeObserver.disconnect();
			if (this.sentinel) this.sentinel.remove();
			if (this.spacer) this.spacer.remove();

			if (this.logoWrapper) {
				const defaultImg = this.logoWrapper.querySelector('.mk-em-logo-default');
				const scrolledImg = this.logoWrapper.querySelector('.mk-em-logo-scrolled');
				if (defaultImg && scrolledImg) {
					const wrapperParent = this.logoWrapper.parentElement;
					defaultImg.classList.remove('mk-em-logo-default');
					scrolledImg.remove();
					wrapperParent.insertBefore(defaultImg, this.logoWrapper);
					this.logoWrapper.remove();
				}
			}

			// Reset inline styles
			this.element.style.position     = '';
			this.element.style.top          = '';
			this.element.style.left         = '';
			this.element.style.width        = '';
			this.element.style.zIndex       = '';
			this.element.style.marginTop    = '';
			this.element.style.marginBottom = '';
			this.element.classList.remove('mk-em-is-sticky', 'mk-em-is-scrolled', 'mk-em-has-shadow');
		}
	}

	/**
	 * Scan DOM for containers with our sticky controls enabled
	 */
	function initStickyHeaders() {
		const containers = document.querySelectorAll('.e-con[data-settings]');
		containers.forEach(function(container) {
			// Skip already-initialised elements
			if (container.__mkEmInit) return;

			let settings = {};
			try {
				settings = JSON.parse(container.dataset.settings);
			} catch (e) {
				return;
			}

			if (settings.mk_em_sticky_enable !== 'yes') return;

			container.__mkEmInit = true;
			container.__mkEmHandler = new StickyHeaderHandler(container, settings);

			// Editor cleanup
			container.addEventListener('elementor/destroyed', function() {
				if (container.__mkEmHandler) {
					container.__mkEmHandler.destroy();
					container.__mkEmInit = false;
				}
			});
		});
	}

	// Run on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initStickyHeaders);
	} else {
		initStickyHeaders();
	}

	// Run again after full load (catches lazy-loaded elements)
	window.addEventListener('load', initStickyHeaders);

})();
