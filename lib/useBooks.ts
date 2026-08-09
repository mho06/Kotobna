"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { Book } from "./types";

const PAGE_SIZE = 24;

export function useBooks(searchQuery: string, genreFilter: string) {
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback(
    async function (pageToFetch: number, reset: boolean) {
      setLoading(true);
      const from = pageToFetch * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (searchQuery.trim()) {
        query = query.ilike("title", "%" + searchQuery.trim() + "%");
      }
      if (genreFilter) {
        query = query.eq("genre", genreFilter);
      }

      const result = await query;
      if (result.error) {
        console.error("Error fetching books:", result.error.message);
        setLoading(false);
        return;
      }

      const rows = (result.data || []) as Book[];
      setBooks(function (prev) {
        return reset ? rows : prev.concat(rows);
      });
      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
    },
    [searchQuery, genreFilter]
  );

  useEffect(
    function () {
      setPage(0);
      fetchPage(0, true);
    },
    [searchQuery, genreFilter]
  );

  const loadMore = useCallback(function () {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next, false);
  }, [page, loading, hasMore, fetchPage]);

  return { books: books, loading: loading, hasMore: hasMore, loadMore: loadMore };
}
