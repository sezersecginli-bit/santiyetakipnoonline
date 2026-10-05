"use client";
import { useState } from "react";
import { Bell, AlertTriangle, Clock, Truck } from "lucide-react";
import { todayISO, daysBetween, fmtDate } from "@/lib/helpers";

export default function NotificationBell({ alerts, onNavigate }) {
  const [open, setOpen] = useState(false);

  const handleClick = (alert) => {
    setOpen(false);
    onNavigate(alert.page);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative text-slate-500 hover:text-slate-800">
        <Bell size={18} />
        {alerts.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {alerts.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="px-4 py-2.5 border-b border-slate-100 text-sm font-semibold text-slate-800">
              Bildirimler {alerts.length > 0 && <span className="text-slate-400 font-normal">({alerts.length})</span>}
            </div>
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">Yeni bildirim yok</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {alerts.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <button key={i} onClick={() => handleClick(a)} className="w-full flex items-start gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-left">
                      <Icon size={15} className={`mt-0.5 shrink-0 ${a.tone === "red" ? "text-red-500" : "text-amber-500"}`} />
                      <span className="text-sm text-slate-700">{a.text}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function buildAlerts(data) {
  const today = todayISO();
  const alerts = [];

  data.workItems
    .filter((w) => w.status !== "Tamamlandı" && w.status !== "İptal" && w.end && w.end < today)
    .forEach((w) => {
      alerts.push({ icon: AlertTriangle, tone: "red", page: "is-kalemleri", text: `${w.name} — ${daysBetween(w.end, today)} gün gecikti` });
    });

  data.quotes
    .filter((q) => q.status !== "Onaylandı" && q.deadline && daysBetween(today, q.deadline) >= 0 && daysBetween(today, q.deadline) <= 2)
    .forEach((q) => {
      alerts.push({ icon: Clock, tone: "amber", page: "teklifler", text: `${q.title} teklif son tarihi ${fmtDate(q.deadline)}` });
    });

  data.purchases
    .filter((p) => p.status !== "Tamamlandı" && p.expectedDelivery && !p.actualDelivery && p.expectedDelivery < today)
    .forEach((p) => {
      alerts.push({ icon: Truck, tone: "red", page: "satin-alma", text: `${p.item} teslimatı gecikti` });
    });

  (data.defects || [])
    .filter((d) => d.status === "Açık" && d.dueDate && d.dueDate < today)
    .forEach((d) => {
      alerts.push({ icon: AlertTriangle, tone: "red", page: "kontrol", text: `${d.block} ${d.apt || ""} — ${d.title} (son tarih geçti)` });
    });

  return alerts;
}
