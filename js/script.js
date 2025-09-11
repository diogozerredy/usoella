// ==========================
// MENU MOBILE
// ==========================
const toggle = document.querySelector(".menu-toggle");
const header = document.querySelector(".site-header");
const menu = document.querySelector("#primary-nav");

toggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = header.classList.toggle("menu-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});

menu?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    header.classList.remove("menu-open");
    toggle?.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", (e) => {
  if (header.classList.contains("menu-open") && !header.contains(e.target)) {
    header.classList.remove("menu-open");
    toggle?.setAttribute("aria-expanded", "false");
  }
});

menu?.addEventListener("click", (e) => e.stopPropagation());

document.getElementById("cta-comprar")?.addEventListener("click", (e) => {
  e.preventDefault();
  document
    .getElementById("novidades")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ==========================
// CARRINHO - LOCALSTORAGE
// ==========================
function loadCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function getThumbForItem(item) {
  const itemId = String(item.id || "");
  const produtos = window.__produtos || [];
  if (!itemId) return item.thumb || "https://via.placeholder.com/120";

  let matchedProd = null;
  produtos.forEach((p) => {
    const pid = String(p.id || "");
    if (!pid) return;
    if (
      itemId === pid ||
      itemId.startsWith(pid + "-") ||
      itemId.startsWith(pid)
    ) {
      if (!matchedProd || pid.length > String(matchedProd.id).length) {
        matchedProd = p;
      }
    }
  });

  const prod = matchedProd;
  if (!prod) {
    return item.thumb || "https://via.placeholder.com/120";
  }

  const imgsMeta = Array.isArray(prod.imagens)
    ? prod.imagens.map((it) =>
        typeof it === "string"
          ? { src: it }
          : { src: it.src || it.url || "", color: it.color || it.colorName }
      )
    : prod.imagem
    ? [{ src: prod.imagem }]
    : [];

  if (item.cor) {
    const corKey = String(item.cor).toLowerCase();
    const matched = imgsMeta.find(
      (m) => m.color && String(m.color).toLowerCase() === corKey
    );
    if (matched && matched.src) return matched.src;
    const found = imgsMeta.find(
      (m) => m.src && String(m.src).toLowerCase().includes(corKey)
    );
    if (found && found.src) return found.src;
  }

  if (imgsMeta.length && imgsMeta[0].src) return imgsMeta[0].src;

  if (Array.isArray(prod.imagens) && prod.imagens.length) {
    const first = prod.imagens[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && (first.src || first.url)) {
      return first.src || first.url;
    }
  }

  return prod.imagem || item.thumb || "https://via.placeholder.com/120";
}

// ==========================
// RENDERIZAÇÃO DO CARRINHO
// ==========================
function renderCartGeneric({ containerId, totalId, isModal = false }) {
  const cart = loadCart();
  const container = document.getElementById(containerId);
  const totalEl = document.getElementById(totalId);
  if (!container || !totalEl) return;

  container.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    container.innerHTML = "<p>Seu carrinho está vazio.</p>";
  } else {
    cart.forEach((item) => {
      total += item.price * item.qty;
      const thumb = getThumbForItem(item) || "https://via.placeholder.com/120";
      if (isModal) {
        container.innerHTML += `
          <div class="cart-item-preview" data-cart-id="${item.id}">
            <img src="${thumb}" alt="${item.name}">
            <div>
              <strong>${item.name}</strong><br>
              ${item.qty}x R$ ${item.price.toFixed(2)}<br>
              <small>Cor: <strong>${
                item.cor ?? "—"
              }</strong> — Tamanho: <strong>${
          item.tamanho ?? "—"
        }</strong></small><br>
              <div style="margin-top:.35rem;">
                <button class="btn btn-outline modal-remove-btn" data-remove-id="${
                  item.id
                }">Remover</button>
              </div>
            </div>
          </div>
        `;
      } else {
        container.innerHTML += `
          <div class="cart-item">
            <img src="${thumb}" alt="${item.name}">
            <div class="cart-item-info">
              <strong>${item.name}</strong>
              <span>R$ ${item.price.toFixed(2)}</span>
            </div>
            <div>
              <div class="cart-item-actions">
                <button class="qty-btn" onclick="changeQty('${
                  item.id
                }', -1)">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="changeQty('${
                  item.id
                }', 1)">+</button>
              </div>
              <a class="remover" href="#" onclick="event.preventDefault(); requestRemove('${
                item.id
              }')">Remover</a>
            </div>
            <div class="item-total"><strong>R$ ${(
              item.price * item.qty
            ).toFixed(2)}</strong></div>
          </div>
        `;
      }
    });
  }

  totalEl.textContent = total.toFixed(2);

  if (isModal) {
    container.querySelectorAll(".modal-remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.removeId;
        if (id) requestRemove(id);
      });
    });
  }
}

function renderCart(containerId = "cart-items", totalId = "subtotal") {
  renderCartGeneric({ containerId, totalId, isModal: false });
}

function renderCartModal() {
  renderCartGeneric({
    containerId: "cart-modal-items",
    totalId: "cart-modal-total",
    isModal: true,
  });
}

// ==========================
// CARRINHO FLUTUANTE
// ==========================
function updateFloatingCart() {
  const cart = loadCart();
  const countEl = document.getElementById("cart-count");
  if (!countEl) return;
  countEl.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

// ==========================
// MODAL DE PRODUTO
// ==========================
let selectedProduct = null;
let selectedColor = null;
let selectedSize = null;
let selectedImageIndex = 0;
let modalImages = [];
let modalImagesMeta = [];

function updateModalImage(index) {
  const img = document.getElementById("modal-produto-img");
  if (!img || !modalImages || modalImages.length === 0) return;
  if (index < 0) index = modalImages.length - 1;
  if (index >= modalImages.length) index = 0;
  selectedImageIndex = index;
  img.src = modalImages[selectedImageIndex] || "";
}

function openProductModal(product) {
  selectedProduct = product;
  selectedColor = null;
  selectedSize = null;
  selectedImageIndex = 0;
  modalImages = [];
  modalImagesMeta = [];

  if (Array.isArray(product.imagens)) {
    product.imagens.forEach((it) => {
      if (typeof it === "string") {
        modalImagesMeta.push({ src: it });
        modalImages.push(it);
      } else if (it && typeof it === "object") {
        const src = it.src || it.url || "";
        const color = it.color || it.colorName || null;
        if (src) {
          modalImagesMeta.push({ src, color });
          modalImages.push(src);
        }
      }
    });
  } else if (product.imagem) {
    modalImagesMeta.push({ src: product.imagem });
    modalImages.push(product.imagem);
  }

  const modal = document.getElementById("produto-modal");
  const nome = document.getElementById("modal-produto-nome");
  const preco = document.getElementById("modal-produto-preco");
  const descricao = document.getElementById("modal-produto-descricao"); // Pega o elemento da descrição
  const img = document.getElementById("modal-produto-img");
  const coresContainer = document.getElementById("modal-cores");
  const tamanhosContainer = document.getElementById("modal-tamanhos");
  const btnConfirmar = document.getElementById("confirmar-compra");

  nome.textContent = product.nome;
  preco.textContent = `R$ ${product.preco.toFixed(2)}`;
  descricao.textContent = product.descricao || ""; // Adiciona a descrição
  img.src = modalImages[0] || "https://via.placeholder.com/200";

  // Render cores
  coresContainer.innerHTML = "";
  const productColors = modalImagesMeta
    .map((imgMeta) => imgMeta.color)
    .filter((color, index, self) => color && self.indexOf(color) === index);

  if (productColors.length > 0) {
    productColors.forEach((cor) => {
      const btn = document.createElement("button");
      btn.textContent = cor;
      btn.className = "opcao-btn";
      btn.dataset.color = cor;

      const corKey = String(cor).toLowerCase();
      const matchedIndex = modalImagesMeta.findIndex(
        (m) => m.color && String(m.color).toLowerCase() === corKey
      );
      if (matchedIndex >= 0) {
        btn.dataset.imgIndex = String(matchedIndex);
      }

      btn.onclick = () => {
        selectedColor = cor;
        document
          .querySelectorAll("#modal-cores .opcao-btn")
          .forEach((b) => b.classList.remove("ativo"));
        btn.classList.add("ativo");

        const idx = parseInt(btn.dataset.imgIndex ?? "-1", 10);
        if (idx >= 0) {
          updateModalImage(idx);
        }
        checkConfirm();
      };
      coresContainer.appendChild(btn);
    });
  } else {
    coresContainer.innerHTML = "<small>Cor única</small>";
    selectedColor = "Única";
  }

  // Render tamanhos
  tamanhosContainer.innerHTML = "";
  if (product.tamanhos?.length > 0) {
    product.tamanhos.forEach((tamanho) => {
      const btn = document.createElement("button");
      btn.textContent = tamanho;
      btn.className = "opcao-btn";
      btn.onclick = () => {
        selectedSize = tamanho;
        document
          .querySelectorAll("#modal-tamanhos .opcao-btn")
          .forEach((b) => b.classList.remove("ativo"));
        btn.classList.add("ativo");
        checkConfirm();
      };
      tamanhosContainer.appendChild(btn);
    });
  } else {
    tamanhosContainer.innerHTML = "<small>Tamanho único</small>";
    selectedSize = "Único";
  }

  // Carousel controls
  const prevBtn = modal.querySelector(".carousel-prev");
  const nextBtn = modal.querySelector(".carousel-next");
  const newPrev = prevBtn.cloneNode(true);
  const newNext = nextBtn.cloneNode(true);
  prevBtn.parentNode.replaceChild(newPrev, prevBtn);
  nextBtn.parentNode.replaceChild(newNext, nextBtn);
  newPrev.addEventListener("click", () =>
    updateModalImage(selectedImageIndex - 1)
  );
  newNext.addEventListener("click", () =>
    updateModalImage(selectedImageIndex + 1)
  );

  checkConfirm();
  modal.classList.remove("hidden");
}

function closeProductModal() {
  document.getElementById("produto-modal").classList.add("hidden");
}

function checkConfirm() {
  const btn = document.getElementById("confirmar-compra");
  btn.disabled = !(selectedColor && selectedSize);
}

document
  .getElementById("close-produto-modal")
  ?.addEventListener("click", closeProductModal);
document.getElementById("confirmar-compra")?.addEventListener("click", () => {
  if (!selectedColor || !selectedSize) {
    showNotification("Por favor, selecione cor e tamanho.", false);
    return;
  }
  if (!selectedProduct) {
    alert("Nenhum produto selecionado.");
    return;
  }
  const cart = loadCart();
  const id = `${selectedProduct.id}-${selectedColor}-${selectedSize}`;
  const existing = cart.find((p) => p.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id,
      name: selectedProduct.nome,
      price: selectedProduct.preco,
      qty: 1,
      thumb: modalImages.length > 0 ? modalImages[0] : "",
      cor: selectedColor,
      tamanho: selectedSize,
    });
  }
  saveCart(cart);
  updateFloatingCart();
  renderCart();
  renderCartModal();
  closeProductModal();
  showNotification("Produto adicionado ao carrinho!");
});

// ==========================
// MODAL DO CARRINHO
// ==========================
document.getElementById("cart-button")?.addEventListener("click", () => {
  renderCartModal();
  document.getElementById("cart-modal")?.classList.remove("hidden");
});

document.getElementById("close-cart-modal")?.addEventListener("click", () => {
  document.getElementById("cart-modal")?.classList.add("hidden");
});

document.getElementById("cart-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "cart-modal")
    document.getElementById("cart-modal")?.classList.add("hidden");
});

// ==========================
// REMOÇÃO DE ITENS
// ==========================
let pendingRemoveId = null;

function requestRemove(id) {
  pendingRemoveId = id;
  const item = loadCart().find((p) => p.id === id);
  const msgEl = document.getElementById("remove-confirm-message");
  if (msgEl) {
    msgEl.textContent = item
      ? `Deseja remover "${item.name}" do carrinho?`
      : "Deseja remover este item?";
  }
  document.getElementById("remove-confirm-modal")?.classList.remove("hidden");
}

function confirmRemove() {
  if (!pendingRemoveId) return;
  let cart = loadCart().filter((p) => p.id !== pendingRemoveId);
  saveCart(cart);
  pendingRemoveId = null;
  document.getElementById("remove-confirm-modal")?.classList.add("hidden");
  renderCart();
  renderCartModal();
  updateFloatingCart();
}

function cancelRemove() {
  pendingRemoveId = null;
  document.getElementById("remove-confirm-modal")?.classList.add("hidden");
}

document
  .getElementById("remove-confirm-btn")
  ?.addEventListener("click", confirmRemove);
document
  .getElementById("cancel-remove-btn")
  ?.addEventListener("click", cancelRemove);
document
  .getElementById("remove-confirm-modal")
  ?.addEventListener("click", (e) => {
    if (e.target.id === "remove-confirm-modal") cancelRemove();
  });

// ==========================
// ALTERAÇÃO DE QUANTIDADE
// ==========================
function changeQty(id, delta) {
  let cart = loadCart();
  let item = cart.find((p) => p.id === id);
  if (!item) return;

  if (delta < 0 && item.qty === 1) {
    requestRemove(id);
    return;
  }
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((p) => p.id !== id);
  }
  saveCart(cart);
  updateFloatingCart();
  renderCart();
  renderCartModal();
}

// ==========================
// INICIALIZAÇÃO
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  updateFloatingCart();

  (function waitProdutos(attempt = 0) {
    if (window.__produtos && window.__produtos.length > 0) {
      renderCart();
      return;
    }
    if (attempt >= 20) {
      renderCart();
      return;
    }
    setTimeout(() => waitProdutos(attempt + 1), 100);
  })();

  document
    .getElementById("cart-modal-open-cart")
    ?.addEventListener("click", () => {
      window.location.href = "carrinho.html";
    });
  document
    .getElementById("cart-modal-buy-now")
    ?.addEventListener("click", () => {
      if (typeof sendWhatsAppOrder === "function") {
        sendWhatsAppOrder();
      } else {
        window.location.href = "carrinho.html";
      }
    });
});
