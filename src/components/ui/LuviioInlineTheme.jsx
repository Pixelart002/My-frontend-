const CSS = `
html,body,#root{margin:0;min-width:0;background:#080808;color:#f5efe8;font-family:DM Sans,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%}
html{scroll-behavior:smooth}
*,*::before,*::after{box-sizing:border-box}
body{overflow-x:hidden}
img,svg,video,canvas{max-width:100%}
a{color:inherit}
button,input,select,textarea{font:inherit}

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
  [data-luviio-app] .home-hero-grid,
  [data-luviio-app] .home-overview-grid,
  [data-luviio-app] .home-value-grid{grid-template-columns:1fr!important}
  [data-luviio-app] .home-highlight-stats{grid-template-columns:1fr!important}
  [data-luviio-app] .product-detail,
  [data-luviio-app] .cart-layout,
  [data-luviio-app] .checkout-layout{grid-template-columns:1fr}
  [data-luviio-app] .cart-summary,
  [data-luviio-app] .checkout-summary{position:static}
 
[data-luviio-app] .pagination{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin:26px auto;padding:8px}
[data-luviio-app] .page-btn{width:40px;min-width:40px;height:40px;display:grid;place-items:center;padding:0;border:1px solid var(--lv-border);border-radius:11px;color:var(--lv-muted);background:rgba(255,255,255,.025);cursor:pointer}
[data-luviio-app] .page-btn:hover:not(:disabled),[data-luviio-app] .page-btn.is-active{color:#0b0b0a;border-color:var(--lv-gold);background:var(--lv-gold)}
[data-luviio-app] .page-btn:disabled{opacity:.35;cursor:not-allowed}
[data-luviio-app] .page-ellipsis{width:28px;text-align:center;color:var(--lv-muted)}
[data-luviio-app] .state{width:100%;max-width:100%;box-sizing:border-box;overflow:hidden}
[data-luviio-app] .state-icon{width:54px;height:54px;display:grid;place-items:center;margin:0 auto;border:1px solid var(--lv-border-gold);border-radius:16px;color:var(--lv-gold);background:rgba(216,173,106,.07)}
[data-luviio-app] .state-icon-alert{color:#f08a8a;border-color:rgba(240,138,138,.25);background:rgba(240,138,138,.06)}
[data-luviio-app] .state-title{color:var(--lv-text);font-weight:800;font-size:15px}
[data-luviio-app] .state-message{max-width:620px;margin:0 auto;color:var(--lv-muted);line-height:1.65;overflow-wrap:anywhere}
[data-luviio-app] .state-action-row{display:flex;justify-content:center;flex-wrap:wrap;gap:10px}
[data-luviio-app] .products-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,245px),1fr));gap:clamp(14px,2vw,20px);align-items:stretch}
[data-luviio-app] .skeleton{background:linear-gradient(90deg,rgba(255,255,255,.045),rgba(255,255,255,.09),rgba(255,255,255,.045));background-size:200% 100%;animation:lv-shimmer 1.5s linear infinite}
[data-luviio-app] .skeleton-media{aspect-ratio:1;border-radius:18px}
[data-luviio-app] .skeleton-line{height:14px;margin-top:12px;border-radius:8px}
[data-luviio-app] .skeleton-line-short{width:62%}
[data-luviio-app] .confirm-dialog-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:max(18px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));background:rgba(0,0,0,.76);backdrop-filter:blur(10px)}
[data-luviio-app] .confirm-dialog{width:min(460px,100%);max-height:min(88vh,680px);overflow:auto;padding:22px;border:1px solid var(--lv-border);border-radius:22px;background:#10100f;color:var(--lv-text);box-shadow:0 30px 100px rgba(0,0,0,.55)}
[data-luviio-app] .confirm-dialog-header{display:flex;align-items:center;justify-content:space-between;gap:12px}
[data-luviio-app] .confirm-dialog-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;color:var(--lv-gold);background:rgba(216,173,106,.08);border:1px solid var(--lv-border-gold)}
[data-luviio-app] .confirm-dialog-icon.is-danger{color:#f08a8a;border-color:rgba(240,138,138,.25);background:rgba(240,138,138,.07)}
[data-luviio-app] .confirm-dialog-close{width:42px;height:42px;display:grid;place-items:center;border:1px solid var(--lv-border);border-radius:12px;color:var(--lv-muted);background:rgba(255,255,255,.035);cursor:pointer}
[data-luviio-app] .confirm-dialog h2{margin:20px 0 8px;color:var(--lv-text);font-size:22px;letter-spacing:-.025em}
[data-luviio-app] .confirm-dialog p{margin:0;color:var(--lv-muted);line-height:1.65;overflow-wrap:anywhere}
[data-luviio-app] .confirm-dialog .btn-row{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;margin-top:24px}
@keyframes lv-shimmer{to{background-position:-200% 0}}
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

/* CHECKOUT — scoped, self-contained; no external checkout stylesheet required */
[data-luviio-app] .checkout{padding-top:clamp(28px,5vw,60px);overflow-x:clip}
[data-luviio-app] .checkout-back{display:inline-flex;align-items:center;gap:7px;margin:0 0 24px;padding:0;border:0;background:transparent;color:var(--lv-muted);font-size:13px;cursor:pointer}
[data-luviio-app] .checkout-back:hover{color:var(--lv-gold);transform:translateX(-2px)}
[data-luviio-app] .checkout-heading{max-width:760px;margin-bottom:20px}
[data-luviio-app] .checkout-heading .eyebrow{display:flex;align-items:center;gap:7px;margin-bottom:10px}
[data-luviio-app] .checkout-subtitle{margin:12px 0 0!important;color:var(--lv-muted);line-height:1.6}
[data-luviio-app] .checkout-steps{display:flex;align-items:center;width:min(680px,100%);margin:0 0 30px;color:var(--lv-dim);font-size:11px;text-transform:uppercase;letter-spacing:.1em}
[data-luviio-app] .checkout-steps span{display:flex;align-items:center;gap:7px;white-space:nowrap}
[data-luviio-app] .checkout-steps b{display:grid;place-items:center;width:27px;height:27px;border:1px solid var(--lv-border);border-radius:50%;font-size:11px}
[data-luviio-app] .checkout-steps i{flex:1;height:1px;min-width:18px;margin:0 10px;background:var(--lv-border)}
[data-luviio-app] .checkout-steps .is-complete,[data-luviio-app] .checkout-steps .is-current{color:var(--lv-gold)}
[data-luviio-app] .checkout-steps .is-complete b,[data-luviio-app] .checkout-steps .is-current b{border-color:var(--lv-gold);background:var(--lv-gold);color:#080808}
[data-luviio-app] .checkout-layout-refined{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,380px);gap:clamp(20px,4vw,42px);align-items:start}
[data-luviio-app] .checkout-main{min-width:0;display:flex;flex-direction:column;gap:16px}
[data-luviio-app] .checkout-section{min-width:0;padding:clamp(18px,3vw,26px);border:1px solid var(--lv-border);border-radius:20px;background:linear-gradient(145deg,rgba(255,255,255,.025),transparent 55%),var(--lv-surface);box-shadow:0 12px 32px rgba(0,0,0,.12)}
[data-luviio-app] .checkout-section h2{display:flex;align-items:center;gap:8px;margin:0 0 18px;color:var(--lv-text);font-size:13px;letter-spacing:.11em}
[data-luviio-app] .checkout-section h2::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.06)}
[data-luviio-app] .checkout-section-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}
[data-luviio-app] .checkout-section-heading h2{margin:0}
[data-luviio-app] .section-kicker{margin:0 0 4px;font-size:10px;letter-spacing:.14em;text-transform:uppercase}
[data-luviio-app] .checkout-live-badge{flex:0 0 auto;padding:6px 10px;border:1px solid var(--lv-border-gold);border-radius:999px;color:var(--lv-gold);font-size:10px;white-space:nowrap}
[data-luviio-app] .address-list{display:flex;flex-direction:column;gap:9px;min-width:0}
[data-luviio-app] .address-card{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);min-width:0;gap:11px;padding:14px;border:1px solid var(--lv-border);border-radius:16px;background:#0b0b0a;box-sizing:border-box;cursor:pointer}
[data-luviio-app] .address-card:hover{border-color:var(--lv-border-gold)}
[data-luviio-app] .address-card.is-selected{border-color:var(--lv-gold);background:linear-gradient(90deg,rgba(216,173,106,.09),transparent 75%),#0b0b0a;box-shadow:0 0 0 1px rgba(216,173,106,.1)}
[data-luviio-app] .address-card p{margin:5px 0;color:var(--lv-muted);font-size:12px;line-height:1.5;overflow-wrap:anywhere}
[data-luviio-app] .address-card strong{font-size:14px}
[data-luviio-app] .address-card input{margin-top:3px;accent-color:var(--lv-gold)}
[data-luviio-app] .address-flow-note{display:flex;align-items:flex-start;gap:10px;margin-top:14px;padding:12px 14px;border:1px solid rgba(216,173,106,.18);border-radius:12px;background:rgba(216,173,106,.05)}
[data-luviio-app] .address-flow-note svg{flex:0 0 auto;margin-top:2px;color:var(--lv-gold)}
[data-luviio-app] .address-flow-note div{display:grid;gap:2px;min-width:0}
[data-luviio-app] .address-flow-note strong{font-size:13px}
[data-luviio-app] .address-flow-note span{font-size:12px;line-height:1.45;color:var(--lv-muted)}
[data-luviio-app] .payment-selector{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px;border:1px solid var(--lv-border);border-radius:16px;background:#0b0b0a;box-sizing:border-box}
[data-luviio-app] .payment-selector-copy{min-width:0;display:flex;flex-direction:column;gap:5px}
[data-luviio-app] .payment-selector-label{display:flex;align-items:center;gap:6px;color:var(--lv-gold);font-size:12px}
[data-luviio-app] .payment-selector-copy strong{font-size:15px;overflow-wrap:anywhere}
[data-luviio-app] .payment-selector-copy small{color:var(--lv-muted);line-height:1.5;overflow-wrap:anywhere}
[data-luviio-app] .coupon-input-row{display:flex;gap:8px;min-width:min(100%,340px)}
[data-luviio-app] .coupon-input-row input{min-width:0;flex:1;border:1px solid var(--lv-border);border-radius:12px;background:var(--lv-surface);color:var(--lv-text);padding:11px 12px;outline:none}
[data-luviio-app] .coupon-input-row input:focus{border-color:var(--lv-gold);box-shadow:0 0 0 3px rgba(216,173,106,.08)}
[data-luviio-app] .checkout-summary{position:sticky;top:90px;align-self:start;min-width:0;width:100%;padding:24px;border:1px solid var(--lv-border);border-radius:20px;background:linear-gradient(145deg,rgba(255,255,255,.03),transparent 55%),var(--lv-surface);box-sizing:border-box}
[data-luviio-app] .checkout-summary .summary-items{margin:14px 0;padding:0 0 10px;list-style:none;border-bottom:1px solid rgba(255,255,255,.07)}
[data-luviio-app] .checkout-summary .summary-items li{display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:13px;min-width:0}
[data-luviio-app] .checkout-summary .summary-items li span{min-width:0;overflow-wrap:anywhere}
[data-luviio-app] .checkout-summary .summary-items li strong{white-space:nowrap}
[data-luviio-app] .checkout-summary .summary-lines{display:grid;gap:12px}
[data-luviio-app] .checkout-summary .summary-lines>div{display:flex;justify-content:space-between;gap:12px;min-width:0}
[data-luviio-app] .checkout-summary .summary-lines dt{color:var(--lv-muted)}
[data-luviio-app] .checkout-summary .summary-lines dd{margin:0;text-align:right;color:var(--lv-text);white-space:nowrap}
[data-luviio-app] .checkout-summary .final-cost-row{margin-top:8px;padding-top:15px;border-top:1px solid var(--lv-gold)}
[data-luviio-app] .checkout-summary .final-cost-row dt{font-weight:800;color:var(--lv-text)}
[data-luviio-app] .checkout-summary .final-cost-row dd{font-size:21px;font-weight:800;color:var(--lv-gold);white-space:nowrap}
[data-luviio-app] .checkout-shipping-detail{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06)}
[data-luviio-app] .checkout-shipping-detail span{display:grid;gap:2px;min-width:0}
[data-luviio-app] .checkout-shipping-detail b{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
[data-luviio-app] .checkout-shipping-detail small{font-size:11px;color:var(--lv-dim)}
[data-luviio-app] .checkout-shipping-detail em{font-style:normal;font-size:10px;padding:4px 7px;border-radius:999px;color:var(--lv-gold);background:rgba(216,173,106,.1);white-space:nowrap}
[data-luviio-app] .shipping-courier-list{display:grid;gap:10px;margin-top:14px}
[data-luviio-app] .shipping-courier-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;padding:13px 14px;border:1px solid var(--lv-border);border-radius:14px;background:rgba(255,255,255,.02);cursor:pointer}
[data-luviio-app] .shipping-courier-card.is-selected{border-color:var(--lv-gold);background:rgba(216,173,106,.07)}
[data-luviio-app] .shipping-courier-card input{accent-color:var(--lv-gold)}
[data-luviio-app] .shipping-courier-copy{display:grid;gap:3px;min-width:0}
[data-luviio-app] .shipping-courier-copy strong{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
[data-luviio-app] .shipping-courier-copy small{font-size:11px;color:var(--lv-dim)}
[data-luviio-app] .shipping-courier-price{font-weight:800;white-space:nowrap}
[data-luviio-app] .checkout-loading-page{min-height:60vh;display:grid;place-items:center}
[data-luviio-app] .checkout-cancel-modal-backdrop{position:fixed;inset:0;z-index:10050;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.78);backdrop-filter:blur(12px);box-sizing:border-box}
[data-luviio-app] .checkout-cancel-modal{width:min(440px,100%);max-height:min(90dvh,620px);overflow:auto;padding:24px;border:1px solid var(--lv-border-gold);border-radius:22px;background:var(--lv-surface);box-shadow:0 30px 90px rgba(0,0,0,.7);color:var(--lv-text)}
[data-luviio-app] .checkout-cancel-modal-icon{display:grid;place-items:center;width:48px;height:48px;margin-bottom:16px;border:1px solid rgba(239,123,114,.35);border-radius:14px;background:rgba(239,123,114,.12);color:#d99584}
[data-luviio-app] .checkout-cancel-modal-copy{display:grid;gap:7px}
[data-luviio-app] .checkout-cancel-modal-copy h3{margin:0;font-size:clamp(24px,6vw,31px);line-height:1.08}
[data-luviio-app] .checkout-cancel-modal-copy p:last-child{margin:4px 0 0;color:var(--lv-muted);font-size:13px;line-height:1.6}
[data-luviio-app] .checkout-cancel-modal-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:22px}
[data-luviio-app] .checkout-cancel-modal-actions .btn{min-height:48px;width:100%;justify-content:center}
[data-luviio-app] .checkout-cancel-danger{background:#8d4031!important;color:#fff!important;border-color:#a75343!important}
[data-luviio-app] .address-form{display:grid;gap:12px}
[data-luviio-app] .address-form .field-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
[data-luviio-app] .address-form .field{display:grid;gap:6px;min-width:0}
[data-luviio-app] .address-form label{color:var(--lv-muted);font-size:11px;font-weight:700}
[data-luviio-app] .address-form input,[data-luviio-app] .address-form select{width:100%;min-height:46px;padding:11px 12px;border:1px solid var(--lv-border);border-radius:12px;background:#0b0b0a;color:var(--lv-text);outline:none}
[data-luviio-app] .address-form input:focus,[data-luviio-app] .address-form select:focus{border-color:var(--lv-gold);box-shadow:0 0 0 3px rgba(216,173,106,.08)}
[data-luviio-app] .check-line{display:flex!important;align-items:center;gap:8px;color:var(--lv-muted);font-size:12px}
[data-luviio-app] .check-line input{width:16px;height:16px;accent-color:var(--lv-gold)}
[data-luviio-app] .form-error{margin-top:10px;padding:11px 13px;border:1px solid rgba(239,123,114,.28);border-radius:12px;background:rgba(239,123,114,.07);color:#f0aaa4;font-size:12px;line-height:1.5;overflow-wrap:anywhere}
@media(max-width:1080px){[data-luviio-app] .checkout-layout-refined{display:flex!important;flex-direction:column!important;width:100%!important;gap:18px!important}[data-luviio-app] .checkout-main,[data-luviio-app] .checkout-section,[data-luviio-app] .checkout-summary{width:100%;max-width:100%}[data-luviio-app] .checkout-summary{position:static;order:2}}
@media(max-width:700px){[data-luviio-app] .checkout{padding-top:24px}[data-luviio-app] .checkout-section{padding:16px}[data-luviio-app] .checkout-section-heading{gap:10px}[data-luviio-app] .checkout-live-badge{font-size:9px;padding:5px 8px}[data-luviio-app] .payment-selector{align-items:stretch;flex-direction:column;gap:12px}[data-luviio-app] .payment-selector .btn{width:100%;justify-content:center}[data-luviio-app] .coupon-input-row{width:100%}[data-luviio-app] .checkout-summary{padding:18px}[data-luviio-app] .address-card{grid-template-columns:auto minmax(0,1fr);padding:13px}[data-luviio-app] .address-form .field-grid{grid-template-columns:1fr}[data-luviio-app] .checkout-cancel-modal{padding:20px}[data-luviio-app] .checkout-cancel-modal-actions{grid-template-columns:1fr}}
@media(max-width:480px){[data-luviio-app] .checkout-steps{width:100%;font-size:9px}[data-luviio-app] .checkout-steps i{margin-inline:5px;min-width:10px}[data-luviio-app] .checkout-steps span{flex-direction:column;gap:3px;text-align:center}[data-luviio-app] .checkout-steps b{width:24px;height:24px}[data-luviio-app] .checkout-section{padding:14px}[data-luviio-app] .checkout-summary{padding:16px}[data-luviio-app] .coupon-input-row{flex-direction:column}[data-luviio-app] .coupon-input-row .btn{width:100%}[data-luviio-app] .checkout-shipping-detail{align-items:flex-start}}

/* Payment method modal — fully owned by the inline Luviio storefront theme. */
[data-luviio-app] .payment-modal-backdrop{
  position:fixed;
  inset:0;
  z-index:10060;
  display:grid;
  place-items:center;
  padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));
  background:rgba(0,0,0,.78);
  backdrop-filter:blur(12px) saturate(.82);
  -webkit-backdrop-filter:blur(12px) saturate(.82);
  box-sizing:border-box;
  overflow:auto;
}
[data-luviio-app] .payment-modal{
  position:relative;
  width:min(600px,100%);
  max-width:600px;
  max-height:min(820px,calc(100dvh - 24px));
  display:flex;
  flex-direction:column;
  min-width:0;
  overflow:hidden auto;
  padding:22px;
  border:1px solid var(--lv-border-gold);
  border-radius:22px;
  background:linear-gradient(145deg,rgba(216,173,106,.055),rgba(255,255,255,.012) 45%),#101010;
  color:var(--lv-text);
  box-shadow:0 30px 100px rgba(0,0,0,.72);
  box-sizing:border-box;
  overscroll-behavior:contain;
}
[data-luviio-app] .payment-modal-header{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px;
  min-width:0;
  padding:0 0 16px;
  border-bottom:1px solid var(--lv-border-soft);
}
[data-luviio-app] .payment-modal-title-wrap{
  min-width:0;
  display:grid;
  gap:5px;
}
[data-luviio-app] .payment-modal-header h3{
  margin:0;
  min-width:0;
  color:var(--lv-text);
  font-family:"Playfair Display",Georgia,serif;
  font-size:clamp(24px,5vw,34px);
  line-height:1.08;
  font-weight:600;
  overflow-wrap:anywhere;
}
[data-luviio-app] .payment-modal-close{
  flex:0 0 46px;
  width:46px!important;
  min-width:46px;
  height:46px;
  min-height:46px;
  display:grid;
  place-items:center;
  padding:0;
  border:1px solid var(--lv-border);
  border-radius:14px;
  background:#151515;
  color:var(--lv-muted);
}
[data-luviio-app] .payment-modal-close:hover{border-color:rgba(216,173,106,.45);background:#1a1814;color:var(--lv-text)}
[data-luviio-app] .payment-modal-body{
  min-width:0;
  padding:18px 2px 8px;
}
[data-luviio-app] .payment-modal-options{
  display:grid;
  gap:12px;
  min-width:0;
}
[data-luviio-app] .payment-option{
  position:relative;
  display:grid;
  grid-template-columns:48px minmax(0,1fr);
  align-items:center;
  gap:14px;
  min-width:0;
  width:100%;
  padding:15px;
  border:1px solid var(--lv-border);
  border-radius:16px;
  background:#0b0b0a;
  color:var(--lv-text);
  cursor:pointer;
  box-sizing:border-box;
  transition:border-color .18s ease,background-color .18s ease,box-shadow .18s ease,transform .18s ease;
}
[data-luviio-app] .payment-option:hover,
[data-luviio-app] .payment-option.is-selected{
  border-color:var(--lv-gold);
  background:rgba(216,173,106,.065);
  box-shadow:0 0 0 1px rgba(216,173,106,.12);
}
[data-luviio-app] .payment-option:active{transform:translateY(1px)}
[data-luviio-app] .payment-option input{
  position:absolute;
  width:1px;
  height:1px;
  margin:-1px;
  padding:0;
  border:0;
  overflow:hidden;
  clip:rect(0 0 0 0);
  clip-path:inset(50%);
  white-space:nowrap;
}
[data-luviio-app] .payment-option:focus-within{
  outline:2px solid var(--lv-gold);
  outline-offset:2px;
}
[data-luviio-app] .payment-option-icon{
  width:48px;
  height:48px;
  display:grid;
  place-items:center;
  border:1px solid rgba(216,173,106,.14);
  border-radius:14px;
  background:#151515;
  color:var(--lv-gold);
}
[data-luviio-app] .payment-option-copy{
  min-width:0;
  display:grid;
  gap:6px;
}
[data-luviio-app] .payment-option-topline{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  min-width:0;
}
[data-luviio-app] .payment-option-topline strong{
  min-width:0;
  color:var(--lv-text);
  font-size:16px;
  line-height:1.3;
  overflow-wrap:anywhere;
}
[data-luviio-app] .payment-option-copy small{
  display:block;
  min-width:0;
  color:var(--lv-muted);
  font-size:12px;
  line-height:1.5;
  overflow-wrap:anywhere;
}
[data-luviio-app] .payment-option-check{
  flex:0 0 auto;
  display:grid;
  place-items:center;
  color:var(--lv-gold);
}
[data-luviio-app] .payment-option-meta{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
  min-width:0;
}
[data-luviio-app] .payment-option-meta span{
  display:inline-flex;
  align-items:center;
  min-height:24px;
  padding:4px 8px;
  border:1px solid rgba(255,255,255,.08);
  border-radius:999px;
  background:rgba(255,255,255,.025);
  color:var(--lv-dim);
  font-size:10px;
  line-height:1.2;
}
[data-luviio-app] .payment-modal-actions{
  display:flex;
  justify-content:flex-end;
  gap:10px;
  min-width:0;
  margin-top:8px;
  padding-top:16px;
  border-top:1px solid var(--lv-border-soft);
}
[data-luviio-app] .payment-modal-actions .btn{
  min-height:48px;
  min-width:120px;
  justify-content:center;
}
[data-luviio-app] .payment-modal-primary{
  min-height:48px;
}
[data-luviio-app] .payment-modal-review,
[data-luviio-app] .payment-modal-active{
  min-width:0;
}
[data-luviio-app] .payment-modal-payment{
  min-width:0;
  padding:2px 0;
}
[data-luviio-app] .payment-modal-payment #payment-element{
  width:100%;
  max-width:100%;
  min-width:0;
  padding:0!important;
  border:0!important;
  background:transparent!important;
}
[data-luviio-app] .payment-review{
  display:grid;
  gap:12px;
  min-width:0;
}
[data-luviio-app] .payment-review-card{
  min-width:0;
  padding:14px;
  border:1px solid var(--lv-border);
  border-radius:14px;
  background:#0b0b0a;
}
[data-luviio-app] .payment-review-heading{
  display:flex;
  align-items:center;
  gap:8px;
  color:var(--lv-text);
}
[data-luviio-app] .payment-review-address{
  display:grid;
  gap:3px;
  margin-top:10px;
  color:var(--lv-muted);
  font-size:12px;
  line-height:1.5;
  overflow-wrap:anywhere;
}
[data-luviio-app] .payment-review-address strong{color:var(--lv-text);font-size:13px}
[data-luviio-app] .payment-review-address p{margin:0}
[data-luviio-app] .payment-review-total{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:8px 14px;
  align-items:center;
}
[data-luviio-app] .payment-review-total span{color:var(--lv-muted);font-size:12px}
[data-luviio-app] .payment-review-total strong{color:var(--lv-text);font-size:13px;text-align:right;overflow-wrap:anywhere}
[data-luviio-app] .payment-review-secure{
  display:flex;
  align-items:flex-start;
  gap:7px;
  min-width:0;
  color:var(--lv-muted);
  font-size:11px;
  line-height:1.5;
}
[data-luviio-app] .payment-success-state{
  display:grid;
  justify-items:center;
  gap:10px;
  padding:22px 10px;
  text-align:center;
}
[data-luviio-app] .payment-success-state strong{font-size:18px;color:var(--lv-text)}
[data-luviio-app] .payment-success-state p{max-width:460px;margin:0;color:var(--lv-muted);font-size:13px;line-height:1.6}
@media(max-width:640px){
  [data-luviio-app] .payment-modal-backdrop{place-items:end center;padding:8px}
  [data-luviio-app] .payment-modal{
    width:100%;
    max-width:100%;
    max-height:calc(100dvh - 16px);
    padding:18px;
    border-radius:20px;
  }
  [data-luviio-app] .payment-modal-header h3{font-size:26px}
  [data-luviio-app] .payment-modal-body{padding-inline:0}
  [data-luviio-app] .payment-option{grid-template-columns:44px minmax(0,1fr);gap:12px;padding:13px}
  [data-luviio-app] .payment-option-icon{width:44px;height:44px;border-radius:12px}
  [data-luviio-app] .payment-modal-actions{display:grid;grid-template-columns:1fr 1fr}
  [data-luviio-app] .payment-modal-actions .btn{width:100%;min-width:0}
}
@media(max-width:420px){
  [data-luviio-app] .payment-modal{padding:15px;border-radius:18px}
  [data-luviio-app] .payment-modal-close{flex-basis:42px;width:42px!important;min-width:42px;height:42px;min-height:42px}
  [data-luviio-app] .payment-option{grid-template-columns:40px minmax(0,1fr);gap:10px;padding:12px}
  [data-luviio-app] .payment-option-icon{width:40px;height:40px}
  [data-luviio-app] .payment-option-topline strong{font-size:15px}
  [data-luviio-app] .payment-option-copy small{font-size:11px}
  [data-luviio-app] .payment-modal-actions{grid-template-columns:1fr}
}


`;

export default function LuviioInlineTheme() {
  return <style data-luviio-inline-theme>{CSS}</style>;
}
