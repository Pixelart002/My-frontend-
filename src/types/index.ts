// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginRequest {
 email: string;
 password: string;
}

export interface RegisterRequest {
 email: string;
 password: string;
 full_name ? : string;
}

export interface AuthTokens {
 access_token: string;
 refresh_token: string;
 token_type: string;
 expires_in ? : number;
}

export interface LoginResponse extends AuthTokens {
 user: { id: string;email: string };
}

// ── User ──────────────────────────────────────────────────────────────────────

export type UserRole = "customer" | "admin";

export interface UserProfile {
 id: string;
 email: string;
 full_name: string | null;
 phone: string | null;
 role: UserRole;
 is_active: boolean;
 created_at: string;
}

export interface Address {
 id: string;
 user_id: string;
 line1: string;
 line2: string | null;
 city: string;
 state: string | null;
 postal_code: string;
 country: string;
 is_default: boolean;
 created_at: string;
}

export interface AddressCreate {
 line1: string;
 line2 ? : string;
 city: string;
 state ? : string;
 postal_code: string;
 country: string;
 is_default ? : boolean;
}

// ── Category ──────────────────────────────────────────────────────────────────

export interface Category {
 id: string;
 name: string;
 slug: string;
 description: string | null;
 image_url: string | null;
 is_active: boolean;
}

// ── Product ───────────────────────────────────────────────────────────────────

export interface Product {
 id: string;
 name: string;
 slug: string;
 description: string | null;
 short_description: string | null;
 sku: string | null;
 category_id: string | null;
 price: number;
 compare_price: number | null;
 stock: number;
 low_stock_threshold: number;
 weight_grams: number | null;
 image_url: string | null;
 is_active: boolean;
 created_at: string;
 fts ? : string;
 categories ? : { name: string;slug: string } | null;
 product_images ? : ProductImage[];
}

export interface ProductImage {
 id: string;
 product_id: string;
 url: string;
 position: number;
}

export interface ProductCreate {
 name: string;
 slug: string;
 description ? : string;
 short_description ? : string;
 sku ? : string;
 category_id ? : string;
 price: number;
 compare_price ? : number;
 stock ? : number;
 low_stock_threshold ? : number;
 weight_grams ? : number;
 image_url ? : string;
 is_active ? : boolean;
}

export interface ProductUpdate extends Partial < ProductCreate > {}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse < T > {
 items: T[];
 total: number;
 page: number;
 page_size: number;
 pages: number;
}

// ── Order ─────────────────────────────────────────────────────────────────────

export type OrderStatus = |
 "pending" |
 "paid" |
 "shipped" |
 "delivered" |
 "cancelled" |
 "refunded";

export interface OrderItem {
 id: string;
 order_id: string;
 product_id: string;
 product_name: string;
 unit_price: number;
 quantity: number;
 subtotal: number;
}

export interface Order {
 id: string;
 customer_id: string;
 status: OrderStatus;
 subtotal: number;
 shipping_cost: number;
 tax_amount: number;
 total_amount: number;
 shipping_address_id: string | null;
 shipping_line1: string;
 shipping_line2: string | null;
 shipping_city: string;
 shipping_state: string | null;
 shipping_postal_code: string;
 shipping_country: string;
 notes: string | null;
 tracking_number: string | null;
 stripe_payment_intent: string | null;
 created_at: string;
 order_items ? : OrderItem[];
 users ? : { email: string;full_name: string | null };
}

export interface OrderCreate {
 items: { product_id: string;quantity: number } [];
 shipping_address_id: string;
 notes ? : string;
}

// ── Cart (client-side only) ───────────────────────────────────────────────────

export interface CartItem {
 product: Product;
 quantity: number;
}

// ── Payment ───────────────────────────────────────────────────────────────────

export interface PaymentIntentResponse {
 client_secret: string;
 payment_intent_id: string;
}

// ── Feature flags ─────────────────────────────────────────────────────────────

export interface FeatureFlags {
 newCheckout ? : boolean;
 promoBanner ? : boolean;
 maintenanceMode ? : boolean;
 pushNotifications ? : boolean;
}

// ── API error ─────────────────────────────────────────────────────────────────

export interface ApiError {
 detail: string;
 request_id ? : string;
}