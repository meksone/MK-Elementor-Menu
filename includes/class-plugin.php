<?php
/**
 * Main Plugin class
 */

namespace MK_Elementor_Menu;

use MK_Elementor_Menu\Assets_Manager;
use MK_Elementor_Menu\Extensions\Sticky_Header;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Plugin {

	/**
	 * @var Plugin|null
	 */
	private static $instance = null;

	/**
	 * @var Assets_Manager
	 */
	public $assets;

	/**
	 * Get plugin instance
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor
	 */
	private function __construct() {
		$this->includes();
		$this->init_components();
		$this->register_hooks();
	}

	/**
	 * Include required files
	 */
	private function includes() {
		require_once MK_EM_PATH . 'includes/class-assets-manager.php';
		require_once MK_EM_PATH . 'includes/extensions/class-sticky-header.php';
	}

	/**
	 * Initialize components
	 */
	private function init_components() {
		$this->assets = new Assets_Manager();
		new Sticky_Header();
	}

	/**
	 * Register hooks
	 */
	private function register_hooks() {
		// Plugin level hooks can be added here in the future
	}
}
