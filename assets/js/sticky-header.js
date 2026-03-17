/**
 * Sticky Header Handler - vanilla JS, no jQuery
 * v0.1.8
 */
(function() {
	'use strict';

	class StickyHeaderHandler {
		constructor(element, settings) {
			this.element        = element;
			this.settings       = settings;
			this.observer       = null;
			this.sentinel       = null;
			this.logoWrapper    = null;
			this.spacer         = null;
			this.shrinkTargets  = [];
			this.initialHeight  = null;
			this.stickyHeight   = null;
			// Reliable editor detection: depends on elementor-frontend script (declared as dep)
			this._isEditor      = !!(window.elementorFrontend && elementorFrontend.isEditMode && elementorFrontend.isEditMode());
			this.init();
		}

		// ── Helpers ───────────────────────────────────────────────

		_parseSlideSetting(setting) {
			if (!setting || !setting.size) return null;
			return setting.size + (setting.unit || 'px');
		}

		// ── Init ──────────────────────────────────────────────────

		init() {
			// Resolve heights
			this.initialHeight = this._parseSlideSetting(this.settings.mk_em_initial_height)
				|| (Math.max(this.element.offsetHeight, 80) + 'px');
			this.stickyHeight  = this._parseSlideSetting(this.settings.mk_em_sticky_height) || '60px';

			// Resolve transition duration
			const dur = (this.settings.mk_em_transition_duration && this.settings.mk_em_transition_duration.size != null)
				? this.settings.mk_em_transition_duration.size
				: 300;
			this._transitionDur = dur;

			if (this._isEditor) {
				// ── Editor mode ────────────────────────────────────
				// Preview switch OFF: leave the container as-is (user sees normal layout).
				// Preview switch ON:  show the scrolled state as a static snapshot so
				//                     the user can inspect background, shadow, logo swap.
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
				// No scroll listeners or fixed positioning in editor.
				return;
			}

			// ── Frontend mode ──────────────────────────────────────
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
				const selector = selectorRaw.startsWith('.') ? selectorRaw : '.' + selectorRaw;
				targets = Array.from(this.element.querySelectorAll(selector));
			}

			if (!targets.length) {
				const fallback = this.element.querySelector('.elementor-widget-image');
				if (fallback) targets = [fallback];
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
			const imageWidget = this.element.querySelector('.elementor-widget-image');
			if (!imageWidget) return;

			const defaultImg = imageWidget.querySelector('img');
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

			// Always apply object-fit / object-position with fallback defaults.
			// Elementor skips serialising frontend_available values that equal the
			// control default, so we cannot rely on the setting being present.
			scrolledImg.style.objectFit      = this.settings.mk_em_scrolled_logo_fit      || 'contain';
			scrolledImg.style.objectPosition = this.settings.mk_em_scrolled_logo_position || 'left center';

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
			if (this.observer) this.observer.disconnect();
			if (this._resizeObserver) this._resizeObserver.disconnect();
			if (this.sentinel) this.sentinel.remove();
			if (this.spacer) this.spacer.remove();

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

	// ── Bootstrap ─────────────────────────────────────────────────

	function initContainer(container) {
		if (container.__mkEmInit) return;

		let settings = {};
		try {
			settings = JSON.parse(container.dataset.settings || '{}');
		} catch (e) {
			return;
		}

		if (settings.mk_em_sticky_enable !== 'yes') return;

		container.__mkEmInit    = true;
		container.__mkEmHandler = new StickyHeaderHandler(container, settings);

		container.addEventListener('elementor/destroyed', function() {
			if (container.__mkEmHandler) {
				container.__mkEmHandler.destroy();
				container.__mkEmInit = false;
			}
		});
	}

	function initStickyHeaders() {
		document.querySelectorAll('.e-con[data-settings]').forEach(initContainer);
	}

	// Initial scan
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initStickyHeaders);
	} else {
		initStickyHeaders();
	}
	window.addEventListener('load', initStickyHeaders);

	// Watch for containers added/replaced by Elementor editor re-renders
	if (typeof MutationObserver !== 'undefined') {
		const domObserver = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				mutation.addedNodes.forEach(function(node) {
					if (node.nodeType !== 1) return;
					if (node.matches && node.matches('.e-con[data-settings]')) {
						initContainer(node);
					}
					if (node.querySelectorAll) {
						node.querySelectorAll('.e-con[data-settings]').forEach(initContainer);
					}
				});
			});
		});

		if (document.body) {
			domObserver.observe(document.body, { childList: true, subtree: true });
		} else {
			document.addEventListener('DOMContentLoaded', function() {
				domObserver.observe(document.body, { childList: true, subtree: true });
			});
		}
	}

})();
