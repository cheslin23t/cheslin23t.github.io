"use client";

import { motion } from "framer-motion";
import {
  SiDocker,
  SiGit,
  SiNodedotjs,
  SiReact,
  SiTailwindcss,
  SiTypescript,
} from "react-icons/si";

export function Skills() {
  const beltChunk = [...Array(4)].flatMap(() => [
    { name: "React", icon: SiReact, color: "#61DAFB" },
    { name: "TypeScript", icon: SiTypescript, color: "#3178C6" },
    { name: "Node", icon: SiNodedotjs, color: "#339933" },
    { name: "Tailwind", icon: SiTailwindcss, color: "#06B6D4" },
    { name: "Docker", icon: SiDocker, color: "#2496ED" },
    { name: "Git", icon: SiGit, color: "#F05032" },
  ]);

  const skillGroups = [
    {
      title: "Frontend",
      summary: "UI architecture and polished user experiences.",
      items: ["Next.js (Pages/App Router)", "React + TypeScript", "Tailwind CSS"],
    },
    {
      title: "Backend",
      summary: "Reliable APIs and production-ready services.",
      items: ["Node.js + REST", "PostgreSQL / Supabase", "Auth, caching, rate-limiting"],
    },
    {
      title: "Shipping",
      summary: "From idea to deployment with quality control.",
      items: ["GitHub workflows", "Vercel deployments", "Monitoring + iteration"],
    },
  ];

  return (
    <section
      id="skills"
      className="relative overflow-hidden pt-0 pb-28"
      style={{ scrollMarginTop: "100px" }}
    >
      <div className="section">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-(--accent) sm:text-base">
            Tech stack
          </span>
          <h2 className="mt-2 px-2 text-3xl font-bold tracking-tight text-pretty sm:text-5xl md:text-6xl">
            Skills{" "}
            <span className="text-gradient-shimmer">Overview</span>
          </h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          {skillGroups.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-(--card-border) bg-linear-to-br from-(--card) to-(--card-border) p-5"
            >
              <h3 className="text-base font-semibold">{group.title}</h3>
              <p className="mt-1 text-xs text-(--muted)">{group.summary}</p>
              <ul className="mt-3 space-y-2 text-sm text-(--muted)">
                {group.items.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-(--card-border) bg-(--card)/40 py-3">
          <div className="relative overflow-hidden">
            <motion.div
              className="flex w-max items-center gap-8 whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                repeat: Infinity,
                ease: "linear",
                duration: 24,
              }}
            >
              {[0, 1].map((copy) => (
                <div key={copy} className="flex items-center gap-8 px-4">
                  {beltChunk.map((item, index) => (
                    <div key={`${copy}-${item.name}-${index}`} className="flex items-center gap-2">
                      <item.icon style={{ color: item.color }} size={16} />
                      <span className="text-xs uppercase tracking-wider text-(--muted)">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
