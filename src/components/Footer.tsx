import { Heart } from "lucide-react";
import { siteConfig, socials } from "@/data/config";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-black/20 px-4 py-10 backdrop-blur-sm sm:px-0 sm:py-12">
      <div className="section">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3 text-base text-(--muted)">
            <span className="text-lg font-bold text-(--foreground)">
              <span className="gradient-text">PS</span>
            </span>
            <span>•</span>
            <span>
              © {year} {siteConfig.name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-base font-medium text-(--muted)">
            Built with
            <Heart size={16} className="fill-red-500 text-red-500" />
            Next.js & Tailwind
          </div>

          <div className="flex items-center gap-5">
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-(--muted) transition-colors duration-200 hover:scale-110 hover:text-(--accent)"
                aria-label={social.name}
              >
                <social.icon size={22} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
