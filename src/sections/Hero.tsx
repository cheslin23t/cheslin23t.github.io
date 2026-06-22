export function Hero() {
  return (
    <section
      id="home"
      className="section relative flex min-h-[100svh] items-center overflow-hidden pb-32 pt-24 sm:pt-32 lg:min-h-[112vh]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 -left-20 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute right-0 bottom-6 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      </div>

      <div className="grid w-full items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.25em] text-violet-300 sm:text-sm">
            Portfolio template
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">
            Clean portfolio.
            <br />
            <span className="text-gradient-shimmer">Less noise, more signal.</span>
          </h1>
          <p className="max-w-2xl text-base text-(--muted) sm:text-lg">
            A refined starter based on the main portfolio design system. Focused on
            visual quality and structure, without backend complexity.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#projects"
              className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-violet-400"
            >
              Explore projects
            </a>
            <a
              href="#about"
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition-colors hover:border-white/40"
            >
              About section
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-(--card-border) bg-linear-to-br from-(--card) to-(--card-border) p-6">
          <div className="mb-5 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-(--muted)">
              Quick replace
            </span>
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-(--muted)">
              starter
            </span>
          </div>
          <ul className="space-y-2 text-sm text-(--muted)">
            <li>- Update name, role and social links</li>
            <li>- Replace screenshots and project cards</li>
            <li>- Adjust colors/typography to your brand</li>
            <li>- Deploy static-ready portfolio in minutes</li>
          </ul>
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
            <div>
              <p className="text-lg font-bold text-(--foreground)">5</p>
              <p className="text-[10px] uppercase tracking-wider text-(--muted)">Sections</p>
            </div>
            <div>
              <p className="text-lg font-bold text-(--foreground)">0</p>
              <p className="text-[10px] uppercase tracking-wider text-(--muted)">Backend</p>
            </div>
            <div>
              <p className="text-lg font-bold text-(--foreground)">Fast</p>
              <p className="text-[10px] uppercase tracking-wider text-(--muted)">Setup</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
