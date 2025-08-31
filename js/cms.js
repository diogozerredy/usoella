// ============================
// Produtos: carregar do CMS (data/produtos.json) + filtros
// ============================

async function fetchProdutosJSON() {
  try {
    const res = await fetch('data/produtos.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao carregar produtos.json');
    const data = await res.json();
    return Array.isArray(data.produtos) ? data.produtos : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

function buildFilters(categories) {
  const filtersEl = document.getElementById('product-filters');
  if (!filtersEl) return;

  filtersEl.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.textContent = 'Todas';
  allBtn.dataset.cat = '__ALL__';
  filtersEl.appendChild(allBtn);

  categories.forEach(cat => {
    const b = document.createElement('button');
    b.className = 'filter-btn';
    b.textContent = cat;
    b.dataset.cat = cat;
    filtersEl.appendChild(b);
  });

  filtersEl.addEventListener('click', (e) => {
    if (e.target.matches('.filter-btn')) {
      document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
      e.target.classList.add('active');
      const cat = e.target.dataset.cat;
      window.__renderProdutos(cat);
    }
  });
}

function productCardHTML(p) {
  const price = Number(p.preco || 0);
  return `
    <article class="card">
      <div class="thumb">
        <img src="${p.imagem || 'https://via.placeholder.com/600x600?text=Produto'}" alt="${p.nome || ''}">
      </div>
      <div class="card-body">
        <h3>${p.nome || ''}</h3>
        <div class="price">R$ ${price.toFixed(2)}</div>
        <button class="btn btn-primary btn-add-from-json"
          data-id="${p.id}"
          data-name="${p.nome}"
          data-price="${price}"
          data-thumb="${p.imagem}">
          Adicionar ao Carrinho
        </button>
      </div>
    </article>
  `;
}

async function renderProdutos(selectedCat = '__ALL__') {
  const listEl = document.getElementById('product-list');
  const emptyEl = document.getElementById('novidades-empty');
  if (!listEl) return;

  let produtos = window.__produtos || [];
  if (!produtos.length) {
    produtos = await fetchProdutosJSON();
    produtos.sort((a, b) => {
      const dx = (b.destaque === true) - (a.destaque === true);
      if (dx !== 0) return dx;
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (db !== da) return db - da;
      return (a.nome || '').localeCompare(b.nome || '');
    });
    window.__produtos = produtos;
  }

  const filtered = selectedCat === '__ALL__'
    ? produtos
    : produtos.filter(p => (p.categoria || '').toLowerCase() === selectedCat.toLowerCase());

  listEl.innerHTML = filtered.map(productCardHTML).join('');

  if (filtered.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
  } else {
    if (emptyEl) emptyEl.style.display = 'none';
  }

  // bind "Adicionar"
  listEl.querySelectorAll('button.btn-add-from-json').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const t = e.currentTarget;
      const item = {
        id: t.dataset.id,
        name: t.dataset.name,
        price: Number(t.dataset.price || 0),
        thumb: t.dataset.thumb || ''
      };
      if (typeof addToCart === 'function') {
        addToCart(item);
      } else {
        console.warn('Função addToCart não encontrada.');
      }
    });
  });
}

async function initNovidadesSection() {
  const listEl = document.getElementById('product-list');
  if (!listEl) return;
  const produtos = await fetchProdutosJSON();
  window.__produtos = produtos;
  const cats = [...new Set(produtos.map(p => p.categoria).filter(Boolean))].sort();
  buildFilters(cats);
  window.__renderProdutos = (cat) => renderProdutos(cat);
  renderProdutos('__ALL__');
}

document.addEventListener('DOMContentLoaded', initNovidadesSection);
