import { api } from "./api";
import type {
  LoginRequest, LoginResponse, RegisterRequest, AuthTokens,
  UserProfile, Address, AddressCreate,
  Product, ProductCreate, ProductUpdate, PaginatedResponse,
  Order, OrderCreate, PaymentIntentResponse, Category,
} from "@/types";

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authService = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>("/auth/login", data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<{ message: string }>("/auth/register", data).then((r) => r.data),

  logout: () =>
    api.post<{ message: string }>("/auth/logout").then((r) => r.data),

  refresh: (refresh_token: string) =>
    api.post<AuthTokens>("/auth/refresh", { refresh_token }).then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (new_password: string) =>
    api.post<{ message: string }>("/auth/reset-password", { new_password }).then((r) => r.data),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const userService = {
  getMe: () =>
    api.get<UserProfile>("/users/me").then((r) => r.data),

  updateMe: (data: Partial<Pick<UserProfile, "full_name" | "phone">>) =>
    api.patch<UserProfile>("/users/me", data).then((r) => r.data),

  getAddresses: () =>
    api.get<Address[]>("/users/me/addresses").then((r) => r.data),

  addAddress: (data: AddressCreate) =>
    api.post<Address>("/users/me/addresses", data).then((r) => r.data),

  deleteAddress: (id: string) =>
    api.delete(`/users/me/addresses/${id}`),

  // Admin
  listUsers: (page = 1, page_size = 20) =>
    api.get<PaginatedResponse<UserProfile>>("/users/", { params: { page, page_size } }).then((r) => r.data),

  updateUser: (id: string, data: { is_active?: boolean; role?: string }) =>
    api.patch<UserProfile>(`/users/${id}`, data).then((r) => r.data),
};

// ── Products ──────────────────────────────────────────────────────────────────

export const productService = {
  list: (params?: {
    page?: number;
    page_size?: number;
    category?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    in_stock?: boolean;
  }) =>
    api.get<PaginatedResponse<Product>>("/products", { params }).then((r) => r.data),

  getBySlug: (slug: string) =>
    api.get<Product>(`/products/${slug}`).then((r) => r.data),

  create: (data: ProductCreate) =>
    api.post<Product>("/products", data).then((r) => r.data),

  update: (id: string, data: ProductUpdate) =>
    api.patch<Product>(`/products/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/products/${id}`),

  uploadImage: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{ image_url: string }>(`/products/${id}/image`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  listCategories: () =>
    api.get<Category[]>("/categories").then((r) => r.data),

  createCategory: (data: { name: string; slug: string; description?: string }) =>
    api.post<Category>("/categories", data).then((r) => r.data),
};

// ── Orders ────────────────────────────────────────────────────────────────────

export const orderService = {
  create: (data: OrderCreate) =>
    api.post<Order>("/orders/", data).then((r) => r.data),

  myOrders: (page = 1, page_size = 20) =>
    api.get<PaginatedResponse<Order>>("/orders/my", { params: { page, page_size } }).then((r) => r.data),

  getMyOrder: (id: string) =>
    api.get<Order>(`/orders/my/${id}`).then((r) => r.data),

  cancelOrder: (id: string) =>
    api.post<Order>(`/orders/my/${id}/cancel`).then((r) => r.data),

  // Admin
  listAll: (params?: { page?: number; page_size?: number; status_filter?: string }) =>
    api.get<PaginatedResponse<Order>>("/orders/", { params }).then((r) => r.data),

  adminUpdate: (id: string, data: { status?: string; tracking_number?: string }) =>
    api.patch<Order>(`/orders/${id}`, data).then((r) => r.data),
};

// ── Payments ──────────────────────────────────────────────────────────────────

export const paymentService = {
  createIntent: (order_id: string) =>
    api.post<PaymentIntentResponse>("/payments/create-intent", { order_id }).then((r) => r.data),
};