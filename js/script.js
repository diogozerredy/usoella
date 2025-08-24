// ==========================
// Menu mobile
// ==========================
const toggle = document.querySelector('.menu-toggle');
const header = document.querySelector('.site-header');

toggle?.addEventListener('click', () => {
  const isOpen = header.classList.toggle('menu-open');
  toggle.setAttribute('aria-expanded', String(isOpen));
});

// Fechar menu ao clicar em um link (mobile)
document.querySelectorAll('#primary-nav a').forEach(a => {
  a.addEventListener('click', () => {
    header.classList.remove('menu-open');
    toggle?.setAttribute('aria-expanded', 'false');
  });
});

// CTA "Compre Agora" -> rolar até novidades
document.getElementById('cta-comprar')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('novidades')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ==========================
// Carrinho (LocalStorage)
// ==========================
function loadCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(product) {
  let cart = loadCart();
  const existing = cart.find(p => p.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
  alert(`${product.name} adicionado ao carrinho.`);
}

function removeFromCart(id) {
  let cart = loadCart().filter(p => p.id !== id);
  saveCart(cart);
}

// Exibir carrinho em qualquer página que tenha container
function renderCart(containerId = "cart-items", subtotalId = "subtotal") {
  const cart = loadCart();
  const container = document.getElementById(containerId);
  if (!container) return;

  let subtotal = 0;
  container.innerHTML = "";
  if (cart.length === 0) {
    container.innerHTML = "<p>Seu carrinho está vazio.</p>";
  } else {
    cart.forEach(item => {
      subtotal += item.price * item.qty;
      container.innerHTML += `
        <div class="cart-item" style="margin:1rem 0; padding:1rem; border:1px solid #eee; border-radius:10px;">
          <strong>${item.name}</strong><br>
          R$ ${item.price.toFixed(2)} x ${item.qty}<br>
          <button class="btn btn-outline" onclick="removeFromCart('${item.id}'); renderCart('${containerId}','${subtotalId}')">Remover</button>
        </div>`;
    });
  }

  const subtotalEl = document.getElementById(subtotalId);
  if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
}

// ==========================
// Checkout via WhatsApp
// ==========================
function sendWhatsAppOrder(numero = "5588999999999") {
  const cart = loadCart();
  if (cart.length === 0) {
    alert("Carrinho vazio!");
    return;
  }

  let message = "🛍️ Pedido:\n\n";
  let total = 0;
  cart.forEach(item => {
    message += `• ${item.name} (${item.qty}x) - R$ ${(item.price * item.qty).toFixed(2)}\n`;
    total += item.price * item.qty;
  });
  message += `\n💰 Total: R$ ${total.toFixed(2)}`;

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

// ==========================
// Bind botões "Compre Agora"
// ==========================

document.querySelectorAll('.btn-add-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    try {
      const data = JSON.parse(btn.dataset.product);
      addToCart(data);
    } catch (err) {
      console.error('Produto inválido no data-product', err);
    }
  });
});

// ==========================
// Carrinho Flutuante
// ==========================
function updateFloatingCart() {
  const cart = loadCart();
  const countEl = document.getElementById('cart-count');
  const dropdown = document.getElementById('cart-dropdown-items');
  if (!countEl || !dropdown) return;

  // Atualiza contagem
  let totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  countEl.textContent = totalQty;

  // Renderiza lista dropdown
  dropdown.innerHTML = "";
  if (cart.length === 0) {
    dropdown.innerHTML = "<p>Seu carrinho está vazio.</p>";
    return;
  }
  cart.forEach(item => {
    dropdown.innerHTML += `
      <div class="cart-dropdown-item">
        <img src="${item.thumb || 'https://via.placeholder.com/50'}" alt="${item.name}">
        <div>
          <strong>${item.name}</strong><br>
          ${item.qty}x R$ ${item.price.toFixed(2)}
        </div>
      </div>
    `;
  });
}

// Toggle abrir/fechar dropdown
document.getElementById('cart-button')?.addEventListener('click', () => {
  document.getElementById('cart-dropdown')?.classList.toggle('hidden');
});

// Atualiza carrinho flutuante ao carregar
updateFloatingCart();