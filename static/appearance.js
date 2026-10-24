// A small, pre-paint capability check. Unknown devices get the CSS fallback.
// No continuous animation or per-scroll work is needed for the glass treatment.
(() => {
  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  document.documentElement.dataset.effects =
    memory > 4 && cores > 4 ? "glass" : "lite";
})();
