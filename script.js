const canvas = document.querySelector("#dream-field");
const ctx = canvas.getContext("2d");
const bookmarks = document.querySelectorAll(".bookmark-rail a");
const sections = [...bookmarks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const parallaxPieces = document.querySelectorAll("[data-depth]");

const originButton = document.querySelector(".origin-apple-tab");
const manifestoButton = document.querySelector(".manifesto-float");
const overlays = document.querySelectorAll(".overlay");
const closeButtons = document.querySelectorAll(".popup-close");

let width = 0;
let height = 0;
let mouseX = 0.5;
let mouseY = 0.5;
let particles = [];

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function makeParticles() {
  particles = Array.from({ length: 95 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2.3 + 0.4,
    drift: Math.random() * 0.35 + 0.06,
    wobble: Math.random() * 80,
    alpha: Math.random() * 0.45 + 0.2
  }));
}

function drawThread(startX, startY, endX, endY, lift, alpha) {
  const pullX = (mouseX - 0.5) * 80;
  const pullY = (mouseY - 0.5) * 70;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(
    width * 0.28 + pullX,
    startY - lift + pullY,
    width * 0.72 - pullX,
    endY + lift - pullY,
    endX,
    endY
  );
  ctx.strokeStyle = `rgba(227, 61, 80, ${alpha})`;
  ctx.lineWidth = 0.85;
  ctx.stroke();
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  const time = performance.now() * 0.001;
  const scroll = window.scrollY || 0;

  const gradient = ctx.createRadialGradient(
    width * 0.72,
    height * 0.18,
    20,
    width * 0.72,
    height * 0.18,
    Math.max(width, height) * 0.7
  );
  gradient.addColorStop(0, "rgba(127, 148, 40, 0.18)");
  gradient.addColorStop(0.45, "rgba(239, 192, 96, 0.1)");
  gradient.addColorStop(1, "rgba(255, 248, 232, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  particles.forEach((particle) => {
    particle.x += particle.drift;
    particle.y += Math.sin(time + particle.wobble) * 0.08;
    if (particle.x > width + 20) particle.x = -20;

    const pulse = Math.sin(time * 1.5 + particle.wobble) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.arc(
      particle.x,
      (particle.y + scroll * 0.025) % (height + 30) - 15,
      particle.size * pulse,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = `rgba(251, 247, 238, ${particle.alpha})`;
    ctx.fill();
  });

  for (let i = 0; i < 8; i += 1) {
    const y = height * (0.13 + i * 0.11) + Math.sin(time * 0.7 + i) * 28;
    drawThread(-40, y, width + 40, y + Math.sin(i) * 80, 90 + i * 8, 0.14);
  }

  requestAnimationFrame(draw);
}

function updateParallax(event) {
  mouseX = event.clientX / window.innerWidth;
  mouseY = event.clientY / window.innerHeight;

  parallaxPieces.forEach((piece) => {
    const depth = Number(piece.dataset.depth || 0);
    const x = (mouseX - 0.5) * depth * 80;
    const y = (mouseY - 0.5) * depth * 80;
    piece.style.translate = `${x}px ${y}px`;
  });
}

function activateBookmark(id) {
  bookmarks.forEach((link) => {
    link.setAttribute("aria-current", String(link.getAttribute("href") === `#${id}`));
  });
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) activateBookmark(entry.target.id);
    });
  },
  { rootMargin: "-40% 0px -45% 0px", threshold: 0.01 }
);

sections.forEach((section) => sectionObserver.observe(section));

function openOverlay(id, trigger) {
  const overlay = document.getElementById(id);
  if (!overlay) return;

  overlays.forEach((openOverlayElement) => {
    if (openOverlayElement.id !== id) closeOverlay(openOverlayElement.id);
  });

  overlay.hidden = false;
  overlay.classList.add("is-open");
  trigger?.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeOverlay(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove("is-open");
  overlay.hidden = true;

  const hasOpenOverlay = [...overlays].some((openOverlayElement) =>
    openOverlayElement.classList.contains("is-open")
  );
  if (!hasOpenOverlay) document.body.style.overflow = "";

  if (id === "origin-popup" && originButton) originButton.setAttribute("aria-expanded", "false");
  if (id === "manifesto-popup" && manifestoButton) manifestoButton.setAttribute("aria-expanded", "false");
}

originButton?.addEventListener("click", () => openOverlay("origin-popup", originButton));
manifestoButton?.addEventListener("click", () => openOverlay("manifesto-popup", manifestoButton));

closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeOverlay(button.dataset.close);
  });
});

overlays.forEach((overlay) => {
  overlay.addEventListener("pointerdown", (event) => {
    const clickedInsidePanel =
      event.target instanceof Element && event.target.closest(".popup-panel");
    if (!clickedInsidePanel) {
      closeOverlay(overlay.id);
    }
  });
});

document.addEventListener(
  "pointerdown",
  (event) => {
    if (!(event.target instanceof Element)) return;

    overlays.forEach((overlay) => {
      if (!overlay.classList.contains("is-open")) return;

      const panel = overlay.querySelector(".popup-panel");
      if (!panel?.contains(event.target)) {
        closeOverlay(overlay.id);
      }
    });
  },
  true
);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    overlays.forEach((overlay) => {
      if (overlay.classList.contains("is-open")) closeOverlay(overlay.id);
    });
  }
});

window.addEventListener("resize", () => {
  resizeCanvas();
  makeParticles();
});

window.addEventListener("mousemove", updateParallax);

resizeCanvas();
makeParticles();
draw();
