"use client";

type MenuSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function MenuSearch({ value, onChange }: MenuSearchProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-ink/48">Search menu</span>
      <div className="flex items-center gap-3 rounded-2xl border border-ink/12 bg-white px-4 py-3 shadow-soft">
        <span className="text-base text-ink/45">⌕</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by item, station, or tag"
          className="w-full bg-transparent text-sm text-ink outline-none ring-0"
        />
      </div>
    </label>
  );
}
