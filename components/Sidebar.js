"use client";
import {
  LayoutDashboard, Building2, ListChecks, FileText, ShoppingCart, Users,
  HardHat, Home, FolderOpen, Camera, Settings, ClipboardList, ShieldAlert, UserCog,
} from "lucide-react";
import { MENU } from "@/lib/helpers";
import OrgIcon from "./OrgIcon";

const ICONS = {
  dashboard: LayoutDashboard, proje: Building2, "is-kalemleri": ListChecks, teklifler: FileText,
  "satin-alma": ShoppingCart, firmalar: Users, santiye: HardHat, "daire-takibi": Home,
  gorevler: ClipboardList, kontrol: ShieldAlert,
  evraklar: FolderOpen, fotograflar: Camera, ayarlar: Settings,
};

const ROLE_COLORS = {
  "Yönetici": "bg-orange-600", "Proje Mimarı": "bg-blue-600", "Şantiye Sorumlusu": "bg-emerald-600",
  "Satın Alma": "bg-purple-600", "Teknik Ofis": "bg-slate-600",
};

export default function Sidebar({ page, setPage, collapsed, onClose, org, menu, profile, onSwitchOrg, onLogout }) {
  const items = menu || MENU;
  const handleNav = (id) => {
    setPage(id);
    onClose?.(); // mobilde bir sayfaya geçince paneli kapat
  };

  const initials = (profile?.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const avatarColor = ROLE_COLORS[profile?.role] || "bg-slate-600";

  return (
    <>
      {/* Mobilde panel açıkken arka planı karartan, tıklayınca kapatan katman */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0
          transform transition-transform duration-200 ease-in-out
          ${collapsed ? "-translate-x-full" : "translate-x-0"}
          md:translate-x-0 md:static md:z-auto md:h-full`}
      >
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-800 shrink-0">
          <OrgIcon org={org} size={32} />
          <span className="text-slate-100 font-semibold text-sm truncate">{org?.name || "Şantiye Yönetimi"}</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {items.map((item) => {
            const Icon = ICONS[item.id] || LayoutDashboard;
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  isActive ? "bg-slate-800/80 text-white border-r-2 border-orange-500" : "hover:bg-slate-900 text-slate-400"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate text-left flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Kullanıcı bilgisi + kullanıcı değiştirme — özellikle mobilde sağ üst köşe dar kaldığı için buraya da eklendi */}
        <div className="border-t border-slate-800 p-3 shrink-0">
          <div className="flex items-center gap-2.5 px-1 py-1.5">
            <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-100 truncate">{profile?.full_name}</div>
              <div className="text-[11px] text-slate-500 truncate">{profile?.role}</div>
            </div>
          </div>
          <button
            onClick={onSwitchOrg}
            className="w-full mt-1.5 flex items-center justify-center gap-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md py-2 transition-colors"
          >
            <Building2 size={14} /> Organizasyon Değiştir
          </button>
          <button
            onClick={onLogout}
            className="w-full mt-1.5 flex items-center justify-center gap-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md py-2 transition-colors"
          >
            <UserCog size={14} /> Çıkış Yap
          </button>
        </div>
      </aside>
    </>
  );
}
