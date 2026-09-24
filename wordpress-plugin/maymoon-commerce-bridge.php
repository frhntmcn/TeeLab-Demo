<?php
/**
 * Plugin Name: Maymoon Commerce Bridge
 * Description: Secures the React management interface with the existing WordPress/WooCommerce administrator session.
 * Version: 0.1.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Maymoon
 */

defined( 'ABSPATH' ) || exit;

final class Maymoon_Commerce_Bridge {
	const REST_NAMESPACE = 'maymoon/v1';
	const MAX_QUOTE_LINES = 50;
	const MAX_QUOTE_BODY_BYTES = 65536;
	const MAX_SAVED_DESIGN_BYTES = 10485760;
	const REGISTRATION_ATTEMPTS_PER_HOUR = 10;

	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_action( 'init', array( $this, 'register_order_statuses' ) );
		add_filter( 'wc_order_statuses', array( $this, 'add_order_statuses' ) );
	}

	public function register_routes() {
		register_rest_route( self::REST_NAMESPACE, '/account/session', array( 'methods' => WP_REST_Server::READABLE, 'callback' => array( $this, 'get_customer_session' ), 'permission_callback' => '__return_true' ) );
		register_rest_route( self::REST_NAMESPACE, '/account/register', array( 'methods' => WP_REST_Server::CREATABLE, 'callback' => array( $this, 'register_customer' ), 'permission_callback' => '__return_true' ) );
		register_rest_route( self::REST_NAMESPACE, '/account/login', array( 'methods' => WP_REST_Server::CREATABLE, 'callback' => array( $this, 'login_customer' ), 'permission_callback' => '__return_true' ) );
		register_rest_route( self::REST_NAMESPACE, '/account/logout', array( 'methods' => WP_REST_Server::CREATABLE, 'callback' => array( $this, 'logout_customer' ), 'permission_callback' => array( $this, 'is_logged_in' ) ) );
		register_rest_route( self::REST_NAMESPACE, '/account/password-reset', array( 'methods' => WP_REST_Server::CREATABLE, 'callback' => array( $this, 'request_password_reset' ), 'permission_callback' => '__return_true' ) );
		register_rest_route( self::REST_NAMESPACE, '/account/profile', array( 'methods' => WP_REST_Server::READABLE, 'callback' => array( $this, 'get_customer_profile' ), 'permission_callback' => array( $this, 'is_logged_in' ) ) );
		register_rest_route( self::REST_NAMESPACE, '/account/profile', array( 'methods' => WP_REST_Server::CREATABLE, 'callback' => array( $this, 'update_customer_profile' ), 'permission_callback' => array( $this, 'is_logged_in' ) ) );
		register_rest_route( self::REST_NAMESPACE, '/account/orders', array( 'methods' => WP_REST_Server::READABLE, 'callback' => array( $this, 'get_customer_orders' ), 'permission_callback' => array( $this, 'is_logged_in' ) ) );
		register_rest_route( self::REST_NAMESPACE, '/account/designs', array( 'methods' => WP_REST_Server::READABLE, 'callback' => array( $this, 'get_customer_designs' ), 'permission_callback' => array( $this, 'is_logged_in' ) ) );
		register_rest_route( self::REST_NAMESPACE, '/account/designs', array( 'methods' => WP_REST_Server::CREATABLE, 'callback' => array( $this, 'save_customer_design' ), 'permission_callback' => array( $this, 'is_logged_in' ) ) );
		register_rest_route( self::REST_NAMESPACE, '/account/designs/(?P<id>[a-zA-Z0-9-]+)', array( 'methods' => WP_REST_Server::DELETABLE, 'callback' => array( $this, 'delete_customer_design' ), 'permission_callback' => array( $this, 'is_logged_in' ) ) );
		register_rest_route( self::REST_NAMESPACE, '/checkout/quote', array( 'methods' => WP_REST_Server::CREATABLE, 'callback' => array( $this, 'quote_checkout' ), 'permission_callback' => array( $this, 'is_logged_in' ) ) );
		register_rest_route( self::REST_NAMESPACE, '/admin/orders', array( 'methods' => WP_REST_Server::READABLE, 'callback' => array( $this, 'get_admin_orders' ), 'permission_callback' => array( $this, 'can_manage_store' ) ) );
		register_rest_route( self::REST_NAMESPACE, '/admin/orders/(?P<id>\\d+)/status', array( 'methods' => WP_REST_Server::CREATABLE, 'callback' => array( $this, 'update_admin_order_status' ), 'permission_callback' => array( $this, 'can_manage_store' ) ) );
		register_rest_route( self::REST_NAMESPACE, '/admin/nonce', array( 'methods' => WP_REST_Server::READABLE, 'callback' => array( $this, 'get_admin_nonce' ), 'permission_callback' => '__return_true' ) );

		register_rest_route(
			self::REST_NAMESPACE,
			'/session',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_session' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/admin-login',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'login' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'username' => array( 'required' => true, 'type' => 'string' ),
					'password' => array( 'required' => true, 'type' => 'string' ),
				),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			'/admin-logout',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'logout' ),
				'permission_callback' => array( $this, 'can_manage_store' ),
			)
		);
	}

	private function customer_session_payload() {
		$user = wp_get_current_user();
		if ( ! $user || ! $user->exists() ) {
			return array( 'authenticated' => false );
		}

		return array(
			'authenticated' => true,
			'restNonce'     => wp_create_nonce( 'wp_rest' ),
			'user'          => array(
				'id'    => $user->ID,
				'name'  => $user->display_name,
				'email' => $user->user_email,
			),
		);
	}

	private function restore_user_from_auth_cookie() {
		if ( is_user_logged_in() || empty( $_COOKIE[ LOGGED_IN_COOKIE ] ) ) {
			return;
		}
		$user_id = wp_validate_auth_cookie( (string) wp_unslash( $_COOKIE[ LOGGED_IN_COOKIE ] ), 'logged_in' );
		if ( $user_id ) {
			wp_set_current_user( $user_id );
		}
	}

	public function get_customer_session() {
		$this->restore_user_from_auth_cookie();
		nocache_headers();
		return rest_ensure_response( $this->customer_session_payload() );
	}

	public function register_customer( WP_REST_Request $request ) {
		nocache_headers();
		$name     = sanitize_text_field( (string) $request->get_param( 'name' ) );
		$email    = sanitize_email( (string) $request->get_param( 'email' ) );
		$password = (string) $request->get_param( 'password' );

		if ( '' === $name || ! is_email( $email ) || strlen( $password ) < 10 ) {
			return new WP_Error( 'maymoon_invalid_registration', 'Ad soyad, geçerli e-posta ve en az 10 karakterlik şifre gerekli.', array( 'status' => 400 ) );
		}
		$registration_limit = $this->limit_registration_attempts();
		if ( is_wp_error( $registration_limit ) ) {
			return $registration_limit;
		}
		if ( email_exists( $email ) ) {
			return new WP_Error( 'maymoon_existing_account', 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.', array( 'status' => 409 ) );
		}

		if ( function_exists( 'wc_create_new_customer' ) ) {
			$user_id = wc_create_new_customer( $email, '', $password );
		} else {
			$user_id = wp_create_user( $email, $password, $email );
		}
		if ( is_wp_error( $user_id ) ) {
			return new WP_Error( 'maymoon_registration_failed', 'Hesap oluşturulamadı. Lütfen tekrar deneyin.', array( 'status' => 400 ) );
		}

		wp_update_user( array( 'ID' => $user_id, 'display_name' => $name, 'nickname' => $name ) );
		wp_set_current_user( $user_id );
		wp_set_auth_cookie( $user_id, true, is_ssl() );
		return rest_ensure_response( $this->customer_session_payload() );
	}

	private function limit_registration_attempts() {
		$remote_address = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : '';
		if ( ! filter_var( $remote_address, FILTER_VALIDATE_IP ) ) {
			return new WP_Error( 'maymoon_registration_unavailable', 'Hesap oluşturma şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.', array( 'status' => 503 ) );
		}
		$key = 'maymoon_register_' . hash( 'sha256', $remote_address );
		$attempts = (int) get_transient( $key );
		if ( $attempts >= self::REGISTRATION_ATTEMPTS_PER_HOUR ) {
			return new WP_Error( 'maymoon_registration_limited', 'Çok fazla kayıt denemesi yapıldı. Lütfen bir saat sonra tekrar deneyin.', array( 'status' => 429 ) );
		}
		set_transient( $key, $attempts + 1, HOUR_IN_SECONDS );
		return true;
	}

	public function login_customer( WP_REST_Request $request ) {
		nocache_headers();
		$login    = sanitize_text_field( (string) $request->get_param( 'login' ) );
		$password = (string) $request->get_param( 'password' );
		$user     = wp_authenticate( $login, $password );

		if ( is_wp_error( $user ) ) {
			return new WP_Error( 'maymoon_invalid_credentials', 'E-posta/kullanıcı adı veya şifre doğrulanamadı.', array( 'status' => 401 ) );
		}

		wp_set_current_user( $user->ID );
		wp_set_auth_cookie( $user->ID, true, is_ssl() );
		return rest_ensure_response( $this->customer_session_payload() );
	}

	public function request_password_reset( WP_REST_Request $request ) {
		nocache_headers();
		$login = sanitize_text_field( (string) $request->get_param( 'login' ) );
		if ( '' !== $login ) {
			retrieve_password( $login );
		}
		return rest_ensure_response( array( 'accepted' => true ) );
	}

	public function is_logged_in() {
		return is_user_logged_in();
	}

	public function logout_customer() {
		wp_logout();
		nocache_headers();
		return rest_ensure_response( array( 'authenticated' => false ) );
	}

	private function customer_profile_payload( $user_id ) {
		$user = get_user_by( 'id', $user_id );
		return array(
			'name'    => $user ? $user->display_name : '',
			'email'   => $user ? $user->user_email : '',
			'phone'   => (string) get_user_meta( $user_id, 'billing_phone', true ),
			'address' => array(
				'first_name' => (string) get_user_meta( $user_id, 'billing_first_name', true ),
				'last_name'  => (string) get_user_meta( $user_id, 'billing_last_name', true ),
				'company'    => (string) get_user_meta( $user_id, 'billing_company', true ),
				'tax_office' => (string) get_user_meta( $user_id, '_maymoon_tax_office', true ),
				'tax_number' => (string) get_user_meta( $user_id, '_maymoon_tax_number', true ),
				'line_1'     => (string) get_user_meta( $user_id, 'billing_address_1', true ),
				'line_2'     => (string) get_user_meta( $user_id, 'billing_address_2', true ),
				'city'       => (string) get_user_meta( $user_id, 'billing_city', true ),
				'district'   => (string) get_user_meta( $user_id, '_maymoon_billing_district', true ),
				'postcode'   => (string) get_user_meta( $user_id, 'billing_postcode', true ),
				'country'    => (string) get_user_meta( $user_id, 'billing_country', true ),
			),
		);
	}

	public function get_customer_profile() {
		nocache_headers();
		return rest_ensure_response( $this->customer_profile_payload( get_current_user_id() ) );
	}

	public function update_customer_profile( WP_REST_Request $request ) {
		$user_id = get_current_user_id();
		$name    = sanitize_text_field( (string) $request->get_param( 'name' ) );
		$phone   = sanitize_text_field( (string) $request->get_param( 'phone' ) );
		$address = $request->get_param( 'address' );
		$address = is_array( $address ) ? $address : array();

		if ( '' !== $name ) {
			wp_update_user( array( 'ID' => $user_id, 'display_name' => $name, 'nickname' => $name ) );
		}
		update_user_meta( $user_id, 'billing_phone', $phone );
		$fields = array(
			'first_name' => 'billing_first_name', 'last_name' => 'billing_last_name', 'company' => 'billing_company',
			'line_1' => 'billing_address_1', 'line_2' => 'billing_address_2', 'city' => 'billing_city',
			'postcode' => 'billing_postcode', 'country' => 'billing_country', 'district' => '_maymoon_billing_district',
			'tax_office' => '_maymoon_tax_office', 'tax_number' => '_maymoon_tax_number',
		);
		foreach ( $fields as $field => $meta_key ) {
			update_user_meta( $user_id, $meta_key, sanitize_text_field( isset( $address[ $field ] ) ? (string) $address[ $field ] : '' ) );
		}
		nocache_headers();
		return rest_ensure_response( $this->customer_profile_payload( $user_id ) );
	}

	public function get_customer_orders() {
		nocache_headers();
		if ( ! function_exists( 'wc_get_orders' ) ) {
			return rest_ensure_response( array( 'orders' => array() ) );
		}
		$orders = wc_get_orders( array( 'customer_id' => get_current_user_id(), 'limit' => 50, 'orderby' => 'date', 'order' => 'DESC' ) );
		return rest_ensure_response( array( 'orders' => array_map( array( $this, 'serialize_customer_order' ), $orders ) ) );
	}

	private function get_saved_design_records( $user_id ) {
		$designs = get_user_meta( $user_id, '_maymoon_saved_designs', true );
		return is_array( $designs ) ? $designs : array();
	}

	public function get_customer_designs() {
		nocache_headers();
		return rest_ensure_response( array( 'designs' => $this->get_saved_design_records( get_current_user_id() ) ) );
	}

	public function save_customer_design( WP_REST_Request $request ) {
		$user_id = get_current_user_id();
		$name = sanitize_text_field( (string) $request->get_param( 'name' ) );
		$design = $request->get_param( 'design' );
		if ( '' === $name || ! is_array( $design ) || empty( $design['documents']['front']['objects'] ) && empty( $design['documents']['back']['objects'] ) ) {
			return new WP_Error( 'maymoon_invalid_design', 'Tasarım adı ve en az bir baskı yüzü gerekli.', array( 'status' => 400 ) );
		}
		$encoded_design = wp_json_encode( $design );
		if ( false === $encoded_design || strlen( $encoded_design ) > 2097152 ) {
			return new WP_Error( 'maymoon_design_too_large', 'Tasarım dosyası 2 MB sınırını aşıyor. Görsel boyutlarını küçültüp tekrar deneyin.', array( 'status' => 413 ) );
		}
		foreach ( array( 'front', 'back' ) as $side ) {
			$objects = isset( $design['documents'][ $side ]['objects'] ) && is_array( $design['documents'][ $side ]['objects'] ) ? $design['documents'][ $side ]['objects'] : array();
			if ( count( $objects ) > 200 ) {
				return new WP_Error( 'maymoon_design_object_limit', 'Bir tasarım yüzünde en fazla 200 nesne saklanabilir.', array( 'status' => 400 ) );
			}
		}
		$records = $this->get_saved_design_records( $user_id );
		if ( count( $records ) >= 25 ) {
			return new WP_Error( 'maymoon_design_limit', 'Hesapta en fazla 25 kayıtlı tasarım olabilir. Önce kullanmadığınız bir tasarımı silin.', array( 'status' => 409 ) );
		}
		$record = array(
			'id' => wp_generate_uuid4(),
			'name' => $name,
			'updated_at' => gmdate( DATE_ATOM ),
			'design' => $design,
		);
		array_unshift( $records, $record );
		$encoded_records = wp_json_encode( $records );
		if ( false === $encoded_records || strlen( $encoded_records ) > self::MAX_SAVED_DESIGN_BYTES ) {
			return new WP_Error( 'maymoon_design_storage_limit', 'Kayıtlı tasarımlarınız için ayrılan alan doldu. Yeni tasarım kaydetmeden önce kullanmadığınız tasarımları silin.', array( 'status' => 413 ) );
		}
		update_user_meta( $user_id, '_maymoon_saved_designs', $records );
		nocache_headers();
		return rest_ensure_response( $record );
	}

	public function delete_customer_design( WP_REST_Request $request ) {
		$user_id = get_current_user_id();
		$design_id = sanitize_text_field( (string) $request->get_param( 'id' ) );
		$records = $this->get_saved_design_records( $user_id );
		$remaining = array_values( array_filter( $records, function( $record ) use ( $design_id ) { return ! isset( $record['id'] ) || $record['id'] !== $design_id; } ) );
		if ( count( $remaining ) === count( $records ) ) {
			return new WP_Error( 'maymoon_design_not_found', 'Kayıtlı tasarım bulunamadı.', array( 'status' => 404 ) );
		}
		update_user_meta( $user_id, '_maymoon_saved_designs', $remaining );
		nocache_headers();
		return rest_ensure_response( array( 'deleted' => true ) );
	}

	public function serialize_customer_order( $order ) {
		return array(
			'id'     => $order->get_id(),
			'number' => $order->get_order_number(),
			'date'   => $order->get_date_created() ? $order->get_date_created()->date( DATE_ATOM ) : '',
			'status' => $order->get_status(),
			'total'  => (float) $order->get_total(),
			'items'  => array_map(
				function( $item ) {
					return array( 'name' => $item->get_name(), 'quantity' => $item->get_quantity() );
				},
				$order->get_items()
			),
		);
	}

	private function find_checkout_product( $product_id, $color, $size ) {
		if ( ! function_exists( 'wc_get_product' ) ) {
			return new WP_Error( 'maymoon_woocommerce_unavailable', 'Mağaza altyapısı şu anda hazır değil.', array( 'status' => 503 ) );
		}

		$post = get_page_by_path( sanitize_title( $product_id ), OBJECT, 'product' );
		$product = $post ? wc_get_product( $post->ID ) : false;
		if ( ! $product ) {
			return new WP_Error( 'maymoon_product_not_found', 'Sepetteki ürün bulunamadı veya artık satışta değil.', array( 'status' => 404 ) );
		}

		if ( ! $product->is_type( 'variable' ) ) {
			return $product;
		}

		$wanted_color = sanitize_title( $color );
		$wanted_size  = sanitize_title( $size );
		foreach ( $product->get_children() as $variation_id ) {
			$variation = wc_get_product( $variation_id );
			if ( ! $variation ) {
				continue;
			}
			$attributes = array_map( 'sanitize_title', $variation->get_attributes() );
			if ( in_array( $wanted_color, $attributes, true ) && in_array( $wanted_size, $attributes, true ) ) {
				return $variation;
			}
		}

		return new WP_Error( 'maymoon_variant_not_found', 'Seçtiğiniz renk ve beden kombinasyonu satışta değil.', array( 'status' => 409 ) );
	}

	public function quote_checkout( WP_REST_Request $request ) {
		nocache_headers();
		$items = $request->get_param( 'items' );
		if ( ! is_array( $items ) || empty( $items ) ) {
			return new WP_Error( 'maymoon_empty_cart', 'Sepetiniz boş.', array( 'status' => 400 ) );
		}
		$encoded_items = wp_json_encode( $items );
		if ( false === $encoded_items || strlen( $encoded_items ) > self::MAX_QUOTE_BODY_BYTES || count( $items ) > self::MAX_QUOTE_LINES ) {
			return new WP_Error( 'maymoon_cart_too_large', 'Sepette en fazla 50 satır olabilir. Sepetinizi küçültüp tekrar deneyin.', array( 'status' => 413 ) );
		}

		$quoted_items = array();
		$total        = 0.0;
		foreach ( $items as $line ) {
			if ( ! is_array( $line ) ) {
				return new WP_Error( 'maymoon_invalid_cart', 'Sepet satırı geçersiz.', array( 'status' => 400 ) );
			}
			$product_id = isset( $line['productId'] ) ? sanitize_text_field( (string) $line['productId'] ) : '';
			$color      = isset( $line['color'] ) ? sanitize_text_field( (string) $line['color'] ) : '';
			$size       = isset( $line['size'] ) ? sanitize_text_field( (string) $line['size'] ) : '';
			$quantity   = isset( $line['quantity'] ) ? absint( $line['quantity'] ) : 0;
			if ( '' === $product_id || '' === $color || '' === $size || $quantity < 1 || $quantity > 1000 ) {
				return new WP_Error( 'maymoon_invalid_cart', 'Sepet satırındaki ürün, varyasyon veya adet geçersiz.', array( 'status' => 400 ) );
			}

			$product = $this->find_checkout_product( $product_id, $color, $size );
			if ( is_wp_error( $product ) ) {
				return $product;
			}
			if ( ! $product->is_purchasable() || ! $product->is_in_stock() || ! $product->has_enough_stock( $quantity ) ) {
				return new WP_Error( 'maymoon_out_of_stock', sprintf( '%s için yeterli stok yok.', $product->get_name() ), array( 'status' => 409 ) );
			}

			$unit_price = (float) wc_get_price_to_display( $product );
			$line_total = $unit_price * $quantity;
			$total += $line_total;
			$quoted_items[] = array(
				'product_id' => $product->get_id(), 'name' => $product->get_name(), 'quantity' => $quantity,
				'unit_price' => $unit_price, 'line_total' => $line_total, 'stock_quantity' => $product->get_stock_quantity(),
			);
		}

		return rest_ensure_response( array(
			'items' => $quoted_items, 'subtotal' => $total, 'currency' => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'TRY',
			'note' => 'Kargo, vergi ve indirimler ödeme adımındaki WooCommerce yapılandırmasına göre ayrıca hesaplanacaktır.',
		) );
	}

	public function register_order_statuses() {
		$statuses = array(
			'wc-maymoon-design-review' => 'Tasarım kontrolünde',
			'wc-maymoon-production-waiting' => 'Üretim onayı bekliyor',
			'wc-maymoon-production' => 'Üretimde',
			'wc-maymoon-shipped' => 'Kargolandı',
		);
		foreach ( $statuses as $status => $label ) {
			register_post_status( $status, array(
				'label' => $label, 'public' => true, 'exclude_from_search' => false,
				'show_in_admin_all_list' => true, 'show_in_admin_status_list' => true,
				'label_count' => _n_noop( $label . ' <span class="count">(%s)</span>', $label . ' <span class="count">(%s)</span>', 'maymoon' ),
			) );
		}
	}

	public function add_order_statuses( $order_statuses ) {
		$insert_after = 'wc-processing';
		$addition = array(
			'wc-maymoon-design-review' => 'Tasarım kontrolünde',
			'wc-maymoon-production-waiting' => 'Üretim onayı bekliyor',
			'wc-maymoon-production' => 'Üretimde',
			'wc-maymoon-shipped' => 'Kargolandı',
		);
		$result = array();
		foreach ( $order_statuses as $key => $value ) {
			$result[ $key ] = $value;
			if ( $insert_after === $key ) {
				$result = array_merge( $result, $addition );
			}
		}
		return $result;
	}

	private function serialize_admin_order( $order ) {
		return array(
			'id' => $order->get_id(), 'number' => $order->get_order_number(), 'date' => $order->get_date_created() ? $order->get_date_created()->date( DATE_ATOM ) : '',
			'status' => $order->get_status(), 'customer' => trim( $order->get_formatted_billing_full_name() ), 'email' => $order->get_billing_email(),
			'total' => (float) $order->get_total(), 'currency' => $order->get_currency(), 'customer_note' => $order->get_customer_note(), 'is_paid' => $order->is_paid(),
			'items' => array_map( function( $item ) { return array( 'name' => $item->get_name(), 'quantity' => $item->get_quantity(), 'product_id' => $item->get_product_id(), 'variation_id' => $item->get_variation_id() ); }, $order->get_items() ),
		);
	}

	public function get_admin_orders() {
		nocache_headers();
		if ( ! function_exists( 'wc_get_orders' ) ) {
			return new WP_Error( 'maymoon_woocommerce_unavailable', 'WooCommerce etkin değil.', array( 'status' => 503 ) );
		}
		$orders = wc_get_orders( array( 'limit' => 100, 'orderby' => 'date', 'order' => 'DESC' ) );
		return rest_ensure_response( array( 'orders' => array_map( array( $this, 'serialize_admin_order' ), $orders ) ) );
	}

	public function update_admin_order_status( WP_REST_Request $request ) {
		if ( ! function_exists( 'wc_get_order' ) ) {
			return new WP_Error( 'maymoon_woocommerce_unavailable', 'WooCommerce etkin değil.', array( 'status' => 503 ) );
		}
		$order = wc_get_order( absint( $request->get_param( 'id' ) ) );
		$status = sanitize_key( (string) $request->get_param( 'status' ) );
		$allowed = array( 'pending', 'on-hold', 'failed', 'processing', 'maymoon-design-review', 'maymoon-production-waiting', 'maymoon-production', 'maymoon-shipped', 'completed', 'cancelled', 'refunded' );
		if ( ! $order ) {
			return new WP_Error( 'maymoon_order_not_found', 'Sipariş bulunamadı.', array( 'status' => 404 ) );
		}
		if ( ! in_array( $status, $allowed, true ) ) {
			return new WP_Error( 'maymoon_invalid_status', 'Bu sipariş durumu desteklenmiyor.', array( 'status' => 400 ) );
		}
		$order->update_status( $status, 'Maymoon yönetim panelinden güncellendi.', true );
		return rest_ensure_response( $this->serialize_admin_order( $order ) );
	}

	private function session_payload() {
		$user = wp_get_current_user();

		if ( ! $user || ! $user->exists() || ! $this->user_can_manage_store( $user ) ) {
			return array( 'authenticated' => false );
		}

		return array(
			'authenticated' => true,
			'user'          => array(
				'id'          => $user->ID,
				'name'        => $user->display_name,
				'email'       => $user->user_email,
				'role'        => current_user_can( 'manage_woocommerce' ) ? 'shop_manager' : 'administrator',
			),
		);
	}

	private function user_can_manage_store( $user ) {
		return user_can( $user, 'manage_woocommerce' ) || user_can( $user, 'manage_options' );
	}

	public function get_session() {
		$this->restore_user_from_auth_cookie();
		nocache_headers();
		$payload = $this->session_payload();
		if ( ! empty( $payload['authenticated'] ) ) {
			$payload['restNonce'] = wp_create_nonce( 'wp_rest' );
		}
		return rest_ensure_response( $payload );
	}

	public function get_admin_nonce() {
		$this->restore_user_from_auth_cookie();
		if ( ! $this->can_manage_store() ) {
			return new WP_Error( 'maymoon_forbidden', 'Bu işlem için mağaza yöneticisi girişi gerekli.', array( 'status' => 401 ) );
		}
		nocache_headers();
		return rest_ensure_response( array( 'restNonce' => wp_create_nonce( 'wp_rest' ) ) );
	}

	public function login( WP_REST_Request $request ) {
		nocache_headers();
		$username = sanitize_user( (string) $request->get_param( 'username' ) );
		$password = (string) $request->get_param( 'password' );

		if ( '' === $username || '' === $password ) {
			return new WP_Error( 'maymoon_missing_credentials', 'Kullanıcı adı ve şifre gerekli.', array( 'status' => 400 ) );
		}

		$user = wp_authenticate( $username, $password );
		if ( is_wp_error( $user ) ) {
			return new WP_Error( 'maymoon_invalid_credentials', 'Giriş bilgileri doğrulanamadı.', array( 'status' => 401 ) );
		}

		if ( ! $this->user_can_manage_store( $user ) ) {
			return new WP_Error( 'maymoon_forbidden', 'Bu hesap yönetim paneline erişemez.', array( 'status' => 403 ) );
		}

		wp_set_current_user( $user->ID );
		wp_set_auth_cookie( $user->ID, true, is_ssl() );
		$payload = $this->session_payload();
		$payload['restNonce'] = wp_create_nonce( 'wp_rest' );
		return rest_ensure_response( $payload );
	}

	public function can_manage_store() {
		return current_user_can( 'manage_woocommerce' ) || current_user_can( 'manage_options' );
	}

	public function logout() {
		wp_logout();
		nocache_headers();
		return rest_ensure_response( array( 'authenticated' => false ) );
	}
}

new Maymoon_Commerce_Bridge();
