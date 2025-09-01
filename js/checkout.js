// ==========================
// Checkout via WhatsApp
// ==========================
function sendWhatsAppOrder(numero = "5585992781259") {
  const cart = loadCart();
  if (cart.length === 0) {
    alert("Carrinho vazio!");
    return;
  }

  let message = "🛍️ Pedido:\n\n";
  let total = 0;
  cart.forEach(item => {
    message += `• ${item.name} (${item.qty}x) - R$ ${(item.price * item.qty).toFixed(2)}\n`;
    total += item.price * item.qty;
  });
  message += `\n💰 Total: R$ ${total.toFixed(2)}`;

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}


