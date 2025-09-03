// ============================
// Produtos: carregar do CMS (data/produtos.json) + filtros
// ============================

async function fetchProdutosJSON() {
  try {
    const res = await fetch("data/produtos.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao carregar produtos.json");
    const data = await res.json();
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
  // usa p.imagem ou p.imagens[0] quando disponível
  const thumb =
    p.imagem ||
    (Array.isArray(p.imagens) && p.imagens[0]) ||
    "https://via.placeholder.com/600x600?text=Produto";
  return `
    <article class="card">
      <div class="thumb">
        <img src="${thumb}" alt="${p.nome || ""}">
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
      // Normaliza o objeto para o formato que openProductModal espera
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
}

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
}

document.addEventListener("DOMContentLoaded", initNovidadesSection);
