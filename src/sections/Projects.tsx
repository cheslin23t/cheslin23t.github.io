"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";

export function Projects() {
  return (
    <section
      id="projects"
      className="relative overflow-hidden pt-0 pb-32"
      style={{ scrollMarginTop: "120px" }}
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute top-1/4 -left-1/4 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 bottom-1/4 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
      </div>

      <div className="section">
        <div className="mb-20 text-center">
          <span className="text-base font-bold uppercase tracking-widest text-(--accent)">
            Selected work
          </span>
          <h2 className="mt-4 px-2 text-3xl font-bold tracking-tight text-pretty sm:text-5xl md:text-6xl">
            Featured{" "}
            <span className="text-gradient-shimmer">Projects</span>
          </h2>
          <p className="mx-auto mt-8 max-w-3xl px-2 text-base font-light leading-relaxed text-(--muted) sm:text-xl">
            Card layout copied from the original portfolio style with mobile/desktop mockups.
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
          {projects
            .filter((p) => p.featured)
            .map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <a
            href="https://github.com/Szostak21?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="group mx-auto inline-flex max-w-[min(100%,22rem)] items-center gap-2 px-2 text-center text-sm font-semibold text-(--accent) transition-colors hover:text-(--accent-hover) sm:max-w-none sm:gap-3 sm:text-lg"
          >
            <span>See all projects on GitHub</span>
            <ExternalLink
              size={20}
              className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
            />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
