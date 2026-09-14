"use client";
import { Star } from "lucide-react";
import { STATUS_STYLE, PRIORITY_STYLE } from "@/lib/helpers";

export function StatusBadge({ status }) {
  const cls = STATUS_STYLE[status] || "bg-slate-100 text-slate-600 border-slate-200";
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border ${cls}`}>{status}</span>;
}

export function PriorityDot({ priority }) {
  const s = PRIORITY_STYLE[priority] || PRIORITY_STYLE["Normal"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {priority}
    </span>
  );
}

export function KpiCard({ label, value, sub, tone = "slate", icon: Icon }) {
  const toneMap = {
    slate: "text-slate-900", red: "text-red-600", amber: "text-amber-600",
    blue: "text-blue-600", emerald: "text-emerald-600",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-1 min-w-[150px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {Icon && <Icon size={15} className="text-slate-300" />}
      </div>
      <span className={`text-2xl font-semibold tabular-nums ${toneMap[tone]}`}>{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
}

export function SectionCard({ title, action, children, className = "" }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function EmptyRow({ text }) {
  return <div className="text-sm text-slate-400 py-4 text-center">{text}</div>;
}

export function StarRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={12} className={i <= value ? "fill-orange-400 text-orange-400" : "text-slate-200"} />
        ))}
      </div>
    </div>
  );
}
