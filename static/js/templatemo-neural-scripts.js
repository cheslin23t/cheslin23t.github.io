// JavaScript - modern dark theme interactions and canvas particles

// Safe DOM helpers
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// Mobile menu (safe guards)
const mobileMenuToggle = $('.mobile-menu-toggle');
const mobileNav = $('.mobile-nav');
if (mobileMenuToggle && mobileNav) {
  mobileMenuToggle.addEventListener('click', () => {
    mobileMenuToggle.classList.toggle('active');
    mobileNav.classList.toggle('active');
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    mobileMenuToggle.classList.remove('active'); mobileNav.classList.remove('active');
  }));
  document.addEventListener('click', (e) => {
    if (!mobileMenuToggle.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileMenuToggle.classList.remove('active'); mobileNav.classList.remove('active');
    }
  });
}

// Smooth scrolling
$$('a[href^="#"]').forEach(a => a.addEventListener('click', function(e){
  const href = this.getAttribute('href'); if(href === '#') return;
  const target = document.querySelector(href);
  if (target) { e.preventDefault(); target.scrollIntoView({behavior:'smooth', block:'start'}); }
}));

// Header scrolled state
const header = $('header');
window.addEventListener('scroll', () => {
  if (!header) return;
  header.classList.toggle('scrolled', window.pageYOffset > 48);
});

// Active menu highlighting
function updateActiveMenuItem(){
  const sections = $$('section[id]');
  const navLinks = $$('.nav-links a, .mobile-nav a');
  const scrollPos = window.pageYOffset + 120;
  let current = '';
  sections.forEach(s => { if (scrollPos >= s.offsetTop && scrollPos < s.offsetTop + s.offsetHeight) current = s.id; });
  navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));
}
window.addEventListener('scroll', updateActiveMenuItem);
window.addEventListener('load', updateActiveMenuItem);

// Intersection observer animations
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.style.opacity = '1'; en.target.style.transform = 'translateY(0)'; }
  });
},{threshold:0.12, rootMargin:'0px 0px -80px 0px'});
$$('.timeline-content, .hexagon, .feature-content').forEach(el => {
  el.style.opacity = '0'; el.style.transform = 'translateY(30px)'; el.style.transition = 'opacity .7s ease, transform .7s ease'; io.observe(el);
});

// Canvas particle system (background, subtle, reactive)
(function initCanvasParticles(){
  const canvas = document.createElement('canvas');
  canvas.className = 'neural-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H, DPR = Math.max(1, window.devicePixelRatio || 1);
  function resize(){ W = canvas.width = Math.floor(window.innerWidth * DPR); H = canvas.height = Math.floor(window.innerHeight * DPR); canvas.style.width = window.innerWidth+'px'; canvas.style.height = window.innerHeight+'px'; ctx.setTransform(DPR,0,0,DPR,0,0); }
  window.addEventListener('resize', resize); resize();

  const particles = [];
  const max = 90;
  const colors = ['rgba(0,229,255,0.12)','rgba(100,240,240,0.08)','rgba(160,230,255,0.06)'];

  function spawn(){ if (particles.length >= max) return; particles.push({ x: Math.random()*W/DPR, y: Math.random()*H/DPR, vx:(Math.random()-0.5)*0.2, vy:(Math.random()-0.5)*0.2, r: Math.random()*2+0.6, c: colors[Math.floor(Math.random()*colors.length)], life: Math.random()*120+60 }); }
  for(let i=0;i<max/2;i++) spawn();

  let mouse = {x: W/DPR/2, y: H/DPR/2};
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('pointerdown', () => { for(let i=0;i<6;i++) spawn(); });

  function step(){ ctx.clearRect(0,0,W/DPR,H/DPR);
    // subtle radial ambient
    const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, Math.max(W,H)/2);
    g.addColorStop(0, 'rgba(0,230,255,0.03)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W/DPR,H/DPR);

    for(let i=particles.length-1;i>=0;i--){ const p = particles[i]; p.x += p.vx + (mouse.x - p.x)*0.0006; p.y += p.vy + (mouse.y - p.y)*0.0006; p.life -= 1; if(p.life<=0){ particles.splice(i,1); continue; }
      ctx.beginPath(); ctx.fillStyle = p.c; ctx.globalCompositeOperation = 'lighter'; ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); ctx.closePath();
      // subtle trailing line
      ctx.strokeStyle = 'rgba(0,200,230,0.05)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x - p.vx*8, p.y - p.vy*8); ctx.stroke();
    }
    if (Math.random() < 0.6) spawn();
    ctx.globalCompositeOperation='source-over';
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();

// small UX: form button
const submitBtn = $('.submit-btn');
if (submitBtn) submitBtn.addEventListener('click', (e) => { e.preventDefault(); submitBtn.disabled=true; submitBtn.textContent='Sending...'; setTimeout(()=>{ submitBtn.textContent='Sent'; setTimeout(()=>{ submitBtn.disabled=false; submitBtn.textContent='Send'; },1200); },1200); });

// end of file
