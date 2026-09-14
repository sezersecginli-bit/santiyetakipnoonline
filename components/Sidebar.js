"use client";
import {
  LayoutDashboard, Building2, ListChecks, FileText, ShoppingCart, Users,
  HardHat, Home, FolderOpen, Camera,
} from "lucide-react";
import { MENU } from "@/lib/helpers";

const ICONS = {
  dashboard: LayoutDashboard, proje: Building2, "is-kalemleri": ListChecks, teklifler: FileText,
  "satin-alma": ShoppingCart, firmalar: Users, santiye: HardHat, "daire-takibi": Home,
  evraklar: FolderOpen, fotograflar: Camera,
};

export default function Sidebar({ page, setPage, collapsed }) {
  return (
    <aside className={`bg-slate-950 text-slate-300 flex flex-col shrink-0 h-full transition-all ${collapsed ? "w-0 overflow-hidden md:w-16" : "w-64"}`}>
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-800 shrink-0">
        <div className="w-7 h-7 rounded bg-orange-500 flex items-center justify-center shrink-0">
          <HardHat size={15} className="text-slate-950" />
        </div>
        {!collapsed && <span className="text-slate-100 font-semibold text-sm truncate">Şantiye Yönetimi</span>}
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {MENU.map((item) => {
          const Icon = ICONS[item.id] || LayoutDashboard;
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                isActive ? "bg-slate-800/80 text-white border-r-2 border-orange-500" : "hover:bg-slate-900 text-slate-400"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span className="truncate text-left flex-1">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
