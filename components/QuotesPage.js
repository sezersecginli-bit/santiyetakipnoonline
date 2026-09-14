"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { StatusBadge } from "./Shared";
import { fmtTL, fmtDate } from "@/lib/helpers";
import { approveQuote } from "@/lib/api";

export default function QuotesPage({ data, projectId, profile, onMutated }) {
  const { quotes } = data;
  const [openId, setOpenId] = useState(quotes[0]?.id || null);
  const [busyId, setBusyId] = useState(null);

  const handleApprove = async (quote) => {
    setBusyId(quote.id);
    try {
      await approveQuote(projectId, quote, profile?.full_name || "Bilinmiyor");
      await onMutated();
    } catch (e) {
      alert("Onaylanırken bir hata oluştu: " + e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      {quotes.map((q) => {
        const lowest = q.bids.length ? Math.min(...q.bids.map((b) => b.amount)) : 0;
        const isOpen = openId === q.id;
        return (
          <div key={q.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setOpenId(isOpen ? null : q.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50">
              <div className="flex items-center gap-3 text-left">
                {isOpen ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                <div>
                  <div className="font-medium text-sm text-slate-800">{q.title}</div>
                  <div className="text-xs text-slate-400">Talep eden: {q.requestedBy} · Son tarih: {fmtDate(q.deadline)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-400 hidden sm:inline">{q.bids.length} teklif</span>
                <StatusBadge status={q.status} />
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 px-4 py-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                        <th className="py-1.5 pr-3 font-medium">Firma</th>
                        <th className="py-1.5 pr-3 font-medium text-right">Teklif</th>
                        <th className="py-1.5 pr-3 font-medium">Teslim</th>
                        <th className="py-1.5 pr-3 font-medium">Ödeme</th>
                        <th className="py-1.5 pr-3 font-medium">Garanti</th>
                        <th className="py-1.5 font-medium">Not</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.bids.map((b, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          <td className="py-2 pr-3 font-medium text-slate-700">{b.company}</td>
                          <td className={`py-2 pr-3 text-right tabular-nums ${b.amount === lowest ? "text-emerald-600 font-semibold" : "text-slate-600"}`}>
                            {fmtTL(b.amount)}{b.amount === lowest && <span className="ml-1 text-[10px] bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded">en düşük</span>}
                          </td>
                          <td className="py-2 pr-3 text-slate-500">{b.delivery}</td>
                          <td className="py-2 pr-3 text-slate-500">{b.terms}</td>
                          <td className="py-2 pr-3 text-slate-500">{b.warranty}</td>
                          <td className="py-2 text-slate-400 text-xs">{b.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-2">En düşük fiyat otomatik işaretlenir; karar fiyat, termin, garanti ve referans birlikte değerlendirilerek verilmelidir.</p>
                {q.status !== "Onaylandı" && q.bids.length > 0 && (
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => handleApprove(q)}
                      disabled={busyId === q.id}
                      className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                    >
                      <Check size={13} /> {busyId === q.id ? "İşleniyor…" : "En düşük teklifi onayla ve iş kalemine yansıt"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
