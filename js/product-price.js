(function () {
  function formatBRL(value) {
    if (value === null || typeof value === "undefined" || isNaN(Number(value)))
      return "";
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // helper slugify (mesma lógica usada em cms.js)
  function slugify(str) {
    if (!str) return "";
    return String(str)
      .normalize("NFKD")
      .replace(/[\u0300-\u036F]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function createPriceElement(product) {
    var wrapper = document.createElement("div");
    wrapper.className = "product-price";
    // expõe data-product-id usando id ou slug
    var pid = product.id
      ? String(product.id)
      : product.slug || slugify(product.nome || product.title || "");
    if (pid) wrapper.setAttribute("data-product-id", pid);
    var oldEl = document.createElement("span");
    oldEl.className = "old-price";
    var newEl = document.createElement("span");
    newEl.className = "new-price";
    var discEl = document.createElement("span");
    discEl.className = "discount-percent";
    wrapper.appendChild(oldEl);
    wrapper.appendChild(newEl);
    wrapper.appendChild(discEl);
    return wrapper;
  }

  function applyPriceToElement(priceEl, product) {
    if (!priceEl || !product) return;
    var oldEl = priceEl.querySelector(".old-price");
    var newEl = priceEl.querySelector(".new-price");
    var discEl = priceEl.querySelector(".discount-percent");

    // preço normalizado: tenta product.price, senão product.preco
    var currentPrice =
      typeof product.price !== "undefined"
        ? product.price
        : typeof product.preco !== "undefined"
        ? product.preco
        : null;
    newEl.textContent = formatBRL(currentPrice);

    if (
      product.old_price &&
      Number(product.old_price) > 0 &&
      Number(product.old_price) > Number(currentPrice)
    ) {
      oldEl.textContent = formatBRL(product.old_price);
      oldEl.style.display = "";
      discEl.style.display = "";
      var percent = Math.round(
        (1 - Number(currentPrice) / Number(product.old_price)) * 100
      );
      discEl.textContent = percent + "% OFF";
    } else {
      if (oldEl) oldEl.style.display = "none";
      if (discEl) discEl.style.display = "none";
    }
  }

  function renderProductPriceInContainer(product, container) {
    if (!product || !container) return;
    // Primeiro: procurar placeholder específico para este produto
    var placeholder = container.querySelector(
      '.price[data-price-for="' +
        (product.id || product.slug || product.nome || "") +
        '"]'
    );

    // Se houver placeholder em qualquer nível do card, use ele (substitui conteúdo)
    if (placeholder) {
      // evita inserir diretamente em tags que não aceitam filhos
      if (["IMG", "BUTTON", "A", "INPUT"].includes(placeholder.tagName)) {
        placeholder = placeholder.parentElement || container;
      }
      placeholder.innerHTML = "";
      var priceEl = createPriceElement(product);
      priceEl.classList.add("price-inserted");
      placeholder.appendChild(priceEl);
      applyPriceToElement(priceEl, product);
      return priceEl;
    }

    // Se não houver placeholder, comporta-se como antes: tenta inserir ANTES do botão (acima do botão)
    var existing = container.querySelector(".product-price");
    if (!existing) {
      var firstButton = container.querySelector("button, .btn, a.btn");
      var insertTarget = null;
      if (firstButton && firstButton.parentElement) {
        insertTarget = firstButton.parentElement;
      } else {
        insertTarget =
          container.querySelector(".product-meta") ||
          container.querySelector(".card-body") ||
          container.querySelector(".product-info") ||
          container;
      }

      if (insertTarget && insertTarget.tagName) {
        var badTags = ["IMG", "BUTTON", "A", "INPUT"];
        while (insertTarget && badTags.indexOf(insertTarget.tagName) !== -1) {
          insertTarget = insertTarget.parentElement || container;
          if (!insertTarget || insertTarget === container) break;
        }
      }

      var priceEl = createPriceElement(product);

      if (firstButton && firstButton.parentElement) {
        // insere antes do botão para ficar acima dele
        firstButton.parentElement.insertBefore(priceEl, firstButton);
      } else {
        (insertTarget || container).appendChild(priceEl);
      }

      applyPriceToElement(priceEl, product);
      return priceEl;
    } else {
      applyPriceToElement(existing, product);
      return existing;
    }
  }

  function findAndRender(products, root) {
    if (!Array.isArray(products)) return;
    root = root || document;
    products.forEach(function (p) {
      var id = p.id || p.slug || p.nome || p.title;
      if (!id) return;

      // seletores comuns para localizar cards/produtos no DOM
      var selectors = [
        '[data-product-id="' + id + '"]',
        '[data-id="' + id + '"]',
        '[data-prod-id="' + id + '"]',
        '.product-card[data-id="' + id + '"]',
        '.product[data-id="' + id + '"]',
        '.card[data-id="' + id + '"]',
      ];

      var matched = false;
      selectors.forEach(function (sel) {
        var els = root.querySelectorAll(sel);
        els.forEach(function (el) {
          renderProductPriceInContainer(p, el);
          matched = true;
        });
      });

      // fallback: procurar elementos que contenham o nome exato do produto
      if (!matched && p.nome) {
        var nodes = Array.from(
          root.querySelectorAll("a, h2, h3, .product-name, .title")
        ).filter(function (n) {
          return n.textContent && n.textContent.trim() === p.nome;
        });
        nodes.forEach(function (n) {
          var parent =
            n.closest(".product-card") ||
            n.closest(".product") ||
            n.parentElement;
          if (parent) {
            renderProductPriceInContainer(p, parent);
            matched = true;
          }
        });
      }
    });
  }

  // Atualiza o preço exibido no modal do produto (se presente)
  function updateModalPrice(product) {
    if (!product) return;
    var modalPriceEl = document.getElementById("modal-produto-preco");
    if (!modalPriceEl) return;
    // cria markup simples: antigo + novo + badge
    var wrapper = modalPriceEl;
    wrapper.innerHTML = ""; // substitui conteúdo anterior
    var priceEl = createPriceElement(product);
    wrapper.appendChild(priceEl);
    applyPriceToElement(priceEl, product);
  }

  // Observa adições dinâmicas ao DOM para renderizar preços em novos cards
  function observeDOMMutations(products) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.addedNodes && m.addedNodes.length) {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            // se for container de cards ou card individual, tenta aplicar
            if (
              node.matches &&
              (node.matches(".cards-grid") ||
                node.matches("#product-list") ||
                node.matches(".product-card") ||
                node.matches(".card"))
            ) {
              // busca dentro do nó adicionado
              findAndRender(products, node);
            } else if (node.querySelector) {
              if (
                node.querySelector(".product-card") ||
                node.querySelector(".card") ||
                node.querySelector("#product-list")
              ) {
                findAndRender(products, node);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    // retorna observer caso queira desconectar
    return observer;
  }

  // globals e fetch
  window.__produtos = window.__produtos || null;
  window.__getProductById =
    window.__getProductById ||
    function (id) {
      if (!window.__produtos) return null;
      return (
        window.__produtos.find(function (p) {
          var pid = p.id
            ? String(p.id)
            : p.slug || slugify(p.nome || p.title || "");
          return (
            String(pid) === String(id) ||
            String(p.id) === String(id) ||
            String(p.nome) === String(id)
          );
        }) || null
      );
    };

  var dataUrl = "/data/produtos.json";
  fetch(dataUrl)
    .then(function (res) {
      if (!res.ok) throw new Error("Erro ao carregar " + dataUrl);
      return res.json();
    })
    .then(function (data) {
      // suporta vários formatos (array direto ou objeto com produtos/products/items)
      var products = [];
      if (Array.isArray(data)) products = data;
      else if (Array.isArray(data.produtos)) products = data.produtos;
      else if (Array.isArray(data.products)) products = data.products;
      else if (Array.isArray(data.items)) products = data.items;
      else products = [];

      // normaliza: slug e price
      products = products.map(function (p) {
        var prod = Object.assign({}, p);
        prod.slug = prod.slug || slugify(prod.nome || prod.title || "");
        prod.price =
          typeof prod.price !== "undefined"
            ? Number(prod.price)
            : typeof prod.preco !== "undefined"
            ? Number(prod.preco)
            : 0;
        return prod;
      });
      window.__produtos = products;
      window.__getProductById = function (id) {
        return (
          window.__produtos.find(function (p) {
            var pid = p.id
              ? String(p.id)
              : p.slug || slugify(p.nome || p.title || "");
            return (
              String(pid) === String(id) ||
              String(p.id) === String(id) ||
              String(p.nome) === String(id)
            );
          }) || null
        );
      };

      // renderiza para o DOM atual
      findAndRender(products, document);

      // observa mudanças dinâmicas (ex: carregamento via JS)
      window.__productPriceObserver = observeDOMMutations(products);

      // observa o modal de produto para atualizar preço quando conteúdo mudar
      var modalNameEl = document.getElementById("modal-produto-nome");
      if (modalNameEl) {
        var mo = new MutationObserver(function () {
          // tenta encontrar produto por id no dataset do modal, ou por nome
          var modal = document.getElementById("produto-modal");
          var pid = modal && modal.getAttribute("data-product-id");
          var prod = null;
          if (pid) prod = window.__getProductById(pid);
          if (!prod) {
            var name =
              modalNameEl.textContent && modalNameEl.textContent.trim();
            if (name)
              prod =
                window.__produtos.find(function (p) {
                  return p.nome === name || p.title === name;
                }) || null;
          }
          if (prod) updateModalPrice(prod);
        });
        mo.observe(modalNameEl, {
          characterData: true,
          childList: true,
          subtree: true,
        });
      }
    })
    .catch(function (err) {
      console.warn("product-price.js:", err.message);
    });

  // Export helpers para uso por outros scripts (carrinho, checkout, etc.)
  window.__renderProductPriceInContainer = renderProductPriceInContainer;
  window.__renderPricesForAll = function (root) {
    if (window.__produtos) findAndRender(window.__produtos, root || document);
  };
  window.__updateModalPriceById = function (id) {
    var p = window.__getProductById(id);
    if (p) updateModalPrice(p);
  };
})();
