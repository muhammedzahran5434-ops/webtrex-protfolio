import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Database,
  Download,
  Edit3,
  Files,
  FolderKanban,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Package,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
  Tags,
  Trash2,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import {
  ALLOWED_FILE_EXTS,
  ALLOWED_IMAGE_EXTS,
  ApiClient,
  createArchitecturalArt,
  formatBytes,
  getFileExt,
  readFileAsDataUrl,
} from '../lib/api';
import type {
  ActivityLog,
  AdminSession,
  Category,
  ClientMessage,
  DatabaseStats,
  Project,
  ReleaseFile,
  SiteSettings,
} from '../types';
import { ToastContainer } from './PublicModals';
import type { ToastItem } from '../types';
import { WebTrexLogo } from './WebTrexLogo';

export type AdminTabId =
  | 'overview'
  | 'add-project'
  | 'manage-projects'
  | 'categories'
  | 'files'
  | 'messages'
  | 'settings'
  | 'profile';

interface AdminConsoleProps {
  adminSession: AdminSession;
  setAdminSession: (s: AdminSession) => void;
  adminTab: AdminTabId;
  setAdminTab: (tab: AdminTabId) => void;
  projects: Project[];
  categories: Category[];
  uploadedFiles: ReleaseFile[];
  messages: ClientMessage[];
  activityLogs: ActivityLog[];
  settings: SiteSettings;
  dbStats: DatabaseStats | null;
  toasts: ToastItem[];
  addToast: (title: string, message?: string, type?: 'success' | 'error') => void;
  onRefreshAdminData: () => Promise<void>;
  onViewLiveSite: () => void;
  onLogout: () => void;
  onDownloadFile: (file: ReleaseFile) => void;
}

export function AdminConsole({
  adminSession,
  setAdminSession,
  adminTab,
  setAdminTab,
  projects,
  categories,
  uploadedFiles,
  messages,
  activityLogs,
  settings,
  dbStats,
  toasts,
  addToast,
  onRefreshAdminData,
  onViewLiveSite,
  onLogout,
  onDownloadFile,
}: AdminConsoleProps) {
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);

  const navItems: Array<{
    id: AdminTabId;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number | null;
    highlight?: boolean;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'add-project', label: 'Publish Release', icon: PlusCircle },
    { id: 'manage-projects', label: 'Manage Projects', icon: FolderKanban, badge: projects.length },
    { id: 'categories', label: 'Categories', icon: Tags, badge: categories.length },
    { id: 'files', label: 'Binary Vault', icon: Files, badge: uploadedFiles.length },
    {
      id: 'messages',
      label: 'Client Inbox',
      icon: MessageSquare,
      badge: messages.filter((m) => !m.read).length || null,
      highlight: true,
    },
    { id: 'settings', label: 'Site & Database', icon: Settings },
    { id: 'profile', label: 'Security & Profile', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-[#06070A] text-slate-100 flex flex-col lg:flex-row">
      <ToastContainer toasts={toasts} />

      {/* Mobile Admin Topbar */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
        <WebTrexLogo size="sm" />
        <div className="flex items-center gap-2">
          <button
            onClick={onViewLiveSite}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 text-slate-200 hover:bg-white/15"
          >
            Live Site
          </button>
          <button
            onClick={() => setAdminSidebarOpen(!adminSidebarOpen)}
            className="p-2 rounded-lg border border-white/15 text-white"
            aria-label="Toggle Menu"
          >
            {adminSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Admin Left Rail */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0B0E14] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          adminSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <WebTrexLogo size="sm" />
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 mt-2.5">
                COMMAND CONSOLE // V2
              </p>
            </div>
            <button
              onClick={() => setAdminSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = adminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setAdminTab(item.id);
                    setAdminSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-white border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : ''}`} />
                    {item.label}
                  </span>
                  {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-mono font-semibold ${
                        active
                          ? 'bg-cyan-400/20 text-cyan-200'
                          : item.highlight
                          ? 'bg-indigo-500/25 text-indigo-300'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 space-y-2.5">
          <div className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">DATABASE</span>
            <span className="font-semibold flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SQLite Live
            </span>
          </div>
          <button
            onClick={onViewLiveSite}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            View Live Site
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-semibold hover:bg-rose-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Admin Workspace */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-cyan-400 mb-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Authenticated Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">
              {adminTab === 'overview' && 'Studio Telemetry & Overview'}
              {adminTab === 'add-project' && 'Publish New Release'}
              {adminTab === 'manage-projects' && 'Manage Portfolio Releases'}
              {adminTab === 'categories' && 'Discipline Categories'}
              {adminTab === 'files' && 'Binary & Asset Vault'}
              {adminTab === 'messages' && 'Client Inquiries'}
              {adminTab === 'settings' && 'Site & Database Configuration'}
              {adminTab === 'profile' && 'Administrator Security'}
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-[#0E1118] border border-white/10 px-4 py-2.5 rounded-2xl">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">{adminSession.name}</p>
              <p className="text-xs font-mono text-slate-400">{adminSession.email}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-slate-950 flex items-center justify-center font-display font-bold text-sm">
              WT
            </div>
          </div>
        </div>

        {adminTab === 'overview' && (
          <AdminOverviewTab
            projects={projects}
            uploadedFiles={uploadedFiles}
            messages={messages}
            activityLogs={activityLogs}
            categories={categories}
            dbStats={dbStats}
            onNavigateTab={setAdminTab}
          />
        )}

        {adminTab === 'add-project' && (
          <AdminProjectFormTab
            categories={categories}
            addToast={addToast}
            onSuccess={async () => {
              await onRefreshAdminData();
              setAdminTab('manage-projects');
            }}
          />
        )}

        {adminTab === 'manage-projects' && (
          <AdminManageProjectsTab
            projects={projects}
            categories={categories}
            addToast={addToast}
            onRefreshAdminData={onRefreshAdminData}
            onAddNew={() => setAdminTab('add-project')}
          />
        )}

        {adminTab === 'categories' && (
          <AdminCategoriesTab
            categories={categories}
            projects={projects}
            addToast={addToast}
            onRefreshAdminData={onRefreshAdminData}
          />
        )}

        {adminTab === 'files' && (
          <AdminFilesTab
            uploadedFiles={uploadedFiles}
            addToast={addToast}
            onRefreshAdminData={onRefreshAdminData}
            onDownload={onDownloadFile}
          />
        )}

        {adminTab === 'messages' && (
          <AdminMessagesTab
            messages={messages}
            addToast={addToast}
            onRefreshAdminData={onRefreshAdminData}
          />
        )}

        {adminTab === 'settings' && (
          <AdminSettingsTab
            settings={settings}
            dbStats={dbStats}
            addToast={addToast}
            onRefreshAdminData={onRefreshAdminData}
          />
        )}

        {adminTab === 'profile' && (
          <AdminProfileTab
            adminSession={adminSession}
            setAdminSession={setAdminSession}
            addToast={addToast}
            onRefreshAdminData={onRefreshAdminData}
          />
        )}
      </main>
    </div>
  );
}

// ============================================================================
// ADMIN TAB 1: OVERVIEW
// ============================================================================
function AdminOverviewTab({
  projects,
  uploadedFiles,
  messages,
  activityLogs,
  categories,
  dbStats,
  onNavigateTab,
}: {
  projects: Project[];
  uploadedFiles: ReleaseFile[];
  messages: ClientMessage[];
  activityLogs: ActivityLog[];
  categories: Category[];
  dbStats: DatabaseStats | null;
  onNavigateTab: (tab: AdminTabId) => void;
}) {
  const publishedCount = projects.filter((p) => p.status === 'published').length;
  const draftCount = projects.filter((p) => p.status !== 'published').length;
  const unreadMessages = messages.filter((m) => !m.read).length;

  const categoryDistribution = useMemo(() => {
    return categories.map((cat) => {
      const count = projects.filter(
        (p) => p.category?.toLowerCase() === cat.name.toLowerCase()
      ).length;
      return { name: cat.name, count };
    });
  }, [categories, projects]);

  const maxCatCount = Math.max(1, ...categoryDistribution.map((c) => c.count));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Projects', value: projects.length, accent: 'text-white', action: 'manage-projects' as AdminTabId },
          { label: 'Published', value: publishedCount, accent: 'text-cyan-300', action: 'manage-projects' as AdminTabId },
          { label: 'Drafts', value: draftCount, accent: 'text-amber-300', action: 'manage-projects' as AdminTabId },
          { label: 'Vault Files', value: uploadedFiles.length, accent: 'text-indigo-300', action: 'files' as AdminTabId },
          {
            label: 'Messages',
            value: messages.length,
            sub: unreadMessages > 0 ? `${unreadMessages} unread` : 'All read',
            accent: 'text-emerald-300',
            action: 'messages' as AdminTabId,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            onClick={() => onNavigateTab(stat.action)}
            className="cursor-pointer bento-card rounded-2xl p-5"
          >
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400">{stat.label}</p>
            <p className={`text-3xl font-display font-bold mt-2 ${stat.accent}`}>{stat.value}</p>
            {stat.sub && <p className="text-[11px] font-semibold text-cyan-300 mt-1">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {dbStats && (
        <div className="bento-card rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-semibold">
                {dbStats.engine} Database Engine Active
              </p>
              <p className="text-xs text-slate-400 font-mono">{dbStats.dbPath}</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-300 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
            DB Size: {formatBytes(dbStats.dbSizeBytes)}
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bento-card rounded-3xl p-6 sm:p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display font-bold text-white">Category Distribution</h3>
              <p className="text-xs text-slate-400">Live count of releases across studio disciplines</p>
            </div>
            <button
              onClick={() => onNavigateTab('add-project')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-xs font-bold hover:opacity-95 transition-opacity"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Release
            </button>
          </div>

          <div className="space-y-4">
            {categoryDistribution.map((item) => {
              const pct = Math.round((item.count / maxCatCount) * 100);
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-300">{item.name}</span>
                    <span className="text-cyan-300 font-mono">{item.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-700"
                      style={{ width: `${Math.max(pct, item.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bento-card rounded-3xl p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-lg font-display font-bold text-white">Recent Activity</h3>
          </div>

          {activityLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No activity logs recorded yet.</p>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {activityLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-white/10 last:border-0">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white">{log.action}</p>
                    <p className="text-xs text-slate-400 mt-0.5 break-words">{log.detail}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN TAB 2: ADD / EDIT PROJECT FORM
// ============================================================================
function AdminProjectFormTab({
  categories,
  addToast,
  onSuccess,
  existingProject = null,
}: {
  categories: Category[];
  addToast: (title: string, message?: string, type?: 'success' | 'error') => void;
  onSuccess: () => Promise<void> | void;
  existingProject?: Project | null;
}) {
  const [title, setTitle] = useState(existingProject?.title || '');
  const [description, setDescription] = useState(existingProject?.description || '');
  const [category, setCategory] = useState(
    existingProject?.category || categories[0]?.name || 'Website'
  );
  const [thumbnail, setThumbnail] = useState(existingProject?.thumbnail || '');
  const [images, setImages] = useState<string[]>(existingProject?.images || []);
  const [files, setFiles] = useState<ReleaseFile[]>(existingProject?.files || []);
  const [websiteUrl, setWebsiteUrl] = useState(existingProject?.websiteUrl || '');
  const [downloadUrl, setDownloadUrl] = useState(existingProject?.downloadUrl || '');
  const [techInput, setTechInput] = useState('');
  const [technologies, setTechnologies] = useState<string[]>(existingProject?.technologies || []);
  const [date, setDate] = useState(
    existingProject?.date || new Date().toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = getFileExt(file.name);
    if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
      addToast('Invalid Thumbnail Format', 'Allowed: JPG, JPEG, PNG, WEBP, SVG', 'error');
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setThumbnail(dataUrl);
    addToast('Thumbnail Loaded', file.name);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const loaded: string[] = [];
    for (const file of selected) {
      const ext = getFileExt(file.name);
      if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
        addToast('Skipped File', `${file.name} is not a supported image format.`, 'error');
        continue;
      }
      const dataUrl = await readFileAsDataUrl(file);
      loaded.push(dataUrl);
    }
    setImages((prev) => [...prev, ...loaded]);
    if (loaded.length > 0) {
      addToast('Gallery Images Added', `${loaded.length} image(s) attached.`);
    }
  };

  const handleProjectFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const processed: ReleaseFile[] = [];
    for (const file of selected) {
      const ext = getFileExt(file.name);
      if (!ALLOWED_FILE_EXTS.includes(ext)) {
        addToast(
          'Unsupported File Format',
          `${file.name}: Allowed formats are JPG, JPEG, PNG, WEBP, SVG, APK, ISO, PDF, DOCX, TXT, ZIP.`,
          'error'
        );
        continue;
      }
      const dataUrl = await readFileAsDataUrl(file);
      processed.push({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        type: ext.toUpperCase(),
        size: file.size,
        uploadDate: new Date().toISOString().split('T')[0],
        dataUrl,
      });
    }

    setFiles((prev) => [...prev, ...processed]);
    if (processed.length > 0) {
      addToast('Files Attached', `${processed.length} release file(s) ready for storage.`);
    }
  };

  const handleAddTech = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = techInput.trim();
    if (val && !technologies.includes(val)) {
      setTechnologies([...technologies, val]);
      setTechInput('');
    }
  };

  const handleSaveProject = async (targetStatus: 'published' | 'draft') => {
    if (!title.trim() || !description.trim()) {
      addToast('Missing Required Fields', 'Please enter a project title and description.', 'error');
      return;
    }

    setSaving(true);
    try {
      const rawThumbnail =
        thumbnail ||
        createArchitecturalArt(
          ['#090D16', '#F8FAFC', '#22D3EE'],
          title.trim(),
          `WTX // ${category.toUpperCase()}`
        );

      const finalThumbnail = await ApiClient.uploadFile('thumbnail.png', rawThumbnail);

      const rawImages = images.length > 0 ? images : [finalThumbnail];
      const finalImages = await Promise.all(
        rawImages.map((img, idx) => ApiClient.uploadFile(`gallery-${idx}.png`, img))
      );

      const uploadedReleaseFiles = await Promise.all(
        files.map(async (f) => {
          if (f.dataUrl.startsWith('data:')) {
            const url = await ApiClient.uploadFile(f.name, f.dataUrl);
            return { ...f, dataUrl: url };
          }
          return f;
        })
      );

      const payload: Partial<Project> = {
        title: title.trim(),
        description: description.trim(),
        category,
        thumbnail: finalThumbnail,
        images: finalImages,
        files: uploadedReleaseFiles,
        websiteUrl: websiteUrl.trim(),
        downloadUrl: downloadUrl.trim(),
        technologies,
        date,
        status: targetStatus,
      };

      if (existingProject) {
        await ApiClient.updateProject(existingProject.id, payload);
      } else {
        await ApiClient.createProject(payload);
      }

      addToast(
        targetStatus === 'published' ? 'Release Published!' : 'Draft Saved',
        targetStatus === 'published'
          ? 'Your project is now persisted in SQLite and live on the WebTrex portfolio.'
          : 'Saved as draft in SQLite.'
      );
      await onSuccess();
    } catch (err) {
      addToast('Save Error', err instanceof Error ? err.message : 'Failed to save project.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bento-card rounded-3xl p-6 sm:p-9 space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Project Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., NovaPay Mobile Banking App"
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400"
            >
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name} className="bg-[#0B0E14]">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Release Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
          Project Description *
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Comprehensive overview of architecture, user experience, and business impact..."
          className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-400 resize-none"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-[#07090D] border border-dashed border-white/15 space-y-3">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
            1. Thumbnail
          </p>
          <p className="text-[11px] text-slate-500">JPG, JPEG, PNG, WEBP, SVG</p>
          {thumbnail && (
            <img
              src={thumbnail}
              alt="Thumbnail preview"
              className="w-full h-28 object-cover rounded-xl border border-white/10"
            />
          )}
          <label className="cursor-pointer inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs font-semibold hover:border-cyan-400 transition-colors">
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            {thumbnail ? 'Replace Thumbnail' : 'Upload Thumbnail'}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.svg"
              onChange={handleThumbnailUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="p-5 rounded-2xl bg-[#07090D] border border-dashed border-white/15 space-y-3">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
            2. Gallery ({images.length})
          </p>
          <p className="text-[11px] text-slate-500">Multiple showcase screenshots</p>
          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-1">
              {images.map((img, i) => (
                <div key={i} className="relative w-14 h-14 shrink-0">
                  <img src={img} alt="" className="w-full h-full object-cover rounded-lg border border-white/15" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="cursor-pointer inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs font-semibold hover:border-indigo-400 transition-colors">
            <Upload className="w-4 h-4 text-indigo-400" />
            Add Gallery Images
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.svg"
              onChange={handleGalleryUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="p-5 rounded-2xl bg-[#07090D] border border-dashed border-white/15 space-y-3">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
            3. Release Binaries ({files.length})
          </p>
          <p className="text-[11px] text-slate-500">APK, ISO, ZIP, PDF, DOCX, TXT, Images</p>
          {files.length > 0 && (
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {files.map((f, idx) => (
                <div
                  key={f.id || idx}
                  className="flex items-center justify-between text-[11px] bg-white/[0.05] px-2.5 py-1.5 rounded-lg border border-white/10"
                >
                  <span className="truncate font-medium text-slate-200 max-w-[140px]">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                    className="text-rose-400 font-bold ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="cursor-pointer inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 transition-colors">
            <Package className="w-4 h-4" />
            Upload Release Files
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.svg,.apk,.iso,.pdf,.docx,.txt,.zip"
              onChange={handleProjectFilesUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Live Website URL
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://client-project.com"
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            External Download URL (Optional)
          </label>
          <input
            type="url"
            value={downloadUrl}
            onChange={(e) => setDownloadUrl(e.target.value)}
            placeholder="https://releases.webtrex.studio/app.apk"
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
          Technology Stack Tags
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={handleAddTech}
            placeholder="Type a technology (e.g., Next.js, Kotlin, Docker) and press Enter"
            className="flex-1 px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={handleAddTech}
            className="px-5 py-3 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/15 text-xs font-bold"
          >
            Add Tag
          </button>
        </div>
        {technologies.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {technologies.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-400/25 text-xs font-mono font-semibold"
              >
                {t}
                <button
                  type="button"
                  onClick={() => setTechnologies(technologies.filter((item) => item !== t))}
                  className="hover:text-rose-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSaveProject('draft')}
          className="px-6 py-3 rounded-xl border border-white/15 text-slate-200 text-sm font-semibold hover:border-white/40 transition-colors disabled:opacity-50"
        >
          Save as Draft
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSaveProject('published')}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-sm font-bold hover:opacity-95 transition-opacity disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          {saving ? 'Publishing...' : existingProject ? 'Update & Publish' : 'Publish Release'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN TAB 3: MANAGE PROJECTS
// ============================================================================
function AdminManageProjectsTab({
  projects,
  categories,
  addToast,
  onRefreshAdminData,
  onAddNew,
}: {
  projects: Project[];
  categories: Category[];
  addToast: (title: string, message?: string, type?: 'success' | 'error') => void;
  onRefreshAdminData: () => Promise<void>;
  onAddNew: () => void;
}) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    return projects
      .filter((p) => {
        const matchCat = catFilter === 'All' || p.category === catFilter;
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q);
        return matchCat && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
        if (sortBy === 'oldest') return (a.date || '').localeCompare(b.date || '');
        return (b.date || '').localeCompare(a.date || '');
      });
  }, [projects, search, catFilter, sortBy]);

  const toggleStatus = async (project: Project) => {
    const nextStatus = project.status === 'published' ? 'draft' : 'published';
    try {
      await ApiClient.setProjectStatus(project.id, nextStatus);
      await onRefreshAdminData();
      addToast(
        nextStatus === 'published' ? 'Project Published' : 'Moved to Drafts',
        `${project.title} is now ${nextStatus}.`
      );
    } catch (err) {
      addToast('Update Failed', err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleDelete = async (project: Project) => {
    try {
      await ApiClient.deleteProject(project.id);
      await onRefreshAdminData();
      addToast('Project Deleted', `${project.title} has been permanently removed.`);
    } catch (err) {
      addToast('Delete Failed', err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleDeleteAllProjects = async () => {
    if (projects.length === 0) return;
    try {
      await ApiClient.deleteAllProjects();
      await onRefreshAdminData();
      addToast('All Projects Removed', 'The portfolio archive is now empty.');
    } catch (err) {
      addToast('Clear Failed', err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  if (editingProject) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setEditingProject(null)}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 hover:text-white"
        >
          ← BACK TO ALL RELEASES
        </button>
        <AdminProjectFormTab
          categories={categories}
          addToast={addToast}
          existingProject={editingProject}
          onSuccess={async () => {
            await onRefreshAdminData();
            setEditingProject(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bento-card rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search releases..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#07090D] border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
          >
            <option value="All" className="bg-[#0B0E14]">All Categories</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name} className="bg-[#0B0E14]">
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
          >
            <option value="newest" className="bg-[#0B0E14]">Newest First</option>
            <option value="oldest" className="bg-[#0B0E14]">Oldest First</option>
            <option value="title" className="bg-[#0B0E14]">Title (A–Z)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <button
              onClick={handleDeleteAllProjects}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete All ({projects.length})
            </button>
          )}
          <button
            onClick={onAddNew}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-xs font-bold hover:opacity-95 transition-opacity"
          >
            <PlusCircle className="w-4 h-4" />
            Add Release
          </button>
        </div>
      </div>

      <div className="bento-card rounded-3xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No releases found. Click &quot;Add Release&quot; to publish your first project.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Project</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Files</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm">
                {filtered.map((proj) => (
                  <tr key={proj.id} className="hover:bg-white/[0.025] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={proj.thumbnail}
                          alt=""
                          className="w-14 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-white">{proj.title}</p>
                          <p className="text-xs text-slate-400 font-mono">{proj.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-slate-200 text-xs font-mono">
                        {proj.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-400">
                      {(proj.files || []).length} file(s)
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          proj.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/25'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-400/25'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            proj.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        {proj.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => toggleStatus(proj)}
                          className="px-3 py-1.5 rounded-lg border border-white/15 text-xs font-semibold text-slate-200 hover:border-cyan-400 transition-colors"
                        >
                          {proj.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => setEditingProject(proj)}
                          className="p-2 rounded-lg border border-white/15 text-slate-300 hover:bg-white/10"
                          title="Edit Project"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(proj)}
                          className="p-2 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/15"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN TAB 4: CATEGORIES
// ============================================================================
function AdminCategoriesTab({
  categories,
  projects,
  addToast,
  onRefreshAdminData,
}: {
  categories: Category[];
  projects: Project[];
  addToast: (title: string, message?: string, type?: 'success' | 'error') => void;
  onRefreshAdminData: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await ApiClient.createCategory(name.trim(), description.trim());
      await onRefreshAdminData();
      addToast('Category Added', `${name.trim()} is now available.`);
      setName('');
      setDescription('');
    } catch (err) {
      addToast('Error', err instanceof Error ? err.message : 'Failed to add category.', 'error');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!cat.id) return;
    try {
      await ApiClient.deleteCategory(cat.id);
      await onRefreshAdminData();
      addToast('Category Removed', `${cat.name} deleted.`);
    } catch (err) {
      addToast('Error', err instanceof Error ? err.message : 'Failed to remove category.', 'error');
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <form
        onSubmit={handleAddCategory}
        className="lg:col-span-5 bento-card rounded-3xl p-6 sm:p-7 space-y-4 h-fit"
      >
        <h3 className="text-lg font-display font-bold text-white">Create Discipline Category</h3>
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Category Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., AI & Machine Learning"
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short category summary..."
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-400"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-sm font-bold hover:opacity-95 transition-opacity"
        >
          Add Category
        </button>
      </form>

      <div className="lg:col-span-7 bento-card rounded-3xl p-6 sm:p-7 space-y-3">
        <h3 className="text-lg font-display font-bold text-white mb-4">Active Categories</h3>
        {categories.map((cat) => {
          const count = projects.filter(
            (p) => p.category?.toLowerCase() === cat.name.toLowerCase()
          ).length;
          return (
            <div
              key={cat.id || cat.name}
              className="flex items-center justify-between p-4 rounded-2xl bg-[#07090D] border border-white/10"
            >
              <div>
                <p className="text-sm font-bold text-white">{cat.name}</p>
                <p className="text-xs text-slate-400">{cat.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-300">
                  {count} releases
                </span>
                {cat.id && (
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/15"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN TAB 5: BINARY VAULT
// ============================================================================
function AdminFilesTab({
  uploadedFiles,
  addToast,
  onRefreshAdminData,
  onDownload,
}: {
  uploadedFiles: ReleaseFile[];
  addToast: (title: string, message?: string, type?: 'success' | 'error') => void;
  onRefreshAdminData: () => Promise<void>;
  onDownload: (file: ReleaseFile) => void;
}) {
  const handleDeleteFile = async (file: ReleaseFile) => {
    try {
      await ApiClient.deleteFile(file.id);
      await onRefreshAdminData();
      addToast('File Deleted', `${file.name} removed from storage.`);
    } catch (err) {
      addToast('Delete Failed', err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  return (
    <div className="bento-card rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-display font-bold text-white">Central Binary &amp; Asset Vault</h3>
          <p className="text-xs text-slate-400">
            All APK, ISO, ZIP, PDF, DOCX, TXT, and image packages attached across WebTrex releases
          </p>
        </div>
        <span className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-400/25 text-xs font-mono font-bold">
          {uploadedFiles.length} Total Files
        </span>
      </div>

      {uploadedFiles.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-400">
          No files uploaded yet. Attach files when publishing or editing a release.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">File Name</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">Upload Date</th>
                <th className="py-3.5 px-4">Release</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm">
              {uploadedFiles.map((file) => (
                <tr key={file.id} className="hover:bg-white/[0.025]">
                  <td className="py-4 px-6 font-semibold text-white">{file.name}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-400/25 text-xs font-mono font-bold">
                      {file.type || getFileExt(file.name).toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-xs font-mono text-slate-400">
                    {formatBytes(file.size)}
                  </td>
                  <td className="py-4 px-4 text-xs font-mono text-slate-400">
                    {file.uploadDate}
                  </td>
                  <td className="py-4 px-4 text-xs font-medium text-slate-300">
                    {file.projectTitle || 'Unlinked'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onDownload(file)}
                        className="p-2 rounded-lg border border-white/15 text-slate-300 hover:bg-white/10"
                        title="Download File"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file)}
                        className="p-2 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/15"
                        title="Delete File"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADMIN TAB 6: CLIENT INBOX
// ============================================================================
function AdminMessagesTab({
  messages,
  addToast,
  onRefreshAdminData,
}: {
  messages: ClientMessage[];
  addToast: (title: string, message?: string, type?: 'success' | 'error') => void;
  onRefreshAdminData: () => Promise<void>;
}) {
  const [selectedMsg, setSelectedMsg] = useState<ClientMessage | null>(null);

  const toggleRead = async (msg: ClientMessage) => {
    try {
      await ApiClient.toggleMessageRead(msg.id, !msg.read);
      await onRefreshAdminData();
      setSelectedMsg({ ...msg, read: !msg.read });
    } catch (err) {
      addToast('Error', err instanceof Error ? err.message : 'Failed to update message.', 'error');
    }
  };

  const handleDeleteMsg = async (msg: ClientMessage) => {
    try {
      await ApiClient.deleteMessage(msg.id);
      await onRefreshAdminData();
      if (selectedMsg?.id === msg.id) setSelectedMsg(null);
      addToast('Message Deleted', 'Inquiry removed from inbox.');
    } catch (err) {
      addToast('Error', err instanceof Error ? err.message : 'Failed to delete message.', 'error');
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 bento-card rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-display font-bold text-white">Inbox ({messages.length})</h3>
          <span className="text-xs font-mono text-cyan-300 font-semibold">
            {messages.filter((m) => !m.read).length} Unread
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No client messages submitted yet.
          </div>
        ) : (
          <div className="divide-y divide-white/10 max-h-[540px] overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={async () => {
                  setSelectedMsg({ ...msg, read: true });
                  if (!msg.read) {
                    await ApiClient.toggleMessageRead(msg.id, true);
                    await onRefreshAdminData();
                  }
                }}
                className={`p-5 cursor-pointer transition-colors ${
                  selectedMsg?.id === msg.id ? 'bg-cyan-500/10' : 'hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!msg.read && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                    <p className="text-sm font-bold text-white">{msg.name}</p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs font-semibold text-cyan-300 mt-1">{msg.projectType}</p>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{msg.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-7 bento-card rounded-3xl p-6 sm:p-8">
        {selectedMsg ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-white/10">
              <div>
                <span className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-400/25 text-xs font-mono font-bold">
                  {selectedMsg.projectType}
                </span>
                <h3 className="text-2xl font-display font-bold text-white mt-3">{selectedMsg.name}</h3>
                <a
                  href={`mailto:${selectedMsg.email}`}
                  className="text-sm text-cyan-300 hover:underline font-medium"
                >
                  {selectedMsg.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleRead(selectedMsg)}
                  className="px-3.5 py-2 rounded-xl border border-white/15 text-xs font-semibold text-slate-200 hover:border-cyan-400"
                >
                  {selectedMsg.read ? 'Mark Unread' : 'Mark Read'}
                </button>
                <button
                  onClick={() => handleDeleteMsg(selectedMsg)}
                  className="p-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/15"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#07090D] border border-white/10 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {selectedMsg.message}
            </div>

            <a
              href={`mailto:${selectedMsg.email}?subject=Re: ${encodeURIComponent(
                selectedMsg.projectType
              )} — WEBTREX`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-sm font-bold hover:opacity-95 transition-opacity"
            >
              <Mail className="w-4 h-4" />
              Reply via Email
            </a>
          </div>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-slate-500">
            <MessageSquare className="w-10 h-10 mb-3 text-slate-600" />
            <p className="text-sm font-medium">Select an inquiry from the inbox to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ADMIN TAB 7: WEBSITE SETTINGS & SQLITE DATABASE BACKUP
// ============================================================================
function AdminSettingsTab({
  settings,
  dbStats,
  addToast,
  onRefreshAdminData,
}: {
  settings: SiteSettings;
  dbStats: DatabaseStats | null;
  addToast: (title: string, message?: string, type?: 'success' | 'error') => void;
  onRefreshAdminData: () => Promise<void>;
}) {
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ApiClient.updateSettings(form);
      await onRefreshAdminData();
      addToast('Settings Saved', 'Public website updated immediately in SQLite.');
    } catch (err) {
      addToast('Save Failed', err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="bento-card rounded-3xl p-6 sm:p-9 space-y-6 max-w-4xl"
    >
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Agency Tagline
          </label>
          <input
            type="text"
            value={form.tagline || ''}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Public Contact Email
          </label>
          <input
            type="email"
            value={form.email || ''}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Studio Phone
          </label>
          <input
            type="text"
            value={form.phone || ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Location / Studios
          </label>
          <input
            type="text"
            value={form.location || ''}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
          Hero Main Heading
        </label>
        <input
          type="text"
          value={form.heroTitle || ''}
          onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
        />
      </div>

      <div>
        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
          Hero Description
        </label>
        <textarea
          rows={3}
          value={form.heroSubtitle || ''}
          onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-white/10">
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            GitHub URL
          </label>
          <input
            type="url"
            value={form.githubUrl || ''}
            onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
            placeholder="https://github.com/..."
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            LinkedIn URL
          </label>
          <input
            type="url"
            value={form.linkedinUrl || ''}
            onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
            placeholder="https://www.linkedin.com/in/..."
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Pinterest URL
          </label>
          <input
            type="url"
            value={form.pinterestUrl || ''}
            onChange={(e) => setForm({ ...form, pinterestUrl: e.target.value })}
            placeholder="https://in.pinterest.com/..."
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-sm font-bold hover:opacity-95 transition-opacity"
      >
        {saving ? 'Saving...' : 'Save Website Settings'}
      </button>

      <div className="pt-6 mt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
            <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-400" />
            <span>SQLite Database Active ({dbStats ? formatBytes(dbStats.dbSizeBytes) : 'Ready'})</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Projects, images, APK/ISO release binaries, inquiries, and settings are persisted on disk in SQLite.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={async () => {
              try {
                const dump = await ApiClient.exportBackup();
                const blob = new Blob([JSON.stringify(dump, null, 2)], {
                  type: 'application/json',
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `webtrex-sqlite-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                await onRefreshAdminData();
                addToast('Database Exported', 'SQLite backup JSON downloaded.');
              } catch (err) {
                addToast('Export Failed', err instanceof Error ? err.message : 'Error', 'error');
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.04] text-xs font-bold text-white hover:border-cyan-400 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export JSON
          </button>
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.04] text-xs font-bold text-white hover:border-cyan-400 transition-colors">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            Restore JSON
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const content = await file.text();
                  const parsed = JSON.parse(content);
                  await ApiClient.importBackup(parsed);
                  await onRefreshAdminData();
                  addToast('Database Restored', 'All SQLite tables restored from backup.');
                } catch (err) {
                  addToast(
                    'Restore Failed',
                    err instanceof Error ? err.message : 'Invalid backup file.',
                    'error'
                  );
                }
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>
    </form>
  );
}

// ============================================================================
// ADMIN TAB 8: PROFILE & PASSWORD ROTATION
// ============================================================================
function AdminProfileTab({
  adminSession,
  setAdminSession,
  addToast,
  onRefreshAdminData,
}: {
  adminSession: AdminSession;
  setAdminSession: (s: AdminSession) => void;
  addToast: (title: string, message?: string, type?: 'success' | 'error') => void;
  onRefreshAdminData: () => Promise<void>;
}) {
  const [name, setName] = useState(adminSession.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      addToast('Weak Password', 'New password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Mismatch', 'New password and confirmation do not match.', 'error');
      return;
    }

    setUpdating(true);
    try {
      const res = await ApiClient.updateProfile({
        name: name.trim(),
        currentPassword,
        newPassword,
      });
      setAdminSession(res.admin);
      await onRefreshAdminData();
      addToast('Security Updated', 'Administrator password has been updated securely in SQLite.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast('Update Failed', err instanceof Error ? err.message : 'Verification failed.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl bento-card rounded-3xl p-6 sm:p-9 space-y-6">
      <div>
        <h3 className="text-lg font-display font-bold text-white">Administrator Account &amp; Security</h3>
        <p className="text-xs text-slate-400 mt-1">
          Passwords are cryptographically salted and hashed with SHA-256 before persistence in SQLite.
        </p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Administrator Email (Login ID)
          </label>
          <input
            type="email"
            disabled
            value={adminSession.email}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-500"
          />
        </div>

        <div className="pt-4 border-t border-white/10 space-y-4">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            Change Administrator Password
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-white text-sm"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={updating}
          className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-sm font-bold hover:opacity-95 transition-opacity"
        >
          {updating ? 'Updating Credentials...' : 'Update Password & Profile'}
        </button>
      </form>
    </div>
  );
}
