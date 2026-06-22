import type { ReactNode } from "react";

type SectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function Section({ id, title, subtitle, children }: SectionProps) {
  return (
    <section id={id} className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm text-gray-400 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
