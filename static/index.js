const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const pointerPreference = window.matchMedia(
  "(min-width: 641px) and (pointer: fine) and (hover: hover) and (forced-colors: none)",
);
const revealItems = document.querySelectorAll(".reveal, [data-project]");
let revealObserver;

// Content is visible by default; only hide it once observation is ready.
if (!motionPreference.matches && "IntersectionObserver" in window) {
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.08 },
  );
  revealItems.forEach((item) => revealObserver.observe(item));
  document.documentElement.classList.add("motion-ready");
}

const progress = document.querySelector(".progress span");
const navLinks = [...document.querySelectorAll(".site-header nav a")];
const sections = navLinks.map((link) => document.querySelector(link.hash));
let scrollFrame = 0;
function updateScrollEffects() {
  const range = document.documentElement.scrollHeight - window.innerHeight;
  const ratio =
    range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
  let current = -1;
  sections.forEach((section, index) => {
    if (section.getBoundingClientRect().top <= window.innerHeight * 0.4)
      current = index;
  });
  if (progress) progress.style.transform = `scaleX(${ratio})`;
  navLinks.forEach((link, index) => {
    if (index === current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  scrollFrame = 0;
}
function queueScrollEffects() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollEffects);
}
window.addEventListener("scroll", queueScrollEffects, { passive: true });
window.addEventListener("resize", queueScrollEffects);
if ("ResizeObserver" in window)
  new ResizeObserver(queueScrollEffects).observe(document.body);
updateScrollEffects();

const cursor = document.querySelector(".cursor");
const art = document.querySelector("[data-tilt]");
let pointerFrame = 0;
let pointerX = 0;
let pointerY = 0;
let magneticTarget = null;
let magneticBounds = null;
let artBounds = null;
const pointerEnabled = () =>
  pointerPreference.matches && !motionPreference.matches;

function resetPointer() {
  cancelAnimationFrame(pointerFrame);
  pointerFrame = 0;
  document.body.classList.remove("has-custom-cursor");
  cursor?.classList.remove("active");
  if (magneticTarget) magneticTarget.style.transform = "";
  if (art) art.style.transform = "";
  magneticTarget = magneticBounds = artBounds = null;
}

// Cache geometry on entry and batch all pointer writes into one animation frame.
window.addEventListener(
  "pointermove",
  (event) => {
    if (!pointerEnabled() || event.pointerType !== "mouse") {
      resetPointer();
      return;
    }
    pointerX = event.clientX;
    pointerY = event.clientY;
    const nextTarget = event.target.closest(".magnetic");
    if (nextTarget !== magneticTarget) {
      if (magneticTarget) magneticTarget.style.transform = "";
      magneticTarget = nextTarget;
      magneticBounds = nextTarget?.getBoundingClientRect();
    }
    if (art?.contains(event.target)) {
      if (!artBounds) artBounds = art.getBoundingClientRect();
    } else {
      artBounds = null;
      if (art) art.style.transform = "";
    }
    cursor?.classList.toggle(
      "active",
      Boolean(event.target.closest("a, button")),
    );
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      if (cursor) {
        cursor.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
        document.body.classList.add("has-custom-cursor");
      }
      if (magneticBounds && magneticTarget) {
        const x =
          (pointerX - magneticBounds.left - magneticBounds.width / 2) * 0.12;
        const y =
          (pointerY - magneticBounds.top - magneticBounds.height / 2) * 0.16;
        magneticTarget.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      if (artBounds && art) {
        const x = (pointerX - artBounds.left) / artBounds.width - 0.5;
        const y = (pointerY - artBounds.top) / artBounds.height - 0.5;
        art.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 6}deg)`;
      }
      pointerFrame = 0;
    });
  },
  { passive: true },
);

document.documentElement.addEventListener("pointerleave", resetPointer);
window.addEventListener("blur", resetPointer);
window.addEventListener("scroll", resetPointer, { passive: true });
window.addEventListener("resize", resetPointer);
document.addEventListener("visibilitychange", resetPointer);
document.addEventListener("keydown", (event) => {
  if (event.key === "Tab") resetPointer();
});
pointerPreference.addEventListener("change", resetPointer);
motionPreference.addEventListener("change", () => {
  resetPointer();
  if (motionPreference.matches) {
    revealObserver?.disconnect();
    revealItems.forEach((item) => item.classList.add("is-visible"));
    document.documentElement.classList.remove("motion-ready");
  }
});

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
