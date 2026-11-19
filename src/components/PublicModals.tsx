import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { ApiClient, formatBytes, getFileExt } from '../lib/api';
import type { AdminSession, Project, ReleaseFile, SiteSettings, ToastItem } from '../types';
import { WebTrexLogo } from './WebTrexLogo';

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-[#0E1118]/95 backdrop-blur-xl text-white rounded-2xl p-4 shadow-2xl border border-white/15 flex items-start gap-3 animate-fade-in"
        >
          {t.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold">{t.title}</p>
            {t.message && <p className="text-xs text-slate-400 mt-0.5">{t.message}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

interface CommandPaletteModalProps {
  projects: Project[];
  adminSession: AdminSession | null;
  onClose: () => void;
  onSelectProject: (proj: Project) => void;
  onNavigateSection: (secId: string) => void;
  onOpenAuth: () => void;
  onCopyEmail: () => void;
}

export function CommandPaletteModal({
  projects,
  adminSession,
  onClose,
  onSelectProject,
  onNavigateSection,
  onOpenAuth,
  onCopyEmail,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();

  const quickCommands = [
    { id: 'cmd-home', label: 'Jump to Overview', hint: 'Section', action: () => onNavigateSection('home') },
    { id: 'cmd-services', label: 'Explore Capabilities Matrix', hint: 'Section', action: () => onNavigateSection('services') },
    { id: 'cmd-projects', label: 'Browse All Releases', hint: 'Section', action: () => onNavigateSection('projects') },
    { id: 'cmd-contact', label: 'Start a Project Inquiry', hint: 'Section', action: () => onNavigateSection('contact') },
    { id: 'cmd-copy', label: 'Copy Studio Email Address', hint: 'Action', action: onCopyEmail },
    {
      id: 'cmd-auth',
      label: adminSession ? 'Open Admin Console' : 'Administrator Sign In',
      hint: 'Auth',
      action: onOpenAuth,
    },
  ].filter((c) => !q || c.label.toLowerCase().includes(q));

  const matchedProjects = projects
    .filter(
      (p) =>
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        (p.technologies || []).some((t) => t.toLowerCase().includes(q))
    )
    .slice(0, 5);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0D1017] border border-white/15 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search releases (APK, Website, React...)"
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {matchedProjects.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Published Releases
              </p>
              {matchedProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-left transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={p.thumbnail} alt="" className="w-8 h-6 rounded object-cover border border-white/10" />
                    <span className="text-sm font-medium text-white truncate">{p.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-300 shrink-0">{p.category}</span>
                </button>
              ))}
            </div>
          )}

          <div>
            <p className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Quick Navigation & Actions
            </p>
            {quickCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-left transition-colors"
              >
                <span className="text-sm text-slate-200">{cmd.label}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                  {cmd.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SignInModalProps {
  onClose: () => void;
  onAuthenticated: (sessionData: AdminSession) => void;
}

export function SignInModal({ onClose, onAuthenticated }: SignInModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const adminProfile = await ApiClient.login(email.trim().toLowerCase(), password.trim());
      setEmail('');
      setPassword('');
      onAuthenticated(adminProfile);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid administrator email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0D1017] rounded-3xl border border-white/15 max-w-md w-full p-7 sm:p-9 shadow-2xl relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close Sign In Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-7">
          <WebTrexLogo />
          <h2 className="text-2xl font-display font-bold text-white mt-6">
            Console Authentication
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Sign in with administrator credentials to manage releases, binary files, and client messages.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#07090D] border border-white/15 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Toggle Password Visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-sm font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verifying Session...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Enter Admin Console
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

interface ProjectDrawerModalProps {
  project: Project;
  activeGalleryIdx: number;
  setActiveGalleryIdx: (idx: number) => void;
  onClose: () => void;
  onDownloadFile: (file: ReleaseFile) => void;
}

export function ProjectDrawerModal({
  project,
  activeGalleryIdx,
  setActiveGalleryIdx,
  onClose,
  onDownloadFile,
}: ProjectDrawerModalProps) {
  const gallery = project.images && project.images.length > 0 ? project.images : [project.thumbnail];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-[#0B0E14] border-l border-white/15 max-w-2xl w-full h-full flex flex-col shadow-2xl animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#080A0F]">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 text-xs font-mono font-semibold">
              {project.category}
            </span>
            {project.date && (
              <span className="text-xs text-slate-400 font-mono">{project.date}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-7">
          <div className="space-y-3">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-[#06070A] border border-white/10">
              <img
                src={gallery[activeGalleryIdx] || project.thumbnail}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {gallery.map((imgUrl, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveGalleryIdx(i)}
                    className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeGalleryIdx === i
                        ? 'border-cyan-400'
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
              {project.title}
            </h2>
            <p className="text-slate-300 mt-3 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
          </div>

          {project.technologies && project.technologies.length > 0 && (
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-2.5">
                Technologies & Stack
              </p>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-200"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.files && project.files.length > 0 && (
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <p className="text-[11px] font-mono uppercase tracking-wider text-cyan-300">
                Release Packages ({project.files.length})
              </p>
              <div className="space-y-2">
                {project.files.map((file, idx) => (
                  <div
                    key={file.id || idx}
                    className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#080A0F] border border-white/10"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-400/25 text-cyan-300 text-[10px] font-mono font-bold uppercase">
                        {file.type || getFileExt(file.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                        <p className="text-xs font-mono text-slate-500">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDownloadFile(file)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {project.websiteUrl && (
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-950 text-sm font-bold hover:bg-cyan-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Launch Live Site
              </a>
            )}
            {project.downloadUrl && (
              <a
                href={project.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm font-semibold hover:border-cyan-400/50 transition-colors"
              >
                <Download className="w-4 h-4" />
                External Download
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LegalModal({
  type,
  settings,
  onClose,
}: {
  type: 'privacy' | 'terms';
  settings: SiteSettings;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0E1118] rounded-3xl border border-white/15 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-xl font-display font-bold text-white">
            {type === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm text-slate-300 space-y-3 max-h-[60vh] overflow-y-auto leading-relaxed">
          {type === 'privacy' ? (
            <>
              <p>
                <strong className="text-white">1. Information We Collect:</strong> When you submit an inquiry via the WebTrex contact portal, we collect your name, email address, project discipline, and message details solely for project consultation.
              </p>
              <p>
                <strong className="text-white">2. Security &amp; Storage:</strong> All inquiry submissions and administrative records are persisted securely in our SQLite database. We never sell or rent visitor information to third parties.
              </p>
              <p>
                <strong className="text-white">3. Contact:</strong> For data access or deletion requests, reach out at {settings.email}.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong className="text-white">1. Intellectual Property:</strong> All visual assets, software packages, case studies, and brand marks presented on the WebTrex portfolio remain the intellectual property of WebTrex Technologies or their respective clients.
              </p>
              <p>
                <strong className="text-white">2. Software &amp; Release Downloads:</strong> Approved APK, ISO, and archive artifacts provided in the portfolio are intended for authorized evaluation and deployment in accordance with each project’s license.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
