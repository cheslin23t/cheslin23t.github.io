"use client";

import { motion } from "framer-motion";
import { BookOpen, Link2, Trophy } from "lucide-react";

export function Other() {
  const items = [
    {
      key: "guestbook",
      icon: BookOpen,
      title: "Guestbook",
      desc: "Optional page where visitors can leave a short message.",
      href: "#other",
      color: "from-violet-500 to-purple-500",
    },
    {
      key: "achievements",
      icon: Trophy,
      title: "Achievements",
      desc: "A visual timeline for milestones, awards, and certifications.",
      href: "#other",
      color: "from-amber-500 to-orange-500",
    },
    {
      key: "links",
      icon: Link2,
      title: "Useful Links",
      desc: "One place for socials, docs, CV, and featured resources.",
      href: "#other",
      color: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <section
      id="other"
      className="relative overflow-hidden pt-0 pb-24 sm:pb-32"
      style={{ scrollMarginTop: "120px" }}
    >
      <div className="section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="mb-4 px-2 text-3xl font-bold text-pretty sm:text-5xl md:text-6xl">
            More{" "}
            <span className="text-gradient-shimmer">Sections</span>
          </h2>
          <p className="mx-auto max-w-2xl px-3 text-base text-(--muted) sm:text-lg md:text-xl">
            Keep these cards or replace them with your own pages.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((item) => (
            <motion.a
              key={item.key}
              href={item.href}
              className="group glass relative cursor-pointer overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:scale-105 sm:p-8"
              whileHover={{ scale: 1.05 }}
            >
              <div
                className={`absolute inset-0 bg-linear-to-br ${item.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
              />
              <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                <div
                  className={`h-16 w-16 rounded-2xl bg-linear-to-br ${item.color} p-0.5`}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-(--background)">
                    <item.icon size={32} style={{ color: "var(--foreground)" }} />
                  </div>
                </div>
                <div>
                  <h3
                    className={`bg-linear-to-br ${item.color} mb-2 bg-clip-text px-1 text-xl font-bold text-transparent sm:text-2xl`}
                  >
                    {item.title}
                  </h3>
                  <p className="px-1 text-xs text-(--muted) sm:text-sm">{item.desc}</p>
                </div>
                <div
                  className={`bg-linear-to-br ${item.color} mt-2 bg-clip-text text-sm font-semibold text-transparent transition-transform duration-300 group-hover:translate-x-2`}
                >
                  Explore
                </div>
              </div>
            </motion.a>
          ))}
        </div>

      </div>
    </section>
  );
}
