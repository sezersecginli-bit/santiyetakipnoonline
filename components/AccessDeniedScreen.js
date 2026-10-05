"use client";
import { ShieldAlert } from "lucide-react";
import OrgIcon from "./OrgIcon";

export default function AccessDeniedScreen({ org, error, email, onSwitchOrg, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex mb-6 shadow-xl shadow-black/50" style={{ borderRadius: 16 }}><OrgIcon org={org} size={72} /></div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <ShieldAlert size={28} className="text-amber-400 mx-auto mb-3" />
          <h1 className="text-slate-100 text-lg font-semibold mb-2">Bu organizasyona erişiminiz yok</h1>
          {error ? (
            <p className="text-sm text-red-400 mb-5">{error}</p>
          ) : (
            <p className="text-sm text-slate-400 mb-5">
              <b className="text-slate-300">{email}</b> hesabı <b className="text-slate-300">{org?.name}</b> ekibinde tanımlı değil.
              Yöneticinizden Ayarlar sayfasında e-postanızı bu organizasyonun ekip listesine eklemesini isteyin.
            </p>
          )}
          <div className="space-y-2">
            <button onClick={onSwitchOrg} className="w-full text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md py-2 transition-colors">
              Başka Organizasyon Seç
            </button>
            <button onClick={onLogout} className="w-full text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md py-2 transition-colors">
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
