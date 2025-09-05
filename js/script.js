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

// --- Novo helper: resolve thumb do item baseado no produto original e cor ---
function getThumbForItem(item) {
  const itemId = String(item.id || "");
  const produtos = window.__produtos || [];
  if (!itemId) return item.thumb || "https://via.placeholder.com/120";

  // procura o produto cujo id seja prefixo de itemId (ex: 'vestido-rose' é prefixo de 'vestido-rose-rosa-p')
  // escolhe o match com maior comprimento de id para evitar colisões
  let matchedProd = null;
  produtos.forEach((p) => {
    const pid = String(p.id || "");
    if (!pid) return;
    if (itemId === pid || itemId.startsWith(pid + "-") || itemId.startsWith(pid)) {
      if (!matchedProd || pid.length > String(matchedProd.id).length) {
        matchedProd = p;
      }
    }
  });

  const prod = matchedProd;
  if (!prod) {
    // fallback para thumb já salvo ou placeholder
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

  // se item.cor estiver presente, procura correspondência por cor
  if (item.cor) {
    const corKey = String(item.cor).toLowerCase();
    const matched = imgsMeta.find(
      (m) => m.color && String(m.color).toLowerCase() === corKey
    );
    if (matched && matched.src) return matched.src;
    // fallback: substring no src
    const found = imgsMeta.find(
      (m) => m.src && String(m.src).toLowerCase().includes(corKey)
    );
    if (found && found.src) return found.src;
  }

  // fallback: primeira imagem do produto (prioriza prod.imagens) ou imagem legacy
  if (imgsMeta.length && imgsMeta[0].src) return imgsMeta[0].src;

  // se prod.imagens existe mas imgsMeta ficou vazio por algum motivo,
  // tenta extrair diretamente prod.imagens[0] (string ou objeto)
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
// FUNÇÃO GENÉRICA DE RENDERIZAÇÃO
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
      if (isModal) {
        // usa helper para escolher imagem conforme cor escolhida
        const thumb = getThumbForItem(item) || "https://via.placeholder.com/50";
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
        // USAR getThumbForItem também no carrinho principal para respeitar cor/tamanho escolhidos
        const thumbNonModal =
          getThumbForItem(item) ||
          item.thumb ||
          "https://via.placeholder.com/120";
        container.innerHTML += `
          <div class="cart-item">
            <img src="${thumbNonModal}" alt="${item.name}">
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

  // bind para botões de remover dentro da modal (se houver)
  if (isModal) {
    container.querySelectorAll(".modal-remove-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = btn.dataset.removeId;
        if (id) requestRemove(id);
      });
    });
  }
}

// Helpers para chamadas claras
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
  const dropdown = document.getElementById("cart-dropdown-items");

  if (countEl) {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    countEl.textContent = totalQty;
  }

  if (!dropdown) return;
  dropdown.innerHTML = "";

  if (cart.length === 0) {
    dropdown.innerHTML = "<p>Seu carrinho está vazio.</p>";
  } else {
    cart.forEach((item) => {
      const div = document.createElement("div");
      div.className = "cart-dropdown-item";
      const thumb = getThumbForItem(item) || "https://via.placeholder.com/50";
      div.innerHTML = `
        <img src="${thumb}" alt="${item.name}">
        <div>
          <strong>${item.name}</strong><br>
          ${item.qty}x R$ ${item.price.toFixed(2)}
        </div>
      `;
      dropdown.appendChild(div);
    });
  }
}

// ==========================
// MODAL DE PRODUTO (Shein-like)
// ==========================
let selectedProduct = null;
let selectedColor = null;
let selectedSize = null;
let selectedImageIndex = 0;
let modalImages = []; // array de src strings
let modalImagesMeta = []; // array de { src, color? }

function updateModalImage(index) {
  const img = document.getElementById("modal-produto-img");
  if (!img || !modalImages || modalImages.length === 0) return;
  if (index < 0) index = modalImages.length - 1;
  if (index >= modalImages.length) index = 0;
  selectedImageIndex = index;
  img.src = modalImages[selectedImageIndex] || "";
  // atualiza indicadores visuais se houver (opcional)
}

function openProductModal(product) {
  selectedProduct = product;
  selectedColor = null;
  selectedSize = null;
  selectedImageIndex = 0;
  modalImages = [];
  modalImagesMeta = [];

  // Normaliza imagens: pode ser array de strings ou objetos { src, color }
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
  const img = document.getElementById("modal-produto-img");
  const coresContainer = document.getElementById("modal-cores");
  const tamanhosContainer = document.getElementById("modal-tamanhos");
  const btnConfirmar = document.getElementById("confirmar-compra");
  const prevBtn = modal.querySelector(".carousel-prev");
  const nextBtn = modal.querySelector(".carousel-next");

  nome.textContent = product.nome;
  preco.textContent = `R$ ${product.preco.toFixed(2)}`;
  img.src = modalImages[0] || "https://via.placeholder.com/200";

  // Render cores e associar diretamente imagem baseada em meta.color quando existir
  coresContainer.innerHTML = "";
  if (product.cores?.length > 0) {
    product.cores.forEach((cor) => {
      const btn = document.createElement("button");
      btn.textContent = cor;
      btn.classList.add("opcao-btn");
      btn.setAttribute("data-color", cor);
      try {
        btn.style.color = cor;
      } catch (e) {}
      btn.setAttribute("aria-pressed", "false");

      // procura meta com color igual (case-insensitive)
      const corKey = String(cor).toLowerCase();
      const matched = modalImagesMeta.findIndex(
        (m) => m.color && String(m.color).toLowerCase() === corKey
      );
      if (matched >= 0) {
        btn.dataset.imgIndex = String(matched);
      }

      btn.onclick = () => {
        selectedColor = cor;
        document.querySelectorAll("#modal-cores .opcao-btn").forEach((b) => {
          b.classList.remove("ativo");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("ativo");
        btn.setAttribute("aria-pressed", "true");
        // se imagem vinculada, atualiza
        const idx = parseInt(btn.dataset.imgIndex ?? "-1", 10);
        if (!isNaN(idx) && idx >= 0 && idx < modalImages.length) {
          updateModalImage(idx);
        } else {
          // fallback: busca substring no src
          const found = modalImages.findIndex((src) =>
            String(src).toLowerCase().includes(corKey)
          );
          if (found >= 0) updateModalImage(found);
        }
        checkConfirm();
      };
      coresContainer.appendChild(btn);
    });
  } else {
    coresContainer.innerHTML = "<p>Cor única</p>";
    selectedColor = "Única";
  }

  // Render tamanhos
  tamanhosContainer.innerHTML = "";
  if (product.tamanhos?.length > 0) {
    product.tamanhos.forEach((tamanho) => {
      const btn = document.createElement("button");
      btn.textContent = tamanho;
      btn.classList.add("opcao-btn");
      btn.setAttribute("aria-pressed", "false");
      btn.onclick = () => {
        selectedSize = tamanho;
        document.querySelectorAll("#modal-tamanhos .opcao-btn").forEach((b) => {
          b.classList.remove("ativo");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("ativo");
        btn.setAttribute("aria-pressed", "true");
        checkConfirm();
      };
      tamanhosContainer.appendChild(btn);
    });
  } else {
    tamanhosContainer.innerHTML = "<p>Tamanho Único (M)</p>";
    selectedSize = "Único (M)";
  }

  // set handlers prev/next (remove listeners anteriores para evitar duplicação)
  const clonePrev = prevBtn?.cloneNode(true);
  const cloneNext = nextBtn?.cloneNode(true);
  if (prevBtn && clonePrev) prevBtn.parentNode.replaceChild(clonePrev, prevBtn);
  if (nextBtn && cloneNext) nextBtn.parentNode.replaceChild(cloneNext, nextBtn);

  const newPrev = modal.querySelector(".carousel-prev");
  const newNext = modal.querySelector(".carousel-next");
  newPrev?.addEventListener("click", (e) => {
    e.stopPropagation();
    updateModalImage(selectedImageIndex - 1);
  });
  newNext?.addEventListener("click", (e) => {
    e.stopPropagation();
    updateModalImage(selectedImageIndex + 1);
  });

  // habilita/desabilita confirmar conforme seleção
  btnConfirmar.disabled = true;
  modal.classList.remove("hidden");
}

function closeProductModal() {
  document.getElementById("produto-modal").classList.add("hidden");
}

function checkConfirm() {
  const btn = document.getElementById("confirmar-compra");
  btn.disabled = !(selectedColor && selectedSize);
}

// Ajuste: botão de fechar do modal de produto tem id="close-produto-modal"
document
  .getElementById("close-produto-modal")
  ?.addEventListener("click", closeProductModal);
document.getElementById("confirmar-compra")?.addEventListener("click", () => {
  if (!selectedProduct) return;

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
      thumb: selectedProduct.imagens?.[0] || "",
      cor: selectedColor,
      tamanho: selectedSize,
    });
  }
  saveCart(cart);
  updateFloatingCart();
  renderCart();
  renderCartModal();
  closeProductModal();
  alert("Produto adicionado ao carrinho!");
});

// ==========================
// MODAL DO CARRINHO
// ==========================

// Nota explicativa:
// O botão flutuante do carrinho possui id="cart-button".
// Ao clicar, o handler abaixo chama renderCartModal() (que usa renderCartGeneric para popular os itens)
// e em seguida remove a classe "hidden" do elemento #cart-modal para exibir a modal.
// Fechamento é tratado por #close-cart-modal e por clique no backdrop (ver listeners abaixo).

document.getElementById("cart-button")?.addEventListener("click", () => {
  renderCartModal(); // popula #cart-modal-items e total em #cart-modal-total
  document.getElementById("cart-modal")?.classList.remove("hidden"); // mostra a modal
});

// Fechar modal: botão de fechar (id="close-cart-modal")
document.getElementById("close-cart-modal")?.addEventListener("click", () => {
  document.getElementById("cart-modal")?.classList.add("hidden");
});

// Fechar modal clicando fora do conteúdo: o listener verifica se o alvo do clique tem id === "cart-modal"
document.getElementById("cart-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "cart-modal")
    document.getElementById("cart-modal")?.classList.add("hidden");
});

// ==========================
// REMOÇÃO COM CONFIRMAÇÃO
// ==========================
let pendingRemoveId = null;

function requestRemove(id) {
  pendingRemoveId = id;
  const cart = loadCart();
  const item = cart.find((p) => p.id === id);
  const msgEl = document.getElementById("remove-confirm-message");
  if (msgEl) {
    msgEl.textContent = item
      ? `Deseja remover "${item.name}" do carrinho?`
      : "Deseja remover este item do carrinho?";
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

  if (delta === -1 && item.qty === 1) {
    requestRemove(id);
    return;
  }

  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((p) => p.id !== id);

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

  // tenta aguardar window.__produtos (carregado por cms.js) por curto período
  (function waitProdutos(attempt = 0) {
    if (window.__produtos && window.__produtos.length > 0) {
      renderCart(); // renderiza com thumbs corretos
      return;
    }
    if (attempt >= 20) {
      // timeout: renderiza mesmo assim (usa thumbs salvos no item como fallback)
      renderCart();
      return;
    }
    setTimeout(() => waitProdutos(attempt + 1), 100); // tenta novamente em 100ms
  })();

  // handlers para os botões da modal (caso existam)
  document
    .getElementById("cart-modal-open-cart")
    ?.addEventListener("click", () => {
      window.location.href = "carrinho.html";
    });
  document
    .getElementById("cart-modal-buy-now")
    ?.addEventListener("click", () => {
      // sendWhatsAppOrder é definido em js/checkout.js (agregado na index.html)
      if (typeof sendWhatsAppOrder === "function") {
        sendWhatsAppOrder();
      } else {
        window.location.href = "carrinho.html";
      }
    });
});
