"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { StatusBadge, PriorityDot, EmptyRow } from "./Shared";
import { WORK_STATUS, fmtTL, fmtDate } from "@/lib/helpers";

export default function WorkItemsPage({ data }) {
  const { workItems } = data;
  const [filterBlock, setFilterBlock] = useState("Tümü");
  const [filterStatus, setFilterStatus] = useState("Tümü");
  const [filterCat, setFilterCat] = useState("Tümü");
  const [selected, setSelected] = useState(null);

  const blockNames = ["Tümü", ...new Set(workItems.map((w) => w.block))];

  const filtered = workItems.filter((w) =>
    (filterBlock === "Tümü" || w.block === filterBlock) &&
    (filterStatus === "Tümü" || w.status === filterStatus) &&
    (filterCat === "Tümü" || w.category === filterCat)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white">
          {blockNames.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white">
          <option>Tümü</option>
          <option>Proje</option>
          <option>Şantiye</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white">
          <option>Tümü</option>
          {WORK_STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate-400 self-center ml-auto">{filtered.length} iş kalemi</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left font-medium px-3 py-2.5">İş Adı</th>
              <th className="text-left font-medium px-3 py-2.5">Blok</th>
              <th className="text-left font-medium px-3 py-2.5">Firma</th>
              <th className="text-left font-medium px-3 py-2.5">Sorumlu</th>
              <th className="text-left font-medium px-3 py-2.5">Bitiş</th>
              <th className="text-left font-medium px-3 py-2.5">Öncelik</th>
              <th className="text-left font-medium px-3 py-2.5">Durum</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id} onClick={() => setSelected(w)} className="border-t border-slate-50 hover:bg-orange-50/40 cursor-pointer">
                <td className="px-3 py-2.5 text-slate-800 font-medium">{w.name}</td>
                <td className="px-3 py-2.5 text-slate-500">{w.block}</td>
                <td className="px-3 py-2.5 text-slate-500">{w.company}</td>
                <td className="px-3 py-2.5 text-slate-500">{w.responsible}</td>
                <td className="px-3 py-2.5 text-slate-500">{fmtDate(w.end)}</td>
                <td className="px-3 py-2.5"><PriorityDot priority={w.priority} /></td>
                <td className="px-3 py-2.5"><StatusBadge status={w.status} /></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7}><EmptyRow text="Filtreye uygun iş kalemi yok" /></td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex gap-2">
                <StatusBadge status={selected.status} />
                <PriorityDot priority={selected.priority} />
              </div>
              <p className="text-slate-600">{selected.desc}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Kategori", `${selected.category} / ${selected.sub}`], ["Blok", selected.block],
                  ["Kat", selected.floor], ["Daire", selected.apt], ["Mahal", selected.room],
                  ["Sorumlu", selected.responsible], ["Firma", selected.company],
                  ["Başlangıç", fmtDate(selected.start)], ["Bitiş", fmtDate(selected.end)],
                  ["Planlanan Süre", selected.plannedDays ? `${selected.plannedDays} gün` : "—"],
                  ["Gerçekleşen Süre", selected.actualDays ? `${selected.actualDays} gün` : "—"],
                ].map(([l, v]) => (
                  <div key={l}><div className="text-xs text-slate-400">{l}</div><div className="font-medium text-slate-700">{v}</div></div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div><div className="text-xs text-slate-400">Tahmini Maliyet</div><div className="font-medium text-slate-700">{fmtTL(selected.estCost)}</div></div>
                <div><div className="text-xs text-slate-400">Gerçekleşen Maliyet</div><div className="font-medium text-slate-700">{fmtTL(selected.actCost)}</div></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
