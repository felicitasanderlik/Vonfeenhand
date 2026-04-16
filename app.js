
// ── CART RESERVATIONS ──
const SESSION_ID = localStorage.getItem('vfh_session') || (() => {
  const id = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  localStorage.setItem('vfh_session', id);
  return id;
})();

const RESERVATION_MINUTES = 10;
let reservationTimer = null;

async function reserveStock(productId, combiIdx, qty = 1) {
  const until = new Date(Date.now() + RESERVATION_MINUTES * 60000).toISOString();
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/cart_reservations`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ session_id: SESSION_ID, product_id: productId, combi_idx: combiIdx, qty, reserved_until: until })
    });
  } catch(e) { console.log('Reserve error:', e); }
}

async function releaseStock(productId, combiIdx) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/cart_reservations?session_id=eq.${SESSION_ID}&product_id=eq.${productId}&combi_idx=eq.${combiIdx ?? 'null'}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
  } catch(e) {}
}

async function releaseAllStock() {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/cart_reservations?session_id=eq.${SESSION_ID}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
  } catch(e) {}
}

async function getReservedQty(productId, combiIdx) {
  try {
    // Aktive Reservierungen von ANDEREN Sessions
    const now = new Date().toISOString();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cart_reservations?product_id=eq.${productId}&combi_idx=eq.${combiIdx ?? 'null'}&reserved_until=gt.${now}&session_id=neq.${SESSION_ID}`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const data = await res.json();
    return data.reduce((s, r) => s + (r.qty || 1), 0);
  } catch(e) { return 0; }
}

function updateCombiAvailDisplay(delta) {
  const availEl = document.getElementById('combiAvail');
  if (!availEl || !availEl.textContent) return;
  const match = availEl.textContent.match(/\d+/);
  if (!match) return;
  const current = parseInt(match[0]) + delta;
  if (current <= 0) availEl.innerHTML = '<span style="color:#c0392b;">Ausverkauft</span>';
  else if (current <= 3) availEl.innerHTML = '<span style="color:#e67e22;">Nur noch ' + current + ' verfügbar</span>';
  else availEl.innerHTML = '<span style="color:var(--sage-dark);">' + current + ' verfügbar</span>';
}

function startReservationTimer() {
  clearTimeout(reservationTimer);
  if (cart.length === 0) return;
  reservationTimer = setTimeout(async () => {
    if (cart.length > 0) {
      showToast('⏰ Dein Warenkorb wurde geleert — die Artikel sind wieder verfügbar.', 'error');
      await releaseAllStock();
      cart = [];
      saveCart();
      updateCartUI();
    }
  }, RESERVATION_MINUTES * 60000);
}


// ── KONFETTI ──
function launchConfetti() {
  const colors = ['#8B9E89','#5a7057','#e8ede7','#faf8f4','#C8A84B'];
  const count = 80;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;
      left:${Math.random()*100}vw;
      top:-10px;
      width:${6 + Math.random()*8}px;
      height:${6 + Math.random()*8}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      z-index:9999;
      pointer-events:none;
      animation:confettiFall ${1.5 + Math.random()*2}s ease-in forwards;
      animation-delay:${Math.random()*0.8}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
  // CSS falls noch nicht vorhanden
  if (!document.getElementById('confettiStyle')) {
    const style = document.createElement('style');
    style.id = 'confettiStyle';
    style.textContent = `@keyframes confettiFall {
      0%   { transform: translateY(0) rotate(0deg); opacity:1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity:0; }
    }`;
    document.head.appendChild(style);
  }
}

/* ═══════════════════════════════════════
   von Feenhand · app.js
   Supabase + Cart + Modal + Toast + Nav
   ═══════════════════════════════════════ */

const SUPABASE_URL = 'https://uveihedjoqrdejycqqeu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2ZWloZWRqb3FyZGVqeWNxcWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTA4MDYsImV4cCI6MjA5MTQ4NjgwNn0.H6k7qrc_YMWgvKDqk-_nIYKQjJqVogBgx6EUFOTIhvo';

async function sbFetch(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}

async function sbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Insert error: ${res.status}`);
  return true;
}

function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/images/${path}`;
}

// ── CART ──
let cart = JSON.parse(localStorage.getItem('vfh_cart') || '[]');

function saveCart() { localStorage.setItem('vfh_cart', JSON.stringify(cart)); }

function addToCart(id, name, price, image = '', colors = [], productId = null, combiIdx = null, maxQty = null) {
  const existing = cart.find(i => i.id === id);
  // Gesamt-Menge aller Varianten dieses Produkts im Warenkorb
  const totalInCart = productId
    ? cart.filter(i => i.productId === productId).reduce((s, i) => s + i.qty, 0)
    : (existing ? existing.qty : 0);

  const effectiveMax = maxQty !== null && maxQty !== undefined ? maxQty : (existing ? existing.maxQty : null);

  if (effectiveMax !== null && effectiveMax !== undefined && totalInCart >= effectiveMax) {
    showToast('Maximale verfügbare Menge erreicht!', 'error');
    return;
  }

  if (existing) {
    existing.qty++;
    if (effectiveMax !== null) existing.maxQty = effectiveMax;
  } else {
    cart.push({ id, name, price, image, colors, qty: 1, productId, combiIdx, maxQty: effectiveMax });
  }
  saveCart(); updateCartUI();
  if (productId) reserveStock(productId, combiIdx, 1);
  startReservationTimer();
  updateCombiAvailDisplay(-1);
  showToast(`"${name}" zum Korb hinzugefügt 🧶`);
  // Cart Icon Pop Animation
  const cartBtn = document.querySelector('.nav-cart-fixed');
  if (cartBtn) {
    cartBtn.style.transform = 'scale(1.35)';
    cartBtn.style.transition = 'transform 0.15s';
    setTimeout(() => { cartBtn.style.transform = 'scale(1)'; }, 200);
  }
}

function editCartItem(cartId, productId) {
  sessionStorage.setItem('vfh_edit_cart_id', cartId);
  closeCart();
  window.location.href = 'produkt.html?id=' + productId;
}

function removeFromCart(id) {
  const item = cart.find(i => i.id === id);
  if (item && item.productId) releaseStock(item.productId, item.combiIdx);
  cart = cart.filter(i => i.id !== id);
  saveCart(); updateCartUI();
  updateCombiAvailDisplay(1);
  if (cart.length === 0) clearTimeout(reservationTimer);
}

function getCartTotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
function getCartCount() { return cart.reduce((s, i) => s + i.qty, 0); }

function updateCartUI() {
  const count = getCartCount();
  const badge = document.getElementById('cartBadge');
  if (badge) { badge.style.display = count > 0 ? 'flex' : 'none'; badge.textContent = count; }
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = '€ ' + getCartTotal().toFixed(2).replace('.', ',');
  const itemsEl = document.getElementById('cartItems');
  if (!itemsEl) return;
  if (cart.length === 0) { itemsEl.innerHTML = '<div class="cart-empty">Dein Korb ist noch leer 🧶</div>'; return; }
  itemsEl.innerHTML = cart.map(item => {
    const productId = item.id.split('_')[0];
    return `
    <div class="cart-item">
      <div class="cart-item-img">${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        ${item.colors && item.colors.length > 0 ? `<div style="display:flex;gap:3px;margin-top:3px;">${item.colors.map(c => `<div style="width:14px;height:14px;border-radius:50%;background:${c};border:1px solid rgba(0,0,0,0.1);flex-shrink:0;"></div>`).join('')}</div>` : ''}
        <div class="cart-item-price">€ ${item.price.toFixed(2).replace('.', ',')}</div>
        <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.3rem;">
          <button onclick="changeQty('${item.id}', -1)" style="width:24px;height:24px;border-radius:50%;border:1px solid var(--border);background:white;cursor:pointer;font-size:0.9rem;line-height:1;display:flex;align-items:center;justify-content:center;">−</button>
          <span style="font-size:0.85rem;min-width:16px;text-align:center;">${item.qty}</span>
          <button onclick="changeQty('${item.id}', +1)" style="width:24px;height:24px;border-radius:50%;border:1px solid var(--border);background:white;cursor:pointer;font-size:0.9rem;line-height:1;display:flex;align-items:center;justify-content:center;">+</button>
        </div>
        <button onclick="editCartItem('${item.id}', '${productId}')"
          style="background:none;border:none;font-size:0.7rem;color:var(--sage-dark);cursor:pointer;padding:0;margin-top:0.2rem;letter-spacing:0.05em;">
          Produkt ändern →
        </button>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
    </div>`;
  }).join('');
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty <= 0) { removeFromCart(id); return; }
  if (item.maxQty !== null && item.maxQty !== undefined && newQty > item.maxQty) {
    showToast('Maximale Menge erreicht!', 'error'); return;
  }
  // Pool check
  const total = item.productId
    ? cart.filter(i => i.productId === item.productId).reduce((s,i) => s + i.qty, 0) + delta
    : newQty;
  if (item.maxQty !== null && item.maxQty !== undefined && total > item.maxQty) {
    showToast('Maximale Menge erreicht!', 'error'); return;
  }
  item.qty = newQty;
  if (delta > 0 && item.productId) reserveStock(item.productId, item.combiIdx, 1);
  if (delta < 0 && item.productId) releaseStock(item.productId, item.combiIdx);
  saveCart(); updateCartUI();
  updateCombiAvailDisplay(-delta);
}

function openCart() { document.getElementById('cartDrawer')?.classList.add('open'); document.getElementById('cartOverlay')?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeCart() { document.getElementById('cartDrawer')?.classList.remove('open'); document.getElementById('cartOverlay')?.classList.remove('open'); document.body.style.overflow = ''; }
function toggleCart() { document.getElementById('cartDrawer')?.classList.contains('open') ? closeCart() : openCart(); }

function goToCheckout() {
  if (cart.length === 0) { showToast('Dein Warenkorb ist leer', 'error'); return; }
  closeCart();
  window.location.href = 'checkout.html';
}

async function checkoutPaypal() {
  if (cart.length === 0) { showToast('Dein Korb ist leer!'); return; }
  try {
    await sbInsert('orders', { items: cart, total: getCartTotal(), payment_method: 'paypal', payment_status: 'pending' });
    launchConfetti();
    showToast('Bestellung gespeichert! PayPal wird vorbereitet...');
  } catch(e) { showToast('Fehler beim Speichern.'); }
}

async function checkoutTransfer() {
  if (cart.length === 0) { showToast('Dein Korb ist leer!'); return; }
  try {
    await sbInsert('orders', { items: cart, total: getCartTotal(), payment_method: 'transfer', payment_status: 'pending' });
    launchConfetti();
    showToast('Bestellung gespeichert! Bestätigung kommt per E-Mail.');
  } catch(e) { showToast('Fehler beim Speichern.'); }
}

// ── MODAL ──
const modalContents = {
  impressum: `<h2>Impressum</h2><h3>Angaben gemäß § 5 ECG</h3><address>Felicitas Anderlik<br>von Feenhand<br>[Straße Nr.], [PLZ] [Ort]<br>Österreich</address><h3>Kontakt</h3><p>E-Mail: feenhand@gmail.com</p><h3>EU-Streitschlichtung</h3><p><a href="https://ec.europa.eu/consumers/odr/" target="_blank" style="color:var(--sage-dark)">ec.europa.eu/consumers/odr</a></p>`,
  datenschutz: `<h2>Datenschutzerklärung</h2><h3>Verantwortliche Stelle</h3><p>Felicitas Anderlik · feenhand@gmail.com</p><h3>Datenerhebung</h3><p>Nur Daten die für Bestellabwicklung notwendig sind.</p><h3>Cookies</h3><p>Nur technisch notwendige Cookies (Warenkorb).</p>`,
  agb: `<h2>AGB</h2><h3>Zahlung</h3><p>PayPal oder Vorausüberweisung. Versand nach Zahlungseingang.</p><h3>Versand</h3><p>Österreichweit, 3–7 Werktage.</p><h3>Widerrufsrecht</h3><p>Bei individuell angefertigten Stücken kein Widerrufsrecht gemäß § 18 Abs. 1 Z 3 FAGG.</p>`
};

function openModal(type) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  if (!overlay || !content) return;
  content.innerHTML = modalContents[type] || '';
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() { document.getElementById('modalOverlay')?.classList.remove('open'); document.body.style.overflow = ''; }

// ── TOAST ──
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  clearTimeout(toastTimer);
  t.textContent = msg;
  t.classList.add('show');
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── INIT ──
function initScrollEffects() {
  const navbar = document.getElementById('navbar');
  if (navbar) window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 30));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) { setTimeout(() => entry.target.classList.add('visible'), i * 70); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  initScrollEffects();
  document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
});
