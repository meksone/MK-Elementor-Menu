<?php
/**
 * GitHub Self-Updater
 *
 * Hooks into the WordPress update system so that new releases published on
 * GitHub appear in the dashboard exactly like official plugin updates.
 * Configure MK_EM_GITHUB_USER and MK_EM_GITHUB_REPO at the top of the main plugin file.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class MK_EM_Updater {

	private $plugin_file;
	private $plugin_dir;
	private $github_user;
	private $github_repo;
	private $current_version;
	private $cache_key = 'mk_em_gh_release_cache';
	private $assets_url;

	public function __construct() {
		$this->plugin_file     = MK_EM_PLUGIN_SLUG;
		$this->plugin_dir      = dirname( MK_EM_PLUGIN_SLUG );
		$this->github_user     = MK_EM_GITHUB_USER;
		$this->github_repo     = MK_EM_GITHUB_REPO;
		$this->current_version = MK_EM_VERSION;
		$this->assets_url      = "https://raw.githubusercontent.com/{$this->github_user}/{$this->github_repo}/main/assets/";

		add_filter( 'pre_set_site_transient_update_plugins', array( $this, 'check_for_update' ) );
		add_filter( 'plugins_api',                           array( $this, 'plugin_info' ), 10, 3 );
		add_filter( 'upgrader_source_selection',             array( $this, 'fix_source_dir' ), 10, 4 );
		add_action( 'upgrader_process_complete',             array( $this, 'clear_cache' ), 10, 2 );
		add_filter( 'plugin_action_links_' . $this->plugin_file, array( $this, 'action_links' ) );
	}

	/**
	 * Fetch the latest release from the GitHub API, with a 12-hour transient cache.
	 */
	private function fetch_release() {
		$cached = get_transient( $this->cache_key );
		if ( false !== $cached ) return $cached;

		$url      = "https://api.github.com/repos/{$this->github_user}/{$this->github_repo}/releases/latest";
		$response = wp_remote_get( $url, array(
			'timeout'    => 10,
			'user-agent' => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . home_url(),
		) );

		if ( is_wp_error( $response ) || (int) wp_remote_retrieve_response_code( $response ) !== 200 ) {
			return false;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( empty( $data['tag_name'] ) ) return false;

		set_transient( $this->cache_key, $data, 12 * HOUR_IN_SECONDS );
		return $data;
	}

	/**
	 * Return the best available download URL.
	 * Prefers the canonical asset ZIP attached by GitHub Actions;
	 * falls back to the GitHub auto-archive URL.
	 */
	private function get_download_url( array $release ) {
		if ( ! empty( $release['assets'] ) ) {
			foreach ( $release['assets'] as $asset ) {
				if ( ( $asset['name'] ?? '' ) === $this->plugin_dir . '.zip' ) {
					return $asset['browser_download_url'];
				}
			}
		}
		$tag = $release['tag_name'];
		return "https://github.com/{$this->github_user}/{$this->github_repo}/archive/refs/tags/{$tag}.zip";
	}

	/**
	 * Fetch CHANGELOG.html from GitHub raw for a specific tag.
	 * Cached per-tag; falls back to empty string on failure.
	 */
	private function fetch_changelog( string $tag ): string {
		$cache_key = 'mk_em_gh_changelog_' . sanitize_key( $tag );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) return $cached;

		$url      = "https://raw.githubusercontent.com/{$this->github_user}/{$this->github_repo}/{$tag}/CHANGELOG.html";
		$response = wp_remote_get( $url, array(
			'timeout'    => 10,
			'user-agent' => 'WordPress/' . get_bloginfo( 'version' ) . '; ' . home_url(),
		) );

		if ( is_wp_error( $response ) || (int) wp_remote_retrieve_response_code( $response ) !== 200 ) {
			return '';
		}

		$html = wp_remote_retrieve_body( $response );
		set_transient( $cache_key, $html, 12 * HOUR_IN_SECONDS );
		return $html;
	}

	/**
	 * Inject an update object into the WordPress plugins update transient
	 * when a newer version is available on GitHub.
	 */
	public function check_for_update( $transient ) {
		if ( empty( $transient->checked ) ) return $transient;

		$release = $this->fetch_release();
		if ( ! $release ) return $transient;

		$remote_version = ltrim( $release['tag_name'], 'v' );

		if ( version_compare( $this->current_version, $remote_version, '<' ) ) {
			$transient->response[ $this->plugin_file ] = (object) array(
				'id'            => "github.com/{$this->github_user}/{$this->github_repo}",
				'slug'          => $this->plugin_dir,
				'plugin'        => $this->plugin_file,
				'new_version'   => $remote_version,
				'url'           => "https://github.com/{$this->github_user}/{$this->github_repo}",
				'package'       => $this->get_download_url( $release ),
				'icons'         => array(
					'1x' => $this->assets_url . 'icon-128x128.png',
					'2x' => $this->assets_url . 'icon-256x256.png',
				),
				'banners'       => array(
					'low'  => $this->assets_url . 'banner-772x250.png',
					'high' => $this->assets_url . 'banner-1544x500.png',
				),
				'banners_rtl'   => array(),
				'tested'        => '',
				'requires_php'  => '7.4',
				'compatibility' => new stdClass(),
			);
		}

		return $transient;
	}

	/**
	 * Return plugin metadata for the "View version details" popup.
	 */
	public function plugin_info( $result, $action, $args ) {
		if ( 'plugin_information' !== $action ) return $result;
		if ( ( $args->slug ?? '' ) !== $this->plugin_dir ) return $result;

		$release = $this->fetch_release();
		if ( ! $release ) return $result;

		$remote_version = ltrim( $release['tag_name'], 'v' );
		$zip_url        = $this->get_download_url( $release );

		return (object) array(
			'name'          => 'MK Elementor Menu',
			'slug'          => $this->plugin_dir,
			'version'       => $remote_version,
			'author'        => '<a href="https://github.com/' . esc_attr( $this->github_user ) . '">'
			                   . esc_html( $this->github_user ) . '</a>',
			'homepage'      => "https://github.com/{$this->github_user}/{$this->github_repo}",
			'download_link' => $zip_url,
			'trunk'         => $zip_url,
			'last_updated'  => $release['published_at'] ?? '',
			'requires'      => '6.0',
			'requires_php'  => '7.4',
			'tested'        => get_bloginfo( 'version' ),
			'icons'         => array(
				'1x' => $this->assets_url . 'icon-128x128.png',
				'2x' => $this->assets_url . 'icon-256x256.png',
			),
			'banners'       => array(
				'low'  => $this->assets_url . 'banner-772x250.png',
				'high' => $this->assets_url . 'banner-1544x500.png',
			),
			'sections'      => array(
				'description' => '
<p><strong>MK Elementor Menu</strong> is a private WordPress plugin that extends the Elementor Container element with a Sticky Header feature.</p>
<h4>Features</h4>
<ul>
	<li><strong>Sticky Header</strong> — Makes any Elementor Container stick to the top of the page with configurable scroll threshold.</li>
	<li><strong>Shrink on Scroll</strong> — Reduces container height and padding after scrolling past the threshold, with smooth CSS transitions.</li>
	<li><strong>Logo Swap</strong> — Swap to an alternate logo when scrolled, with three animation presets: Fade, Shrink, and Fade + Shrink.</li>
	<li><strong>Background &amp; Shadow</strong> — Set a background color and optional box shadow for the scrolled state.</li>
	<li><strong>No jQuery</strong> — Vanilla JavaScript with IntersectionObserver for performant scroll detection.</li>
	<li><strong>Elementor Free compatible</strong> — No Elementor Pro required.</li>
	<li><strong>Self-updating</strong> — GitHub Releases-based auto-update integrated into the standard WordPress update flow.</li>
</ul>
<h4>Requirements</h4>
<ul>
	<li>PHP 7.4+</li>
	<li>WordPress 6.0+</li>
	<li>Elementor 3.0+</li>
</ul>',
				'changelog'   => $this->fetch_changelog( $release['tag_name'] ),
			),
		);
	}

	/**
	 * Add a "View details" link to the plugin row on the Plugins screen.
	 */
	public function action_links( $links ) {
		$url = add_query_arg( array(
			'tab'       => 'plugin-information',
			'plugin'    => $this->plugin_dir,
			'TB_iframe' => 'true',
			'width'     => '772',
			'height'    => '604',
		), admin_url( 'plugin-install.php' ) );

		$details = '<a href="' . esc_url( $url ) . '" class="thickbox open-plugin-details-modal" data-title="MK Elementor Menu">'
		         . __( 'View details' )
		         . '</a>';

		array_unshift( $links, $details );
		return $links;
	}

	/**
	 * After WordPress extracts the GitHub ZIP, rename the folder to match
	 * the expected plugin directory name (mk-elementor-menu/).
	 */
	public function fix_source_dir( $source, $remote_source, $_upgrader, $_hook_extra = array() ) {
		global $wp_filesystem;

		$main_file = trailingslashit( $source ) . basename( $this->plugin_file );
		if ( ! $wp_filesystem->exists( $main_file ) ) {
			return $source;
		}

		$corrected = trailingslashit( $remote_source ) . $this->plugin_dir . '/';

		if ( trailingslashit( $source ) === $corrected ) {
			return $source;
		}

		if ( $wp_filesystem->is_dir( $corrected ) ) {
			$wp_filesystem->delete( $corrected, true );
		}

		if ( ! $wp_filesystem->move( $source, $corrected ) ) {
			return new WP_Error(
				'mk_em_updater_rename_fail',
				'Could not rename extracted plugin directory to ' . $this->plugin_dir . '.'
			);
		}

		return $corrected;
	}

	/** Delete the cached release data after a successful update. */
	public function clear_cache( $upgrader, $hook_extra ) {
		if ( ! empty( $hook_extra['plugin'] ) && $hook_extra['plugin'] === $this->plugin_file ) {
			delete_transient( $this->cache_key );
		}
	}
}
