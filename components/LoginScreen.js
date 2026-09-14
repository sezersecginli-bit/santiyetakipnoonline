"use client";
import { useState } from "react";
import { HardHat, Loader2 } from "lucide-react";
import { signIn } from "@/lib/api";

export default function LoginScreen({ onSuccess }) {
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
      onSuccess();
    } catch (err) {
      setError("E-posta veya şifre hatalı. Supabase Authentication panelinde kullanıcının tanımlı olduğundan emin olun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded bg-orange-500 flex items-center justify-center">
            <HardHat size={18} className="text-slate-950" />
          </div>
          <span className="text-slate-100 font-semibold text-lg tracking-tight">Şantiye Yönetim Sistemi</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400 text-sm mb-1">60 Dairelik Konut Projesi</p>
          <h1 className="text-slate-100 text-xl font-semibold mb-6">Hesabınızla giriş yapın</h1>
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-xs text-slate-400">E-posta</span>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                placeholder="ornek@sirket.com"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Şifre</span>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                placeholder="••••••••"
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
        <p className="text-center text-slate-600 text-xs mt-5">
          Hesabınız yok mu? Yöneticinizden Supabase Authentication panelinden sizin için bir kullanıcı oluşturmasını isteyin.
        </p>
      </div>
    </div>
  );
}
