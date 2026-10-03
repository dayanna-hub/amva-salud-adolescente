export function PageHeader({ title, description, eyebrow = "Plataforma AMVA" }: { title: string; description: string; eyebrow?: string }) {
  return (
    <header className="mb-7 flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[.2em] text-teal-700">{eyebrow}</span>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
    </header>
  );
}
