"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";

export default function AdminLogin(props: { onSuccess: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError("");
    const res = await fetch("/api/admin/imagekit-auth", {
      headers: { "x-admin-password": password },
    });
    setChecking(false);
    if (res.ok) {
      sessionStorage.setItem("kotobna_admin_password", password);
      props.onSuccess(password);
    } else {
      setError("Incorrect password.");
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="bg-card border border-ink/10 rounded-card p-8 w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold mb-1">Admin Access</h1>
        <p className="text-sm text-ink/60 mb-6">Enter the admin password to manage Kotobna.</p>
        <input
          type="password"
          value={password}
          onChange={function (e) { setPassword(e.target.value); }}
          className="w-full bg-cream border border-ink/15 rounded-card px-4 py-2.5 mb-3 focus:outline-none focus:border-forest"
          placeholder="Password"
          autoFocus
        />
        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={checking}
          className="w-full font-mono text-[11px] uppercase tracking-widest bg-forest text-cream rounded-card px-4 py-2.5 hover:bg-forest-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {checking && <Spinner />}
          {checking ? "Checking..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
