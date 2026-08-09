"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { CategoryRow } from "./types";

export function useCategories() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async function () {
    setLoading(true);
    const result = await supabase
      .from("categories")
      .select("*")
      .eq("section", "books")
      .order("value", { ascending: true });
    if (!result.error) setCategories((result.data || []) as CategoryRow[]);
    setLoading(false);
  }, []);

  useEffect(function () {
    refresh();
  }, [refresh]);

  return { categories: categories, loading: loading, refresh: refresh };
}
