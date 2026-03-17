/**
 * Sticky Header Handler - vanilla JS, no jQuery (except Elementor hook registration)
 * v0.1.15
 */
(function($) {
	'use strict';

	// ─────────────────────────────────────────────────────────────
	// Handler class
	// ─────────────────────────────────────────────────────────────

	class StickyHeaderHandler {
		constructor(element, settings, isEditor) {
			this.element        = element;
			this.settings       = settings;
			this._isEditor      = isEditor;
			this.observer       = null;
			this.sentinel       = null;
			this.logoWrapper    = null;
			this.spacer         = null;
			this.shrinkTargets  = [];
			this.initialHeight  = null;
			this.stickyHeight   = null;
			this._attrObserver  = null;
			this._resizeObserver = null;
			this.init();
		}

		// ── Helpers ───────────────────────────────────────────────

		_parseSlideSetting(setting) {
			if (!setting || !setting.size) return null;
			return setting.size + (setting.unit || 'px');
		}

		// ── Init ──────────────────────────────────────────────────

		init() {
			this.initialHeight = this._parseSlideSetting(this.settings.mk_em_initial_height)
				|| (Math.max(this.element.offsetHeight, 80) + 'px');
			this.stickyHeight  = this._parseSlideSetting(this.settings.mk_em_sticky_height) || '60px';

			const dur = (this.settings.mk_em_transition_duration && this.settings.mk_em_transition_duration.size != null)
				? this.settings.mk_em_transition_duration.size
				: 300;
			this._transitionDur = dur;

			if (this._isEditor) {
				// ── Editor: show scrolled state if preview switch is ON ──
				if (this.settings.mk_em_preview_scrolled === 'yes') {
					this.element.classList.add('mk-em-is-sticky', 'mk-em-is-scrolled');
					this.element.style.height    = this.stickyHeight;
					this.element.style.minHeight = '0';
					this.element.style.overflow  = 'hidden';
					this._setupShrinkTargets();
					if (this.settings.mk_em_scrolled_logo && this.settings.mk_em_scrolled_logo.url) {
						this._setupLogoSwap();
					}
				}
				// Watch data-settings for any render_type:'none' control changes
				this._watchSettings();
				return;
			}

			// ── Frontend ──────────────────────────────────────────
			this._applyFixedPosition();
			this._createSpacer();
			this.element.classList.add('mk-em-is-sticky');
			this._setupShrinkTargets();
			if (this.settings.mk_em_scrolled_logo && this.settings.mk_em_scrolled_logo.url) {
				this._setupLogoSwap();
			}
			this._createSentinel();
			this._bindScrollObserver();
			this._bindResize();
		}

		// ── Settings watcher (editor only) ────────────────────────
		// Elementor updates data-settings in-place for render_type:'none' controls
		// without replacing the element, so frontend/element_ready won't re-fire.
		// We watch the attribute directly and destroy+reinit on every change.

		_watchSettings() {
			if (typeof MutationObserver === 'undefined') return;
			const isEditor = this._isEditor;
			let rafHandle = null;

			this._attrObserver = new MutationObserver((mutations) => {
				// Use requestAnimationFrame to ensure the DOM is updated
				// and Elementor has finished updating the data-settings attribute
				if (rafHandle) cancelAnimationFrame(rafHandle);
				rafHandle = requestAnimationFrame(() => {
					const el = this.element;
					this.destroy();
					el.__mkEmInit = false;
					initContainer(el, isEditor);
				});
			});
			this._attrObserver.observe(this.element, {
				attributes:      true,
				attributeFilter: ['data-settings'],
			});
		}

		// ── Positioning ───────────────────────────────────────────

		_applyFixedPosition() {
			const rect   = this.element.getBoundingClientRect();
			const zIndex = parseInt(this.settings.mk_em_z_index) || 999;

			this.element.style.position     = 'fixed';
			this.element.style.top          = rect.top + 'px';
			this.element.style.left         = rect.left + 'px';
			this.element.style.width        = rect.width + 'px';
			this.element.style.height       = this.initialHeight;
			this.element.style.minHeight    = '0';
			this.element.style.transition   = 'height ' + this._transitionDur + 'ms cubic-bezier(0.4,0,0.2,1), background-color ' + this._transitionDur + 'ms ease, box-shadow ' + this._transitionDur + 'ms ease';
			this.element.style.zIndex       = zIndex;
			this.element.style.marginTop    = '0';
			this.element.style.marginBottom = '0';
			this.element.style.overflow     = 'hidden';
		}

		_createSpacer() {
			this.spacer = document.createElement('div');
			this.spacer.className = 'mk-em-sticky-spacer';
			this.spacer.style.height = this.initialHeight;
			this.spacer.setAttribute('aria-hidden', 'true');
			this.element.parentElement.insertBefore(this.spacer, this.element.nextSibling);
		}

		_bindResize() {
			const recalc = () => {
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

		// ── Logo shrink target ────────────────────────────────────

		_setupShrinkTargets() {
			let targets = [];
			const selectorRaw = (this.settings.mk_em_logo_selector || '').trim();
			if (selectorRaw) {
				const selector = (selectorRaw.startsWith('.') || selectorRaw.startsWith('#'))
					? selectorRaw
					: '.' + selectorRaw;
				targets = Array.from(this.element.querySelectorAll(selector));
			}
			if (!targets.length) {
				const fallbacks = [
					'.elementor-widget-image',
					'.elementor-widget-theme-site-logo',
					'.elementor-widget-image-box'
				];
				for (const selector of fallbacks) {
					const found = this.element.querySelector(selector);
					if (found) {
						targets = [found];
						break;
					}
				}
			}
			targets.forEach(el => {
				el.classList.add('mk-em-shrink-target');
				el.style.transition      = 'transform ' + this._transitionDur + 'ms cubic-bezier(0.4,0,0.2,1)';
				el.style.transformOrigin = 'left center';
			});
			this.shrinkTargets = targets;
		}

		// ── Logo swap ─────────────────────────────────────────────

		_setupLogoSwap() {
			let logoContainer = null;
			const selectorRaw = (this.settings.mk_em_logo_selector || '').trim();

			if (selectorRaw) {
				const selector = (selectorRaw.startsWith('.') || selectorRaw.startsWith('#'))
					? selectorRaw
					: '.' + selectorRaw;
				logoContainer  = this.element.querySelector(selector);
			}

			if (!logoContainer) {
				const fallbacks = [
					'.elementor-widget-image',
					'.elementor-widget-theme-site-logo',
					'.elementor-widget-image-box'
				];
				for (const selector of fallbacks) {
					const found = this.element.querySelector(selector);
					if (found) {
						logoContainer = found;
						break;
					}
				}
			}

			if (!logoContainer) return;

			const defaultImg = logoContainer.tagName === 'IMG' ? logoContainer : logoContainer.querySelector('img');
			if (!defaultImg) return;

			const originalParent = defaultImg.parentElement;

			this.logoWrapper = document.createElement('span');
			this.logoWrapper.className = 'mk-em-logo-wrapper mk-em-logo-anim-' + (this.settings.mk_em_logo_animation || 'fade');

			defaultImg.classList.add('mk-em-logo-default');
			defaultImg.style.transition = 'opacity ' + this._transitionDur + 'ms ease, transform ' + this._transitionDur + 'ms cubic-bezier(0.4,0,0.2,1)';

			const scrolledImg     = document.createElement('img');
			scrolledImg.src       = this.settings.mk_em_scrolled_logo.url;
			scrolledImg.alt       = defaultImg.alt;
			scrolledImg.className = 'mk-em-logo-scrolled';
			scrolledImg.setAttribute('aria-hidden', 'true');
			scrolledImg.style.transition = 'opacity ' + this._transitionDur + 'ms ease, transform ' + this._transitionDur + 'ms cubic-bezier(0.4,0,0.2,1)';

			// Re-implement inline style application for object-fit and position.
			// This ensures they are applied even if Elementor's CSS output is delayed
			// or if we need to force the values on the dynamically created element.
			const fit = this.settings.mk_em_scrolled_logo_fit || 'contain';
			const pos = this.settings.mk_em_scrolled_logo_position || 'left center';
			scrolledImg.style.objectFit = fit;
			scrolledImg.style.objectPosition = pos;

			originalParent.insertBefore(this.logoWrapper, defaultImg);
			this.logoWrapper.appendChild(defaultImg);
			this.logoWrapper.appendChild(scrolledImg);
		}

		// ── Scroll detection ──────────────────────────────────────

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
							if (!entry.isIntersecting) this._onScrolled();
							else                        this._onRestored();
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
						if (scrollY > threshold) this._onScrolled();
						else                      this._onRestored();
						ticking = false;
					});
					ticking = true;
				}
			}, { passive: true });
		}

		// ── State changes ─────────────────────────────────────────

		_onScrolled() {
			if (this.element.classList.contains('mk-em-is-scrolled')) return;
			this.element.style.height = this.stickyHeight;
			this.element.classList.add('mk-em-is-scrolled');
		}

		_onRestored() {
			if (!this.element.classList.contains('mk-em-is-scrolled')) return;
			this.element.style.height = this.initialHeight;
			this.element.classList.remove('mk-em-is-scrolled');
		}

		// ── Destroy ───────────────────────────────────────────────

		destroy() {
			if (this._attrObserver)   this._attrObserver.disconnect();
			if (this.observer)        this.observer.disconnect();
			if (this._resizeObserver) this._resizeObserver.disconnect();
			if (this.sentinel)        this.sentinel.remove();
			if (this.spacer)          this.spacer.remove();

			this.shrinkTargets.forEach(el => {
				el.classList.remove('mk-em-shrink-target');
				el.style.transition      = '';
				el.style.transformOrigin = '';
			});

			if (this.logoWrapper) {
				const defaultImg  = this.logoWrapper.querySelector('.mk-em-logo-default');
				const scrolledImg = this.logoWrapper.querySelector('.mk-em-logo-scrolled');
				if (defaultImg && scrolledImg) {
					const wrapperParent = this.logoWrapper.parentElement;
					defaultImg.classList.remove('mk-em-logo-default');
					defaultImg.style.transition = '';
					scrolledImg.remove();
					wrapperParent.insertBefore(defaultImg, this.logoWrapper);
					this.logoWrapper.remove();
				}
			}

			this.element.style.position     = '';
			this.element.style.top          = '';
			this.element.style.left         = '';
			this.element.style.width        = '';
			this.element.style.height       = '';
			this.element.style.minHeight    = '';
			this.element.style.zIndex       = '';
			this.element.style.overflow     = '';
			this.element.style.marginTop    = '';
			this.element.style.marginBottom = '';
			this.element.style.transition   = '';
			this.element.classList.remove('mk-em-is-sticky', 'mk-em-is-scrolled');
		}
	}

	// ─────────────────────────────────────────────────────────────
	// Bootstrap
	// ─────────────────────────────────────────────────────────────

	function initContainer(container, isEditor) {
		if (container.__mkEmInit) return;

		// Use the documented Elementor utility to get settings.
		// This correctly handles defaults that might be missing from data-settings.
		let settings = {};
		if (isEditor && window.elementorFrontend && elementorFrontend.utils && elementorFrontend.utils.controls) {
			settings = elementorFrontend.utils.controls.getElementSettings(container);
		} else {
			try {
				settings = JSON.parse(container.dataset.settings || '{}');
			} catch (e) {
				return;
			}
		}

		if (settings.mk_em_sticky_enable !== 'yes') return;

		container.__mkEmInit    = true;
		container.__mkEmHandler = new StickyHeaderHandler(container, settings, isEditor);

		container.addEventListener('elementor/destroyed', function() {
			if (container.__mkEmHandler) {
				container.__mkEmHandler.destroy();
				container.__mkEmInit = false;
			}
		});
	}

	// Use the documented Elementor pattern:
	//   $(window).on('elementor/frontend/init', ...)
	// This fires after elementorFrontend is fully initialised — isEditMode() is
	// reliable here.  Then register frontend/element_ready/global which fires for
	// every element on both the frontend AND in the editor preview on each render.

	$(window).on('elementor/frontend/init', function() {
		var isEditor = elementorFrontend.isEditMode();

		elementorFrontend.hooks.addAction('frontend/element_ready/global', function($scope) {
			var el = $scope[0];
			if (!el.classList.contains('e-con')) return;
			initContainer(el, isEditor);
		});
	});

})(jQuery);
