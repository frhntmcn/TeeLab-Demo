<?php
// Standalone regression checks for the bridge's REST input limits.
define( 'ABSPATH', __DIR__ );
define( 'HOUR_IN_SECONDS', 3600 );
define( 'OBJECT', 'OBJECT' );

$transients = array();
$saved_designs = array();
$product_lookups = 0;
$meta_writes = 0;

function add_action() {}
function add_filter() {}
function nocache_headers() {}
function rest_ensure_response( $value ) { return $value; }
function sanitize_text_field( $value ) { return trim( $value ); }
function sanitize_email( $value ) { return filter_var( $value, FILTER_SANITIZE_EMAIL ); }
function is_email( $value ) { return false !== filter_var( $value, FILTER_VALIDATE_EMAIL ); }
function email_exists() { return true; }
function get_transient( $key ) { global $transients; return isset( $transients[ $key ] ) ? $transients[ $key ] : false; }
function set_transient( $key, $value ) { global $transients; $transients[ $key ] = $value; }
function get_current_user_id() { return 7; }
function get_user_meta() { global $saved_designs; return $saved_designs; }
function update_user_meta( $user_id, $key, $value ) { global $saved_designs, $meta_writes; $saved_designs = $value; ++$meta_writes; }
function wp_json_encode( $value ) { return json_encode( $value ); }
function wp_generate_uuid4() { return 'test-uuid'; }
function get_page_by_path() { global $product_lookups; ++$product_lookups; return (object) array( 'ID' => 1 ); }
function sanitize_title( $value ) { return strtolower( $value ); }
function absint( $value ) { return abs( (int) $value ); }
function wc_get_product() { return new Test_Product(); }
function wc_get_price_to_display() { return 12.5; }
function get_woocommerce_currency() { return 'TRY'; }

class WP_Error {
	public $code;
	public $data;
	public function __construct( $code, $message, $data ) { $this->code = $code; $this->data = $data; }
}
function is_wp_error( $value ) { return $value instanceof WP_Error; }

class WP_REST_Request {
	private $params;
	private $body;
	public function __construct( $params, $body = '' ) { $this->params = $params; $this->body = $body; }
	public function get_param( $key ) { return isset( $this->params[ $key ] ) ? $this->params[ $key ] : null; }
	public function get_body() { return $this->body; }
}

class Test_Product {
	public function is_type() { return false; }
	public function is_purchasable() { return true; }
	public function is_in_stock() { return true; }
	public function has_enough_stock() { return true; }
	public function get_id() { return 1; }
	public function get_name() { return 'Test tişört'; }
	public function get_stock_quantity() { return 100; }
}

function check( $condition, $message ) {
	if ( ! $condition ) { throw new RuntimeException( $message ); }
}

require dirname( __DIR__ ) . '/maymoon-commerce-bridge.php';
$bridge = new Maymoon_Commerce_Bridge();
$line = array( 'productId' => 'test', 'color' => 'siyah', 'size' => 'M', 'quantity' => 1 );

$response = $bridge->quote_checkout( new WP_REST_Request( array( 'items' => array_fill( 0, 51, $line ) ) ) );
check( is_wp_error( $response ) && 'maymoon_cart_too_large' === $response->code, 'Too many quote lines must be rejected.' );
check( 0 === $product_lookups, 'Oversized quote must not reach product lookup.' );

$large_line = $line;
$large_line['productId'] = str_repeat( 'x', 65537 );
$response = $bridge->quote_checkout( new WP_REST_Request( array( 'items' => array( $large_line ) ) ) );
check( is_wp_error( $response ) && 0 === $product_lookups, 'Oversized parsed items must be rejected before lookup, even with an empty request body.' );

$response = $bridge->quote_checkout( new WP_REST_Request( array( 'items' => array( $line ) ) ) );
check( is_array( $response ) && 12.5 === $response['subtotal'] && 1 === $product_lookups, 'Ordinary quote must still work.' );

$response = $bridge->quote_checkout( new WP_REST_Request( array( 'items' => array_fill( 0, 50, $line ) ) ) );
check( is_array( $response ) && 625.0 === $response['subtotal'], 'Maximum allowed quote lines must still work.' );

$design = array( 'documents' => array( 'front' => array( 'objects' => array( array( 'type' => 'text' ) ) ), 'back' => array( 'objects' => array() ) ) );
$saved_designs = array( array( 'design' => str_repeat( 'x', 10485700 ) ) );
$response = $bridge->save_customer_design( new WP_REST_Request( array( 'name' => 'Yeni', 'design' => $design ) ) );
check( is_wp_error( $response ) && 'maymoon_design_storage_limit' === $response->code && 0 === $meta_writes, 'Over-quota design must not be stored.' );

$saved_designs = array();
$response = $bridge->save_customer_design( new WP_REST_Request( array( 'name' => 'Yeni', 'design' => $design ) ) );
check( is_array( $response ) && 1 === $meta_writes && 1 === count( $saved_designs ), 'Ordinary design save must still work.' );

$recursive_design = $design;
$recursive_design['documents']['front']['objects'][0]['loop'] = &$recursive_design;
$response = $bridge->save_customer_design( new WP_REST_Request( array( 'name' => 'Hatalı', 'design' => $recursive_design ) ) );
check( is_wp_error( $response ) && 'maymoon_design_too_large' === $response->code && 1 === $meta_writes, 'Unserializable design must not bypass size limit.' );

$_SERVER['REMOTE_ADDR'] = '192.0.2.10';
$registration = new WP_REST_Request( array( 'name' => 'Test User', 'email' => 'existing@example.com', 'password' => 'strong-password' ) );
for ( $attempt = 0; $attempt < 10; ++$attempt ) {
	$response = $bridge->register_customer( $registration );
	check( is_wp_error( $response ) && 'maymoon_existing_account' === $response->code, 'Ordinary registration error must remain available.' );
}
$response = $bridge->register_customer( $registration );
check( is_wp_error( $response ) && 'maymoon_registration_limited' === $response->code, 'Excess registration attempts must be throttled.' );
$_SERVER['REMOTE_ADDR'] = '192.0.2.11';
$response = $bridge->register_customer( $registration );
check( is_wp_error( $response ) && 'maymoon_existing_account' === $response->code, 'Independent IP must not be blocked by another IP.' );

echo "Security limit checks passed.\n";
