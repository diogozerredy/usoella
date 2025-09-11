let notificationTimeout;

// ==========================
// NOTIFICAÇÃO (MODAL HÍBRIDO)
// ==========================
function showNotification(message, success = true, requireAction = false) {
  const notificationModal = document.getElementById("notification-alert-modal");
  const notificationMessage = document.getElementById(
    "notification-alert-message"
  );
  const notificationIcon = document.getElementById("notification-alert-icon");
  const okButton = document.getElementById("notification-alert-ok-btn");

  if (
    !notificationModal ||
    !notificationMessage ||
    !notificationIcon ||
    !okButton
  ) {
    console.error("Elementos do modal de notificação não encontrados.");
    return;
  }

  notificationMessage.textContent = message;

  // Define o ícone
  notificationIcon.className = "";
  if (success) {
    notificationIcon.classList.add("fas", "fa-check-circle", "success-icon");
  } else {
    notificationIcon.classList.add(
      "fas",
      "fa-exclamation-triangle",
      "error-icon"
    );
  }

  // Decide se mostra o botão ou usa o temporizador
  if (requireAction) {
    okButton.style.display = "block"; // Mostra o botão OK
  } else {
    okButton.style.display = "none"; // Esconde o botão OK

    // Limpa qualquer temporizador anterior e cria um novo
    clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(() => {
      notificationModal.classList.add("hidden");
    }, 1000); // Fecha o modal após 2 segundos
  }

  notificationModal.classList.remove("hidden");
}

// Evento para fechar o modal de notificação via botão OK
document
  .getElementById("notification-alert-ok-btn")
  ?.addEventListener("click", () => {
    document
      .getElementById("notification-alert-modal")
      ?.classList.add("hidden");
  });
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

  // Lógica para encontrar a imagem com base na nova estrutura
  if (item.cor && Array.isArray(prod.imagens_por_cor)) {
    const corGroup = prod.imagens_por_cor.find((g) => g.cor === item.cor);
    if (
      corGroup &&
      Array.isArray(corGroup.imagens_cor) &&
      corGroup.imagens_cor.length > 0
    ) {
      const imgSrc = corGroup.imagens_cor[0];
      return typeof imgSrc === "string" ? imgSrc : imgSrc.src;
    }
  }

  // Fallback para a primeira imagem do produto se a cor não for encontrada
  if (
    Array.isArray(prod.imagens_por_cor) &&
    prod.imagens_por_cor.length > 0 &&
    Array.isArray(prod.imagens_por_cor[0].imagens_cor) &&
    prod.imagens_por_cor[0].imagens_cor.length > 0
  ) {
    const imgSrc = prod.imagens_por_cor[0].imagens_cor[0];
    return typeof imgSrc === "string" ? imgSrc : imgSrc.src;
  }

  return item.thumb || "https://via.placeholder.com/120";
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
// MODIFICAÇÃO: 'modalImages' agora guarda objetos com src e cor
let modalImages = [];

function updateModalImage(index) {
  const img = document.getElementById("modal-produto-img");
  if (!img || !modalImages || modalImages.length === 0) return;

  // Garante que o índice esteja dentro dos limites
  if (index < 0) index = modalImages.length - 1;
  if (index >= modalImages.length) index = 0;
  selectedImageIndex = index;

  const currentImageInfo = modalImages[selectedImageIndex];
  img.src = currentImageInfo.src || "";

  // MODIFICAÇÃO: Atualiza a cor selecionada com base na imagem
  selectedColor = currentImageInfo.cor;
  document.querySelectorAll("#modal-cores .opcao-btn").forEach((b) => {
    b.classList.toggle("ativo", b.dataset.color === selectedColor);
  });

  checkConfirm();
}

function openProductModal(product) {
  selectedProduct = product;
  selectedColor = null;
  selectedSize = null;
  selectedImageIndex = 0;
  modalImages = [];

  const modal = document.getElementById("produto-modal");
  const nome = document.getElementById("modal-produto-nome");
  const preco = document.getElementById("modal-produto-preco");
  const descricao = document.getElementById("modal-produto-descricao");
  const img = document.getElementById("modal-produto-img");
  const coresContainer = document.getElementById("modal-cores");
  const tamanhosContainer = document.getElementById("modal-tamanhos");

  nome.textContent = product.nome;
  preco.textContent = `R$ ${product.preco.toFixed(2)}`;
  descricao.textContent = product.descricao || "";

  // MODIFICAÇÃO: Constrói uma lista única de imagens com suas cores associadas
  (product.imagens_por_cor || []).forEach((group) => {
    (group.imagens_cor || []).forEach((imageSrc) => {
      modalImages.push({
        src: typeof imageSrc === "string" ? imageSrc : imageSrc.src,
        cor: group.cor,
      });
    });
  });

  // Renderiza a primeira imagem e define a primeira cor como ativa
  if (modalImages.length > 0) {
    img.src = modalImages[0].src;
    selectedColor = modalImages[0].cor;
  } else {
    img.src = "https://via.placeholder.com/200";
  }

  // Renderiza os botões de cores
  coresContainer.innerHTML = "";
  const productColors = product.imagens_por_cor || [];

  if (productColors.length > 0) {
    productColors.forEach((corGroup) => {
      const btn = document.createElement("button");
      btn.textContent = corGroup.cor;
      btn.className = "opcao-btn";
      btn.dataset.color = corGroup.cor;

      // MODIFICAÇÃO: Ao clicar na cor, pula para a primeira imagem daquela cor
      btn.onclick = () => {
        const firstImageIndexOfColor = modalImages.findIndex(
          (img) => img.cor === corGroup.cor
        );
        if (firstImageIndexOfColor !== -1) {
          updateModalImage(firstImageIndexOfColor);
        }
      };
      coresContainer.appendChild(btn);
    });
    // Ativa o botão da primeira cor
    updateModalImage(0);
  } else {
    coresContainer.innerHTML = "<small>Cor única</small>";
    selectedColor = "Única";
  }

  // Renderiza tamanhos (sem alteração)
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

  // Controles do carrossel (agora funcionam desde o início)
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
  const currentThumb =
    modalImages.find((img) => img.cor === selectedColor)?.src ||
    (modalImages.length > 0 ? modalImages[0].src : "");

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id,
      name: selectedProduct.nome,
      price: selectedProduct.preco,
      qty: 1,
      thumb: currentThumb,
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
