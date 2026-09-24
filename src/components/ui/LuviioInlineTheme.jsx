const CSS = `
[data-luviio-app]{
  --lv-bg:#080808;
  --lv-surface:#10100f;
  --lv-surface-2:#151513;
  --lv-surface-3:#1a1a17;
  --lv-text:#f5efe8;
  --lv-muted:#b7b0a8;
  --lv-dim:#8f887f;
  --lv-gold:#d8ad6a;
  --lv-gold-strong:#b89143;
  --lv-border:rgba(255,255,255,.09);
  --lv-border-gold:rgba(216,173,106,.25);
  --lv-danger:#ef7b72;
  --lv-success:#74bf86;
  --lv-radius:18px;
  --lv-shadow:0 18px 55px rgba(0,0,0,.2);
  min-height:100vh;
  background:var(--lv-bg);
  color:var(--lv-text);
}
[data-luviio-app] .store-main{
  min-height:calc(100vh - 72px);
  background:
    radial-gradient(circle at 80% 0%,rgba(216,173,106,.055),transparent 34rem),
    var(--lv-bg);
}
[data-luviio-app] .store-page-frame,
[data-luviio-app] .page.container{
  color:var(--lv-text);
}
[data-luviio-app] .page.container{
  width:min(1240px,calc(100% - 32px));
  margin:0 auto;
  padding:clamp(34px,5vw,70px) 0;
  box-sizing:border-box;
}
[data-luviio-app] .page-heading{
  max-width:860px;
  margin:0 0 30px;
}
[data-luviio-app] .page-heading.compact{
  margin-bottom:24px;
}
[data-luviio-app] .page-heading h1,
[data-luviio-app] .page-heading h2,
[data-luviio-app] .section-title{
  margin:.35rem 0 0;
  color:var(--lv-text);
  font-weight:700;
  letter-spacing:-.04em;
  line-height:1.02;
}
[data-luviio-app] .page-heading h1{
  font-size:clamp(2.2rem,6vw,4.8rem);
}
[data-luviio-app] .page-heading p:not(.eyebrow){
  margin:12px 0 0;
  color:var(--lv-muted);
  max-width:700px;
  line-height:1.7;
}
[data-luviio-app] .eyebrow,
[data-luviio-app] .section-kicker{
  color:var(--lv-gold);
  font-size:10px;
  font-weight:800;
  letter-spacing:.16em;
  text-transform:uppercase;
}
[data-luviio-app] .card,
[data-luviio-app] .summary,
[data-luviio-app] .profile-card,
[data-luviio-app] .order-detail-card,
[data-luviio-app] .checkout-section,
[data-luviio-app] .settings-section,
[data-luviio-app] .change-password-card{
  border:1px solid var(--lv-border);
  border-radius:22px;
  background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018));
  box-shadow:var(--lv-shadow);
}
[data-luviio-app] .btn{
  min-height:44px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  padding:0 16px;
  border:1px solid rgba(216,173,106,.45);
  border-radius:12px;
  background:linear-gradient(135deg,#d8ad6a,#b89143);
  color:#0b0b0a;
  font-size:12px;
  font-weight:850;
  text-decoration:none;
  cursor:pointer;
  box-sizing:border-box;
  box-shadow:0 9px 22px rgba(216,173,106,.14);
  transition:transform .18s ease,filter .18s ease,opacity .18s ease;
}
[data-luviio-app] .btn:hover{transform:translateY(-1px);filter:brightness(1.04)}
[data-luviio-app] .btn:disabled{opacity:.55;cursor:not-allowed;transform:none}
[data-luviio-app] .btn-quiet,
[data-luviio-app] .btn-ghost{
  background:rgba(255,255,255,.035);
  border-color:var(--lv-border);
  color:var(--lv-text);
  box-shadow:none;
}
[data-luviio-app] .btn-danger{
  background:rgba(182,61,53,.14);
  border-color:rgba(239,123,114,.35);
  color:#ffaaa2;
  box-shadow:none;
}
[data-luviio-app] .btn-block{width:100%}
[data-luviio-app] .btn-sm{min-height:40px;padding:0 13px}
[data-luviio-app] button,
[data-luviio-app] input,
[data-luviio-app] select,
[data-luviio-app] textarea{
  font:inherit;
}
[data-luviio-app] input,
[data-luviio-app] select,
[data-luviio-app] textarea{
  width:100%;
  min-height:46px;
  box-sizing:border-box;
  border:1px solid var(--lv-border);
  border-radius:12px;
  background:rgba(255,255,255,.035);
  color:var(--lv-text);
  padding:11px 13px;
  outline:none;
}
[data-luviio-app] input:focus,
[data-luviio-app] select:focus,
[data-luviio-app] textarea:focus{
  border-color:rgba(216,173,106,.55);
  box-shadow:0 0 0 3px rgba(216,173,106,.09);
}
[data-luviio-app] input::placeholder,
[data-luviio-app] textarea::placeholder{color:#77716b}
[data-luviio-app] label{color:var(--lv-text)}
[data-luviio-app] .field{display:grid;gap:8px}
[data-luviio-app] .field label{font-size:12px;font-weight:750}
[data-luviio-app] .hint,
[data-luviio-app] small{color:var(--lv-muted)}
[data-luviio-app] .form-error{
  margin:12px 0;
  padding:12px 14px;
  border:1px solid rgba(239,123,114,.28);
  border-radius:12px;
  background:rgba(182,61,53,.1);
  color:#ffaaa2;
}
[data-luviio-app] .notice{
  border-radius:14px;
  border:1px solid var(--lv-border);
  background:rgba(255,255,255,.03);
  color:var(--lv-muted);
  padding:13px 15px;
}
[data-luviio-app] .notice.error{border-color:rgba(239,123,114,.3);color:#ffaaa2}
[data-luviio-app] .notice.warn{border-color:rgba(216,173,106,.25);color:#e7c995}
[data-luviio-app] .products-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(min(100%,245px),1fr));
  gap:clamp(14px,2vw,20px);
  align-items:stretch;
}
[data-luviio-app] .shop-toolbar{
  display:flex;
  align-items:center;
  gap:12px;
  margin-bottom:16px;
}
[data-luviio-app] .shop-search{
  flex:1;
  min-width:0;
  display:flex;
  align-items:center;
  gap:9px;
  padding:0 11px 0 14px;
  min-height:46px;
  border:1px solid var(--lv-border);
  border-radius:14px;
  background:rgba(255,255,255,.035);
}
[data-luviio-app] .shop-search input{
  min-height:44px;
  padding:0;
  border:0;
  background:transparent;
  box-shadow:none;
}
[data-luviio-app] .shop-search button{
  width:38px;height:38px;display:grid;place-items:center;
  border:0;border-radius:10px;background:rgba(216,173,106,.12);color:var(--lv-gold);cursor:pointer;
}
[data-luviio-app] .filter-panel{
  display:grid;
  gap:16px;
  margin-bottom:16px;
  padding:18px;
  border:1px solid var(--lv-border);
  border-radius:18px;
  background:var(--lv-surface);
}
[data-luviio-app] .filter-group{display:grid;gap:9px}
[data-luviio-app] .filter-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.11em;color:var(--lv-gold)}
[data-luviio-app] .chip-row{display:flex;flex-wrap:wrap;gap:7px}
[data-luviio-app] .chip{
  min-height:36px;
  padding:0 12px;
  border-radius:999px;
  border:1px solid var(--lv-border);
  background:rgba(255,255,255,.03);
  color:var(--lv-muted);
  cursor:pointer;
}
[data-luviio-app] .chip.is-active{color:#0b0b0a;background:var(--lv-gold);border-color:var(--lv-gold)}
[data-luviio-app] .clear-filters{
  display:inline-flex;align-items:center;gap:6px;
  margin-bottom:18px;border:0;background:transparent;color:var(--lv-gold);cursor:pointer;
}
[data-luviio-app] .account-overview-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:12px;
  margin:20px 0;
}
[data-luviio-app] .account-stat-card{
  min-height:130px;
  padding:20px;
  border:1px solid var(--lv-border);
  border-radius:18px;
  background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.018));
}
[data-luviio-app] .account-stat-card h3{
  margin:8px 0 4px;color:var(--lv-text);font-size:1.35rem;line-height:1.15;
  overflow-wrap:anywhere;
}
[data-luviio-app] .account-links{
  display:flex;flex-wrap:wrap;gap:8px;margin:0 0 20px;
}
[data-luviio-app] .account-links a,
[data-luviio-app] .back-link,
[data-luviio-app] .cart-back{
  display:inline-flex;align-items:center;gap:7px;color:var(--lv-muted);text-decoration:none;font-size:12px;font-weight:700;
}
[data-luviio-app] .account-links a{
  min-height:40px;padding:0 13px;border:1px solid var(--lv-border);border-radius:12px;background:rgba(255,255,255,.03);color:var(--lv-text)
}
[data-luviio-app] .orders-list{
  display:grid;gap:9px;
}
[data-luviio-app] .order-row{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto auto;
  align-items:center;
  gap:16px;
  padding:16px 18px;
  border:1px solid var(--lv-border);
  border-radius:16px;
  background:rgba(255,255,255,.025);
  color:var(--lv-text);
  text-decoration:none;
}
[data-luviio-app] .order-row-main{display:grid;gap:4px}
[data-luviio-app] .order-row-main span,
[data-luviio-app] .order-row-amount{color:var(--lv-muted);font-size:12px}
[data-luviio-app] .status-pill{
  min-height:30px;display:inline-flex;align-items:center;justify-content:center;padding:0 10px;border-radius:999px;font-size:10px;font-weight:800;border:1px solid var(--lv-border)
}
[data-luviio-app] .tone-success{color:#b9e8c3;background:rgba(116,191,134,.1)}
[data-luviio-app] .tone-warning{color:#ead09d;background:rgba(216,173,106,.1)}
[data-luviio-app] .tone-danger{color:#ffaaa2;background:rgba(239,123,114,.1)}
[data-luviio-app] .tone-neutral{color:var(--lv-muted);background:rgba(255,255,255,.03)}
[data-luviio-app] .profile-card,
[data-luviio-app] .change-password-card{
  padding:clamp(20px,4vw,34px);
}
[data-luviio-app] .profile-card-header,
[data-luviio-app] .settings-section-heading,
[data-luviio-app] .change-password-header{
  display:flex;align-items:center;justify-content:space-between;gap:16px;
}
[data-luviio-app] .profile-card-header h2,
[data-luviio-app] .settings-section h2,
[data-luviio-app] .change-password-card h1,
[data-luviio-app] .checkout-section h2{
  margin:.35rem 0 0;color:var(--lv-text);letter-spacing:-.025em
}
[data-luviio-app] .profile-details{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:22px;
}
[data-luviio-app] .profile-detail{
  padding:16px;border:1px solid var(--lv-border);border-radius:14px;background:rgba(255,255,255,.025);display:grid;gap:6px;
}
[data-luviio-app] .profile-detail span{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:var(--lv-gold)}
[data-luviio-app] .profile-detail strong{color:var(--lv-text);overflow-wrap:anywhere}
[data-luviio-app] .profile-form,
[data-luviio-app] .change-password-form{display:grid;gap:16px;margin-top:22px;max-width:760px}
[data-luviio-app] .btn-row{display:flex;flex-wrap:wrap;gap:9px;align-items:center}
[data-luviio-app] .settings-page .settings-section{
  padding:22px;
  margin-top:16px;
  box-shadow:none;
}
[data-luviio-app] .settings-section-heading{justify-content:flex-start}
[data-luviio-app] .settings-heading-icon,
[data-luviio-app] .settings-title-icon,
[data-luviio-app] .change-password-icon{
  width:44px;height:44px;flex:0 0 44px;display:grid;place-items:center;border-radius:14px;background:rgba(216,173,106,.1);border:1px solid var(--lv-border-gold);color:var(--lv-gold);
}
[data-luviio-app] .settings-list{display:grid;gap:8px;margin-top:16px}
[data-luviio-app] .settings-row{
  display:grid;grid-template-columns:42px minmax(0,1fr) 21px;align-items:center;gap:12px;padding:14px;border:1px solid var(--lv-border);border-radius:15px;color:var(--lv-text);text-decoration:none;background:rgba(255,255,255,.025)
}
[data-luviio-app] .settings-row-icon{
  width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:rgba(255,255,255,.035);color:var(--lv-gold)
}
[data-luviio-app] .settings-row-copy{display:grid;gap:4px}
[data-luviio-app] .settings-row-copy small{line-height:1.45}
[data-luviio-app] .address-list.manage{display:grid;gap:10px;margin-top:20px}
[data-luviio-app] .address-card-manage{
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:16px;border:1px solid var(--lv-border);border-radius:16px;background:rgba(255,255,255,.025)
}
[data-luviio-app] .address-card-manage strong{color:var(--lv-text)}
[data-luviio-app] .address-card-manage p{margin:6px 0;color:var(--lv-muted);line-height:1.55}
[data-luviio-app] .address-form{
  display:grid;gap:14px;padding:20px;border:1px solid var(--lv-border);border-radius:18px;background:var(--lv-surface)
}
[data-luviio-app] .field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
[data-luviio-app] .check-line{display:flex;align-items:center;gap:9px;color:var(--lv-muted);font-size:12px}
[data-luviio-app] .check-line input{width:18px;min-height:18px}
[data-luviio-app] .cart-page-heading{margin-bottom:26px}
[data-luviio-app] .cart-page-heading h1{margin:.35rem 0 0;color:var(--lv-text);font-size:clamp(2.3rem,6vw,4.4rem);letter-spacing:-.045em}
[data-luviio-app] .cart-page-heading>p:last-child{margin:10px 0 0;color:var(--lv-muted)}
[data-luviio-app] .cart-layout{
  display:grid;grid-template-columns:minmax(0,1.4fr) minmax(300px,.6fr);gap:20px;align-items:start;
}
[data-luviio-app] .cart-items{display:grid;gap:10px}
[data-luviio-app] .cart-card{
  position:relative;display:grid;grid-template-columns:106px minmax(0,1fr) 38px;gap:14px;align-items:center;padding:13px;border:1px solid var(--lv-border);border-radius:18px;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.018));overflow:hidden;
}
[data-luviio-app] .cart-card-thumb{width:106px;height:106px;border-radius:14px;overflow:hidden;background:#f1eee8;display:grid;place-items:center;color:#b89143;text-decoration:none}
[data-luviio-app] .cart-card-thumb img{width:100%;height:100%;object-fit:cover;display:block}
[data-luviio-app] .cart-card-main{min-width:0;display:grid;gap:13px}
[data-luviio-app] .cart-card-copy{min-width:0}
[data-luviio-app] .cart-card-copy h2{margin:5px 0;font-size:16px;line-height:1.35}
[data-luviio-app] .cart-card-copy h2 a{color:var(--lv-text);text-decoration:none}
[data-luviio-app] .cart-unit{margin:0;color:var(--lv-muted);font-size:12px}
[data-luviio-app] .cart-card-controls{display:flex;align-items:center;justify-content:space-between;gap:12px}
[data-luviio-app] .cart-line-total{color:var(--lv-text);font-size:16px}
[data-luviio-app] .cart-qty{display:inline-flex;align-items:center;gap:2px;padding:3px;border:1px solid var(--lv-border);border-radius:11px;background:rgba(255,255,255,.025)}
[data-luviio-app] .cart-qty button{width:32px;height:32px;display:grid;place-items:center;border:0;border-radius:8px;background:transparent;color:var(--lv-text);cursor:pointer}
[data-luviio-app] .cart-qty-value{min-width:32px;text-align:center;color:var(--lv-text);font-size:12px;font-weight:800}
[data-luviio-app] .cart-remove{width:36px;height:36px;display:grid;place-items:center;border:1px solid var(--lv-border);border-radius:10px;background:rgba(255,255,255,.03);color:var(--lv-muted);cursor:pointer}
[data-luviio-app] .cart-summary{position:sticky;top:92px;padding:22px}
[data-luviio-app] .summary-lines{display:grid;gap:11px;margin:15px 0 0}
[data-luviio-app] .summary-lines>div{display:flex;align-items:center;justify-content:space-between;gap:14px;color:var(--lv-muted);font-size:12px}
[data-luviio-app] .summary-lines dt,.summary-lines dd{margin:0}
[data-luviio-app] .summary-lines .total{padding-top:14px;border-top:1px solid var(--lv-border);color:var(--lv-text);font-size:15px;font-weight:800}
[data-luviio-app] .free-ship-note,
[data-luviio-app] .cart-secure-note{display:flex;align-items:flex-start;gap:7px;margin:14px 0;color:var(--lv-muted);font-size:11px;line-height:1.5}
[data-luviio-app] .cart-utilities{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
[data-luviio-app] .product-detail{
  display:grid;grid-template-columns:minmax(0,1.08fr) minmax(360px,.92fr);gap:clamp(26px,5vw,68px);align-items:start;
}
[data-luviio-app] .gallery-main{
  position:relative;aspect-ratio:1/1;overflow:hidden;border:1px solid var(--lv-border);border-radius:24px;background:#efede7;
}
[data-luviio-app] .gallery-main img{width:100%;height:100%;object-fit:cover;display:block}
[data-luviio-app] .gallery-thumbs{display:grid;grid-template-columns:repeat(auto-fit,minmax(66px,1fr));gap:8px;margin-top:9px}
[data-luviio-app] .gallery-thumbs .thumb{aspect-ratio:1;border:1px solid var(--lv-border);border-radius:12px;overflow:hidden;padding:0;background:#efede7;cursor:pointer}
[data-luviio-app] .gallery-thumbs .thumb.is-active{border-color:rgba(216,173,106,.65);box-shadow:0 0 0 2px rgba(216,173,106,.1)}
[data-luviio-app] .gallery-thumbs img{width:100%;height:100%;object-fit:cover}
[data-luviio-app] .product-info{min-width:0}
[data-luviio-app] .product-category{margin:0;color:var(--lv-gold);font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
[data-luviio-app] .product-info>h1{margin:8px 0 12px;color:var(--lv-text);font-size:clamp(2rem,5vw,4.2rem);line-height:1.02;letter-spacing:-.045em}
[data-luviio-app] .product-summary,
[data-luviio-app] .description-block p{color:var(--lv-muted);line-height:1.75}
[data-luviio-app] .product-price{display:flex;flex-wrap:wrap;align-items:baseline;gap:9px;margin:18px 0 8px}
[data-luviio-app] .product-price .now{color:var(--lv-text);font-size:24px;font-weight:850}
[data-luviio-app] .product-price .was{color:#77716b;text-decoration:line-through;font-size:13px}
[data-luviio-app] .product-price .save{color:var(--lv-success);font-size:11px;font-weight:800}
[data-luviio-app] .stock-note{display:inline-flex;min-height:30px;align-items:center;padding:0 10px;border-radius:999px;font-size:10px;font-weight:800}
[data-luviio-app] .stock-note.in{color:#b9e8c3;background:rgba(116,191,134,.1);border:1px solid rgba(116,191,134,.2)}
[data-luviio-app] .stock-note.low{color:#ead09d;background:rgba(216,173,106,.1)}
[data-luviio-app] .stock-note.out{color:#ffaaa2;background:rgba(239,123,114,.1)}
[data-luviio-app] .qty-row{display:flex;align-items:center;gap:12px;margin:18px 0}
[data-luviio-app] .qty-row>span{color:var(--lv-muted);font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.1em}
[data-luviio-app] .qty-stepper{display:inline-flex;align-items:center;border:1px solid var(--lv-border);border-radius:12px;background:rgba(255,255,255,.025);overflow:hidden}
[data-luviio-app] .qty-stepper button{width:40px;height:42px;border:0;background:transparent;color:var(--lv-text);cursor:pointer}
[data-luviio-app] .qty-stepper input{width:54px;min-height:42px;border:0;border-left:1px solid var(--lv-border);border-right:1px solid var(--lv-border);border-radius:0;background:transparent;text-align:center;color:var(--lv-text)}
[data-luviio-app] .product-actions{display:flex;flex-wrap:wrap;gap:8px}
[data-luviio-app] .shipping-note{display:flex;align-items:center;gap:7px;color:var(--lv-muted);font-size:11px;margin:15px 0 0}
[data-luviio-app] .product-parameters{
  margin-top:26px;padding:20px;border:1px solid var(--lv-border);border-radius:18px;background:rgba(255,255,255,.025)
}
[data-luviio-app] .product-parameters-heading{display:flex;align-items:end;justify-content:space-between;gap:12px}
[data-luviio-app] .product-parameters-heading h2{margin:.35rem 0 0;font-size:1.25rem;color:var(--lv-text)}
[data-luviio-app] .attributes{margin:15px 0 0;border-top:1px solid var(--lv-border)}
[data-luviio-app] .attribute-row{display:grid;grid-template-columns:minmax(110px,.7fr) minmax(0,1.3fr);gap:14px;padding:11px 0;border-bottom:1px solid var(--lv-border)}
[data-luviio-app] .attribute-row dt{color:var(--lv-muted);font-size:12px}
[data-luviio-app] .attribute-row dd{margin:0;color:var(--lv-text);font-size:12px;overflow-wrap:anywhere}
[data-luviio-app] .description-block{margin-top:22px}
[data-luviio-app] .description-block h3{color:var(--lv-text)}
[data-luviio-app] .breadcrumbs{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px;color:var(--lv-dim);font-size:11px}
[data-luviio-app] .breadcrumbs a{color:var(--lv-muted);text-decoration:none}
[data-luviio-app] .checkout-page{
  color:var(--lv-text);
}
[data-luviio-app] .checkout-layout{
  display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:20px;align-items:start;
}
[data-luviio-app] .checkout-section{padding:20px;margin-bottom:12px;box-shadow:none}
[data-luviio-app] .checkout-section-heading{
  display:flex;align-items:end;justify-content:space-between;gap:14px;margin-bottom:15px
}
[data-luviio-app] .checkout-live-badge{
  display:inline-flex;min-height:28px;align-items:center;padding:0 9px;border-radius:999px;color:var(--lv-gold);background:rgba(216,173,106,.08);border:1px solid var(--lv-border-gold);font-size:10px;font-weight:800
}
[data-luviio-app] .payment-selector{
  display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px;border:1px solid var(--lv-border);border-radius:15px;background:rgba(255,255,255,.025)
}
[data-luviio-app] .payment-selector-copy{display:grid;gap:4px;min-width:0}
[data-luviio-app] .payment-selector-copy strong{color:var(--lv-text)}
[data-luviio-app] .payment-selector-copy small{line-height:1.45}
[data-luviio-app] .coupon-input-row{display:flex;gap:8px;margin-top:10px}
[data-luviio-app] .coupon-input-row input{min-width:0}
[data-luviio-app] .checkout-summary{position:sticky;top:92px;padding:20px}
[data-luviio-app] .order-detail-card{padding:clamp(20px,4vw,34px)}
[data-luviio-app] .order-detail-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
[data-luviio-app] .order-detail-title h1{margin:.35rem 0;color:var(--lv-text);font-size:clamp(2rem,5vw,3.6rem);letter-spacing:-.04em}
[data-luviio-app] .order-detail-actions{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}
[data-luviio-app] .order-detail-items{display:grid;gap:8px;margin-top:22px}
[data-luviio-app] .order-item{
  display:grid;grid-template-columns:66px minmax(0,1fr) auto;align-items:center;gap:12px;padding:11px;border:1px solid var(--lv-border);border-radius:14px;background:rgba(255,255,255,.025)
}
[data-luviio-app] .order-item-thumb{width:66px;height:66px;overflow:hidden;border-radius:11px;background:#efede7;display:grid;place-items:center;color:#b89143;text-decoration:none}
[data-luviio-app] .order-item-thumb img{width:100%;height:100%;object-fit:cover}
[data-luviio-app] .order-item-info{min-width:0}
[data-luviio-app] .order-item-info h3{margin:0;color:var(--lv-text);font-size:13px}
[data-luviio-app] .order-item-info p,
[data-luviio-app] .order-item-info span{color:var(--lv-muted);font-size:11px}
[data-luviio-app] .order-item-total{color:var(--lv-text);font-size:13px}
[data-luviio-app] .order-summary{padding:20px;margin-top:16px}
[data-luviio-app] .order-result{
  max-width:820px;margin:0 auto;text-align:center;padding:clamp(28px,6vw,60px) 20px
}
[data-luviio-app] .order-result-icon{color:var(--lv-gold)}
[data-luviio-app] .order-result-icon.danger{color:#ffaaa2}
[data-luviio-app] .order-result h1{margin:10px 0;color:var(--lv-text);font-size:clamp(2.3rem,6vw,4.6rem);letter-spacing:-.045em}
[data-luviio-app] .order-result>p:not(.eyebrow):not(.form-error){color:var(--lv-muted);line-height:1.7;max-width:650px;margin:0 auto 20px}
[data-luviio-app] .order-result-order-id{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:20px 0
}
[data-luviio-app] .order-result-order-id>div{padding:16px;border:1px solid var(--lv-border);border-radius:16px;background:rgba(255,255,255,.025);display:grid;gap:6px}
[data-luviio-app] .order-result-order-id span{color:var(--lv-muted);font-size:10px;text-transform:uppercase;letter-spacing:.11em}
[data-luviio-app] .order-result-order-id strong{color:var(--lv-text);font-size:18px}
[data-luviio-app] .order-result-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin-bottom:9px}
[data-luviio-app] .order-result-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:30px}
[data-luviio-app] .order-result-meta>div{padding:14px;border:1px solid var(--lv-border);border-radius:14px;background:rgba(255,255,255,.025);display:grid;place-items:center;gap:8px;color:var(--lv-muted);font-size:11px;line-height:1.4}
[data-luviio-app] .error-page{
  max-width:820px;margin:0 auto;text-align:center;padding:clamp(50px,10vw,100px) 20px
}
[data-luviio-app] .error-code{font-size:clamp(5rem,18vw,11rem);font-weight:850;line-height:.8;color:rgba(216,173,106,.18);letter-spacing:-.08em}
[data-luviio-app] .error-title{margin:22px 0 8px;color:var(--lv-text);font-size:clamp(2rem,5vw,3.8rem);letter-spacing:-.04em}
[data-luviio-app] .error-sub{color:var(--lv-muted);line-height:1.7;max-width:620px;margin:0 auto 22px}
[data-luviio-app] .error-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:8px}
[data-luviio-app] .auth-layout{
  display:grid;place-items:center;min-height:calc(100vh - 160px)
}
[data-luviio-app] .auth-card{
  width:min(520px,100%);
  margin:0 auto;
  padding:clamp(24px,5vw,38px);
  border:1px solid var(--lv-border);
  border-radius:24px;
  background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.018));
  box-shadow:0 24px 70px rgba(0,0,0,.22)
}
[data-luviio-app] .auth-card h1{margin:.35rem 0;color:var(--lv-text);font-size:clamp(2rem,5vw,3.2rem);letter-spacing:-.045em}
[data-luviio-app] .auth-sub{color:var(--lv-muted);line-height:1.65}
[data-luviio-app] .auth-card form{display:grid;gap:15px;margin-top:22px}
[data-luviio-app] .auth-footer{margin:20px 0 0;color:var(--lv-muted);font-size:12px;text-align:center}
[data-luviio-app] .auth-footer a{color:var(--lv-gold)}
[data-luviio-app] .state{
  min-height:180px;display:grid;place-items:center;gap:12px;padding:24px;text-align:center;border:1px dashed var(--lv-border);border-radius:18px;color:var(--lv-muted)
}
[data-luviio-app] .spin{animation:lv-spin 1s linear infinite}
@keyframes lv-spin{to{transform:rotate(360deg)}}
[data-luviio-app] .footer{
  margin-top:34px;
  padding:clamp(42px,6vw,70px) max(16px,calc((100vw - 1240px)/2)) 22px;
  background:#070706;
  border-top:1px solid var(--lv-border);
  color:var(--lv-muted);
}
[data-luviio-app] .footer-grid{
  display:grid;grid-template-columns:minmax(220px,1.4fr) repeat(4,minmax(130px,1fr));gap:30px
}
[data-luviio-app] .footer .brand{color:var(--lv-text);font-size:22px;font-weight:850;letter-spacing:.08em}
[data-luviio-app] .footer-tagline{max-width:330px;line-height:1.7}
[data-luviio-app] .footer-column h4{margin:0 0 12px;color:var(--lv-text);font-size:11px;text-transform:uppercase;letter-spacing:.12em}
[data-luviio-app] .footer-links,.footer-meta{display:grid;gap:8px}
[data-luviio-app] .footer a{color:var(--lv-muted);text-decoration:none;font-size:12px}
[data-luviio-app] .footer a:hover{color:var(--lv-gold)}
[data-luviio-app] .footer-bottom{display:flex;justify-content:space-between;gap:12px;margin-top:36px;padding-top:16px;border-top:1px solid var(--lv-border);font-size:11px}
[data-luviio-app] .policy-page,
[data-luviio-app] .policy-layout{
  color:var(--lv-text);
}
[data-luviio-app] .policy-card{
  padding:clamp(22px,4vw,36px);
  border:1px solid var(--lv-border);
  border-radius:22px;
  background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018));
}
[data-luviio-app] .policy-card h1,
[data-luviio-app] .policy-card h2,
[data-luviio-app] .policy-card h3{color:var(--lv-text);letter-spacing:-.025em}
[data-luviio-app] .policy-card p,
[data-luviio-app] .policy-card li{color:var(--lv-muted);line-height:1.78}
[data-luviio-app] table{width:100%;border-collapse:collapse}
[data-luviio-app] th,
[data-luviio-app] td{padding:11px;border-bottom:1px solid var(--lv-border);text-align:left;color:var(--lv-muted)}
[data-luviio-app] th{color:var(--lv-text)}
[data-luviio-app] .modal-backdrop{background:rgba(0,0,0,.72)!important;backdrop-filter:blur(8px)}
[data-luviio-app] .modal,
[data-luviio-app] [role="dialog"]{
  border-color:var(--lv-border)!important;
  border-radius:20px!important;
  background:var(--lv-surface)!important;
  color:var(--lv-text);
}
[data-luviio-app] .mobile-drawer,
[data-luviio-app] .admin-drawer{
  box-shadow:0 26px 80px rgba(0,0,0,.35)
}
[data-luviio-app] .admin-layout,
[data-luviio-app] .admin-page{
  background:var(--lv-bg)!important;color:var(--lv-text)!important
}
[data-luviio-app] .admin-panel,
[data-luviio-app] .admin-card,
[data-luviio-app] .panel-card{
  border-color:var(--lv-border)!important;
  background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.018))!important;
  color:var(--lv-text)!important
}
[data-luviio-app] .admin-panel h1,
[data-luviio-app] .admin-panel h2,
[data-luviio-app] .admin-panel h3,
[data-luviio-app] .panel-card h2,
[data-luviio-app] .panel-card h3{color:var(--lv-text)!important}
[data-luviio-app] .admin-panel p,
[data-luviio-app] .admin-panel label{color:var(--lv-muted)}
[data-luviio-app] .admin-panel input,
[data-luviio-app] .admin-panel select,
[data-luviio-app] .admin-panel textarea{
  background:rgba(255,255,255,.04)!important;color:var(--lv-text)!important;border-color:var(--lv-border)!important
}
[data-luviio-app] .admin-table{
  border-color:var(--lv-border)!important
}
@media (max-width:900px){
  [data-luviio-app] .product-detail,
  [data-luviio-app] .cart-layout,
  [data-luviio-app] .checkout-layout{grid-template-columns:1fr}
  [data-luviio-app] .cart-summary,
  [data-luviio-app] .checkout-summary{position:static}
  [data-luviio-app] .footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:640px){
  [data-luviio-app] .page.container{width:min(100% - 22px,1240px);padding:28px 0 50px}
  [data-luviio-app] .field-grid{grid-template-columns:1fr}
  [data-luviio-app] .shop-toolbar{align-items:stretch;flex-direction:column}
  [data-luviio-app] .order-row{grid-template-columns:1fr}
  [data-luviio-app] .cart-card{grid-template-columns:74px minmax(0,1fr);padding:10px}
  [data-luviio-app] .cart-card-thumb{width:74px;height:74px}
  [data-luviio-app] .cart-remove{position:absolute;top:10px;right:10px}
  [data-luviio-app] .cart-card-controls{align-items:flex-end;flex-direction:column}
  [data-luviio-app] .order-detail-header{flex-direction:column}
  [data-luviio-app] .order-result-order-id,
  [data-luviio-app] .order-result-meta{grid-template-columns:1fr}
  [data-luviio-app] .payment-selector{align-items:stretch;flex-direction:column}
  [data-luviio-app] .coupon-input-row{flex-direction:column}
  [data-luviio-app] .footer-grid{grid-template-columns:1fr}
  [data-luviio-app] .footer-bottom{flex-direction:column}
  [data-luviio-app] .product-actions .btn{flex:1 1 150px}
}
`;

export default function LuviioInlineTheme() {
  return <style data-luviio-inline-theme>{CSS}</style>;
}
