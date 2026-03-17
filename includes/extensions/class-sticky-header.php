<?php
/**
 * Sticky Header Extension - Extends Elementor Container element
 */

namespace MK_Elementor_Menu\Extensions;

use Elementor\Controls_Manager;
use Elementor\Element_Base;
use Elementor\Group_Control_Background;
use Elementor\Group_Control_Box_Shadow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Sticky_Header {

	const SECTION_ID = 'mk_em_sticky_header_section';

	public function __construct() {
		add_action(
			'elementor/element/container/section_effects/after_section_end',
			[ $this, 'register_controls' ]
		);
	}

	public function register_controls( Element_Base $element ) {
		if ( ! \Elementor\Plugin::$instance->experiments->is_feature_active( 'container' ) ) {
			return;
		}

		$element->start_controls_section(
			self::SECTION_ID,
			[
				'label' => esc_html__( 'Sticky Header', 'mk-elementor-menu' ),
				'tab'   => Controls_Manager::TAB_ADVANCED,
			]
		);

		// ── Enable ───────────────────────────────────────────────
		$element->add_control(
			'mk_em_sticky_enable',
			[
				'label'              => esc_html__( 'Enable Sticky Header', 'mk-elementor-menu' ),
				'type'               => Controls_Manager::SWITCHER,
				'return_value'       => 'yes',
				'default'            => '',
				'render_type'        => 'none',
				'frontend_available' => true,
			]
		);

		// ── Behaviour ────────────────────────────────────────────
		$element->add_control(
			'mk_em_divider_behaviour',
			[
				'type'      => Controls_Manager::DIVIDER,
				'condition' => [ 'mk_em_sticky_enable' => 'yes' ],
			]
		);

		$element->add_control(
			'mk_em_scroll_threshold',
			[
				'label'              => esc_html__( 'Scroll Threshold (px)', 'mk-elementor-menu' ),
				'type'               => Controls_Manager::NUMBER,
				'default'            => 80,
				'min'                => 0,
				'max'                => 500,
				'description'        => esc_html__( 'How many pixels to scroll before shrinking.', 'mk-elementor-menu' ),
				'condition'          => [ 'mk_em_sticky_enable' => 'yes' ],
				'render_type'        => 'none',
				'frontend_available' => true,
			]
		);

		$element->add_control(
			'mk_em_transition_duration',
			[
				'label'              => esc_html__( 'Transition Duration (ms)', 'mk-elementor-menu' ),
				'type'               => Controls_Manager::SLIDER,
				'default'            => [ 'size' => 300 ],
				'range'              => [ 'px' => [ 'min' => 0, 'max' => 1000, 'step' => 50 ] ],
				'condition'          => [ 'mk_em_sticky_enable' => 'yes' ],
				'render_type'        => 'none',
				'frontend_available' => true,
				'selectors'          => [ '{{WRAPPER}}' => '--mk-em-transition-duration: {{SIZE}}ms;' ],
			]
		);

		// ── Height ───────────────────────────────────────────────
		$element->add_control(
			'mk_em_divider_height',
			[
				'type'      => Controls_Manager::DIVIDER,
				'condition' => [ 'mk_em_sticky_enable' => 'yes' ],
			]
		);

		$element->add_control(
			'mk_em_initial_height',
			[
				'label'              => esc_html__( 'Starting Height', 'mk-elementor-menu' ),
				'type'               => Controls_Manager::SLIDER,
				'size_units'         => [ 'px', 'vh' ],
				'default'            => [ 'unit' => 'px', 'size' => 100 ],
				'range'              => [
					'px' => [ 'min' => 40, 'max' => 400 ],
					'vh' => [ 'min' => 5,  'max' => 50  ],
				],
				'description'        => esc_html__( 'Container height before scrolling.', 'mk-elementor-menu' ),
				'condition'          => [ 'mk_em_sticky_enable' => 'yes' ],
				'render_type'        => 'none',
				'frontend_available' => true,
			]
		);

		$element->add_control(
			'mk_em_sticky_height',
			[
				'label'              => esc_html__( 'Sticky Height', 'mk-elementor-menu' ),
				'type'               => Controls_Manager::SLIDER,
				'size_units'         => [ 'px', 'vh' ],
				'default'            => [ 'unit' => 'px', 'size' => 60 ],
				'range'              => [
					'px' => [ 'min' => 20, 'max' => 300 ],
					'vh' => [ 'min' => 3,  'max' => 30  ],
				],
				'description'        => esc_html__( 'Container height after scrolling past the threshold.', 'mk-elementor-menu' ),
				'condition'          => [ 'mk_em_sticky_enable' => 'yes' ],
				'render_type'        => 'none',
				'frontend_available' => true,
			]
		);

		// ── Logo ─────────────────────────────────────────────────
		$element->add_control(
			'mk_em_divider_logo',
			[
				'type'      => Controls_Manager::DIVIDER,
				'condition' => [ 'mk_em_sticky_enable' => 'yes' ],
			]
		);

		$element->add_control(
			'mk_em_logo_selector',
			[
				'label'              => esc_html__( 'Logo CSS Class', 'mk-elementor-menu' ),
				'type'               => Controls_Manager::TEXT,
				'placeholder'        => 'e.g. my-logo',
				'description'        => esc_html__( 'CSS class (without dot) on the logo widget, image widget or container to scale on scroll.', 'mk-elementor-menu' ),
				'condition'          => [ 'mk_em_sticky_enable' => 'yes' ],
				'render_type'        => 'none',
				'frontend_available' => true,
			]
		);

		$element->add_control(
			'mk_em_logo_scale',
			[
				'label'     => esc_html__( 'Logo Scale (scrolled)', 'mk-elementor-menu' ),
				'type'      => Controls_Manager::SLIDER,
				'default'   => [ 'size' => 0.75 ],
				'range'     => [ 'px' => [ 'min' => 0.3, 'max' => 1, 'step' => 0.05 ] ],
				'condition' => [ 'mk_em_sticky_enable' => 'yes' ],
				'selectors' => [ '{{WRAPPER}}' => '--mk-em-logo-scale: {{SIZE}};' ],
			]
		);

		$element->add_control(
			'mk_em_scrolled_logo',
			[
				'label'              => esc_html__( 'Alternate Logo (scrolled)', 'mk-elementor-menu' ),
				'type'               => Controls_Manager::MEDIA,
				'default'            => [ 'url' => '' ],
				'description'        => esc_html__( 'Optional: swap to a different logo when scrolled.', 'mk-elementor-menu' ),
				'condition'          => [ 'mk_em_sticky_enable' => 'yes' ],
				'render_type'        => 'none',
				'frontend_available' => true,
			]
		);

		$element->add_control(
			'mk_em_scrolled_logo_width',
			[
				'label'      => esc_html__( 'Scrolled Logo Width', 'mk-elementor-menu' ),
				'type'       => Controls_Manager::SLIDER,
				'size_units' => [ 'px', '%' ],
				'default'    => [ 'unit' => '%', 'size' => 100 ],
				'range'      => [
					'px' => [ 'min' => 10, 'max' => 500 ],
					'%'  => [ 'min' => 10, 'max' => 100 ],
				],
				'condition'  => [
					'mk_em_sticky_enable'  => 'yes',
					'mk_em_scrolled_logo!' => '',
				],
				'selectors'  => [ '{{WRAPPER}}' => '--mk-em-scrolled-logo-width: {{SIZE}}{{UNIT}};' ],
			]
		);

		$element->add_control(
			'mk_em_scrolled_logo_fit',
			[
				'label'              => esc_html__( 'Scrolled Logo Fit', 'mk-elementor-menu' ),
				'type'               => Controls_Manager::SELECT,
				'options'            => [
					'contain'    => esc_html__( 'Contain', 'mk-elementor-menu' ),
					'cover'      => esc_html__( 'Cover', 'mk-elementor-menu' ),
					'fill'       => esc_html__( 'Fill', 'mk-elementor-menu' ),
					'scale-down' => esc_html__( 'Scale Down', 'mk-elementor-menu' ),
					'none'       => esc_html__( 'None (natural size)', 'mk-elementor-menu' ),
				],
				'default'            => 'contain',
				'condition'          => [
					'mk_em_sticky_enable'  => 'yes',
					'mk_em_scrolled_logo!' => '',
				],
				'render_type'        => 'none',
				'frontend_available' => true,
			]
		);

		$element->add_control(
			'mk_em_scrolled_logo_position',
			[
				'label'              => esc_html__( 'Scrolled Logo Position', 'mk-elementor-menu' ),
				'type'               => Controls_Manager::SELECT,
				'options'            => [
					'left top'      => esc_html__( 'Left Top', 'mk-elementor-menu' ),
					'left center'   => esc_html__( 'Left Center', 'mk-elementor-menu' ),
					'left bottom'   => esc_html__( 'Left Bottom', 'mk-elementor-menu' ),
					'center top'    => esc_html__( 'Center Top', 'mk-elementor-menu' ),
					'center center' => esc_html__( 'Center Center', 'mk-elementor-menu' ),
					'center bottom' => esc_html__( 'Center Bottom', 'mk-elementor-menu' ),
					'right top'     => esc_html__( 'Right Top', 'mk-elementor-menu' ),
					'right center'  => esc_html__( 'Right Center', 'mk-elementor-menu' ),
					'right bottom'  => esc_html__( 'Right Bottom', 'mk-elementor-menu' ),
				],
				'default'            => 'left center',
				'condition'          => [
					'mk_em_sticky_enable'  => 'yes',
					'mk_em_scrolled_logo!' => '',
				],
				'render_type'        => 'none',
				'frontend_available' => true,
			]
		);

		$element->add_control(
			'mk_em_logo_animation',
			[
				'label'              => esc_html__( 'Logo Swap Animation', 'mk-elementor-menu' ),
				'type'               => Controls_Manager::SELECT,
				'options'            => [
					'fade'        => esc_html__( 'Fade', 'mk-elementor-menu' ),
					'shrink'      => esc_html__( 'Shrink', 'mk-elementor-menu' ),
					'fade-shrink' => esc_html__( 'Fade + Shrink', 'mk-elementor-menu' ),
				],
				'default'            => 'fade',
				'condition'          => [
					'mk_em_sticky_enable'  => 'yes',
					'mk_em_scrolled_logo!' => '',
				],
				'render_type'        => 'none',
				'frontend_available' => true,
			]
		);

		// ── Appearance ───────────────────────────────────────────
		$element->add_control(
			'mk_em_divider_appearance',
			[
				'type'      => Controls_Manager::DIVIDER,
				'condition' => [ 'mk_em_sticky_enable' => 'yes' ],
			]
		);

		$element->add_group_control(
			Group_Control_Background::get_type(),
			[
				'name'      => 'mk_em_scrolled_bg',
				'label'     => esc_html__( 'Background (scrolled)', 'mk-elementor-menu' ),
				'types'     => [ 'classic', 'gradient' ],
				'selector'  => '{{WRAPPER}}.mk-em-is-scrolled',
				'condition' => [ 'mk_em_sticky_enable' => 'yes' ],
			]
		);

		$element->add_group_control(
			Group_Control_Box_Shadow::get_type(),
			[
				'name'      => 'mk_em_scrolled_shadow',
				'label'     => esc_html__( 'Box Shadow (scrolled)', 'mk-elementor-menu' ),
				'selector'  => '{{WRAPPER}}.mk-em-is-scrolled',
				'condition' => [ 'mk_em_sticky_enable' => 'yes' ],
			]
		);

		$element->add_control(
			'mk_em_z_index',
			[
				'label'              => esc_html__( 'Z-Index', 'mk-elementor-menu' ),
				'type'               => Controls_Manager::NUMBER,
				'default'            => 999,
				'condition'          => [ 'mk_em_sticky_enable' => 'yes' ],
				'render_type'        => 'none',
				'frontend_available' => true,
			]
		);

		// ── Editor Preview ────────────────────────────────────────
		$element->add_control(
			'mk_em_divider_preview',
			[
				'type'      => Controls_Manager::DIVIDER,
				'condition' => [ 'mk_em_sticky_enable' => 'yes' ],
			]
		);

		$element->add_control(
			'mk_em_preview_scrolled',
			[
				'label'              => esc_html__( 'Preview Scrolled State', 'mk-elementor-menu' ),
				'description'        => esc_html__( 'Toggle on to preview background, shadow, and logo swap as they appear after scrolling. Turn off before publishing.', 'mk-elementor-menu' ),
				'type'               => Controls_Manager::SWITCHER,
				'return_value'       => 'yes',
				'default'            => '',
				'condition'          => [ 'mk_em_sticky_enable' => 'yes' ],
				'render_type'        => 'template',
				'frontend_available' => true,
			]
		);

		$element->end_controls_section();
	}
}
