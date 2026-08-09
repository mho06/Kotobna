"use client";

import { useEffect, useRef, useState } from "react";
import { useBooks } from "@/lib/useBooks";
import { useCategories } from "@/lib/useCategories";
import BookCard from "@/components/BookCard";
import SearchBar from "@/components/SearchBar";
import SkeletonCard from "@/components/SkeletonCard";

export default function Home() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const booksResult = useBooks(search, filter);
  const books = booksResult.books;
  const loading = booksResult.loading;
  const hasMore = booksResult.hasMore;
  const loadMore = booksResult.loadMore;
  const categoriesResult = useCategories();
  const categories = categoriesResult.categories;
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(function () {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return function () { observer.disconnect(); };
  }, [loadMore]);

  return (
    <main className="px-5 sm:px-8 py-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-forest mb-1">
          Browse the shelf
        </h1>
        <p className="text-ink/60 text-sm">
          Every book here is real, in hand, and available to request over WhatsApp.
        </p>
      </div>

      <div className="mb-4 max-w-sm">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={function () { setFilter(""); }}
            className={
              "font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors " +
              (filter === "" ? "bg-forest text-cream border-forest" : "border-ink/20 text-ink/60 hover:border-forest")
            }
          >
            All
          </button>
          {categories.map(function (c) {
            return (
              <button
                key={c.id}
                onClick={function () { setFilter(c.value); }}
                className={
                  "font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors " +
                  (filter === c.value ? "bg-forest text-cream border-forest" : "border-ink/20 text-ink/60 hover:border-forest")
                }
              >
                {c.value}
              </button>
            );
          })}
        </div>
      )}

      {books.length === 0 && !loading && (
        <p className="text-ink/50 italic">No books found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
        {books.map(function (book) {
          return <BookCard key={book.id} book={book} />;
        })}
        {loading &&
          Array.from({ length: 4 }).map(function (_, i) {
            return <SkeletonCard key={"s-" + i} />;
          })}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-10" />}
    </main>
  );
}
