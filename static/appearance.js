// Progressive glass for desktop and touch browsers, including iOS Safari.
(() => {
  const root = document.documentElement;
  const reduced = [
    matchMedia("(prefers-reduced-motion: reduce)"),
    matchMedia("(prefers-reduced-transparency: reduce)"),
    matchMedia("(forced-colors: active)"),
  ];
  const connection = navigator.connection;
  const supported =
    CSS.supports("backdrop-filter", "blur(1px)") ||
    CSS.supports("-webkit-backdrop-filter", "blur(1px)");
  const limited =
    (navigator.deviceMemory > 0 && navigator.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2);
  let slow = false;
  let frame = 0;
  let lastScroll = -Infinity;
  let lastSample = -Infinity;
  let previous = 0;
  let started = 0;
  let count = 0;
  let delayed = 0;
  let severe = 0;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function update() {
    root.dataset.effects =
      supported &&
      !limited &&
      !slow &&
      !connection?.saveData &&
      !reduced.some((query) => query.matches)
        ? "glass"
        : "lite";
    if (root.dataset.effects === "lite") stop();
  }
  function sample(now) {
    frame = 0;
    if (document.hidden || now - lastScroll > 180) return;
    // Repeated slow frames, or two severe stalls, favor the solid surface.
    if (previous) {
      if (now - previous > 40) delayed++;
      if (now - previous > 100) severe++;
    }
    previous = now;
    count++;
    if ((count >= 10 && delayed >= 5) || severe >= 2) {
      slow = true;
      update();
      return;
    }
    if (count < 36 && now - started < 1200)
      frame = requestAnimationFrame(sample);
  }
  addEventListener(
    "scroll",
    () => {
      const now = performance.now();
      lastScroll = now;
      if (
        frame ||
        document.hidden ||
        root.dataset.effects !== "glass" ||
        now - lastSample < 3000
      )
        return;
      lastSample = started = now;
      previous = count = delayed = severe = 0;
      frame = requestAnimationFrame(sample);
    },
    { passive: true },
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  reduced.forEach((query) => query.addEventListener("change", update));
  connection?.addEventListener("change", update);
  update();
})();
