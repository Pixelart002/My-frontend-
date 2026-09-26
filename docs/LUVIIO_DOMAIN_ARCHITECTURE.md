# LUVIIO Domain Architecture

## 1. Purpose

LUVIIO uses a hybrid domain architecture.

- `luviio.in` = public marketing, brand, SEO and content surface.
- `app.luviio.in` = transactional ecommerce application.
- The primary public product SEO URL remains `luviio.in/product/:slug`.
- The ecommerce application handles shopping, cart, checkout, account and admin workflows.

The separation is intentional: public discovery and SEO stay on the primary domain while transactional UI is isolated on the app subdomain.

---

## 2. High-Level Flow

```text
                         LUVIIO
                           |
             +-------------+-------------+
             |                           |
             v                           v
       luviio.in                    app.luviio.in
     Public / SEO                  Ecommerce App
             |                           |
      +------+------+             +------+------+
      |      |      |             |      |      |
      v      v      v             v      v      v
    Home   Blog   Product        Shop   Cart  Account
             |                    |
             v                    v
        Category SEO           Checkout
             |                    |
             +-------- CTA -------+
                       |
                       v
                 app.luviio.in
```

---

## 3. Page-by-Page Navigation

### Page 1 — Marketing Home

**URL**

`https://luviio.in/`

**Purpose**

Brand introduction, product discovery and marketing.

**Primary actions**

```text
luviio.in/
   |
   +--> Explore Categories
   |
   +--> View Products
   |
   +--> Read Guides / Blog
   |
   +--> Shop Now
             |
             v
      app.luviio.in/shop
```

The home page should not become the transactional checkout UI.

---

### Page 2 — About

**URL**

`https://luviio.in/about`

**Purpose**

Explain LUVIIO, its business, product categories and brand context.

**Flow**

```text
/about
   |
   +--> Categories
   +--> Product SEO pages
   +--> Blog / Guides
   +--> Shop Now
             |
             v
      app.luviio.in/shop
```

---

### Page 3 — Category Discovery

**URL**

`https://luviio.in/category/:slug`

**Purpose**

SEO-friendly category landing page.

**Flow**

```text
/category/:slug
       |
       +--> Product A
       +--> Product B
       +--> Product C
       |
       +--> Product SEO page
       |
       +--> Shop Now
                |
                v
         app.luviio.in/shop
```

Category pages are public discovery pages. They should contain useful category content and internal links, not only a client-side product grid.

---

### Page 4 — Product SEO Page

**URL**

`https://luviio.in/product/:slug`

**Purpose**

Canonical public product discovery page.

This URL is retained for SEO, structured data, search indexing, social sharing and external links.

**Flow**

```text
Google / User / Social
          |
          v
luviio.in/product/:slug
          |
    +-----+------+
    |            |
    v            v
Product info   SEO data
    |            |
    +-----+------+
          |
          v
   View / Buy CTA
          |
          v
app.luviio.in/shop
          |
          v
     Product flow
          |
          v
        Cart
          |
          v
      Checkout
```

Do not remove or replace the primary `luviio.in/product/:slug` URLs without an explicit SEO migration plan.

---

### Page 5 — Blog / Guides

**URL**

`https://luviio.in/blog`

**Purpose**

Educational content, SEO, AEO and GEO discovery.

**Flow**

```text
Blog / Guide
     |
     +--> Category guide
     |
     +--> Relevant product
     |
     +--> Product SEO page
     |
     +--> Shop CTA
             |
             v
      app.luviio.in/shop
```

Content should create useful internal links to relevant categories and products.

---

### Page 6 — Ecommerce Shop

**URL**

`https://app.luviio.in/shop`

**Purpose**

Transactional product browsing.

**Flow**

```text
app.luviio.in/shop
        |
        +--> Search
        +--> Filter
        +--> Category
        +--> Product
                 |
                 v
              Cart
```

The app domain is the main shopping workspace.

---

### Page 7 — Product in App

**URL**

`https://app.luviio.in/product/:slug`

**Purpose**

Interactive ecommerce product experience.

This route may reuse product data from the backend, but it must not compete with the public SEO URL as an independent canonical page.

**Flow**

```text
app.luviio.in/product/:slug
          |
          +--> Variant / quantity
          +--> Add to cart
          +--> Buy / checkout
```

SEO canonical strategy must prevent accidental duplicate indexing between the public product URL and the app product route.

---

### Page 8 — Cart

**URL**

`https://app.luviio.in/cart`

**Purpose**

Review selected products before checkout.

**Flow**

```text
Shop / Product
      |
      v
    Cart
      |
      +--> Continue shopping
      |
      +--> Checkout
```

Pricing, taxes, shipping and totals remain backend-authoritative.

---

### Page 9 — Checkout

**URL**

`https://app.luviio.in/checkout`

**Purpose**

Address, shipping, payment and order confirmation workflow.

**Flow**

```text
Cart
 |
 v
Address
 |
 v
Shipping / Courier
 |
 v
Payment method
 |
 +------> Stripe
 |
 +------> COD
 |
 v
Order creation
 |
 v
Confirmation
```

The frontend must not independently calculate authoritative order totals.

---

### Page 10 — Account

**URL**

`https://app.luviio.in/account`

**Purpose**

Authenticated customer area.

**Flow**

```text
Account
  |
  +--> Profile
  +--> Addresses
  +--> Orders
  +--> Security
  +--> Logout
```

Authentication uses the existing access-token-in-memory plus HttpOnly refresh-cookie architecture.

---

### Page 11 — Admin

**URL**

`https://app.luviio.in/admin`

**Purpose**

Protected administration surface.

**Flow**

```text
Admin
  |
  v
Authentication
  |
  v
MFA / authorization
  |
  v
RBAC / ABAC
  |
  +--> Products
  +--> Inventory
  +--> Orders
  +--> Shipping
  +--> Customers
  +--> Settings
```

Admin routes remain protected and must never be exposed as public marketing content.

---

## 4. Domain Responsibility

```text
luviio.in
|
+-- Marketing
+-- Brand
+-- SEO
+-- Product discovery
+-- Category discovery
+-- Blog / guides
+-- Public structured data
+-- Public social/share URLs
|
+-- CTA ------------------------------+
                                       |
                                       v
                              app.luviio.in
                              |
                              +-- Shop
                              +-- Product interaction
                              +-- Cart
                              +-- Checkout
                              +-- Account
                              +-- Admin
```

---

## 5. SEO URL Ownership

The public SEO URLs are owned by the primary domain:

```text
https://luviio.in/product/:slug
https://luviio.in/category/:slug
https://luviio.in/blog
```

Transactional application URLs are owned by:

```text
https://app.luviio.in/shop
https://app.luviio.in/product/:slug
https://app.luviio.in/cart
https://app.luviio.in/checkout
https://app.luviio.in/account
https://app.luviio.in/admin
```

The app product route must not accidentally become a second competing SEO document.

---

## 6. Search / Social Request Flow

```text
Search engine / social crawler
             |
             v
      luviio.in/product/:slug
             |
             v
       SSR product HTML
             |
      +------+------+
      |             |
      v             v
  Meta/OG       Product JSON-LD
      |
      v
   Public SEO URL
```

Normal application users can continue into the ecommerce app through explicit CTAs.

---

## 7. API Flow

Both public and app surfaces use the same backend source of truth.

```text
luviio.in
    |
    +------------------+
                       |
app.luviio.in          |
    |                  |
    +--------+---------+
             |
             v
      Backend API
             |
             v
          Supabase
```

The browser must not move business rules into either frontend. Product pricing, tax, shipping, inventory and order totals remain backend-authoritative.

---

## 8. Domain Migration Rule

Do not perform a blind domain replacement.

The migration must preserve:

1. Existing indexed product URLs.
2. Product canonical URLs.
3. Product structured data.
4. Sitemap product entries.
5. Robots configuration.
6. Social/OG product previews.
7. Existing external backlinks.
8. API authentication behavior.
9. Checkout and payment flows.

Only transactional routes should move to the app subdomain as part of the application-domain separation.

---

## 10. Domain → Controller → Router → Page → API

The request flow is separated by responsibility. A page must not become the controller, and a controller must not contain frontend presentation logic.

```text
USER / CRAWLER
      |
      v
+----------------------+
| Domain / Host        |
| luviio.in             |
| app.luviio.in         |
+----------+-----------+
           |
           v
+----------------------+
| Controller /         |
| Request Boundary     |
+----------+-----------+
           |
           v
+----------------------+
| Router / Route       |
| validation + auth    |
+----------+-----------+
           |
           v
+----------------------+
| Domain Service       |
| business rules       |
+----------+-----------+
           |
           v
+----------------------+
| Repository /         |
| Integration         |
+----------+-----------+
           |
           v
      Supabase / External
      Provider APIs
```

### Public product / SEO controller flow

```text
Google / Social / User
          |
          v
luviio.in/product/:slug
          |
          v
Vercel request boundary
          |
          +---- crawler ----> SSR Product Controller
          |                         |
          |                         v
          |                   Backend Product API
          |                         |
          |                         v
          |                   Product + SEO + Images
          |                         |
          |                         v
          |                   HTML / OG / JSON-LD
          |
          +---- browser ----> React Product Page
                                    |
                                    v
                              Backend Product API
```

The backend share controller is the public social-preview boundary:

```text
/share/products/:slug
        |
        v
Social Share Controller
        |
        v
Product service / repository
        |
        v
SEO + OG HTML
```

The public SEO product URL remains `luviio.in/product/:slug`; the share endpoint is an implementation endpoint and must not become a competing canonical page.

### Ecommerce controller flow

```text
app.luviio.in
      |
      +--> Shop Controller
      |       |
      |       +--> Product API
      |       +--> Category API
      |
      +--> Product Controller
      |       |
      |       +--> Product API
      |
      +--> Cart Controller
      |       |
      |       +--> Cart API
      |
      +--> Checkout Controller
              |
              +--> Address
              +--> Shipping Controller
              +--> Payment Controller
              +--> Order Controller
```

### Shipping controller flow

```text
Checkout
   |
   v
Shipping Controller / Router
   |
   +--> Rate
   |
   +--> Courier selection
   |
   +--> Shipment creation
   |
   +--> AWB
   |
   +--> Pickup
   |
   +--> Label / Manifest / Invoice
   |
   +--> Tracking
   |
   +--> Provider webhook
             |
             v
       Shipping service
             |
             v
       Order / shipment state
```

Provider-specific behavior stays inside the shipping integration boundary:

```text
Shipping Service
      |
      v
Provider Interface
      |
      +--> Shiprocket adapter
      |
      +--> Future provider adapter
```

The router/controller remains provider-neutral where possible. Provider-specific API paths, payloads and identifiers belong in the provider integration.

### Authentication / Admin controller flow

```text
app.luviio.in/admin
        |
        v
Auth Controller
        |
        v
Access token + refresh session
        |
        v
MFA Controller
        |
        v
RBAC / ABAC authorization
        |
        v
Admin Controller
        |
        +--> Products
        +--> Inventory
        +--> Orders
        +--> Shipping
        +--> Customers
        +--> Settings
```

### Responsibility rules

```text
PAGE
  = presentation + user interaction

CONTROLLER
  = request/response boundary + orchestration

ROUTER
  = HTTP route + validation + dependency/auth wiring

DOMAIN SERVICE
  = business rules + workflow

REPOSITORY
  = database persistence

INTEGRATION
  = external provider API

DATABASE
  = runtime source of truth
```

Do not move pricing, tax, shipping totals, inventory decisions or order-state rules into React pages. The frontend displays backend results and submits user intent; authoritative business decisions remain in backend domain services.

---
## 9. Target Architecture

```text
                    INTERNET
                       |
          +------------+------------+
          |                         |
          v                         v
     luviio.in                app.luviio.in
     PUBLIC WEB                 APP WEB
          |                         |
     +----+-----+              +----+------+
     |    |     |              |    |      |
     v    v     v              v    v      v
    SEO  Blog  Brand          Shop Cart Account
     |                         |
     v                         v
 Product / Category          Checkout
     |                         |
     +-----------+-------------+
                 |
                 v
             Backend API
                 |
                 v
              Supabase
```

This document is the source of truth for the frontend domain/page ownership model.
