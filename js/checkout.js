// ==========================
// Checkout via WhatsApp
// ==========================
function sendWhatsAppOrder(numero = "5585992781259") {
  // tenta usar loadCart() se disponível, senão lê do localStorage
  let cart = [];
  if (typeof loadCart === "function") {
    cart = loadCart();
  } else {
    try {
      cart = JSON.parse(localStorage.getItem("cart")) || [];
    } catch (e) {
      cart = [];
    }
  }

  if (!cart || cart.length === 0) {
    alert("Carrinho vazio!");
    return;
  }

  let message = "🛍️ Pedido:\n\n";
  let total = 0;
  cart.forEach((item) => {
    const cor = item.cor ? `Cor: ${item.cor}` : "";
    const tamanho = item.tamanho ? `Tamanho: ${item.tamanho}` : "";
    const attrs = [cor, tamanho].filter(Boolean).join(" — ");
    message += `• ${item.name}${attrs ? " — " + attrs : ""} (${
      item.qty
    }x) - R$ ${(item.price * item.qty).toFixed(2)}\n`;
    total += item.price * item.qty;
  });
  message += `\n💰 Total: R$ ${total.toFixed(2)}`;

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
