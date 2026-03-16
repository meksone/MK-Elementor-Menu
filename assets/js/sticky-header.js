/**
 * Sticky Header Handler - vanilla JS, no jQuery
 */
(function() {
	'use strict';

	if (typeof elementorFrontend === 'undefined') {
		return;
	}

	/**
	 * StickyHeaderHandler class
	 */
	class StickyHeaderHandler {
		constructor(element, settings) {
			this.element = element;
			this.settings = settings;
			this.observer = null;
			this.sentinel = null;
			this.logoWrapper = null;
			this.init();
		}

		/**
		 * Initialize the handler
		 */
		init() {
			// Add sticky class to activate position: sticky
			this.element.classList.add('mk-em-is-sticky');

			// Setup logo swap if scrolled logo is configured
			if (this.settings.mk_em_scrolled_logo && this.settings.mk_em_scrolled_logo.url) {
				this._setupLogoSwap();
			}

			// Create sentinel element for IntersectionObserver
			this._createSentinel();

			// Setup IntersectionObserver
			this._bindScrollObserver();
		}

		/**
		 * Setup logo swap with animation
		 */
		_setupLogoSwap() {
			// Find the first image widget inside the container
			const imageWidget = this.element.querySelector('.elementor-widget-image');
			if (!imageWidget) {
				return;
			}

			const defaultImg = imageWidget.querySelector('img');
			if (!defaultImg) {
				return;
			}

			// Store original parent for restoration
			const originalParent = defaultImg.parentElement;

			// Create wrapper span
			this.logoWrapper = document.createElement('span');
			this.logoWrapper.className = 'mk-em-logo-wrapper';

			// Add animation class
			const animationType = this.settings.mk_em_logo_animation || 'fade';
			this.logoWrapper.classList.add('mk-em-logo-anim-' + animationType);

			// Add classes to default image
			defaultImg.classList.add('mk-em-logo-default');

			// Create scrolled logo image
			const scrolledImg = document.createElement('img');
			scrolledImg.src = this.settings.mk_em_scrolled_logo.url;
			scrolledImg.alt = defaultImg.alt;
			scrolledImg.className = 'mk-em-logo-scrolled';
			scrolledImg.setAttribute('aria-hidden', 'true');

			// Wrap both images
			originalParent.insertBefore(this.logoWrapper, defaultImg);
			this.logoWrapper.appendChild(defaultImg);
			this.logoWrapper.appendChild(scrolledImg);
		}

		/**
		 * Create sentinel element for scroll detection
		 */
		_createSentinel() {
			const threshold = parseInt(this.settings.mk_em_scroll_threshold) || 80;

			this.sentinel = document.createElement('div');
			this.sentinel.style.cssText = `
				position: absolute;
				top: ${threshold}px;
				height: 1px;
				width: 1px;
				pointer-events: none;
				opacity: 0;
			`;
			this.sentinel.setAttribute('aria-hidden', 'true');
			this.sentinel.className = 'mk-em-sentinel';

			document.body.prepend(this.sentinel);
		}

		/**
		 * Bind scroll observer
		 */
		_bindScrollObserver() {
			if (typeof IntersectionObserver !== 'undefined') {
				// Use IntersectionObserver (preferred, performant)
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
				// Fallback: use scroll event with passive listener
				this._bindScrollEventFallback();
			}
		}

		/**
		 * Fallback scroll event listener for older browsers
		 */
		_bindScrollEventFallback() {
			const threshold = parseInt(this.settings.mk_em_scroll_threshold) || 80;
			let scrolling = false;

			const handleScroll = () => {
				scrolling = true;
			};

			const updateScroll = () => {
				if (!scrolling) {
					return;
				}

				const scrollY = window.scrollY || window.pageYOffset;
				if (scrollY > threshold) {
					this._onScrolled();
				} else {
					this._onRestored();
				}

				scrolling = false;
				requestAnimationFrame(updateScroll);
			};

			window.addEventListener('scroll', handleScroll, { passive: true });
			requestAnimationFrame(updateScroll);
		}

		/**
		 * Handle scroll event - scrolled past threshold
		 */
		_onScrolled() {
			if (this.element.classList.contains('mk-em-is-scrolled')) {
				return; // Already in scrolled state
			}

			this.element.classList.add('mk-em-is-scrolled');

			// Add shadow class if enabled
			if (this.settings.mk_em_scrolled_box_shadow === 'yes') {
				this.element.classList.add('mk-em-has-shadow');
			}
		}

		/**
		 * Handle scroll event - restored to original position
		 */
		_onRestored() {
			if (!this.element.classList.contains('mk-em-is-scrolled')) {
				return; // Already in restored state
			}

			this.element.classList.remove('mk-em-is-scrolled');
			this.element.classList.remove('mk-em-has-shadow');
		}

		/**
		 * Destroy handler (cleanup for editor live reload)
		 */
		destroy() {
			// Disconnect observer
			if (this.observer) {
				this.observer.disconnect();
			}

			// Remove sentinel
			if (this.sentinel) {
				this.sentinel.remove();
			}

			// Restore logo to original state (unwrap)
			if (this.logoWrapper) {
				const defaultImg = this.logoWrapper.querySelector('.mk-em-logo-default');
				const scrolledImg = this.logoWrapper.querySelector('.mk-em-logo-scrolled');

				if (defaultImg && scrolledImg) {
					// Get the parent of the wrapper
					const wrapperParent = this.logoWrapper.parentElement;

					// Remove classes from default img
					defaultImg.classList.remove('mk-em-logo-default');

					// Remove scrolled img
					scrolledImg.remove();

					// Unwrap - move default img back to parent
					wrapperParent.insertBefore(defaultImg, this.logoWrapper);
					this.logoWrapper.remove();
				}
			}

			// Remove sticky class
			this.element.classList.remove('mk-em-is-sticky');
			this.element.classList.remove('mk-em-is-scrolled');
			this.element.classList.remove('mk-em-has-shadow');
		}
	}

	/**
	 * Register handler with Elementor frontend
	 */
	elementorFrontend.hooks.addAction(
		'frontend/element_ready/container',
		function($scope) {
			const element = $scope[0] || $scope;

			// Skip if not a container element
			if (!element || !element.classList.contains('e-con')) {
				return;
			}

			// Get settings from data-settings attribute
			let settings = {};
			if (element.dataset.settings) {
				try {
					settings = JSON.parse(element.dataset.settings);
				} catch (e) {
					console.error('Failed to parse element settings:', e);
					return;
				}
			}

			// Bail if sticky is not enabled
			if (settings.mk_em_sticky_enable !== 'yes') {
				return;
			}

			// Create handler instance
			const handler = new StickyHeaderHandler(element, settings);

			// Store handler on element for cleanup
			if (!element.__mkEmHandlers) {
				element.__mkEmHandlers = [];
			}
			element.__mkEmHandlers.push(handler);

			// Expose destroy method on element for editor cleanup
			const originalDestroy = element.__mkEmDestroy || (() => {});
			element.__mkEmDestroy = function() {
				originalDestroy.call(this);
				if (element.__mkEmHandlers && element.__mkEmHandlers.length) {
					element.__mkEmHandlers.forEach((h) => h.destroy());
					element.__mkEmHandlers = [];
				}
			};

			// Listen for element destroy event (editor cleanup)
			element.addEventListener('elementor/destroyed', () => {
				if (element.__mkEmDestroy) {
					element.__mkEmDestroy();
				}
			});
		}
	);
})();
