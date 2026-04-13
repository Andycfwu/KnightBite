import { Card } from "@/components/ui/Card";

type EmptyStateProps = {
  title: string;
  description: string;
  compact?: boolean;
};

export function EmptyState({ title, description, compact = false }: EmptyStateProps) {
  return (
    <Card
      className={`rounded-[28px] border-dashed bg-white/80 text-center shadow-none ${
        compact ? "px-5 py-6" : "px-6 py-10 sm:px-7"
      }`}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sand text-brand">
        <span className="text-xl">+</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Empty</p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink/58">{description}</p>
    </Card>
  );
}
