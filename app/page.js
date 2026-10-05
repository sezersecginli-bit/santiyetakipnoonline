"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import LoginScreen from "@/components/LoginScreen";
import OrgSelectScreen from "@/components/OrgSelectScreen";
import AccessDeniedScreen from "@/components/AccessDeniedScreen";
import NewProjectScreen from "@/components/NewProjectScreen";
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
import SettingsPage from "@/components/SettingsPage";
import TasksPage from "@/components/TasksPage";
import DefectsPage from "@/components/DefectsPage";
import { SectionCard } from "@/components/Shared";
import { buildAlerts } from "@/components/NotificationBell";
import { MENU } from "@/lib/helpers";
import { listProjects, fetchAllData, subscribeToProjectChanges, listOrganizations, getSession, onAuthStateChange, getMyProfile, signOut } from "@/lib/api";
import { getStoredOrgId, setStoredOrgId, clearStoredOrgId } from "@/lib/currentOrg";
import { getStoredProjectId, setStoredProjectId } from "@/lib/currentProject";

export default function Home() {
  const [orgs, setOrgs] = useState(null); // null = organizasyonlar henüz yüklenmedi
  const [orgsError, setOrgsError] = useState("");
  const [orgId, setOrgId] = useState(null);
  const [session, setSession] = useState(undefined); // undefined = kontrol ediliyor, null = giriş yok
  const [profile, setProfile] = useState(undefined); // undefined = yükleniyor, null = bu organizasyona erişim yok
  const [profileError, setProfileError] = useState("");
  const [projects, setProjects] = useState(null); // null = proje listesi henüz yüklenmedi
  const [projectId, setProjectId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [pageHistory, setPageHistory] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");

  // ---- Organizasyonlar (giriş öncesi logo ekranı) ----
  const refreshOrgs = useCallback(async () => {
    try {
      const list = await listOrganizations();
      setOrgs(list);
      setOrgsError("");
      return list;
    } catch (e) {
      console.error(e);
      setOrgs([]);
      setOrgsError(e.message || "bilinmeyen hata");
      return [];
    }
  }, []);

  useEffect(() => {
    refreshOrgs().then((list) => {
      const stored = getStoredOrgId();
      if (stored && list.find((o) => o.id === stored)) setOrgId(stored);
    });
  }, [refreshOrgs]);

  const org = orgs ? orgs.find((o) => o.id === orgId) || null : null;

  // Organizasyon değişince/çıkınca çalışma alanını sıfırla
  const resetWorkspace = useCallback(() => {
    setProjects(null);
    setProjectId(null);
    setData(null);
    setLoading(true);
    setLoadError("");
    setPage("dashboard");
    setPageHistory([]);
    setSearch("");
    setSidebarCollapsed(true);
    setProfile(undefined);
    setProfileError("");
  }, []);

  const selectOrg = useCallback((id) => {
    resetWorkspace();
    setStoredOrgId(id);
    setOrgId(id);
  }, [resetWorkspace]);

  const clearOrg = useCallback(() => {
    resetWorkspace();
    clearStoredOrgId();
    setOrgId(null);
  }, [resetWorkspace]);

  // ---- Oturum ----
  useEffect(() => {
    getSession().then(setSession);
    const unsubscribe = onAuthStateChange((s) => setSession(s));
    return unsubscribe;
  }, []);

  const userId = session?.user?.id || null;

  // Giriş yapılmış ve organizasyon seçilmişse: bu organizasyondaki üyeliği çöz
  // (userId'ye bağlı: oturum belirteci yenilendiğinde ekran sıfırlanmasın)
  useEffect(() => {
    if (!userId || !orgId) return;
    let cancelled = false;
    getMyProfile(orgId)
      .then((p) => { if (!cancelled) setProfile(p); })
      .catch((e) => {
        console.error(e);
        if (!cancelled) { setProfile(null); setProfileError("Üyelik kontrol edilemedi: " + (e.message || "bilinmeyen hata")); }
      });
    return () => { cancelled = true; };
  }, [userId, orgId]);

  const refreshMyProfile = useCallback(() => {
    if (!orgId) return;
    getMyProfile(orgId).then((p) => { if (p) setProfile(p); }).catch(() => {});
  }, [orgId]);

  const loadProjectData = useCallback(async (pid) => {
    setLoading(true);
    try {
      const all = await fetchAllData(pid);
      setData(all);
      setLoadError("");
    } catch (e) {
      console.error(e);
      setLoadError("Veriler yüklenemedi: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEverything = useCallback(async () => {
    try {
      const list = await listProjects(orgId);
      setProjects(list);
      if (list.length === 0) {
        setLoading(false);
        return;
      }
      const stored = getStoredProjectId();
      const resolved = list.find((p) => p.id === stored) ? stored : list[0].id;
      setProjectId(resolved);
      setStoredProjectId(resolved);
      await loadProjectData(resolved);
    } catch (e) {
      console.error(e);
      setLoadError("Projeler yüklenemedi: " + e.message);
      setLoading(false);
    }
  }, [loadProjectData, orgId]);

  useEffect(() => {
    if (userId && orgId && profile) {
      loadEverything();
    }
  }, [userId, orgId, profile?.id, loadEverything]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSwitchProject = useCallback((pid) => {
    setStoredProjectId(pid);
    setProjectId(pid);
    setPage("dashboard");
    setPageHistory([]);
    loadProjectData(pid);
  }, [loadProjectData]);

  const handleProjectCreated = useCallback(async (newId) => {
    const list = await listProjects(orgId);
    setProjects(list);
    handleSwitchProject(newId);
  }, [handleSwitchProject, orgId]);

  const handleProjectDeleted = useCallback(async (deletedId) => {
    const list = await listProjects(orgId);
    setProjects(list);
    if (deletedId === projectId) {
      if (list.length > 0) {
        handleSwitchProject(list[0].id);
      } else {
        setProjectId(null);
        setData(null);
        setLoading(false);
      }
    }
  }, [projectId, handleSwitchProject, orgId]);

  // ---- Sayfa gezinme geçmişi (geri tuşu) ----
  const navigateTo = useCallback((newPage) => {
    setPage((current) => {
      if (current !== newPage) {
        setPageHistory((h) => [...h, current]);
      }
      return newPage;
    });
  }, []);

  const goBack = useCallback(() => {
    setPageHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setPage(prev);
      return h.slice(0, -1);
    });
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    clearOrg();
  }, [clearOrg]);

  const alerts = useMemo(() => (data ? buildAlerts(data) : []), [data]);

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

  // ---- Organizasyonlar yükleniyor ----
  if (orgs === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 gap-2">
        <Loader2 size={18} className="animate-spin" /> Yükleniyor…
      </div>
    );
  }

  // ---- İlk sayfa: organizasyon (logo) seçimi ----
  if (!orgId || !org) {
    return <OrgSelectScreen orgs={orgs} error={orgsError} onSelect={selectOrg} />;
  }

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
    return <LoginScreen org={org} onBack={clearOrg} onSuccess={() => {}} />;
  }

  // ---- Bu organizasyondaki üyelik kontrol ediliyor ----
  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 gap-2">
        <Loader2 size={18} className="animate-spin" /> Yükleniyor…
      </div>
    );
  }

  // ---- Bu organizasyona erişim yok ----
  if (profile === null) {
    return (
      <AccessDeniedScreen
        org={org}
        email={session?.user?.email}
        error={profileError}
        onSwitchOrg={clearOrg}
        onLogout={handleLogout}
      />
    );
  }

  // ---- Proje listesi henüz yüklenmedi ----
  if (projects === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 gap-2">
        <Loader2 size={18} className="animate-spin" /> Projeler yükleniyor…
      </div>
    );
  }

  // ---- Hiç proje yok: ilk projeyi oluştur ----
  if (projects.length === 0) {
    return <NewProjectScreen org={org} orgId={orgId} onCreated={handleProjectCreated} />;
  }

  const activePageIds = MENU.map((m) => m.id);
  const menuWithLabels = MENU.map((item) => ({ ...item, label: org.menuLabels?.[item.id] || item.label }));
  const activeMenuLabeled = menuWithLabels.find((m) => m.id === page);

  return (
    <div className="h-screen w-full flex bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar page={page} setPage={navigateTo} collapsed={sidebarCollapsed} onClose={() => setSidebarCollapsed(true)} org={org} menu={menuWithLabels} profile={profile} onSwitchOrg={clearOrg} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          profile={profile}
          onLogout={handleLogout}
          onMenuToggle={() => setSidebarCollapsed((s) => !s)}
          alerts={alerts}
          onNavigate={navigateTo}
          search={search}
          setSearch={setSearch}
          orgId={orgId}
          projects={projects}
          currentProjectId={projectId}
          onSwitchProject={handleSwitchProject}
          onProjectCreated={handleProjectCreated}
          onProjectDeleted={handleProjectDeleted}
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
              <div className="mb-4 flex items-center gap-2">
                {pageHistory.length > 0 && (
                  <button onClick={goBack} className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md p-1.5 -ml-1.5" title="Geri">
                    <ArrowLeft size={18} />
                  </button>
                )}
                <h1 className="text-lg font-semibold text-slate-800">{activeMenuLabeled?.label}</h1>
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
                  {page === "dashboard" && <Dashboard data={data} setPage={navigateTo} />}
                  {page === "proje" && <ProjectPage data={data} projectId={projectId} profile={profile} onMutated={refetch} onProjectDeleted={handleProjectDeleted} />}
                  {page === "is-kalemleri" && <WorkItemsPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "firmalar" && <CompaniesPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "teklifler" && <QuotesPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "santiye" && <SiteDailyReportPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "daire-takibi" && <ApartmentTrackingPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "gorevler" && <TasksPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "kontrol" && <DefectsPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "satin-alma" && <PurchasingPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "evraklar" && <DocumentsPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "fotograflar" && <PhotosPage data={data} projectId={projectId} profile={profile} onMutated={refetch} />}
                  {page === "ayarlar" && (
                    <SettingsPage
                      orgId={orgId}
                      org={org}
                      bootstrap={!!profile?.bootstrap}
                      currentProfileId={profile?.id}
                      menu={MENU}
                      onOrgChanged={refreshOrgs}
                      onTeamChanged={refreshMyProfile}
                      onSelfDeleted={handleLogout}
                    />
                  )}
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
