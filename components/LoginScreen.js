"use client";
import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { signIn } from "@/lib/api";
import OrgIcon from "./OrgIcon";

export default function LoginScreen({ org, onBack, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      onSuccess?.();
    } catch (err) {
      setError("E-posta veya şifre hatalı. Supabase Authentication panelinde bu e-posta ile bir kullanıcı tanımlı olduğundan emin olun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <span className="block shadow-xl shadow-black/50" style={{ borderRadius: 21 }}>
            <OrgIcon org={org} size={96} />
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h1 className="text-slate-100 text-xl font-semibold mb-1">Giriş Yap</h1>
          <p className="text-slate-500 text-sm mb-6">{org?.name} hesabınızla devam edin</p>
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-xs text-slate-400">E-posta</span>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                placeholder="ornek@sirket.com"
                autoComplete="username"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Şifre</span>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Giriş Yap
            </button>
          </form>
        </div>
        <button onClick={onBack} className="mt-5 mx-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft size={13} /> Organizasyon seçimine dön
        </button>
      </div>
    </div>
  );
}
