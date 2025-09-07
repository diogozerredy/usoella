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

document.addEventListener("DOMContentLoaded", loadHero);
