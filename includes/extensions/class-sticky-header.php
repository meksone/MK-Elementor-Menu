<?php
/**
 * Sticky Header Extension - Extends Elementor Container element
 */

namespace MK_Elementor_Menu\Extensions;

use Elementor\Controls_Manager;
use Elementor\Element_Base;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Sticky_Header {

	const SECTION_ID = 'mk_em_sticky_header_section';

	/**
	 * Constructor
	 */
	public function __construct() {
		// Inject controls into the container's Advanced tab
		add_action(
			'elementor/element/container/section_effects/after_section_end',
			[ $this, 'register_controls' ]
		);
	}

	/**
	 * Register controls
	 */
	public function register_controls( Element_Base $element ) {
		// Guard: Check if Container element exists
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

		// --- Enable Toggle ---
		$element->add_control(
			'mk_em_sticky_enable',
			[
				'label'       => esc_html__( 'Enable Sticky Header', 'mk-elementor-menu' ),
				'type'        => Controls_Manager::SWITCHER,
				'return_value' => 'yes',
				'default'     => '',
				'render_type' => 'none',
				'frontend_available' => true,
			]
		);

		// --- Scroll Threshold ---
		$element->add_control(
			'mk_em_scroll_threshold',
			[
				'label'       => esc_html__( 'Scroll Threshold (px)', 'mk-elementor-menu' ),
				'type'        => Controls_Manager::NUMBER,
				'default'     => 80,
				'min'         => 0,
				'max'         => 500,
				'condition'   => [ 'mk_em_sticky_enable' => 'yes' ],
				'render_type' => 'none',
				'frontend_available' => true,
			]
		);

		// --- Transition Duration ---
		$element->add_control(
			'mk_em_transition_duration',
			[
				'label'       => esc_html__( 'Transition Duration (ms)', 'mk-elementor-menu' ),
				'type'        => Controls_Manager::SLIDER,
				'default'     => [ 'size' => 300 ],
				'range'       => [
					'px' => [
						'min'  => 0,
						'max'  => 1000,
						'step' => 50,
					],
				],
				'condition'   => [ 'mk_em_sticky_enable' => 'yes' ],
				'selectors'   => [
					'{{WRAPPER}}' => '--mk-em-transition-duration: {{SIZE}}ms;',
				],
			]
		);

		// --- Separator ---
		$element->add_control(
			'mk_em_shrink_divider',
			[
				'type'      => Controls_Manager::DIVIDER,
				'condition' => [ 'mk_em_sticky_enable' => 'yes' ],
			]
		);

		// --- Min Height ---
		$element->add_control(
			'mk_em_shrink_min_height',
			[
				'label'       => esc_html__( 'Min Height (scrolled)', 'mk-elementor-menu' ),
				'type'        => Controls_Manager::SLIDER,
				'size_units'  => [ 'px', 'vh' ],
				'default'     => [ 'unit' => 'px', 'size' => 60 ],
				'range'       => [
					'px' => [ 'min' => 20, 'max' => 300 ],
					'vh' => [ 'min' => 5, 'max' => 50 ],
				],
				'condition'   => [ 'mk_em_sticky_enable' => 'yes' ],
				'selectors'   => [
					'{{WRAPPER}}' => '--mk-em-min-height: {{SIZE}}{{UNIT}};',
				],
			]
		);

		// --- Padding Top ---
		$element->add_control(
			'mk_em_shrink_padding_top',
			[
				'label'       => esc_html__( 'Padding Top (scrolled)', 'mk-elementor-menu' ),
				'type'        => Controls_Manager::SLIDER,
				'size_units'  => [ 'px', 'em', 'rem' ],
				'default'     => [ 'unit' => 'px', 'size' => 8 ],
				'range'       => [
					'px'  => [ 'min' => 0, 'max' => 50 ],
					'em'  => [ 'min' => 0, 'max' => 3, 'step' => 0.1 ],
					'rem' => [ 'min' => 0, 'max' => 3, 'step' => 0.1 ],
				],
				'condition'   => [ 'mk_em_sticky_enable' => 'yes' ],
				'selectors'   => [
					'{{WRAPPER}}' => '--mk-em-shrink-padding-top: {{SIZE}}{{UNIT}};',
				],
			]
		);

		// --- Padding Bottom ---
		$element->add_control(
			'mk_em_shrink_padding_bottom',
			[
				'label'       => esc_html__( 'Padding Bottom (scrolled)', 'mk-elementor-menu' ),
				'type'        => Controls_Manager::SLIDER,
				'size_units'  => [ 'px', 'em', 'rem' ],
				'default'     => [ 'unit' => 'px', 'size' => 8 ],
				'range'       => [
					'px'  => [ 'min' => 0, 'max' => 50 ],
					'em'  => [ 'min' => 0, 'max' => 3, 'step' => 0.1 ],
					'rem' => [ 'min' => 0, 'max' => 3, 'step' => 0.1 ],
				],
				'condition'   => [ 'mk_em_sticky_enable' => 'yes' ],
				'selectors'   => [
					'{{WRAPPER}}' => '--mk-em-shrink-padding-bottom: {{SIZE}}{{UNIT}};',
				],
			]
		);

		// --- Logo Scale (fallback when no scrolled logo) ---
		$element->add_control(
			'mk_em_shrink_logo_scale',
			[
				'label'       => esc_html__( 'Logo Scale (scrolled)', 'mk-elementor-menu' ),
				'type'        => Controls_Manager::SLIDER,
				'default'     => [ 'size' => 0.75 ],
				'range'       => [
					'px' => [
						'min'  => 0.3,
						'max'  => 1,
						'step' => 0.05,
					],
				],
				'condition'   => [ 'mk_em_sticky_enable' => 'yes' ],
				'selectors'   => [
					'{{WRAPPER}}' => '--mk-em-logo-scale: {{SIZE}};',
				],
			]
		);

		// --- Separator ---
		$element->add_control(
			'mk_em_logo_divider',
			[
				'type'      => Controls_Manager::DIVIDER,
				'condition' => [ 'mk_em_sticky_enable' => 'yes' ],
			]
		);

		// --- Scrolled Logo Image ---
		$element->add_control(
			'mk_em_scrolled_logo',
			[
				'label'       => esc_html__( 'Scrolled Logo (Alternate)', 'mk-elementor-menu' ),
				'type'        => Controls_Manager::MEDIA,
				'default'     => [ 'url' => '' ],
				'condition'   => [ 'mk_em_sticky_enable' => 'yes' ],
				'render_type' => 'none',
				'frontend_available' => true,
			]
		);

		// --- Logo Animation Type ---
		$element->add_control(
			'mk_em_logo_animation',
			[
				'label'       => esc_html__( 'Logo Animation', 'mk-elementor-menu' ),
				'type'        => Controls_Manager::SELECT,
				'options'     => [
					'fade'        => esc_html__( 'Fade', 'mk-elementor-menu' ),
					'shrink'      => esc_html__( 'Shrink', 'mk-elementor-menu' ),
					'fade-shrink' => esc_html__( 'Fade + Shrink', 'mk-elementor-menu' ),
				],
				'default'     => 'fade',
				'condition'   => [ 'mk_em_sticky_enable' => 'yes' ],
				'render_type' => 'none',
				'frontend_available' => true,
			]
		);

		// --- Separator ---
		$element->add_control(
			'mk_em_bg_divider',
			[
				'type'      => Controls_Manager::DIVIDER,
				'condition' => [ 'mk_em_sticky_enable' => 'yes' ],
			]
		);

		// --- Scrolled Background Color ---
		$element->add_control(
			'mk_em_scrolled_bg_color',
			[
				'label'       => esc_html__( 'Background Color (scrolled)', 'mk-elementor-menu' ),
				'type'        => Controls_Manager::COLOR,
				'default'     => '#ffffff',
				'condition'   => [ 'mk_em_sticky_enable' => 'yes' ],
				'selectors'   => [
					'{{WRAPPER}}' => '--mk-em-scrolled-bg: {{VALUE}};',
				],
			]
		);

		// --- Box Shadow ---
		$element->add_control(
			'mk_em_scrolled_box_shadow',
			[
				'label'       => esc_html__( 'Enable Box Shadow (scrolled)', 'mk-elementor-menu' ),
				'type'        => Controls_Manager::SWITCHER,
				'return_value' => 'yes',
				'default'     => '',
				'condition'   => [ 'mk_em_sticky_enable' => 'yes' ],
				'render_type' => 'none',
				'frontend_available' => true,
			]
		);

		// --- Z-Index ---
		$element->add_control(
			'mk_em_z_index',
			[
				'label'       => esc_html__( 'Z-Index', 'mk-elementor-menu' ),
				'type'        => Controls_Manager::NUMBER,
				'default'     => 999,
				'condition'   => [ 'mk_em_sticky_enable' => 'yes' ],
				'selectors'   => [
					'{{WRAPPER}}' => '--mk-em-z-index: {{VALUE}};',
				],
			]
		);

		$element->end_controls_section();
	}
}
