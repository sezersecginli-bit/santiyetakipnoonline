"use client";
import { useMemo } from "react";
import {
  Home, Check, ListChecks, AlertTriangle, FileText, Clock, Banknote, TrendingUp, Wallet, Package,
} from "lucide-react";
import { KpiCard, SectionCard, EmptyRow, StatusBadge, PriorityDot } from "./Shared";
import { todayISO, daysBetween, fmtTL, fmtDate } from "@/lib/helpers";

export default function Dashboard({ data, setPage }) {
  const { workItems, quotes, blocks, tasks, activities, purchases } = data;
  const today = todayISO();

  const lateItems = useMemo(
    () => workItems.filter((w) => w.status !== "Tamamlandı" && w.status !== "İptal" && w.end && w.end < today),
    [workItems, today]
  );
  const upcomingItems = useMemo(
    () => workItems.filter((w) => w.status !== "Tamamlandı" && w.status !== "İptal" && w.start && daysBetween(today, w.start) >= 0 && daysBetween(today, w.start) <= 7),
    [workItems, today]
  );

  const allApts = blocks.flatMap((b) => b.floors.flatMap((f) => f.apartments));
  const completedApts = allApts.filter((a) => a.progress >= 100).length;
  const activeWork = workItems.filter((w) => ["Devam ediyor", "Kontrolde", "Eksik var"].includes(w.status)).length;
  const pendingQuotes = quotes.filter((q) => q.status === "Teklif bekliyor" || q.status === "Teklifler alındı").length;
  const approvalQuotes = quotes.filter((q) => q.status === "Onay bekliyor").length;
  const totalEst = workItems.reduce((s, w) => s + (w.estCost || 0), 0);
  const totalAct = workItems.reduce((s, w) => s + (w.actCost || 0), 0);

  const overallProgress = allApts.length ? Math.round(allApts.reduce((s, a) => s + a.progress, 0) / allApts.length) : 0;
  const statusCounts = workItems.reduce((acc, w) => {
    let bucket = w.status === "Tamamlandı" ? "Tamamlandı" : (w.status === "Devam ediyor" || w.status === "Kontrolde") ? "Devam Ediyor" :
      (w.status !== "İptal" && w.end && w.end < today) ? "Gecikti" : "Bekliyor";
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});
  const statusTotal = workItems.length || 1;

  const quoteStatusCounts = quotes.reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  const myTasksToday = tasks.filter((t) => t.status !== "Tamamlandı").slice(0, 4);
  const deadlineQuotes = quotes.filter((q) => q.status !== "Onaylandı" && q.deadline && daysBetween(today, q.deadline) >= -2 && daysBetween(today, q.deadline) <= 5);

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-800">Proje Genel İlerleme</span>
          <span className="text-sm font-semibold text-orange-600">%{overallProgress}</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: `${overallProgress}%` }} />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-500 flex-wrap">
          {Object.entries(statusCounts).map(([k, v]) => (
            <span key={k}>{k}: <b className="text-slate-700">{v}</b> iş kalemi ({Math.round((v / statusTotal) * 100)}%)</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Toplam Daire" value={allApts.length} icon={Home} />
        <KpiCard label="Tamamlanan Daire" value={completedApts} tone="emerald" icon={Check} />
        <KpiCard label="Aktif İşler" value={activeWork} tone="blue" icon={ListChecks} />
        <KpiCard label="Geciken İşler" value={lateItems.length} tone={lateItems.length ? "red" : "slate"} icon={AlertTriangle} />
        <KpiCard label="Bekleyen Teklifler" value={pendingQuotes} tone="amber" icon={FileText} />
        <KpiCard label="Onay Bekleyen Teklif" value={approvalQuotes} tone="amber" icon={Clock} />
        <KpiCard label="Açık Satın Almalar" value={purchases.filter((p) => p.status !== "Tamamlandı").length} tone="blue" icon={Package} />
        <KpiCard label="Toplam Bütçe (Tahmini)" value={fmtTL(totalEst)} icon={TrendingUp} />
        <KpiCard label="Gerçekleşen Harcama" value={fmtTL(totalAct)} tone="blue" icon={Wallet} />
        <KpiCard label="Bu Ay Yapılan Ödeme" value={fmtTL(0)} sub="Ödeme modülü sonraki fazda" icon={Banknote} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="BUGÜN" className="lg:col-span-1">
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xs font-medium text-slate-400 mb-1.5">YAPILACAKLAR ({myTasksToday.length})</div>
              {myTasksToday.length ? myTasksToday.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-slate-700 truncate pr-2">{t.title}</span>
                  <PriorityDot priority={t.priority} />
                </div>
              )) : <EmptyRow text="Görev yok" />}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 mb-1.5">BAŞLAMASI GEREKEN İŞLER ({upcomingItems.length})</div>
              {upcomingItems.length ? upcomingItems.slice(0, 3).map((w) => (
                <div key={w.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-slate-700 truncate pr-2">{w.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">{fmtDate(w.start)}</span>
                </div>
              )) : <EmptyRow text="Yaklaşan iş yok" />}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 mb-1.5">TEKLİF SON TARİHLERİ ({deadlineQuotes.length})</div>
              {deadlineQuotes.length ? deadlineQuotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-slate-700 truncate pr-2">{q.title}</span>
                  <span className="text-xs text-amber-600 shrink-0">{fmtDate(q.deadline)}</span>
                </div>
              )) : <EmptyRow text="Yaklaşan teklif tarihi yok" />}
            </div>
          </div>
        </SectionCard>

        <SectionCard title={`Geciken İşler (${lateItems.length})`} className="lg:col-span-2">
          {lateItems.length === 0 ? <EmptyRow text="Geciken iş yok, harika!" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="py-1.5 pr-3 font-medium">İş</th>
                    <th className="py-1.5 pr-3 font-medium">Firma</th>
                    <th className="py-1.5 pr-3 font-medium">Sorumlu</th>
                    <th className="py-1.5 pr-3 font-medium">Bitiş</th>
                    <th className="py-1.5 font-medium text-red-500">Gecikme</th>
                  </tr>
                </thead>
                <tbody>
                  {lateItems.map((w) => (
                    <tr key={w.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-3 text-slate-700">{w.name}</td>
                      <td className="py-2 pr-3 text-slate-500">{w.company}</td>
                      <td className="py-2 pr-3 text-slate-500">{w.responsible}</td>
                      <td className="py-2 pr-3 text-slate-500">{fmtDate(w.end)}</td>
                      <td className="py-2 text-red-600 font-medium">{daysBetween(w.end, today)} gün</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Teklif Durumu" action={<button onClick={() => setPage("teklifler")} className="text-xs text-orange-600 font-medium hover:underline">Tümünü gör</button>}>
          <div className="space-y-2">
            {["Teklif bekliyor", "Teklifler alındı", "Karşılaştırılıyor", "Onay bekliyor", "Onaylandı"].map((s) => (
              <div key={s} className="flex items-center justify-between text-sm">
                <StatusBadge status={s} />
                <span className="font-medium text-slate-700 tabular-nums">{quoteStatusCounts[s] || 0}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Son Aktiviteler">
          <div className="space-y-3">
            {activities.length === 0 && <EmptyRow text="Henüz aktivite yok" />}
            {activities.map((a, i) => (
              <div key={i} className="flex gap-2.5 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                <div>
                  <span className="text-slate-700"><b className="font-medium">{a.user}</b>, {a.text}</span>
                  <div className="text-xs text-slate-400">{fmtDate(a.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
