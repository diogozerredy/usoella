async function loadHero() {
  try {
    const res = await fetch("/data/hero.json");
    const hero = await res.json();

    document.getElementById("hero-title").textContent = hero.titulo;
    document.getElementById("hero-img").src = hero.imagem;
    document.getElementById("hero-cta").textContent = hero.cta;
    document.getElementById("hero-cta").href = hero.cta_link;
  } catch (err) {
    console.error("Erro ao carregar Hero:", err);
  }
}

async function loadSobre() {
  try {
    const res = await fetch("/data/sobre.json");
    const sobre = await res.json();

    document.getElementById("sobre-titulo").textContent = sobre.titulo;
    document.getElementById("sobre-texto").innerHTML = sobre.texto; // Usar innerHTML se o texto for markdown/html
    document.getElementById("sobre-img").src = sobre.imagem;
  } catch (err) {
    console.error("Erro ao carregar Sobre:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadHero();
  loadSobre();
});
