(function () {
  function formatBRL(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function createPriceElement(product) {
    var wrapper = document.createElement("div");
    wrapper.className = "product-price";
    wrapper.setAttribute("data-product-id", product.id || product.slug || "");
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

  function applyPriceToContainer(product, container) {
    if (!container) return;
    // se já tiver .product-price dentro do container, reutiliza
    var priceEl = container.querySelector(".product-price");
    if (!priceEl) {
      // tenta inserir em locais comuns
      var target =
        container.querySelector(".product-meta") ||
        container.querySelector(".card-body") ||
        container;
      priceEl = createPriceElement(product);
      target.appendChild(priceEl);
    }

    var oldEl = priceEl.querySelector(".old-price");
    var newEl = priceEl.querySelector(".new-price");
    var discEl = priceEl.querySelector(".discount-percent");

    newEl.textContent = formatBRL(product.price);

    if (
      product.old_price &&
      Number(product.old_price) > 0 &&
      Number(product.old_price) > Number(product.price)
    ) {
      oldEl.textContent = formatBRL(product.old_price);
      oldEl.style.display = "";
      discEl.style.display = "";
      var percent = Math.round(
        (1 - Number(product.price) / Number(product.old_price)) * 100
      );
      discEl.textContent = percent + "% OFF";
    } else {
      if (oldEl) oldEl.style.display = "none";
      if (discEl) discEl.style.display = "none";
    }
  }

  function findAndApply(products) {
    if (!products || !Array.isArray(products)) return;
    products.forEach(function (p) {
      var id = p.id || p.slug || p.nome || p.title || "";
      if (!id) return;

      // seletores suportados para localizar cards/produtos na página
      var selectors = [
        '[data-product-id="' + id + '"]',
        '[data-id="' + id + '"]',
        '[data-prod-id="' + id + '"]',
        '.product-card[data-id="' + id + '"]',
        '.product[data-id="' + id + '"]',
      ];

      var found = false;
      selectors.forEach(function (sel) {
        var els = document.querySelectorAll(sel);
        els.forEach(function (el) {
          applyPriceToContainer(p, el);
          found = true;
        });
      });

      // fallback: procurar por elementos que possuam atributo data-product com JSON inline
      if (!found) {
        var inline = document.querySelectorAll("[data-product]");
        inline.forEach(function (el) {
          try {
            var obj = JSON.parse(el.getAttribute("data-product"));
            if (obj && (obj.id === id || obj.nome === id || obj.slug === id)) {
              applyPriceToContainer(p, el);
              found = true;
            }
          } catch (e) {
            /* ignore */
          }
        });
      }

      // se ainda não encontrou, tenta procurar por um elemento cujo texto contenha o nome do produto (caso raro)
      if (!found && p.nome) {
        var nodes = Array.from(
          document.querySelectorAll("a, h2, h3, .product-name, .title")
        ).filter(function (n) {
          return n.textContent && n.textContent.trim() === p.nome;
        });
        nodes.forEach(function (n) {
          var parent =
            n.closest(".product-card") ||
            n.closest(".product") ||
            n.parentElement;
          applyPriceToContainer(p, parent);
        });
      }
    });
  }

  // Carrega JSON de produtos e aplica
  var url = "/data/produtos.json";
  fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error("Não foi possível carregar " + url);
      return res.json();
    })
    .then(function (data) {
      var products = data && data.produtos ? data.produtos : [];
      // aguarda DOM pronto
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
          findAndApply(products);
        });
      } else {
        findAndApply(products);
      }
    })
    .catch(function (err) {
      console.warn("product-price.js:", err.message);
    });

  // exporta util global
  window.__renderProductPrices = findAndApply;
})();
