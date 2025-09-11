// ============================
// Produtos: carregar do CMS (data/produtos.json) + filtros
// ============================

async function fetchProdutosJSON() {
  try {
    const res = await fetch("data/produtos.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao carregar produtos.json");
    const data = await res.json();
    if (data && Array.isArray(data.hero)) {
      // **INÍCIO DA CORREÇÃO DO BANNER**
      window.__shopHeroImages = data.hero.map((it) => {
        // Garante que o caminho da imagem seja extraído corretamente, seja string ou objeto
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
      // **FIM DA CORREÇÃO DO BANNER**
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
      renderProdutos(window.__produtos, cat);
    }
  });
}

function getProductThumbnail(p) {
  if (p.imagens_por_cor && p.imagens_por_cor.length > 0) {
    const firstColorGroup = p.imagens_por_cor[0];
    if (firstColorGroup.imagens_cor && firstColorGroup.imagens_cor.length > 0) {
      const firstImage = firstColorGroup.imagens_cor[0];
      return typeof firstImage === "string" ? firstImage : firstImage.src;
    }
  }
  if (p.imagens && p.imagens.length > 0) {
    const firstImage = p.imagens[0];
    return typeof firstImage === "string" ? firstImage : firstImage.src;
  }
  return "https://via.placeholder.com/600x600?text=Produto";
}

function productCardHTML(p) {
  const price = Number(p.preco || 0);
  const thumb = getProductThumbnail(p);
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
        <button class="btn btn-primary btn-open-product" data-id="${p.id}">
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
        cor.imagens_cor.map((img) => (typeof img === "string" ? img : img.src))
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

function initShopHero() {
  const carouselEl = document.getElementById("shop-hero-carousel");
  if (!carouselEl) return;

  let images = Array.isArray(window.__shopHeroImages)
    ? window.__shopHeroImages.slice()
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

function initNovidadesCarousel() {
  if (window.innerWidth < 981) return;

  const track = document.getElementById("product-list");
  const prevBtn = document.getElementById("novidades-prev");
  const nextBtn = document.getElementById("novidades-next");

  if (!track || !prevBtn || !nextBtn) return;

  const products = track.querySelectorAll(".card");
  const productsCount = products.length;
  const itemsVisible = 4;

  if (productsCount <= itemsVisible) {
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    return;
  }

  prevBtn.style.display = "flex";
  nextBtn.style.display = "flex";

  let currentIndex = 0;
  const maxIndex = productsCount - itemsVisible;

  function updateCarousel() {
    const offset = currentIndex * -25;
    track.style.transform = `translateX(${offset}%)`;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === maxIndex;
  }

  nextBtn.addEventListener("click", () => {
    if (currentIndex < maxIndex) {
      currentIndex++;
      updateCarousel();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  });

  updateCarousel();
}

async function initPage() {
  const allProducts = await fetchProdutosJSON();

  allProducts.sort((a, b) => {
    const aDestaque = a.destaque === true;
    const bDestaque = b.destaque === true;
    if (aDestaque !== bDestaque) return bDestaque - aDestaque;
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });

  window.__produtos = allProducts;
  const isShopPage = window.location.pathname.includes("shop.html");

  if (isShopPage) {
    const categories = [
      ...new Set(allProducts.map((p) => p.categoria).filter(Boolean)),
    ].sort();
    buildFilters(categories);
    renderProdutos(allProducts, "__ALL__");
    initShopHero();
  } else {
    // Homepage
    const novidades = allProducts.slice(0, 10);
    renderProdutos(novidades, "__ALL__");
    initNovidadesCarousel();
  }
}

document.addEventListener("DOMContentLoaded", initPage);
