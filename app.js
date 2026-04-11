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

function addToCart(id, name, price, image = '') {
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty++; }
  else { cart.push({ id, name, price, image, qty: 1 }); }
  saveCart(); updateCartUI();
  showToast(`"${name}" zum Korb hinzugefügt 🧶`);
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart(); updateCartUI();
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
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">€ ${item.price.toFixed(2).replace('.', ',')}</div>
        <div class="cart-item-qty">Menge: ${item.qty}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
    </div>
  `).join('');
}

function openCart() { document.getElementById('cartDrawer')?.classList.add('open'); document.getElementById('cartOverlay')?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeCart() { document.getElementById('cartDrawer')?.classList.remove('open'); document.getElementById('cartOverlay')?.classList.remove('open'); document.body.style.overflow = ''; }
function toggleCart() { document.getElementById('cartDrawer')?.classList.contains('open') ? closeCart() : openCart(); }

async function checkoutPaypal() {
  if (cart.length === 0) { showToast('Dein Korb ist leer!'); return; }
  try {
    await sbInsert('orders', { items: cart, total: getCartTotal(), payment_method: 'paypal', payment_status: 'pending' });
    showToast('Bestellung gespeichert! PayPal wird vorbereitet...');
  } catch(e) { showToast('Fehler beim Speichern.'); }
}

async function checkoutTransfer() {
  if (cart.length === 0) { showToast('Dein Korb ist leer!'); return; }
  try {
    await sbInsert('orders', { items: cart, total: getCartTotal(), payment_method: 'transfer', payment_status: 'pending' });
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
