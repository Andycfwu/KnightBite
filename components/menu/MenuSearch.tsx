"use client";

export function MenuSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <div className="flex items-center gap-3 rounded-[22px] border border-black/10 bg-white px-5 py-4 shadow-[0_12px_28px_rgba(23,23,23,0.06)]">
        <SearchIcon />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search menu..."
          className="w-full bg-transparent text-[1.05rem] text-ink outline-none ring-0"
        />
      </div>
    </label>
  );
}

function SearchIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-ink/38">
      <circle cx="11" cy="11" r="7.2" stroke="currentColor" strokeWidth="2" />
      <path d="m16.5 16.5 3.8 3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
