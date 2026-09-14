"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import LoginScreen from "@/components/LoginScreen";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import Dashboard from "@/components/Dashboard";
import ProjectPage from "@/components/ProjectPage";
import WorkItemsPage from "@/components/WorkItemsPage";
import CompaniesPage from "@/components/CompaniesPage";
import QuotesPage from "@/components/QuotesPage";
import SiteDailyReportPage from "@/components/SiteDailyReportPage";
import ApartmentTrackingPage from "@/components/ApartmentTrackingPage";
import PurchasingPage from "@/components/PurchasingPage";
import DocumentsPage from "@/components/DocumentsPage";
import PhotosPage from "@/components/PhotosPage";
import { SectionCard } from "@/components/Shared";
import { MENU, todayISO, daysBetween } from "@/lib/helpers";
import { getSession, onAuthStateChange, getMyProfile, getActiveProjectId, fetchAllData, subscribeToProjectChanges, signOut } from "@/lib/api";

export default function Home() {
  const [session, setSession] = useState(undefined); // undefined = kontrol ediliyor, null = giriş yok
  const [profile, setProfile] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getSession().then(setSession);
    const unsubscribe = onAuthStateChange((s) => setSession(s));
    return unsubscribe;
  }, []);

  const loadEverything = useCallback(async () => {
    try {
      const pid = await getActiveProjectId();
      if (!pid) {
        setLoadError("Aktif proje bulunamadı. supabase/schema.sql dosyasındaki seed verisini Supabase SQL Editor'de çalıştırdığınızdan emin olun.");
        setLoading(false);
        return;
      }
      setProjectId(pid);
      const [prof, all] = await Promise.all([getMyProfile(), fetchAllData(pid)]);
      setProfile(prof);
      setData(all);
      setLoadError("");
    } catch (e) {
      console.error(e);
      setLoadError("Veriler yüklenemedi: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      setLoading(true);
      loadEverything();
    } else if (session === null) {
      setLoading(false);
    }
  }, [session, loadEverything]);

  useEffect(() => {
    if (!projectId) return;
    const unsubscribe = subscribeToProjectChanges(projectId, () => {
      fetchAllData(projectId).then(setData).catch(console.error);
    });
    return unsubscribe;
  }, [projectId]);

  const refetch = useCallback(async () => {
    if (!projectId) return;
    const all = await fetchAllData(projectId);
    setData(all);
  }, [projectId]);

  const alertCount = useMemo(() => {
    if (!data) return 0;
    const today = todayISO();
    const late = data.workItems.filter((w) => w.status !== "Tamamlandı" && w.status !== "İptal" && w.end && w.end < today).length;
    const quoteDeadlines = data.quotes.filter((q) => q.status !== "Onaylandı" && q.deadline && daysBetween(today, q.deadline) <= 2 && daysBetween(today, q.deadline) >= 0).length;
    return late + quoteDeadlines;
  }, [data]);

  const filteredView = useMemo(() => {
    if (!data || !search.trim()) return null;
    const q = search.toLowerCase();
    return {
      companies: data.companies.filter((c) => c.name.toLowerCase().includes(q) || (c.category || "").toLowerCase().includes(q)),
      workItems: data.workItems.filter((w) => w.name.toLowerCase().includes(q) || (w.sub || "").toLowerCase().includes(q)),
      quotes: data.quotes.filter((qt) => qt.title.toLowerCase().includes(q)),
      purchases: data.purchases.filter((p) => p.item.toLowerCase().includes(q) || (p.company || "").toLowerCase().includes(q)),
      documents: data.documents.filter((d) => d.name.toLowerCase().includes(q)),
    };
  }, [data, search]);

  // ---- Oturum kontrol ediliyor ----
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 gap-2">
        <Loader2 size={18} className="animate-spin" /> Yükleniyor…
      </div>
    );
  }

  // ---- Giriş yapılmamış ----
  if (!session) {
    return <LoginScreen onSuccess={() => { /* onAuthStateChange session'ı güncelleyecek */ }} />;
  }

  const activeMenu = MENU.find((m) => m.id === page);
  const activePageIds = MENU.map((m) => m.id);

  return (
    <div className="h-screen w-full flex bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar page={page} setPage={setPage} collapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          profile={profile}
          onLogout={async () => { await signOut(); }}
          onMenuToggle={() => setSidebarCollapsed((s) => !s)}
          alertCount={alertCount}
          search={search}
          setSearch={setSearch}
          projectName={data?.project?.name || "Proje"}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading || !data ? (
            <div className="flex items-center justify-center h-full text-slate-400 gap-2">
              <Loader2 size={18} className="animate-spin" /> Yükleniyor…
            </div>
          ) : loadError ? (
            <div className="max-w-lg mx-auto mt-12 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">{loadError}</div>
          ) : (
            <>
              <div className="mb-4">
                <h1 className="text-lg font-semibold text-slate-800">{activeMenu?.label}</h1>
              </div>

              {search.trim() && filteredView ? (
                <SectionCard title={`"${search}" için sonuçlar`}>
                  <div className="space-y-4 text-sm">
                    <div>
                      <div className="text-xs font-medium text-slate-400 mb-1.5">İŞ KALEMLERİ ({filteredView.workItems.length})</div>
                      {filteredView.workItems.map((w) => <div key={w.id} className="py-1 text-slate-700">{w.name}</div>)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-400 mb-1.5">FİRMALAR ({filteredView.companies.length})</div>
                      {filteredView.companies.map((c) => <div key={c.id} className="py-1 text-slate-700">{c.name}</div>)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-400 mb-1.5">TEKLİFLER ({filteredView.quotes.length})</div>
                      {filteredView.quotes.map((q) => <div key={q.id} className="py-1 text-slate-700">{q.title}</div>)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-400 mb-1.5">SATIN ALMALAR ({filteredView.purchases.length})</div>
                      {filteredView.purchases.map((p) => <div key={p.id} className="py-1 text-slate-700">{p.item}</div>)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-400 mb-1.5">EVRAKLAR ({filteredView.documents.length})</div>
                      {filteredView.documents.map((d) => <div key={d.id} className="py-1 text-slate-700">{d.name}</div>)}
                    </div>
                  </div>
                </SectionCard>
              ) : (
                <>
                  {page === "dashboard" && <Dashboard data={data} setPage={setPage} />}
                  {page === "proje" && <ProjectPage data={data} />}
                  {page === "is-kalemleri" && <WorkItemsPage data={data} />}
                  {page === "firmalar" && <CompaniesPage data={data} />}
                  {page === "teklifler" && <QuotesPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "santiye" && <SiteDailyReportPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "daire-takibi" && <ApartmentTrackingPage data={data} />}
                  {page === "satin-alma" && <PurchasingPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "evraklar" && <DocumentsPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "fotograflar" && <PhotosPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {!activePageIds.includes(page) && <div className="text-sm text-slate-400">Modül bulunamadı.</div>}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
