const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal, [data-project]');

if (reduced) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  revealItems.forEach((item) => observer.observe(item));
}

const progress = document.querySelector('.progress span');
let ticking = false;
function updateScrollEffects() {
  const range = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${range > 0 ? window.scrollY / range : 0})`;
  document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`);
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) requestAnimationFrame(updateScrollEffects);
  ticking = true;
}, { passive: true });
updateScrollEffects();

if (window.matchMedia('(pointer: fine)').matches && !reduced) {
  const cursor = document.querySelector('.cursor');
  let cursorFrame = 0;
  let cursorX = 0;
  let cursorY = 0;
  document.body.classList.add('has-custom-cursor');
  window.addEventListener('pointermove', (event) => {
    cursorX = event.clientX;
    cursorY = event.clientY;
    if (cursorFrame) return;
    cursorFrame = requestAnimationFrame(() => {
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      cursorFrame = 0;
    });
  });
  document.querySelectorAll('a').forEach((link) => {
    link.addEventListener('pointerenter', () => cursor.classList.add('active'));
    link.addEventListener('pointerleave', () => cursor.classList.remove('active'));
  });

  const art = document.querySelector('[data-tilt]');
  art.addEventListener('pointermove', (event) => {
    const bounds = art.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    art.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 6}deg)`;
  });
  art.addEventListener('pointerleave', () => { art.style.transform = ''; });

  document.querySelectorAll('.magnetic').forEach((item) => {
    item.addEventListener('pointermove', (event) => {
      const bounds = item.getBoundingClientRect();
      item.style.transform = `translate(${(event.clientX - bounds.left - bounds.width / 2) * .12}px, ${(event.clientY - bounds.top - bounds.height / 2) * .16}px)`;
    });
    item.addEventListener('pointerleave', () => { item.style.transform = ''; });
  });
}

document.getElementById('year').textContent = new Date().getFullYear();
