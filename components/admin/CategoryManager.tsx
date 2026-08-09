"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";
import { useCategories } from "@/lib/useCategories";

export default function CategoryManager(props: { password: string }) {
  const password = props.password;
  const categoriesResult = useCategories();
  const categories = categoriesResult.categories;
  const loading = categoriesResult.loading;
  const refresh = categoriesResult.refresh;
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newValue.trim()) return;
    setSaving(true);
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ value: newValue.trim() }),
    });
    setNewValue("");
    setSaving(false);
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this genre?")) return;
    await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id: id }),
    });
    refresh();
  }

  return (
    <div className="bg-card border border-ink/10 rounded-card p-5 mb-8">
      <h3 className="font-display font-semibold mb-3">Genres</h3>
      {loading ? (
        <p className="text-ink/50 italic text-sm">Loading...</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.length === 0 && <p className="text-ink/50 italic text-sm">No genres yet.</p>}
          {categories.map(function (c) {
            return (
              <span
                key={c.id}
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest border border-forest text-forest rounded-full px-3 py-1"
              >
                {c.value}
                <button type="button" onClick={function () { handleDelete(c.id); }} className="hover:text-red-700">
                  &#215;
                </button>
              </span>
            );
          })}
        </div>
      )}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newValue}
          onChange={function (e) { setNewValue(e.target.value); }}
          placeholder="Add genre..."
          className="flex-1 bg-cream border border-ink/15 rounded-card px-3 py-2 text-sm focus:outline-none focus:border-forest"
        />
        <button
          type="submit"
          disabled={saving}
          className="font-mono text-[10px] uppercase tracking-widest bg-ochre text-cream rounded-card px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Spinner />} {saving ? "Adding..." : "Add"}
        </button>
      </form>
    </div>
  );
}
