const header = document.querySelector(".site-header");
const heroPanels = document.querySelectorAll(".hero-panel");
const heroDots = document.querySelectorAll(".hero-dots span");

function updateHeaderVisibility() {
  if (!header) return;

  const hideAfter = window.innerHeight / 2;
  header.classList.toggle("header-hidden", window.scrollY > hideAfter);
}

window.addEventListener("scroll", updateHeaderVisibility, { passive: true });
window.addEventListener("resize", updateHeaderVisibility);
updateHeaderVisibility();

function setActiveHeroDot(index) {
  heroDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === index);
  });
}

heroPanels.forEach((panel, index) => {
  panel.addEventListener("mouseenter", () => setActiveHeroDot(index));
});

setActiveHeroDot(0);
