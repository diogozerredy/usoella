// ============================
// Produtos e Banner: carregar do CMS
// ============================

async function fetchShopData() {
  try {
    const produtosRes = await fetch("/data/produtos.json", {
      cache: "no-store",
    });
    if (!produtosRes.ok) throw new Error("Falha ao carregar produtos.json");
    const produtosData = await produtosRes.json();
    window.__produtos = Array.isArray(produtosData.produtos)
      ? produtosData.produtos
      : [];

    const categoriasRes = await fetch("/data/categorias.json", {
      cache: "no-store",
    });
    if (categoriasRes.ok) {
      const categoriasData = await categoriasRes.json();
      let categorias = Array.isArray(categoriasData.categorias)
        ? categoriasData.categorias
        : [];

      categorias.sort((a, b) => (a.ordem || 999) - (b.ordem || 999));
      window.__categorias = categorias;
    } else {
      window.__categorias = [];
    }

    const bannerRes = await fetch("/data/banner.json", {
      cache: "no-store",
    });
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
      return typeof firstImage === "string" ? firstImage : firstImage.src;
    }
  }
  return "https://via.placeholder.com/600x600?text=Produto";
}

function productCardHTML(p) {
  const price = Number(p.preco || 0);
  const thumb = getProductThumbnail(p);
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
      if (typeof openProductModal === "function") {
        openProductModal(prod);
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

function initNovidadesCarousel() {
  const track = document.querySelector(".carousel-track");
  const prevBtn = document.getElementById("novidades-prev");
  const nextBtn = document.getElementById("novidades-next");

  if (!track || !prevBtn || !nextBtn) return;

  let currentIndex = 0;

  const updateCarousel = () => {
    const items = Array.from(track.children);
    if (items.length === 0) {
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
      return;
    }

    let itemsVisible;
    if (window.innerWidth <= 600) {
      itemsVisible = 1;
    } else if (window.innerWidth <= 980) {
      itemsVisible = 2;
    } else {
      itemsVisible = 4;
    }

    const totalItems = items.length;
    const maxIndex = Math.max(0, totalItems - itemsVisible);

    if (currentIndex > maxIndex) {
      currentIndex = maxIndex;
    }

    if (totalItems <= itemsVisible) {
      track.style.transform = "translateX(0)";
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
      return;
    }

    prevBtn.style.display = "flex";
    nextBtn.style.display = "flex";

    const itemWidth = items[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const offset = currentIndex * -(itemWidth + gap);

    track.style.transform = `translateX(${offset}px)`;

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;
  };

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  });

  nextBtn.addEventListener("click", () => {
    const totalItems = track.children.length;
    let itemsVisible;
    if (window.innerWidth <= 600) itemsVisible = 1;
    else if (window.innerWidth <= 980) itemsVisible = 2;
    else itemsVisible = 4;
    const maxIndex = Math.max(0, totalItems - itemsVisible);

    if (currentIndex < maxIndex) {
      currentIndex++;
      updateCarousel();
    }
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateCarousel, 150);
  });

  setTimeout(updateCarousel, 100);
}

async function initPage() {
  await fetchShopData();

  const path = window.location.pathname;
  const isHomePage =
    path === "/" || path.endsWith("/index.html") || path.endsWith("/home");
  const isShopPage = path.includes("/shop");

  if (isShopPage) {
    // LÓGICA DE ORDENAÇÃO CORRIGIDA PARA A PÁGINA DA LOJA
    const categoryOrderMap = new Map(
      (window.__categorias || []).map((cat) => [cat.nome, cat.ordem || 999])
    );

    const allProductsSortedByCategory = (window.__produtos || []).sort(
      (a, b) => {
        const orderA = categoryOrderMap.get(a.categoria) || 999;
        const orderB = categoryOrderMap.get(b.categoria) || 999;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        // Se as categorias forem iguais, ordena por data de criação (mais novo primeiro)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
    );

    buildFilters(window.__categorias || []);
    renderProdutos(allProductsSortedByCategory, "__ALL__");
    initShopBanner();
  } else if (isHomePage) {
    const allProductsSortedByDate = (window.__produtos || []).sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    const destaques = allProductsSortedByDate.filter(
      (p) => p.destaque === true
    );
    const recentesNaoDestaques = allProductsSortedByDate.filter(
      (p) => p.destaque !== true
    );

    let novidades = [...destaques];

    for (const produto of recentesNaoDestaques) {
      if (novidades.length >= 10) break;
      if (!novidades.some((p) => p.id === produto.id)) {
        novidades.push(produto);
      }
    }

    novidades = novidades.slice(0, 10);

    renderProdutos(novidades, "__ALL__");
    initNovidadesCarousel();
  }
}

document.addEventListener("DOMContentLoaded", initPage);
