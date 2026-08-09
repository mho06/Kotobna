"use client";

import { useEffect, useState } from "react";
import AdminLogin from "@/components/admin/AdminLogin";
import CategoryManager from "@/components/admin/CategoryManager";
import AdminBookForm from "@/components/admin/AdminBookForm";
import AdminBookList from "@/components/admin/AdminBookList";

export default function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [checkedSession, setCheckedSession] = useState(false);

  useEffect(function () {
    const stored = sessionStorage.getItem("kotobna_admin_password");
    if (stored) setPassword(stored);
    setCheckedSession(true);
  }, []);

  function handleLogout() {
    sessionStorage.removeItem("kotobna_admin_password");
    setPassword(null);
  }

  if (!checkedSession) return null;
  if (!password) return <AdminLogin onSuccess={setPassword} />;

  return (
    <main className="px-4 sm:px-8 py-6 sm:py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Admin</h1>
        <div className="flex items-center gap-4">
          <a href="/" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] uppercase tracking-widest text-ink/50 hover:text-forest transition-colors">
            View live site
          </a>
          <button onClick={handleLogout} className="font-mono text-[10px] uppercase tracking-widest text-red-700 hover:text-red-800 transition-colors">
            Log out
          </button>
        </div>
      </div>

      <CategoryManager password={password} />
      <AdminBookForm password={password} onSaved={function () { setRefreshKey(function (k) { return k + 1; }); }} />

      <h2 className="font-display text-xl font-semibold mb-4">Existing Books</h2>
      <AdminBookList password={password} refreshKey={refreshKey} />
    </main>
  );
}