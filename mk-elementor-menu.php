<?php
/**
 * Plugin Name: MK Elementor Menu
 * Version: 0.1.9
 * Description: Extends Elementor Container with a Sticky Header feature with customizable logo animations
 * Author: MK
 * Text Domain: mk-elementor-menu
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Elementor requires at least: 3.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

// Define constants
define( 'MK_EM_VERSION',     '0.1.9' );
define( 'MK_EM_PATH',        plugin_dir_path( __FILE__ ) );
define( 'MK_EM_URL',         plugin_dir_url( __FILE__ ) );
define( 'MK_EM_PLUGIN_SLUG', 'mk-elementor-menu/mk-elementor-menu.php' );
define( 'MK_EM_GITHUB_USER', 'meksone' );
define( 'MK_EM_GITHUB_REPO', 'MK-Elementor-Menu' );

// GitHub self-updater (admin only)
if ( is_admin() ) {
	require_once plugin_dir_path( __FILE__ ) . 'includes/class-updater.php';
	new MK_EM_Updater();
}

/**
 * Load plugin after Elementor is loaded
 */
add_action( 'plugins_loaded', function() {
	// Guard: Check if Elementor has loaded
	if ( ! did_action( 'elementor/loaded' ) ) {
		add_action( 'admin_notices', function() {
			echo '<div class="notice notice-error"><p>';
			echo esc_html__( 'MK Elementor Menu requires Elementor to be installed and activated.', 'mk-elementor-menu' );
			echo '</p></div>';
		} );
		return;
	}

	// Load the main plugin class
	require_once MK_EM_PATH . 'includes/class-plugin.php';
	\MK_Elementor_Menu\Plugin::instance();
}, 20 );
