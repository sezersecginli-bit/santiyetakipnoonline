"use client";
import { Search, Bell, LogOut, Menu } from "lucide-react";

const ROLE_COLORS = {
  "Yönetici": "bg-orange-600", "Proje Mimarı": "bg-blue-600", "Şantiye Sorumlusu": "bg-emerald-600",
  "Satın Alma": "bg-purple-600", "Teknik Ofis": "bg-slate-600",
};

export default function TopBar({ profile, onLogout, onMenuToggle, alertCount, search, setSearch, projectName }) {
  const initials = (profile?.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const color = ROLE_COLORS[profile?.role] || "bg-slate-600";

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center gap-3 px-4 shrink-0">
      <button onClick={onMenuToggle} className="text-slate-500 hover:text-slate-800 md:hidden">
        <Menu size={20} />
      </button>
      <div className="hidden md:block text-sm font-medium text-slate-800 truncate max-w-[220px]">{projectName}</div>
      <div className="flex-1 flex items-center max-w-md ml-2">
        <div className="relative w-full">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Firma, iş, daire, teklif ara…"
            className="w-full text-sm border border-slate-200 rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-slate-50"
          />
        </div>
      </div>
      <button className="relative text-slate-500 hover:text-slate-800">
        <Bell size={18} />
        {alertCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {alertCount}
          </span>
        )}
      </button>
      <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
        <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-semibold`}>
          {initials}
        </div>
        <div className="hidden sm:block leading-tight">
          <div className="text-xs font-medium text-slate-800">{profile?.full_name}</div>
          <div className="text-[11px] text-slate-400">{profile?.role}</div>
        </div>
        <button onClick={onLogout} className="text-slate-400 hover:text-red-500 ml-1" title="Çıkış">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
