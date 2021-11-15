<?php
if ( !defined( 'ABSPATH' ) ) { exit; } // Exit if accessed directly.

class Zume_Public_Heatmaps_Metrics_Map_Trainings extends DT_Metrics_Chart_Base
{
    public $base_slug = 'zume-public-heatmaps';
    public $base_title = "Public Maps";

    public $title = 'Trainings Saturation Map';
    public $slug = 'trainings-saturation-map';

    public $permissions = [ 'dt_access_contacts', 'view_project_metrics' ];
    public $magic_link;

    private static $_instance = null;
    public static function instance() {
        if ( is_null( self::$_instance ) ) {
            self::$_instance = new self();
        }
        return self::$_instance;
    }

    public function __construct() {
        $this->magic_link = site_url() . '/zume_app/heatmap_trainings/';
        parent::__construct();

        if ( ! class_exists( 'DT_Training') ) {
            return;
        }

        if ( !$this->has_permission() ){
            return;
        }
        $url_path = dt_get_url_path();

        // only load scripts if exact url
        if ( "metrics/$this->base_slug/$this->slug" === $url_path ) {
            add_action( 'wp_head', [ $this, 'head_script' ] );
        }
    }

    public function head_script() {
        $js_object = [
            'rest_endpoints_base' => esc_url_raw( rest_url() ) . "$this->base_slug/$this->slug",
            'base_slug' => $this->base_slug,
            'slug' => $this->slug,
            'root' => esc_url_raw( rest_url() ),
            'plugin_uri' => plugin_dir_url( __DIR__ ),
            'nonce' => wp_create_nonce( 'wp_rest' ),
            'current_user_login' => wp_get_current_user()->user_login,
            'current_user_id' => get_current_user_id(),
            'magic_link' => $this->magic_link,
            'translations' => [
                "title" => $this->title,
                "copy" => __("Copy Public URL", 'zume-public-heatmap')
            ]
        ];
        ?>
        <script>
            let jsObject = [<?php echo json_encode( $js_object ) ?>][0]
            "use strict";
            jQuery(document).ready(function() {

                jQuery('#metrics-sidemenu').foundation('down', jQuery(`#${jsObject.base_slug}-menu`));

                jQuery('#chart').empty().html(`
                      <div class="grid-x">
                            <div class="cell medium-6"><span class="section-header">${jsObject.translations.title}</span></div>
                            <div class="cell medium-6"><button class="button tiny copy_to_clipboard" style="float:right;" data-value="${jsObject.magic_link}">${jsObject.translations.copy}</button></div>
                        </div>
                      <hr style="max-width:100%;">
                      <div id="heatmap"></div>
                    `)

                /**
                 * use the class .copy_to_clipboard to copy the contents of data-value="" to the clipboard.
                 */
                jQuery('.copy_to_clipboard').on('click', function(){
                    let str = jQuery(this).data('value')
                    const el = document.createElement('textarea');
                    el.value = str;
                    el.setAttribute('readonly', '');
                    el.style.position = 'absolute';
                    el.style.left = '-9999px';
                    document.body.appendChild(el);
                    const selected =
                        document.getSelection().rangeCount > 0
                            ? document.getSelection().getRangeAt(0)
                            : false;
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    if (selected) {
                        document.getSelection().removeAllRanges();
                        document.getSelection().addRange(selected);
                    }
                    alert('Copied')
                })

                jQuery('#heatmap').html(`<iframe width="100%" height="${window.innerHeight - 190}" src="${jsObject.magic_link}" style="border:0" allowfullscreen=""></iframe>`)

            })
        </script>
        <?php
    }
}
Zume_Public_Heatmaps_Metrics_Map_Trainings::instance();
