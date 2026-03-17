<?php
/**
 * Assets Manager - handles script and style registration
 */

namespace MK_Elementor_Menu;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Assets_Manager {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'elementor/frontend/after_register_scripts', [ $this, 'register_scripts' ] );
		add_action( 'elementor/frontend/after_register_styles', [ $this, 'register_styles' ] );
		add_action( 'elementor/preview/enqueue_scripts', [ $this, 'enqueue_scripts' ] );
		add_action( 'elementor/preview/enqueue_styles', [ $this, 'enqueue_styles' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'maybe_enqueue_frontend_assets' ] );
	}

	/**
	 * Register scripts
	 */
	public function register_scripts() {
		wp_register_script(
			'mk-em-sticky-header',
			MK_EM_URL . 'assets/js/sticky-header.js',
			array( 'elementor-frontend' ),
			MK_EM_VERSION,
			true
		);
	}

	/**
	 * Register styles
	 */
	public function register_styles() {
		wp_register_style(
			'mk-em-sticky-header',
			MK_EM_URL . 'assets/css/sticky-header.css',
			array(),
			MK_EM_VERSION
		);
	}

	/**
	 * Enqueue scripts (in editor)
	 */
	public function enqueue_scripts() {
		wp_enqueue_script( 'mk-em-sticky-header' );
	}

	/**
	 * Enqueue styles (in editor)
	 */
	public function enqueue_styles() {
		wp_enqueue_style( 'mk-em-sticky-header' );
	}

	/**
	 * Maybe enqueue frontend assets (on Elementor pages)
	 */
	public function maybe_enqueue_frontend_assets() {
		if ( ! is_singular() ) {
			return;
		}

		// Check if the current page is built with Elementor
		if ( ! \Elementor\Plugin::$instance->db->is_built_with_elementor( get_the_ID() ) ) {
			return;
		}

		wp_enqueue_script( 'mk-em-sticky-header' );
		wp_enqueue_style( 'mk-em-sticky-header' );
	}
}
