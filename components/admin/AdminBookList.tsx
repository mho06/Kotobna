"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Book } from "@/lib/types";

export default function AdminBookList(props: { password: string; refreshKey: number }) {
  const password = props.password;
  const refreshKey = props.refreshKey;

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async function () {
    setLoading(true);
    const result = await supabase.from("books").select("*").order("created_at", { ascending: false });
    if (!result.error) setBooks((result.data || []) as Book[]);
    setLoading(false);
  }, []);

  useEffect(function () {
    fetchBooks();
  }, [fetchBooks, refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this book permanently?")) return;
    const res = await fetch("/api/admin/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id: id }),
    });
    if (res.ok) {
      setBooks(function (prev) { return prev.filter(function (b) { return b.id !== id; }); });
    } else {
      alert("Failed to delete book.");
    }
  }

  if (loading) return <p className="text-ink/50 italic">Loading...</p>;
  if (books.length === 0) return <p className="text-ink/50 italic">No books yet.</p>;

  return (
    <div className="divide-y divide-ink/10 border border-ink/10 rounded-card overflow-hidden bg-card">
      {books.map(function (book) {
        return (
          <div key={book.id} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="min-w-0">
              <p className="font-display font-semibold truncate">{book.title || "Untitled"}</p>
              <p className="text-xs text-ink/50 truncate">
                {[book.author, book.publish_date].filter(Boolean).join(" \u00b7 ")}
              </p>
            </div>
            <button
              onClick={function () { handleDelete(book.id); }}
              className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-red-700 border border-red-700 rounded-full px-3 py-1.5 hover:bg-red-700 hover:text-cream transition-colors"
            >
              Delete
            </button>
          </div>
        );
      })}
    </div>
  );
}
