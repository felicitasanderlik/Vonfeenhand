/* ═══════════════════════════════════════
   von Feenhand · app.js
   Gemeinsame Logik: Cart, Modal, Nav, Toast
   ═══════════════════════════════════════ */

// ══════════════════════════════
// CART (localStorage)
// ══════════════════════════════
let cart = JSON.parse(localStorage.getItem('vfh_cart') || '[]');

function saveCart() {
  localStorage.setItem('vfh_cart', JSON.stringify(cart));
}

function addToCart(id, name, price, image = '') {
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty++; }
  else { cart.push({ id, name, price, image, qty: 1 }); }
  saveCart();
  updateCartUI();
  showToast(`„${name}" zum Korb hinzugefügt 🧶`);
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
}

function getCartTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function getCartCount() {
  return cart.reduce((s, i) => s + i.qty, 0);
}

function updateCartUI() {
  const count = getCartCount();

  // Badge
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.style.display = count > 0 ? 'flex' : 'none';
    badge.textContent = count;
  }

  // Total
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) {
    totalEl.textContent = '€ ' + getCartTotal().toFixed(2).replace('.', ',');
  }

  // Items
  const itemsEl = document.getElementById('cartItems');
  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="cart-empty">Dein Korb ist noch leer 🧶</div>';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">€ ${(item.price).toFixed(2).replace('.', ',')}</div>
        <div class="cart-item-qty">Menge: ${item.qty}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" aria-label="Entfernen">✕</button>
    </div>
  `).join('');
}

// ══════════════════════════════
// CART DRAWER
// ══════════════════════════════
function openCart() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

function toggleCart() {
  const drawer = document.getElementById('cartDrawer');
  if (drawer?.classList.contains('open')) { closeCart(); }
  else { openCart(); }
}

// ══════════════════════════════
// CHECKOUT
// ══════════════════════════════
function checkoutPaypal() {
  if (cart.length === 0) { showToast('Dein Korb ist leer!'); return; }
  // TODO: PayPal integration
  showToast('PayPal-Zahlung wird vorbereitet...');
}

function checkoutTransfer() {
  if (cart.length === 0) { showToast('Dein Korb ist leer!'); return; }
  // TODO: Bestellbestätigung per E-Mail
  showToast('Bestellung wird per E-Mail bestätigt...');
}

// ══════════════════════════════
// MODAL
// ══════════════════════════════
const modalContents = {
  impressum: `
    <h2>Impressum</h2>
    <h3>Angaben gemäß § 5 ECG</h3>
    <address>
      Felicitas Anderlik<br>
      von Feenhand<br>
      [Straße Nr.], [PLZ] [Ort]<br>
      Österreich
    </address>
    <h3>Kontakt</h3>
    <p>E-Mail: feenhand@gmail.com</p>
    <h3>Unternehmensgegenstand</h3>
    <p>Herstellung und Verkauf von handgefertigten Häkelfiguren und -artikeln.</p>
    <h3>EU-Streitschlichtung</h3>
    <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
    <a href="https://ec.europa.eu/consumers/odr/" target="_blank" style="color:var(--sage-dark)">ec.europa.eu/consumers/odr</a></p>
    <h3>Haftungsausschluss</h3>
    <p>Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte
    externer Links. Für den Inhalt verlinkter Seiten sind ausschließlich deren Betreiber verantwortlich.</p>
  `,
  datenschutz: `
    <h2>Datenschutzerklärung</h2>
    <h3>Verantwortliche Stelle</h3>
    <p>Felicitas Anderlik · feenhand@gmail.com</p>
    <h3>Datenerhebung</h3>
    <p>Wir erheben nur Daten, die für die Bestellabwicklung und Kommunikation notwendig sind
    (Name, E-Mail-Adresse, Lieferadresse).</p>
    <h3>Speicherdauer</h3>
    <p>Bestelldaten werden gemäß gesetzlicher Aufbewahrungspflicht für 7 Jahre gespeichert.</p>
    <h3>Ihre Rechte</h3>
    <p>Sie haben das Recht auf Auskunft, Berichtigung und Löschung Ihrer Daten.
    Kontakt: feenhand@gmail.com</p>
    <h3>Cookies</h3>
    <p>Diese Website verwendet ausschließlich technisch notwendige Cookies (Warenkorb).</p>
  `,
  agb: `
    <h2>Allgemeine Geschäftsbedingungen</h2>
    <h3>Vertragspartner</h3>
    <p>Felicitas Anderlik, von Feenhand, Österreich</p>
    <h3>Bestellung & Zahlung</h3>
    <p>Bestellungen sind verbindlich nach Bestellbestätigung per E-Mail. Wir akzeptieren
    PayPal sowie Vorausüberweisung. Bei Überweisung wird nach Zahlungseingang versandt.</p>
    <h3>Versand</h3>
    <p>Versand österreichweit. Versandkosten werden im Bestellprozess angezeigt.
    Lieferzeit: 3–7 Werktage nach Zahlungseingang.</p>
    <h3>Widerrufsrecht</h3>
    <p>Bei individuell angefertigten Einzelstücken besteht kein Widerrufsrecht gemäß
    § 18 Abs. 1 Z 3 FAGG. Bei Lagerware gilt das gesetzliche Rückgaberecht von 14 Tagen.</p>
    <h3>Gewährleistung</h3>
    <p>Es gelten die gesetzlichen Gewährleistungsbestimmungen.</p>
  `
};

function openModal(type) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  if (!overlay || !content) return;
  content.innerHTML = modalContents[type] || '<p>Inhalt nicht gefunden.</p>';
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ══════════════════════════════
// TOAST
// ══════════════════════════════
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  clearTimeout(toastTimer);
  t.textContent = msg;
  t.classList.add('show');
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ══════════════════════════════
// SCROLL & ANIMATIONS
// ══════════════════════════════
function initScrollEffects() {
  // Nav scroll class
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  // Fade-in observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 70);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ══════════════════════════════
// NAV ACTIVE LINK
// ══════════════════════════════
function setActiveNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ══════════════════════════════
// INIT
// ══════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  initScrollEffects();
  setActiveNavLink();

  // Modal outside click
  document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
});
