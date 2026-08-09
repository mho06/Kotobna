"use client";

export default function SearchBar(props: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={props.value}
      onChange={function (e) { props.onChange(e.target.value); }}
      placeholder="Search books..."
      className="w-full bg-card border border-ink/15 rounded-card px-4 py-3 font-body text-sm placeholder:text-ink/40 focus:outline-none focus:border-forest transition-colors"
    />
  );
}
