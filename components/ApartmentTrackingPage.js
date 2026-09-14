"use client";
import { useState } from "react";
import { Home, Check, TrendingUp, AlertTriangle, X } from "lucide-react";
import { KpiCard, SectionCard, StatusBadge, EmptyRow } from "./Shared";
import { fmtDate } from "@/lib/helpers";

function relatedWorkItemsForApt(block, floor, apt, workItems) {
  return workItems.filter((w) => {
    const blockMatch = w.block === block.name || w.block === "Tüm Bloklar" || w.block === "Ortak Alan";
    if (!blockMatch) return false;
    if (w.apt && w.apt !== "-") {
      const aptNum = apt.id.slice(1);
      return w.apt.includes(aptNum) || w.apt.toLowerCase().includes("daire");
    }
    if (w.floor && w.floor !== "-") {
      return floor.name.includes(w.floor.split(" ")[0]) || w.floor.includes(floor.name.split(" ")[0]);
    }
    return true;
  });
}

export default function ApartmentTrackingPage({ data }) {
  const { blocks, workItems, defects } = data;
  const [selected, setSelected] = useState(null);

  const allApts = blocks.flatMap((b) => b.floors.flatMap((f) => f.apartments));
  const avgProgress = allApts.length ? Math.round(allApts.reduce((s, a) => s + a.progress, 0) / allApts.length) : 0;
  const completed = allApts.filter((a) => a.progress >= 100).length;
  const openDefects = defects.filter((d) => d.status === "Açık").length;

  const progressColor = (p) => (p >= 100 ? "bg-emerald-500" : p >= 70 ? "bg-blue-500" : p >= 40 ? "bg-amber-500" : "bg-slate-300");
  const progressText = (p) => (p >= 100 ? "text-emerald-600" : p >= 70 ? "text-blue-600" : p >= 40 ? "text-amber-600" : "text-slate-500");

  const sel = selected;
  const selDefects = sel ? defects.filter((d) => d.block === sel.block.name && d.apt === sel.apt.name) : [];
  const selWork = sel ? relatedWorkItemsForApt(sel.block, sel.floor, sel.apt, workItems) : [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Toplam Daire" value={allApts.length} icon={Home} />
        <KpiCard label="Tamamlanan" value={completed} tone="emerald" icon={Check} />
        <KpiCard label="Ortalama İlerleme" value={`%${avgProgress}`} tone="blue" icon={TrendingUp} />
        <KpiCard label="Açık Eksik" value={openDefects} tone={openDefects ? "red" : "slate"} icon={AlertTriangle} />
      </div>

      {blocks.map((block) => (
        <SectionCard key={block.id} title={block.name}>
          <div className="space-y-4">
            {block.floors.map((floor) => (
              <div key={floor.id}>
                <div className="text-xs font-medium text-slate-400 mb-1.5">{floor.name}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                  {floor.apartments.map((apt) => {
                    const aptDefects = defects.filter((d) => d.block === block.name && d.apt === apt.name && d.status === "Açık");
                    return (
                      <button key={apt.id} onClick={() => setSelected({ block, floor, apt })} className="text-left border border-slate-100 rounded-lg p-2.5 hover:border-orange-300 hover:bg-orange-50/30 transition-colors relative">
                        {aptDefects.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" title="Açık eksik var" />}
                        <div className="text-xs font-medium text-slate-700 mb-1.5">{apt.name}</div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-1">
                          <div className={`h-full rounded-full ${progressColor(apt.progress)}`} style={{ width: `${apt.progress}%` }} />
                        </div>
                        <div className={`text-xs font-semibold ${progressText(apt.progress)}`}>%{apt.progress}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ))}

      {sel && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div><h3 className="font-semibold text-slate-800">{sel.block.name} — {sel.apt.name}</h3><p className="text-xs text-slate-400">{sel.floor.name}</p></div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-5 text-sm">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-500">GENEL İLERLEME</span>
                  <span className={`text-sm font-semibold ${progressText(sel.apt.progress)}`}>%{sel.apt.progress}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${progressColor(sel.apt.progress)}`} style={{ width: `${sel.apt.progress}%` }} />
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-2">İLİŞKİLİ İŞ KALEMLERİ ({selWork.length})</div>
                {selWork.length ? (
                  <div className="space-y-1.5">
                    {selWork.map((w) => (
                      <div key={w.id} className="flex items-center justify-between border border-slate-50 bg-slate-50 rounded-md px-2.5 py-1.5">
                        <span className="text-slate-700 text-xs truncate pr-2">{w.name}</span>
                        <StatusBadge status={w.status} />
                      </div>
                    ))}
                  </div>
                ) : <EmptyRow text="İlişkili iş kalemi bulunamadı" />}
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-2">EKSİKLER ({selDefects.length})</div>
                {selDefects.length ? (
                  <div className="space-y-1.5">
                    {selDefects.map((d) => (
                      <div key={d.id} className="flex items-center justify-between border border-red-100 bg-red-50/50 rounded-md px-2.5 py-1.5">
                        <div className="min-w-0 pr-2">
                          <div className="text-xs text-slate-700 truncate">{d.room} — {d.title}</div>
                          <div className="text-[11px] text-slate-400">{d.assignedTo} · Son: {fmtDate(d.dueDate)}</div>
                        </div>
                        <span className="text-[10px] font-medium text-red-600 shrink-0">{d.status}</span>
                      </div>
                    ))}
                  </div>
                ) : <EmptyRow text="Açık eksik yok" />}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 rounded-md p-2.5"><div className="font-medium text-slate-500 mb-0.5">MALZEME DURUMU</div><div className="text-slate-400">Satın Alma modülü ile entegre.</div></div>
                <div className="bg-slate-50 rounded-md p-2.5"><div className="font-medium text-slate-500 mb-0.5">FOTOĞRAFLAR</div><div className="text-slate-400">Fotoğraflar sayfasından erişilebilir.</div></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
