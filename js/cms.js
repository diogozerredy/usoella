// ============================
// Produtos: carregar do CMS (data/produtos.json) + filtros
// ============================

async function fetchProdutosJSON() {
  try {
    const res = await fetch("data/produtos.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao carregar produtos.json");
    const data = await res.json();
    // expõe imagens do hero (opcional) para o site poder consumir via CMS
    // aceita: data.hero = [ "url1", "url2" ] ou [ { src, alt } ]
    if (data && Array.isArray(data.hero)) {
      window.__shopHeroImages = data.hero.map((it) =>
        typeof it === "string"
          ? { src: it, alt: "" }
          : { src: it.src || "", alt: it.alt || "" }
      );
    } else {
      window.__shopHeroImages = window.__shopHeroImages || [];
    }
    return Array.isArray(data.produtos) ? data.produtos : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

function buildFilters(categories) {
  const filtersEl = document.getElementById("product-filters");
  if (!filtersEl) return;

  filtersEl.innerHTML = "";
  const allBtn = document.createElement("button");
  allBtn.className = "filter-btn active";
  allBtn.textContent = "Todas";
  allBtn.dataset.cat = "__ALL__";
  filtersEl.appendChild(allBtn);

  categories.forEach((cat) => {
    const b = document.createElement("button");
    b.className = "filter-btn";
    b.textContent = cat;
    b.dataset.cat = cat;
    filtersEl.appendChild(b);
  });

  filtersEl.addEventListener("click", (e) => {
    if (e.target.matches(".filter-btn")) {
      document
        .querySelectorAll(".filter-btn")
        .forEach((x) => x.classList.remove("active"));
      e.target.classList.add("active");
      const cat = e.target.dataset.cat;
      window.__renderProdutos(cat);
    }
  });
}

function productCardHTML(p) {
  const price = Number(p.preco || 0);
  // usa p.imagem ou p.imagens[0] (suporta objeto ou string)
  const thumb =
    p.imagem ||
    (Array.isArray(p.imagens) &&
      (typeof p.imagens[0] === "string"
        ? p.imagens[0]
        : p.imagens[0].src || "")) ||
    "https://via.placeholder.com/600x600?text=Produto";
  return `
    <article class="card" data-prod-id="${p.id}">
      <div class="thumb">
        <button class="card-prev" aria-label="Imagem anterior" data-prod-id="${
          p.id
        }">&#10094;</button>
        <img class="card-thumb-img" src="${thumb}" alt="${p.nome || ""}">
        <button class="card-next" aria-label="Próxima imagem" data-prod-id="${
          p.id
        }">&#10095;</button>
      </div>
      <div class="card-body">
        <h3>${p.nome || ""}</h3>
        <div class="price">R$ ${price.toFixed(2)}</div>
        <button class="btn btn-primary btn-open-product"
          data-id="${p.id}">
          Ver / Adicionar
        </button>
      </div>
    </article>
  `;
}

async function renderProdutos(selectedCat = "__ALL__") {
  const listEl = document.getElementById("product-list");
  const emptyEl = document.getElementById("novidades-empty");
  if (!listEl) return;

  let produtos = window.__produtos || [];
  if (!produtos.length) {
    produtos = await fetchProdutosJSON();

    // Se não houver produtos no JSON, inserir exemplos temporários
    if (!produtos || produtos.length === 0) {
      produtos = [
        {
          id: "exemplo-1",
          nome: "Camiseta Exemplo",
          descricao: "Camiseta confortável para o dia a dia.",
          preco: 49.9,
          imagem: "/images/uploads/exemplo-camiseta.jpg",
          imagens: ["/images/uploads/exemplo-camiseta.jpg"],
          categoria: "Camisetas",
          cores: ["branco", "preto"],
          tamanhos: ["p", "m", "g"],
          destaque: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "exemplo-2",
          nome: "Sandália Exemplo",
          descricao: "Sandália elegante e confortável.",
          preco: 89.0,
          imagem: "/images/uploads/exemplo-sandalia.jpg",
          imagens: ["/images/uploads/exemplo-sandalia.jpg"],
          categoria: "Sapatos",
          cores: ["marrom"],
          tamanhos: ["36", "37", "38"],
          destaque: false,
          createdAt: new Date().toISOString(),
        },
      ];
    }

    // Ordenação
    produtos.sort((a, b) => {
      const dx = (b.destaque === true) - (a.destaque === true);
      if (dx !== 0) return dx;
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (db !== da) return db - da;
      return (a.nome || "").localeCompare(b.nome || "");
    });

    window.__produtos = produtos;
  }

  const filtered =
    selectedCat === "__ALL__"
      ? produtos
      : produtos.filter(
          (p) => (p.categoria || "").toLowerCase() === selectedCat.toLowerCase()
        );

  listEl.innerHTML = filtered.map(productCardHTML).join("");

  if (filtered.length === 0) {
    if (emptyEl) emptyEl.style.display = "block";
  } else {
    if (emptyEl) emptyEl.style.display = "none";
  }

  // bind "Abrir modal do produto"
  listEl.querySelectorAll("button.btn-open-product").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = btn.dataset.id;
      const prod = (window.__produtos || []).find(
        (p) => String(p.id) === String(id)
      );
      if (!prod) {
        console.warn("Produto não encontrado para id", id);
        return;
      }
      // Normaliza imagens: passa array como está (strings ou objetos {src,color})
      const productForModal = {
        id: prod.id,
        nome: prod.nome,
        preco: Number(prod.preco || 0),
        imagens: Array.isArray(prod.imagens)
          ? prod.imagens
          : prod.imagem
          ? [prod.imagem]
          : [],
        cores: prod.cores || [],
        tamanhos: prod.tamanhos || [],
      };
      if (typeof openProductModal === "function") {
        openProductModal(productForModal);
      } else {
        console.warn("openProductModal não disponível.");
      }
    });
  });

  // bind card thumbnail carousel controls (prev/next) por card
  listEl.querySelectorAll(".card").forEach((cardEl) => {
    const prodId = cardEl.dataset.prodId;
    const prod = (window.__produtos || []).find(
      (p) => String(p.id) === String(prodId)
    );
    if (!prod) return;

    // normaliza imagens para este produto em formato { src, color? }
    const imgsMeta = Array.isArray(prod.imagens)
      ? prod.imagens.map((it) =>
          typeof it === "string"
            ? { src: it }
            : { src: it.src || it.url || "", color: it.color || it.colorName }
        )
      : prod.imagem
      ? [{ src: prod.imagem }]
      : [];
    const imgs = imgsMeta.map((m) => m.src).filter(Boolean);
    if (imgs.length <= 1) {
      // esconde botões se não há múltiplas imagens
      cardEl.querySelector(".card-prev")?.classList.add("hidden");
      cardEl.querySelector(".card-next")?.classList.add("hidden");
      return;
    }

    const imgEl = cardEl.querySelector(".card-thumb-img");
    const prev = cardEl.querySelector(".card-prev");
    const next = cardEl.querySelector(".card-next");
    cardEl.dataset.imgIndex = "0";

    prev?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      let idx = parseInt(cardEl.dataset.imgIndex || "0", 10) - 1;
      if (idx < 0) idx = imgs.length - 1;
      cardEl.dataset.imgIndex = String(idx);
      imgEl.src = imgs[idx];
    });

    next?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      let idx = parseInt(cardEl.dataset.imgIndex || "0", 10) + 1;
      if (idx >= imgs.length) idx = 0;
      cardEl.dataset.imgIndex = String(idx);
      imgEl.src = imgs[idx];
    });

    // opcional: ao abrir modal e selecionar cor, o modal já altera sua imagem;
    // se quiser sincronizar card + modal automaticamente ao confirmar, é possível adicionar um evento custom.
  });
}

// Novo: inicializa carrossel do hero com imagens vindas do CMS (window.__shopHeroImages)
// suporta 0 (fallback), 1 e várias imagens
function initShopHero() {
  const carouselEl = document.getElementById("shop-hero-carousel");
  if (!carouselEl) return;

  // pega fontes de imagem (prioriza window.__shopHeroImages, fallback para destaque dos produtos)
  let images = Array.isArray(window.__shopHeroImages)
    ? window.__shopHeroImages.slice()
    : [];
  if (
    images.length === 0 &&
    Array.isArray(window.__produtos) &&
    window.__produtos.length
  ) {
    // tenta montar a partir dos produtos em destaque (ou primeiros)
    const destaqueImgs = window.__produtos
      .filter(Boolean)
      .slice(0, 5)
      .map((p) => {
        const src =
          p.imagem ||
          (Array.isArray(p.imagens) &&
            (typeof p.imagens[0] === "string"
              ? p.imagens[0]
              : p.imagens[0].src)) ||
          "";
        return src ? { src, alt: p.nome || "" } : null;
      })
      .filter(Boolean);
    images = destaqueImgs.length ? destaqueImgs : images;
  }

  // fallback: imagem padrão se nada disponível
  if (!images || images.length === 0) {
    images = [
      {
        src: "https://via.placeholder.com/1200x400?text=USOELLA",
        alt: "USOELLA",
      },
    ];
  }

  // monta HTML base
  carouselEl.innerHTML = `
    <div class="hero-slide">
      <img id="hero-img" src="${images[0].src}" alt="${images[0].alt || ""}">
    </div>
    <button id="hero-prev" class="hero-nav hero-prev" aria-label="Anterior">&#10094;</button>
    <button id="hero-next" class="hero-nav hero-next" aria-label="Próximo">&#10095;</button>
    <div id="hero-dots" class="hero-dots"></div>
  `;

  const imgEl = carouselEl.querySelector("#hero-img");
  const prevBtn = carouselEl.querySelector("#hero-prev");
  const nextBtn = carouselEl.querySelector("#hero-next");
  const dotsEl = carouselEl.querySelector("#hero-dots");

  let index = 0;
  let autoplayTimer = null;

  function render() {
    const item = images[index];
    imgEl.src = item.src;
    imgEl.alt = item.alt || "";
    captionEl.textContent = item.alt || "";
    // atualiza dots
    Array.from(dotsEl.children).forEach((d, i) =>
      d.classList.toggle("active", i === index)
    );
    // se houver apenas 1 imagem, esconder controles
    if (images.length <= 1) {
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
      dotsEl.style.display = "none";
    } else {
      prevBtn.style.display = "";
      nextBtn.style.display = "";
      dotsEl.style.display = "";
    }
  }

  // criar dots
  dotsEl.innerHTML = images
    .map(
      (_, i) =>
        `<button class="hero-dot" data-index="${i}" aria-label="Ir para slide ${
          i + 1
        }"></button>`
    )
    .join("");

  // eventos
  prevBtn.addEventListener("click", () => {
    index = (index - 1 + images.length) % images.length;
    render();
  });
  nextBtn.addEventListener("click", () => {
    index = (index + 1) % images.length;
    render();
  });
  dotsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".hero-dot");
    if (!btn) return;
    index = Number(btn.dataset.index || 0);
    render();
  });

  // autoplay simples (5s). pausa ao hover e retoma ao mouseout
  function startAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    if (images.length > 1) {
      autoplayTimer = setInterval(() => {
        index = (index + 1) % images.length;
        render();
      }, 5000);
    }
  }
  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  carouselEl.addEventListener("mouseenter", stopAutoplay);
  carouselEl.addEventListener("mouseleave", startAutoplay);

  // inicializa
  render();
  startAutoplay();

  // expõe função para atualizar imagens programaticamente (útil para CMS)
  carouselEl.updateImages = function (newImages) {
    images = (Array.isArray(newImages) ? newImages : []).map((it) =>
      typeof it === "string"
        ? { src: it, alt: "" }
        : { src: it.src || "", alt: it.alt || "" }
    );
    if (images.length === 0) {
      images = [
        {
          src: "https://via.placeholder.com/1200x400?text=USOELLA",
          alt: "USOELLA",
        },
      ];
    }
    index = 0;
    // recria dots e re-renderiza
    dotsEl.innerHTML = images
      .map(
        (_, i) =>
          `<button class="hero-dot" data-index="${i}" aria-label="Ir para slide ${
            i + 1
          }"></button>`
      )
      .join("");
    render();
    startAutoplay();
  };
}

// chama initShopHero após carregar produtos/hero no initNovidadesSection
async function initNovidadesSection() {
  const listEl = document.getElementById("product-list");
  if (!listEl) return;
  const produtos = await fetchProdutosJSON();
  window.__produtos = produtos;
  const cats = [
    ...new Set(produtos.map((p) => p.categoria).filter(Boolean)),
  ].sort();
  buildFilters(cats);
  window.__renderProdutos = (cat) => renderProdutos(cat);
  renderProdutos("__ALL__");

  // inicializa o hero da loja (CMS-driven)
  try {
    initShopHero();
  } catch (err) {
    console.warn("Erro ao iniciar hero:", err);
  }
}

document.addEventListener("DOMContentLoaded", initNovidadesSection);

// --- Novo: sempre carregar produtos e popular window.__produtos para uso em outras páginas (ex: carrinho) ---
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const produtos = await fetchProdutosJSON();
    // assegura que window.__produtos existe para getThumbForItem e demais lógicas
    window.__produtos = Array.isArray(produtos)
      ? produtos
      : window.__produtos || [];
  } catch (e) {
    console.error("Erro ao pré-carregar produtos para uso global:", e);
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const isShop = window.location.pathname.includes("shop.html");

  fetchProdutosJSON().then((produtos) => {
    if (isShop) {
      renderProdutos(produtos); // mostra todos
    } else {
      const novidades = produtos.slice(-6); // só últimos 6 produtos
      renderProdutos(novidades);
    }
  });
});

// garante que initShopHero rode mesmo quando pré-carregamos produtos
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const produtos = await fetchProdutosJSON();
    window.__produtos = Array.isArray(produtos)
      ? produtos
      : window.__produtos || [];
    // inicializa hero caso não tenha sido inicializado ainda
    try {
      initShopHero();
    } catch (e) {
      /* silent */
    }
  } catch (e) {
    console.error("Erro ao pré-carregar produtos para uso global:", e);
  }
});
