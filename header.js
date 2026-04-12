/* ═══════════════════════════════════════
   von Feenhand · header.js
   Gemeinsamer Header + Cart Drawer + Modal
   ═══════════════════════════════════════ */

(function() {

  // Aktive Seite ermitteln
  const page = (window.location.pathname.split('/').pop() || 'index.html').split('?')[0];

  // Basis-Pfad (für GitHub Pages Unterordner)
  const base = '';

  const navLinks = [
    { href: 'about.html', label: 'Über mich' },
    { href: 'galerie.html', label: 'Galerie' },
    { href: 'shop.html', label: 'Shop' },
    { href: 'kontakt.html', label: 'Kontakt' },
  ];

  const navHTML = `
<nav id="navbar">
  <button class="nav-burger" onclick="toggleBurger()" aria-label="Menü" id="burgerBtn">
    <span></span><span></span><span></span>
  </button>
  <div class="burger-dropdown" id="burgerDropdown">
    ${navLinks.map(l => `<a href="${base}${l.href}">${l.label}</a>`).join('\n    ')}
  </div>
  <a href="${base}index.html" class="nav-brand">
    <img src="${base}logo.png" alt="von Feenhand Logo">
    <div class="nav-wordmark">
      <span style="font-family:'Raleway',sans-serif;font-weight:300;font-size:0.72rem;letter-spacing:0.12em;">von</span>
      <span style="font-family:'Tangerine',cursive;font-weight:700;font-size:2.6rem;line-height:1;">feenhand</span>
      <span style="font-family:'Raleway',sans-serif;font-weight:300;font-size:0.72rem;letter-spacing:0.12em;">gemacht</span>
    </div>
  </a>
  <button class="nav-cart-fixed" onclick="toggleCart()" aria-label="Warenkorb">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
    <span class="cart-badge" id="cartBadge"></span>
  </button>
  <div class="nav-bottom">
    <ul class="nav-links">
      ${navLinks.map(l => `<li><a href="${base}${l.href}"${page === l.href ? ' class="active"' : ''}>${l.label}</a></li>`).join('\n      ')}
    </ul>
  </div>
</nav>

<!-- CART DRAWER -->
<div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>
<div class="cart-drawer" id="cartDrawer">
  <div class="cart-head">
    <h3>Warenkorb</h3>
    <button class="btn-close" onclick="closeCart()">✕</button>
  </div>
  <div class="cart-items" id="cartItems"></div>
  <div class="cart-foot">
    <div class="cart-total">
      <span>Gesamt</span>
      <span class="cart-total-amount" id="cartTotal">€ 0,00</span>
    </div>
    <div class="cart-actions">
      <button class="btn-paypal" onclick="checkoutPaypal()">💳 Mit PayPal bezahlen</button>
      <button class="btn-transfer" onclick="checkoutTransfer()">Per Vorausüberweisung</button>
    </div>
    <p class="cart-note">Versand österreichweit · inkl. MwSt.</p>
  </div>
</div>

<!-- MODAL -->
<div class="modal-overlay" id="modalOverlay">
  <div class="modal">
    <button class="modal-close-btn" onclick="closeModal()">✕</button>
    <div id="modalContent"></div>
  </div>
</div>

<!-- TOAST -->
<div class="toast" id="toast"></div>
`;

  // Footer HTML
  const footerHTML = `
<footer>
  <div class="footer-grid">
    <div>
      <span class="footer-logo">von Feenhand</span>
      <p class="footer-tagline">Handgefertigte Häkelfiguren aus Wien.<br>Jedes Stück ein Unikat mit Charakter.</p>
    </div>
    <div class="footer-col">
      <h4>Seiten</h4>
      <ul>
        ${navLinks.map(l => `<li><a href="${base}${l.href}">${l.label}</a></li>`).join('\n        ')}
      </ul>
    </div>
    <div class="footer-col">
      <h4>Rechtliches</h4>
      <ul>
        <li><a href="#" onclick="openModal('impressum');return false;">Impressum</a></li>
        <li><a href="#" onclick="openModal('datenschutz');return false;">Datenschutz</a></li>
        <li><a href="#" onclick="openModal('agb');return false;">AGB</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2025 von Feenhand · Felicitas Anderlik</span>
    <span>Gemacht mit ♥ und viel Garn</span>
  </div>
</footer>
`;

  // In DOM einfügen
  document.addEventListener('DOMContentLoaded', function() {
    // Nav vor dem ersten Element im Body einfügen
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // Footer nur auf bestimmten Seiten
    const noFooter = ['produkt.html'];
    if (!document.querySelector('footer') && !noFooter.includes(page)) {
      document.body.insertAdjacentHTML('beforeend', footerHTML);
    }

    // Burger JS
    window.toggleBurger = function() {
      const dd = document.getElementById('burgerDropdown');
      const btn = document.getElementById('burgerBtn');
      dd.classList.toggle('open');
      btn.classList.toggle('open');
    };

    document.addEventListener('click', function(e) {
      const dd = document.getElementById('burgerDropdown');
      const btn = document.getElementById('burgerBtn');
      if (dd && btn && !btn.contains(e.target) && !dd.contains(e.target)) {
        dd.classList.remove('open');
        btn.classList.remove('open');
      }
    });
  });

})();
