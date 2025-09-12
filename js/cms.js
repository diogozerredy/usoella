// ============================
// Produtos e Banner: carregar do CMS
// ============================

async function fetchShopData() {
  try {
    // Busca os produtos (já consolidados pelo build script)
    const produtosRes = await fetch("/data/produtos.json", {
      cache: "no-store",
    });
    if (!produtosRes.ok) throw new Error("Falha ao carregar produtos.json");
    const produtosData = await produtosRes.json();
    window.__produtos = Array.isArray(produtosData.produtos)
      ? produtosData.produtos
      : [];

    // MODIFICAÇÃO: Busca as categorias (consolidadas pelo build script)
    const categoriasRes = await fetch("/data/categorias.json", {
      cache: "no-store",
    });
    if (categoriasRes.ok) {
      const categoriasData = await categoriasRes.json();
      window.__categorias = Array.isArray(categoriasData.categorias)
        ? categoriasData.categorias
        : [];
    } else {
      window.__categorias = [];
    }

    // Busca o banner do shop
    const bannerRes = await fetch("/data/banner.json", { cache: "no-store" });
    if (bannerRes.ok) {
      const bannerData = await bannerRes.json();
      if (bannerData && Array.isArray(bannerData.banner_images)) {
        window.__shopBannerImages = bannerData.banner_images.map((it) => {
          const desktopSrc =
            typeof it.src_desktop === "string"
              ? it.src_desktop
              : it.src_desktop?.src;
          const mobileSrc =
            typeof it.src_mobile === "string"
              ? it.src_mobile
              : it.src_mobile?.src;
          const src = window.innerWidth <= 768 ? mobileSrc : desktopSrc;
          return {
            src: src || desktopSrc || mobileSrc || "",
            alt: it.alt || "",
          };
        });
      }
    } else {
      window.__shopBannerImages = [];
    }
  } catch (e) {
    console.error(e);
    window.__produtos = window.__produtos || [];
    window.__categorias = window.__categorias || [];
    window.__shopBannerImages = window.__shopBannerImages || [];
  }
}

// MODIFICAÇÃO: A função agora usa a lista de categorias carregada
function buildFilters(categories) {
  const filtersEl = document.getElementById("product-filters");
  if (!filtersEl) return;

  filtersEl.innerHTML = "";
  const allBtn = document.createElement("button");
  allBtn.className = "filter-btn active";
  allBtn.textContent = "Todas";
  allBtn.dataset.cat = "__ALL__";
  filtersEl.appendChild(allBtn);

  // Usa os nomes das categorias vindas do CMS
  categories.forEach((cat) => {
    if (!cat.nome) return;
    const b = document.createElement("button");
    b.className = "filter-btn";
    b.textContent = cat.nome;
    b.dataset.cat = cat.nome;
    filtersEl.appendChild(b);
  });

  filtersEl.addEventListener("click", (e) => {
    if (e.target.matches(".filter-btn")) {
      document
        .querySelectorAll(".filter-btn")
        .forEach((x) => x.classList.remove("active"));
      e.target.classList.add("active");
      const cat = e.target.dataset.cat;
      renderProdutos(window.__produtos, cat);
    }
  });
}

function getProductThumbnail(p) {
  if (p.imagens_por_cor && p.imagens_por_cor.length > 0) {
    const firstColorGroup = p.imagens_por_cor[0];
    if (firstColorGroup.imagens_cor && firstColorGroup.imagens_cor.length > 0) {
      const firstImage = firstColorGroup.imagens_cor[0];
      // Suporta tanto string simples quanto objeto com 'src'
      return typeof firstImage === "string" ? firstImage : firstImage.src;
    }
  }
  return "https://via.placeholder.com/600x600?text=Produto";
}

function productCardHTML(p) {
  const price = Number(p.preco || 0);
  const thumb = getProductThumbnail(p);
  // Adiciona verificação para o ID
  const productId = p.id || `prod_${Math.random().toString(36).substr(2, 9)}`;

  return `
    <article class="card" data-prod-id="${productId}">
      <div class="thumb">
        <button class="card-prev" aria-label="Imagem anterior" data-prod-id="${productId}">&#10094;</button>
        <img class="card-thumb-img" src="${thumb}" alt="${p.nome || ""}">
        <button class="card-next" aria-label="Próxima imagem" data-prod-id="${productId}">&#10095;</button>
      </div>
      <div class="card-body">
        <h3>${p.nome || ""}</h3>
        <div class="price">R$ ${price.toFixed(2)}</div>
        <button class="btn btn-primary btn-open-product" data-id="${productId}">
          Ver detalhes
        </button>
      </div>
    </article>
  `;
}

function renderProdutos(produtosParaRenderizar, selectedCat = "__ALL__") {
  const listEl = document.getElementById("product-list");
  const emptyEl = document.getElementById("novidades-empty");
  if (!listEl) return;

  const filtered =
    selectedCat === "__ALL__"
      ? produtosParaRenderizar
      : produtosParaRenderizar.filter(
          (p) => (p.categoria || "").toLowerCase() === selectedCat.toLowerCase()
        );

  listEl.innerHTML = filtered.map(productCardHTML).join("");

  if (filtered.length === 0) {
    if (emptyEl) emptyEl.style.display = "block";
  } else {
    if (emptyEl) emptyEl.style.display = "none";
  }

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

      const productForModal = {
        id: prod.id,
        nome: prod.nome,
        descricao: prod.descricao,
        preco: Number(prod.preco || 0),
        imagens_por_cor: Array.isArray(prod.imagens_por_cor)
          ? prod.imagens_por_cor
          : [],
        tamanhos: prod.tamanhos || [],
      };
      if (typeof openProductModal === "function") {
        openProductModal(productForModal);
      } else {
        console.warn("openProductModal não disponível.");
      }
    });
  });

  listEl.querySelectorAll(".card").forEach((cardEl) => {
    const prodId = cardEl.dataset.prodId;
    const prod = (window.__produtos || []).find(
      (p) => String(p.id) === String(prodId)
    );
    if (!prod) return;

    const imgs = (prod.imagens_por_cor || [])
      .flatMap((cor) =>
        (cor.imagens_cor || []).map((img) =>
          typeof img === "string" ? img : img.src
        )
      )
      .filter(Boolean);

    const prevBtn = cardEl.querySelector(".card-prev");
    const nextBtn = cardEl.querySelector(".card-next");

    if (imgs.length <= 1) {
      if (prevBtn) prevBtn.style.display = "none";
      if (nextBtn) nextBtn.style.display = "none";
      return;
    }

    if (prevBtn) prevBtn.style.display = "flex";
    if (nextBtn) nextBtn.style.display = "flex";

    const imgEl = cardEl.querySelector(".card-thumb-img");
    cardEl.dataset.imgIndex = "0";

    prevBtn?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      let idx = parseInt(cardEl.dataset.imgIndex || "0", 10) - 1;
      if (idx < 0) idx = imgs.length - 1;
      cardEl.dataset.imgIndex = String(idx);
      imgEl.src = imgs[idx];
    });

    nextBtn?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      let idx = parseInt(cardEl.dataset.imgIndex || "0", 10) + 1;
      if (idx >= imgs.length) idx = 0;
      cardEl.dataset.imgIndex = String(idx);
      imgEl.src = imgs[idx];
    });
  });
}

function initShopBanner() {
  const carouselEl = document.getElementById("shop-hero-carousel");
  if (!carouselEl) return;

  let images = Array.isArray(window.__shopBannerImages)
    ? window.__shopBannerImages.slice()
    : [];
  if (images.length === 0) {
    images = [
      {
        src: "https://via.placeholder.com/1200x400?text=USOELLA",
        alt: "USOELLA",
      },
    ];
  }

  carouselEl.innerHTML = `
    <div class="hero-slide"><img id="hero-img" src="${images[0].src}" alt="${
    images[0].alt || ""
  }"></div>
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
    if (!images[index]) return;
    imgEl.src = images[index].src;
    imgEl.alt = images[index].alt || "";
    if (dotsEl) {
      Array.from(dotsEl.children).forEach((d, i) =>
        d.classList.toggle("active", i === index)
      );
    }
    const showControls = images.length > 1;
    if (prevBtn) prevBtn.style.display = showControls ? "flex" : "none";
    if (nextBtn) nextBtn.style.display = showControls ? "flex" : "none";
    if (dotsEl) dotsEl.style.display = showControls ? "flex" : "none";
  }

  function startAutoplay() {
    stopAutoplay();
    if (images.length > 1) {
      autoplayTimer = setInterval(() => {
        index = (index + 1) % images.length;
        render();
      }, 5000);
    }
  }

  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  if (dotsEl) {
    dotsEl.innerHTML = images
      .map(
        (_, i) =>
          `<button class="hero-dot" data-index="${i}" aria-label="Slide ${
            i + 1
          }"></button>`
      )
      .join("");
    dotsEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".hero-dot");
      if (!btn) return;
      index = Number(btn.dataset.index || 0);
      render();
      startAutoplay();
    });
  }

  prevBtn?.addEventListener("click", () => {
    index = (index - 1 + images.length) % images.length;
    render();
    startAutoplay();
  });
  nextBtn?.addEventListener("click", () => {
    index = (index + 1) % images.length;
    render();
    startAutoplay();
  });
  carouselEl.addEventListener("mouseenter", stopAutoplay);
  carouselEl.addEventListener("mouseleave", startAutoplay);

  render();
  startAutoplay();
}

async function initPage() {
  await fetchShopData();

  (window.__produtos || []).sort((a, b) => {
    const aDestaque = a.destaque === true;
    const bDestaque = b.destaque === true;
    if (aDestaque !== bDestaque) return bDestaque - aDestaque;
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });

  const path = window.location.pathname;
  const isShopPage =
    path.endsWith("/shop") ||
    path.endsWith("/shop.html") ||
    path.endsWith("/shop/");

  if (isShopPage) {
    // MODIFICAÇÃO: Passa a lista de categorias para a função
    buildFilters(window.__categorias || []);
    renderProdutos(window.__produtos, "__ALL__");
    initShopBanner();
  } else {
    // Homepage
    const novidades = (window.__produtos || [])
      .filter((p) => p.destaque)
      .slice(0, 10);
    renderProdutos(novidades, "__ALL__");
  }
}

document.addEventListener("DOMContentLoaded", initPage);
