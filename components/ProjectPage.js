"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SectionCard } from "./Shared";
import { fmtDate } from "@/lib/helpers";

export default function ProjectPage({ data }) {
  const { project, blocks } = data;
  const [expanded, setExpanded] = useState({ [blocks[0]?.id]: true });
  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  if (!project) return <div className="text-sm text-slate-400">Proje bulunamadı.</div>;

  return (
    <div className="space-y-5">
      <SectionCard title="Proje Bilgileri">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
          {[
            ["Proje Adı", project.name], ["İşveren", project.owner], ["Proje Adresi", project.address],
            ["Toplam Arsa Alanı", project.landArea], ["Toplam İnşaat Alanı", project.constructionArea],
            ["Blok Sayısı", project.blockCount], ["Daire Sayısı", project.apartmentCount],
            ["Başlangıç Tarihi", fmtDate(project.startDate)], ["Planlanan Bitiş", fmtDate(project.plannedEnd)],
            ["Güncel Tahmini Bitiş", fmtDate(project.estimatedEnd)], ["Proje Müdürü", project.manager],
          ].map(([label, val]) => (
            <div key={label}>
              <div className="text-xs text-slate-400 mb-0.5">{label}</div>
              <div className="font-medium text-slate-800">{val}</div>
            </div>
          ))}
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Proje Durumu</div>
            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">{project.status}</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Blok / Kat / Daire Hiyerarşisi">
        <div className="space-y-2">
          {blocks.map((block) => {
            const apts = block.floors.flatMap((f) => f.apartments);
            const avg = apts.length ? Math.round(apts.reduce((s, a) => s + a.progress, 0) / apts.length) : 0;
            return (
              <div key={block.id} className="border border-slate-100 rounded-lg overflow-hidden">
                <button onClick={() => toggle(block.id)} className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2">
                    {expanded[block.id] ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
                    <span className="font-medium text-sm text-slate-800">{block.name}</span>
                    <span className="text-xs text-slate-400">({apts.length} daire)</span>
                  </div>
                  <div className="flex items-center gap-2 w-32">
                    <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${avg}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-600 w-8 text-right">%{avg}</span>
                  </div>
                </button>
                {expanded[block.id] && (
                  <div className="px-3 py-2 divide-y divide-slate-50">
                    {block.floors.map((floor) => (
                      <div key={floor.id} className="py-2">
                        <div className="text-xs font-medium text-slate-500 mb-1.5">{floor.name}</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {floor.apartments.map((apt) => (
                            <div key={apt.id} className="flex items-center justify-between text-xs bg-slate-50 rounded px-2 py-1.5">
                              <span className="text-slate-600">{apt.name}</span>
                              <span className={`font-medium ${apt.progress >= 100 ? "text-emerald-600" : apt.progress >= 60 ? "text-blue-600" : "text-amber-600"}`}>%{apt.progress}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
