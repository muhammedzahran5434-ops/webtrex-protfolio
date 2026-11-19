import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Cpu,
  Download,
  Globe,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  List,
  Lock,
  Mail,
  MapPin,
  Menu,
  PenTool,
  Phone,
  Search,
  Send,
  ShoppingBag,
  Smartphone,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import { AdminConsole } from './components/AdminConsole';
import type { AdminTabId } from './components/AdminConsole';
import {
  CommandPaletteModal,
  LegalModal,
  ProjectDrawerModal,
  SignInModal,
  ToastContainer,
} from './components/PublicModals';
import { WebTrexLogo } from './components/WebTrexLogo';
import { ApiClient, DEFAULT_SETTINGS, getAuthToken, setAuthToken } from './lib/api';
import type {
  ActivityLog,
  AdminSession,
  Category,
  ClientMessage,
  DatabaseStats,
  Project,
  ReleaseFile,
  SiteSettings,
  ToastItem,
} from './types';

function RevealBlock({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.06 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function PublicContactForm({
  addToast,
  preselectedDiscipline,
}: {
  addToast: (title: string, message?: string, type?: 'success' | 'error') => void;
  preselectedDiscipline: string;
}) {
  const disciplines = [
    'Website Development',
    'Mobile App Development',
    'UI/UX Design',
    'Software Development',
    'E-commerce Solutions',
    'Custom Digital Solutions',
  ];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState('Website Development');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedDiscipline) {
      setProjectType(preselectedDiscipline);
    }
  }, [preselectedDiscipline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ApiClient.submitMessage({
        name: name.trim(),
        email: email.trim(),
        projectType,
        message: message.trim(),
      });
      addToast('Brief Submitted', 'Thank you! Your inquiry is saved and our team will respond within 24 hours.');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      addToast(
        'Submission Failed',
        err instanceof Error ? err.message : 'Could not send your message. Please try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bento-card rounded-3xl p-6 sm:p-9 space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Your Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Mercer"
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@company.com"
            className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Select Discipline
        </label>
        <div className="flex flex-wrap gap-2">
          {disciplines.map((d) => {
            const active = projectType === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setProjectType(d)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-cyan-400 text-slate-950 font-bold'
                    : 'bg-[#07090D] text-slate-400 border border-white/10 hover:border-white/25 hover:text-white'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
          Project Brief &amp; Target Timeline
        </label>
        <textarea
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Outline your product goals, core features, and target launch window..."
          className="w-full px-4 py-3 rounded-xl bg-[#07090D] border border-white/15 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-sm font-bold hover:opacity-95 transition-opacity disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {submitting ? 'Transmitting Brief...' : 'Submit Project Brief'}
      </button>
    </form>
  );
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'public' | 'admin'>('public');
  const [adminTab, setAdminTab] = useState<AdminTabId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<ReleaseFile[]>([]);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [portfolioSearch, setPortfolioSearch] = useState('');
  const [portfolioViewMode, setPortfolioViewMode] = useState<'grid' | 'list'>('grid');
  const [heroShowcaseIdx, setHeroShowcaseIdx] = useState(0);
  const [activeProjectModal, setActiveProjectModal] = useState<Project | null>(null);
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
  const [activeServiceIdx, setActiveServiceIdx] = useState(0);
  const [activeProcessStep, setActiveProcessStep] = useState(0);
  const [preselectedDiscipline, setPreselectedDiscipline] = useState('');
  const [activeSection, setActiveSection] = useState('home');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [copiedField, setCopiedField] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (title: string, message = '', type: 'success' | 'error' = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      addToast('Copied to Clipboard', `${label}: ${text}`);
      setTimeout(() => setCopiedField(''), 2000);
    }
  };

  const loadPublicBootstrap = useCallback(async () => {
    try {
      const data = await ApiClient.getBootstrap();
      setProjects(data.projects || []);
      setCategories(data.categories || []);
      setSettings(data.settings || DEFAULT_SETTINGS);
    } catch (err) {
      console.error('Bootstrap load error:', err);
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    try {
      const data = await ApiClient.getAdminData();
      setProjects(data.projects || []);
      setCategories(data.categories || []);
      setUploadedFiles(data.files || []);
      setMessages(data.messages || []);
      setActivityLogs(data.logs || []);
      setSettings(data.settings || DEFAULT_SETTINGS);
      setDbStats(data.stats || null);
    } catch (err) {
      console.error('Admin data load error:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadPublicBootstrap();
      if (getAuthToken()) {
        try {
          const session = await ApiClient.checkSession();
          if (session.authenticated) {
            setAdminSession(session.admin);
            await loadAdminData();
          }
        } catch {
          setAuthToken('');
        }
      }
    };
    init();
  }, [loadPublicBootstrap, loadAdminData]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (currentRoute === 'public') {
          e.preventDefault();
          setCommandPaletteOpen((prev) => !prev);
        }
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setActiveProjectModal(null);
        setSignInModalOpen(false);
        setLegalModal(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentRoute]);

  useEffect(() => {
    if (currentRoute !== 'public') return;
    const sections = ['home', 'about', 'services', 'projects', 'process', 'contact'];
    const onScroll = () => {
      const pos = window.scrollY + 180;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= pos) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [currentRoute]);

  const navigateToAdmin = async () => {
    if (!adminSession) {
      setSignInModalOpen(true);
      addToast('Authentication Required', 'Please sign in with administrator credentials.', 'error');
      return;
    }
    await loadAdminData();
    setCurrentRoute('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    const email = adminSession?.email;
    await ApiClient.logout();
    setAdminSession(null);
    setCurrentRoute('public');
    await loadPublicBootstrap();
    addToast('Signed Out', `Administrator session (${email}) securely closed.`);
  };

  const publishedProjects = useMemo(() => {
    return projects
      .filter((p) => p.status === 'published')
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [projects]);

  const filteredPublicProjects = useMemo(() => {
    return publishedProjects.filter((project) => {
      const matchesCategory =
        selectedCategoryFilter === 'All' ||
        project.category?.toLowerCase() === selectedCategoryFilter.toLowerCase();
      const q = portfolioSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        project.title?.toLowerCase().includes(q) ||
        project.description?.toLowerCase().includes(q) ||
        project.category?.toLowerCase().includes(q) ||
        (project.technologies || []).some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [publishedProjects, selectedCategoryFilter, portfolioSearch]);

  const triggerFileDownload = (fileObj: ReleaseFile) => {
    if (!fileObj?.dataUrl) {
      addToast('Download Unavailable', 'No binary payload attached to this item.', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = fileObj.dataUrl;
    if (fileObj.dataUrl.startsWith('http')) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    link.download = fileObj.name || 'webtrex-asset';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Download Started', `Downloading ${fileObj.name}`);
  };

  const openExternalDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (currentRoute === 'admin' && adminSession) {
    return (
      <AdminConsole
        adminSession={adminSession}
        setAdminSession={setAdminSession}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        projects={projects}
        categories={categories}
        uploadedFiles={uploadedFiles}
        messages={messages}
        activityLogs={activityLogs}
        settings={settings}
        dbStats={dbStats}
        toasts={toasts}
        addToast={addToast}
        onRefreshAdminData={loadAdminData}
        onViewLiveSite={async () => {
          await loadPublicBootstrap();
          setCurrentRoute('public');
        }}
        onLogout={handleLogout}
        onDownloadFile={triggerFileDownload}
      />
    );
  }

  const navLinks = [
    { id: 'home', label: 'Overview', href: '#home' },
    { id: 'about', label: 'Studio', href: '#about' },
    { id: 'services', label: 'Capabilities', href: '#services' },
    { id: 'projects', label: 'Releases', href: '#projects' },
    { id: 'process', label: 'Pipeline', href: '#process' },
    { id: 'contact', label: 'Contact', href: '#contact' },
  ];

  const servicesList = [
    {
      num: '01',
      title: 'Website Development',
      formValue: 'Website Development',
      tagline: 'Flagship web architecture & high-conversion digital platforms',
      timeline: '3–6 Weeks',
      desc: 'We engineer ultra-fast, SEO-structured corporate sites, interactive product showcases, and custom web platforms with sub-second response times and precision typography.',
      deliverables: ['Next.js / React', 'Headless CMS', 'Technical SEO', 'Edge Deployment'],
      icon: Globe,
    },
    {
      num: '02',
      title: 'Mobile App Development',
      formValue: 'Mobile App Development',
      tagline: 'Native-feel iOS & Android applications built for daily velocity',
      timeline: '6–10 Weeks',
      desc: 'From consumer utility apps to enterprise field companions, we craft fluid mobile software with offline-first sync, biometric security, and direct APK release pipelines.',
      deliverables: ['iOS & Android', 'Offline Sync', 'APK Release Builds', 'Push Architecture'],
      icon: Smartphone,
    },
    {
      num: '03',
      title: 'UI/UX Design',
      formValue: 'UI/UX Design',
      tagline: 'Human-centered interface systems & interactive prototypes',
      timeline: '2–4 Weeks',
      desc: 'We translate complex workflows into effortless, tactile user interfaces backed by scalable design token libraries and interactive prototypes.',
      deliverables: ['Design Systems', 'Wireframing', 'Interactive Prototypes', 'Usability Audits'],
      icon: PenTool,
    },
    {
      num: '04',
      title: 'Software Development',
      formValue: 'Software Development',
      tagline: 'Custom desktop utilities, automation suites & backend engines',
      timeline: '4–12 Weeks',
      desc: 'Bespoke software tailored to your operational workflows—built with clean architecture, automated testing, and zero unnecessary bloat.',
      deliverables: ['System Utilities', 'API Gateways', 'Workflow Automation', 'Cloud Workers'],
      icon: Terminal,
    },
    {
      num: '05',
      title: 'E-commerce Solutions',
      formValue: 'E-commerce Solutions',
      tagline: 'Bespoke digital storefronts & frictionless checkout architecture',
      timeline: '4–8 Weeks',
      desc: 'High-converting commerce experiences engineered for global scale, custom inventory rules, and instant payment integrations.',
      deliverables: ['Custom Storefronts', 'Payment Gateways', 'Inventory Sync', 'Analytics'],
      icon: ShoppingBag,
    },
    {
      num: '06',
      title: 'Custom Digital Solutions',
      formValue: 'Custom Digital Solutions',
      tagline: 'Specialized system builds, APK/ISO distributions & cloud infra',
      timeline: 'Custom Scope',
      desc: 'When off-the-shelf tools fall short, we architect custom software distributions, bootable ISO environments, and tailored API ecosystems.',
      deliverables: ['ISO / APK Packaging', 'Custom Integrations', 'Cloud Architecture', 'Security Hardening'],
      icon: Cpu,
    },
  ];

  const processStages = [
    {
      step: '01',
      title: 'Discover',
      subtitle: 'Architecture & Scope',
      duration: 'Week 1',
      desc: 'We audit business objectives, technical constraints, and user workflows to author a crystal-clear execution blueprint.',
      outputs: ['Technical PRD', 'System Architecture Map', 'Milestone Schedule'],
    },
    {
      step: '02',
      title: 'Design',
      subtitle: 'Systems & Prototypes',
      duration: 'Weeks 2–3',
      desc: 'We craft high-contrast interfaces, component token libraries, and clickable prototypes validated before writing production code.',
      outputs: ['Design Tokens', 'Interactive Prototype', 'Responsive Breakpoints'],
    },
    {
      step: '03',
      title: 'Develop',
      subtitle: 'Full-Stack Engineering',
      duration: 'Weeks 4–7',
      desc: 'Clean, modular, production-tested code shipped across web platforms, mobile apps, APIs, and signed binary builds.',
      outputs: ['Frontend & APIs', 'Automated QA', 'Staging Previews'],
    },
    {
      step: '04',
      title: 'Deliver',
      subtitle: 'Launch & Stewardship',
      duration: 'Launch+',
      desc: 'Performance optimization, security verification, cloud deployment, and ongoing iterative evolution.',
      outputs: ['Edge Production Deploy', 'Telemetry Setup', 'Source & Asset Handoff'],
    },
  ];

  const activeHeroProject = publishedProjects[heroShowcaseIdx] || publishedProjects[0] || null;

  return (
    <div className="min-h-screen bg-[#06070A] text-slate-100 relative overflow-x-hidden ambient-glow">
      <ToastContainer toasts={toasts} />

      {/* FLOATING GLASS NAVIGATION DOCK */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 pt-3 pb-2">
        <div className="max-w-7xl mx-auto rounded-2xl bg-[#0B0E14]/80 backdrop-blur-xl border border-white/10 px-4 sm:px-6 h-16 flex items-center justify-between shadow-2xl shadow-black/50">
          <a href="#home" className="focus:outline-none shrink-0">
            <WebTrexLogo size="sm" />
          </a>

          <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-full p-1">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-400 hover:text-white hover:border-cyan-400/40 transition-colors"
              title="Quick Command Palette (Ctrl/Cmd + K)"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">Search</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-300">
                ⌘K
              </kbd>
            </button>

            <a
              href="#contact"
              className="px-4 py-2 rounded-xl border border-white/15 text-xs font-semibold text-white hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-colors"
            >
              Start Project
            </a>

            {adminSession ? (
              <button
                onClick={navigateToAdmin}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-xs font-bold hover:opacity-95 transition-opacity"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Console
              </button>
            ) : (
              <button
                onClick={() => setSignInModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold hover:bg-cyan-300 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-300"
              aria-label="Quick Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-white"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 max-w-7xl mx-auto rounded-2xl bg-[#0E1118]/95 backdrop-blur-xl border border-white/10 p-5 space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-xs font-semibold ${
                    activeSection === link.id
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-white/5 text-slate-300'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="pt-3 border-t border-white/10 flex gap-2">
              {adminSession ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateToAdmin();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Open Admin Console
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSignInModalOpen(true);
                  }}
                  className="w-full py-3 rounded-xl bg-white text-slate-950 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Administrator Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO BENTO SHOWCASE */}
      <section id="home" className="relative pt-10 pb-20 sm:pt-16 sm:pb-24 cyber-grid border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-semibold">{settings.tagline}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
              <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Q4 / 2026 COMMISSIONS OPEN
              </span>
              <span className="hidden sm:inline">WEB • MOBILE • SOFTWARE • APK/ISO</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl sm:text-6xl xl:text-[68px] font-display font-bold text-white leading-[1.03] tracking-tight">
                  {settings.heroTitle.split(' ').slice(0, -2).join(' ')}{' '}
                  <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                    {settings.heroTitle.split(' ').slice(-2).join(' ')}
                  </span>
                </h1>

                <p className="text-base sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
                  {settings.heroSubtitle}
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <a
                    href="#projects"
                    className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 text-sm font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                  >
                    Explore Releases
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/[0.04] border border-white/15 text-white text-sm font-semibold hover:bg-white/[0.08] hover:border-cyan-400/40 transition-all"
                  >
                    Start a Project
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
                  <p className="text-2xl sm:text-3xl font-display font-bold text-white">
                    {publishedProjects.length}+
                  </p>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mt-1">
                    Live Releases
                  </p>
                </div>
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
                  <p className="text-2xl sm:text-3xl font-display font-bold text-cyan-300">
                    {categories.length}
                  </p>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mt-1">
                    Core Tracks
                  </p>
                </div>
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
                  <p className="text-2xl sm:text-3xl font-display font-bold text-indigo-300">
                    &lt;24h
                  </p>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mt-1">
                    Lead Response
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="h-full bento-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-4 mb-4 border-b border-white/10">
                    <span className="flex items-center gap-2 text-cyan-300 font-semibold">
                      <Zap className="w-3.5 h-3.5" />
                      FEATURED ARCHIVE
                    </span>
                    {publishedProjects.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        {publishedProjects.slice(0, 4).map((p, idx) => (
                          <button
                            key={p.id}
                            onClick={() => setHeroShowcaseIdx(idx)}
                            className={`h-1.5 rounded-full transition-all ${
                              heroShowcaseIdx % Math.min(4, publishedProjects.length) === idx
                                ? 'w-5 bg-cyan-400'
                                : 'w-1.5 bg-white/20 hover:bg-white/40'
                            }`}
                            aria-label={`Showcase ${p.title}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {activeHeroProject ? (
                    <div
                      onClick={() => {
                        setActiveProjectModal(activeHeroProject);
                        setActiveGalleryIdx(0);
                      }}
                      className="group cursor-pointer space-y-4"
                    >
                      <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#080A0F] border border-white/10 relative">
                        <img
                          src={activeHeroProject.thumbnail}
                          alt={activeHeroProject.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur border border-white/15 text-[11px] font-mono text-cyan-300">
                          {activeHeroProject.category}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-display font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {activeHeroProject.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {activeHeroProject.description}
                          </p>
                        </div>
                        <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors shrink-0">
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                      </div>

                      {activeHeroProject.technologies && activeHeroProject.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {activeHeroProject.technologies.slice(0, 4).map((tech) => (
                            <span
                              key={tech}
                              className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-[10px] font-mono text-slate-300"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 px-5 rounded-2xl bg-[#07090D] border border-dashed border-white/15 text-center space-y-3">
                      <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 flex items-center justify-center mx-auto">
                        <Layers className="w-5 h-5" />
                      </div>
                      <p className="font-display font-bold text-lg text-white">
                        Release Vault Ready
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                        Sign in to the Admin Console to publish websites, mobile apps, APKs, ISOs, or software suites.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>PRESS ⌘K TO NAVIGATE</span>
                  <span className="text-emerald-400">● SQLITE DB LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECH MARQUEE */}
      <div className="bg-[#0B0E14] text-slate-300 py-3.5 overflow-hidden border-b border-white/10 select-none">
        <div className="flex whitespace-nowrap animate-marquee">
          {[0, 1].map((loop) => (
            <div key={loop} className="flex items-center gap-10 mx-5 text-[11px] font-mono uppercase tracking-[0.22em]">
              <span>Web Platforms</span>
              <span className="text-cyan-400">◆</span>
              <span>iOS &amp; Android Apps</span>
              <span className="text-indigo-400">◆</span>
              <span>Design Systems &amp; UI/UX</span>
              <span className="text-cyan-400">◆</span>
              <span>Enterprise Software</span>
              <span className="text-indigo-400">◆</span>
              <span>APK &amp; ISO Distributions</span>
              <span className="text-cyan-400">◆</span>
              <span>Cloud Architecture</span>
              <span className="text-indigo-400">◆</span>
            </div>
          ))}
        </div>
      </div>

      {/* STUDIO MANIFESTO BENTO */}
      <section id="about" className="py-20 sm:py-28 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealBlock>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  01 // STUDIO ETHOS
                </span>
                <h2 className="text-3xl sm:text-5xl font-display font-bold text-white mt-2">
                  Engineering meets clarity.
                </h2>
              </div>
              <p className="text-slate-400 max-w-xl text-sm sm:text-base leading-relaxed">
                WebTrex is an independent digital product studio uniting precision interface design with resilient full-stack engineering.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  code: '01',
                  title: 'Signal Over Noise',
                  desc: 'Every interface element earns its place through crisp hierarchy, intentional motion, and zero clutter.',
                  accent: 'from-cyan-500/15 to-transparent border-cyan-500/20',
                },
                {
                  code: '02',
                  title: 'Production Resilience',
                  desc: 'Clean, modular architectures built to scale smoothly from MVP launch to high-concurrency enterprise traffic.',
                  accent: 'from-indigo-500/15 to-transparent border-indigo-500/20',
                },
                {
                  code: '03',
                  title: 'Direct Craftsmanship',
                  desc: 'Work directly with the senior engineers and designers shipping your product—no layers of middle translation.',
                  accent: 'from-emerald-500/15 to-transparent border-emerald-500/20',
                },
              ].map((card) => (
                <div
                  key={card.code}
                  className={`rounded-3xl p-7 bg-gradient-to-b ${card.accent} bg-[#0D1017] border border-white/10 space-y-4`}
                >
                  <span className="inline-block px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-cyan-300">
                    PRINCIPLE {card.code}
                  </span>
                  <h3 className="text-xl font-display font-bold text-white">{card.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* MASTER-DETAIL CAPABILITY EXPLORER */}
      <section id="services" className="py-20 sm:py-28 bg-[#090B10] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealBlock>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  02 // CAPABILITIES MATRIX
                </span>
                <h2 className="text-3xl sm:text-5xl font-display font-bold text-white mt-2">
                  Disciplines &amp; Scope
                </h2>
              </div>
              <p className="text-slate-400 max-w-md text-sm">
                Select any discipline on the left to inspect deliverables, sprint cadence, and initiate a scoped inquiry.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 space-y-2.5">
                {servicesList.map((srv, idx) => {
                  const active = activeServiceIdx === idx;
                  return (
                    <button
                      key={srv.num}
                      type="button"
                      onClick={() => setActiveServiceIdx(idx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        active
                          ? 'bg-gradient-to-r from-cyan-500/15 to-indigo-500/10 border-cyan-400/40 text-white shadow-lg shadow-cyan-950/20'
                          : 'bg-[#0E1118] border-white/[0.07] text-slate-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span
                          className={`text-xs font-mono font-bold ${
                            active ? 'text-cyan-300' : 'text-slate-500'
                          }`}
                        >
                          {srv.num}
                        </span>
                        <div className="min-w-0">
                          <p className="font-display font-bold text-base truncate">{srv.title}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{srv.tagline}</p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          active ? 'text-cyan-300 translate-x-0.5' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-7">
                {(() => {
                  const current = servicesList[activeServiceIdx] || servicesList[0];
                  const Icon = current.icon;
                  return (
                    <div
                      key={current.num}
                      className="h-full bento-card rounded-3xl p-7 sm:p-10 flex flex-col justify-between animate-fade-in"
                    >
                      <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 flex items-center justify-center">
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">
                                TRACK {current.num}
                              </span>
                              <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                                {current.title}
                              </h3>
                            </div>
                          </div>

                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            {current.timeline}
                          </span>
                        </div>

                        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                          {current.desc}
                        </p>

                        <div>
                          <p className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3">
                            Core Deliverables
                          </p>
                          <div className="grid sm:grid-cols-2 gap-2.5">
                            {current.deliverables.map((deliv) => (
                              <div
                                key={deliv}
                                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-slate-200"
                              >
                                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span>{deliv}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 mt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                        <span className="text-xs font-mono text-slate-400">
                          READY TO ARCHITECT YOUR {current.title.toUpperCase()}?
                        </span>
                        <a
                          href="#contact"
                          onClick={() => setPreselectedDiscipline(current.formValue)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-bold hover:bg-cyan-300 transition-colors"
                        >
                          Scope This Track
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* SELECTED RELEASES / PORTFOLIO ARCHIVE */}
      <section id="projects" className="py-20 sm:py-28 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealBlock>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  03 // RELEASE ARCHIVE
                </span>
                <h2 className="text-3xl sm:text-5xl font-display font-bold text-white mt-2">
                  Selected Work &amp; Builds
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={portfolioSearch}
                    onChange={(e) => setPortfolioSearch(e.target.value)}
                    placeholder="Search stack, APK, ISO, title..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#0D1017] border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  {portfolioSearch && (
                    <button
                      onClick={() => setPortfolioSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="inline-flex items-center p-1 rounded-xl bg-[#0D1017] border border-white/15">
                  <button
                    onClick={() => setPortfolioViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      portfolioViewMode === 'grid'
                        ? 'bg-cyan-400 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPortfolioViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      portfolioViewMode === 'list'
                        ? 'bg-cyan-400 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Compact Index View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
              {[
                { label: 'All Releases', value: 'All' },
                { label: 'Websites', value: 'Website' },
                { label: 'Mobile Apps', value: 'Mobile Application' },
                { label: 'Software', value: 'Software' },
                { label: 'UI/UX Design', value: 'UI/UX Design' },
                { label: 'Graphics', value: 'Image / Graphics' },
                { label: 'APK Packages', value: 'APK' },
                { label: 'ISO Images', value: 'ISO' },
                { label: 'Other', value: 'Other' },
              ].map((pill) => {
                const active = selectedCategoryFilter === pill.value;
                return (
                  <button
                    key={pill.value}
                    onClick={() => setSelectedCategoryFilter(pill.value)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'bg-[#0D1017] text-slate-400 border border-white/10 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </RevealBlock>

          {filteredPublicProjects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 p-16 text-center bg-[#0B0E14]">
              <p className="text-2xl font-display font-bold text-white">
                {publishedProjects.length === 0
                  ? 'The release vault is ready.'
                  : 'No matching releases found.'}
              </p>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                {publishedProjects.length === 0
                  ? 'Sign in to the Admin Console to publish websites, mobile apps, APKs, ISOs, or software suites.'
                  : 'Clear your active search query or category filter to view all releases.'}
              </p>
              {(selectedCategoryFilter !== 'All' || portfolioSearch.trim() !== '') && (
                <button
                  onClick={() => {
                    setSelectedCategoryFilter('All');
                    setPortfolioSearch('');
                  }}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : portfolioViewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPublicProjects.map((project, idx) => {
                const hasDownloads =
                  (project.files && project.files.length > 0) || Boolean(project.downloadUrl);

                return (
                  <RevealBlock key={project.id} delay={idx * 45}>
                    <article className="group bento-card rounded-3xl overflow-hidden flex flex-col justify-between h-full">
                      <div>
                        <div
                          onClick={() => {
                            setActiveProjectModal(project);
                            setActiveGalleryIdx(0);
                          }}
                          className="aspect-[16/10] bg-[#080A0F] overflow-hidden relative cursor-pointer border-b border-white/10"
                        >
                          <img
                            src={project.thumbnail}
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[11px] font-mono font-semibold text-cyan-300 border border-white/15">
                              {project.category}
                            </span>
                          </div>
                          {project.date && (
                            <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-slate-950/80 text-slate-300 text-[10px] font-mono border border-white/10">
                              {project.date}
                            </span>
                          )}
                        </div>

                        <div className="p-6">
                          <h3
                            onClick={() => {
                              setActiveProjectModal(project);
                              setActiveGalleryIdx(0);
                            }}
                            className="text-xl font-display font-bold text-white cursor-pointer group-hover:text-cyan-300 transition-colors"
                          >
                            {project.title}
                          </h3>
                          <p className="text-sm text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                            {project.description}
                          </p>

                          {project.technologies && project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-4">
                              {project.technologies.slice(0, 4).map((tech) => (
                                <span
                                  key={tech}
                                  className="px-2.5 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[11px] font-mono text-slate-300"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-6 pb-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                        <button
                          onClick={() => {
                            setActiveProjectModal(project);
                            setActiveGalleryIdx(0);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
                        >
                          Inspect Case Study
                          <ArrowUpRight className="w-4 h-4" />
                        </button>

                        {hasDownloads && (
                          <button
                            onClick={() => {
                              if (project.files && project.files.length > 0) {
                                triggerFileDownload(project.files[0]);
                              } else if (project.downloadUrl) {
                                openExternalDownload(project.downloadUrl);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold hover:bg-cyan-400 hover:text-slate-950 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Get Build
                          </button>
                        )}
                      </div>
                    </article>
                  </RevealBlock>
                );
              })}
            </div>
          ) : (
            <div className="bento-card rounded-3xl overflow-hidden divide-y divide-white/10">
              {filteredPublicProjects.map((project) => {
                const hasDownloads =
                  (project.files && project.files.length > 0) || Boolean(project.downloadUrl);
                return (
                  <div
                    key={project.id}
                    className="p-5 sm:px-7 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.025] transition-colors"
                  >
                    <div
                      onClick={() => {
                        setActiveProjectModal(project);
                        setActiveGalleryIdx(0);
                      }}
                      className="flex items-center gap-4 cursor-pointer min-w-0 flex-1"
                    >
                      <img
                        src={project.thumbnail}
                        alt=""
                        className="w-16 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-display font-bold text-white hover:text-cyan-300 transition-colors">
                            {project.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/20 text-[10px] font-mono text-cyan-300">
                            {project.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-1 max-w-xl">
                          {project.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {project.date && (
                        <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                          {project.date}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setActiveProjectModal(project);
                          setActiveGalleryIdx(0);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white hover:border-cyan-400/40"
                      >
                        Inspect
                      </button>
                      {hasDownloads && (
                        <button
                          onClick={() => {
                            if (project.files && project.files.length > 0) {
                              triggerFileDownload(project.files[0]);
                            } else if (project.downloadUrl) {
                              openExternalDownload(project.downloadUrl);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* INTERACTIVE 4-STAGE PIPELINE STEPPER */}
      <section id="process" className="py-20 sm:py-28 bg-[#090B10] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealBlock>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  04 // EXECUTION PIPELINE
                </span>
                <h2 className="text-3xl sm:text-5xl font-display font-bold text-white mt-2">
                  How We Ship
                </h2>
              </div>
              <p className="text-slate-400 max-w-md text-sm">
                Four transparent phases engineered to take ideas from whiteboard to production.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {processStages.map((stage, idx) => {
                const active = activeProcessStep === idx;
                return (
                  <button
                    key={stage.step}
                    onClick={() => setActiveProcessStep(idx)}
                    className={`text-left p-5 rounded-2xl border transition-all ${
                      active
                        ? 'bg-white/[0.06] border-cyan-400/50 shadow-lg'
                        : 'bg-[#0D1017] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`font-mono text-xs font-bold ${
                          active ? 'text-cyan-300' : 'text-slate-500'
                        }`}
                      >
                        PHASE {stage.step}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{stage.duration}</span>
                    </div>
                    <p className="text-xl font-display font-bold text-white">{stage.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{stage.subtitle}</p>
                    <div className="h-1 w-full rounded-full bg-white/10 mt-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          active ? 'w-full bg-gradient-to-r from-cyan-400 to-indigo-500' : 'w-0'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {(() => {
              const stage = processStages[activeProcessStep] || processStages[0];
              return (
                <div
                  key={stage.step}
                  className="bento-card rounded-3xl p-7 sm:p-9 grid md:grid-cols-12 gap-8 items-center animate-fade-in"
                >
                  <div className="md:col-span-7 space-y-3">
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                      STAGE {stage.step} — {stage.subtitle}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                      {stage.title}
                    </h3>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                  <div className="md:col-span-5 space-y-2.5">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                      Stage Outputs
                    </p>
                    {stage.outputs.map((out) => (
                      <div
                        key={out}
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-medium text-slate-200"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {out}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </RevealBlock>
        </div>
      </section>

      {/* CONTACT & PROJECT BRIEF HUB */}
      <section id="contact" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12">
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  05 // INITIATE CONTACT
                </span>
                <h2 className="text-3xl sm:text-5xl font-display font-bold text-white mt-2 leading-tight">
                  Let’s build your next release.
                </h2>
                <p className="text-slate-400 mt-4 text-sm sm:text-base leading-relaxed">
                  Share your product goals, timeline, or technical questions. Our leads respond directly within 24 hours.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#0D1017] border border-white/10">
                  <a href={`mailto:${settings.email}`} className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono text-slate-500">EMAIL</p>
                      <p className="text-sm font-semibold text-white truncate">{settings.email}</p>
                    </div>
                  </a>
                  <button
                    onClick={() => copyToClipboard(settings.email, 'Email')}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 shrink-0"
                    title="Copy Email"
                  >
                    {copiedField === 'Email' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[#0D1017] border border-white/10">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-mono text-slate-500">TELEPHONE</p>
                      <p className="text-sm font-semibold text-white">{settings.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(settings.phone, 'Phone')}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 shrink-0"
                    title="Copy Phone"
                  >
                    {copiedField === 'Phone' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0D1017] border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-mono text-slate-500">STUDIOS</p>
                    <p className="text-sm font-semibold text-white">{settings.location}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                {[
                  { label: 'GitHub', url: settings.githubUrl || 'https://github.com/muhammedzahran5434-ops' },
                  {
                    label: 'LinkedIn',
                    url: settings.linkedinUrl || 'https://www.linkedin.com/in/muhammed-zahran-b8b111406',
                  },
                  { label: 'Pinterest', url: settings.pinterestUrl || 'https://in.pinterest.com/webtrex/' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-slate-200 hover:border-cyan-400/50 hover:text-cyan-300 transition-colors"
                  >
                    {s.label}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <PublicContactForm
                addToast={addToast}
                preselectedDiscipline={preselectedDiscipline}
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#080A0F] border-t border-white/10 pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
            <div className="md:col-span-5 space-y-4">
              <WebTrexLogo />
              <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                {settings.tagline} Engineering websites, mobile apps, and bespoke software systems.
              </p>
              <a
                href={`mailto:${settings.email}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:underline"
              >
                <Mail className="w-4 h-4" />
                {settings.email}
              </a>
            </div>

            <div className="md:col-span-3 space-y-2.5">
              <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
                Navigation
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                {navLinks.map((l) => (
                  <li key={l.id}>
                    <a href={l.href} className="hover:text-white transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3">
              <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
                Studio Access
              </p>
              <p className="text-sm text-slate-400">
                Manage releases, binary packages, and client inquiries from the console.
              </p>
              <button
                onClick={() => (adminSession ? navigateToAdmin() : setSignInModalOpen(true))}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-bold text-white hover:border-cyan-400/40 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                {adminSession ? 'Open Admin Console' : 'Administrator Portal'}
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} WEBTREX Technologies. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <button onClick={() => setLegalModal('privacy')} className="hover:text-white">
                Privacy Policy
              </button>
              <button onClick={() => setLegalModal('terms')} className="hover:text-white">
                Terms &amp; Conditions
              </button>
            </div>
          </div>
        </div>
      </footer>

      {activeProjectModal && (
        <ProjectDrawerModal
          project={activeProjectModal}
          activeGalleryIdx={activeGalleryIdx}
          setActiveGalleryIdx={setActiveGalleryIdx}
          onClose={() => setActiveProjectModal(null)}
          onDownloadFile={triggerFileDownload}
        />
      )}

      {commandPaletteOpen && (
        <CommandPaletteModal
          projects={publishedProjects}
          adminSession={adminSession}
          onClose={() => setCommandPaletteOpen(false)}
          onSelectProject={(proj) => {
            setCommandPaletteOpen(false);
            setActiveProjectModal(proj);
            setActiveGalleryIdx(0);
          }}
          onNavigateSection={(secId) => {
            setCommandPaletteOpen(false);
            const el = document.getElementById(secId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenAuth={() => {
            setCommandPaletteOpen(false);
            if (adminSession) navigateToAdmin();
            else setSignInModalOpen(true);
          }}
          onCopyEmail={() => {
            copyToClipboard(settings.email, 'Email');
            setCommandPaletteOpen(false);
          }}
        />
      )}

      {signInModalOpen && (
        <SignInModal
          onClose={() => setSignInModalOpen(false)}
          onAuthenticated={async (sessionData) => {
            setAdminSession(sessionData);
            setSignInModalOpen(false);
            await loadAdminData();
            setCurrentRoute('admin');
            addToast('Welcome Back', `Signed in as ${sessionData.email}`);
          }}
        />
      )}

      {legalModal && (
        <LegalModal
          type={legalModal}
          settings={settings}
          onClose={() => setLegalModal(null)}
        />
      )}
    </div>
  );
}
