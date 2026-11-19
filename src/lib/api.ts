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

export const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
export const ALLOWED_FILE_EXTS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'svg',
  'apk',
  'iso',
  'pdf',
  'docx',
  'txt',
  'zip',
];

export function getFileExt(filename = ''): string {
  const parts = String(filename).split('.');
  return parts.length > 1 ? (parts.pop() || '').toLowerCase() : '';
}

export function formatBytes(bytes: number): string {
  const b = Number(bytes) || 0;
  if (b === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function createArchitecturalArt(
  palette: [string, string, string],
  title: string,
  code: string
): string {
  const [bg, fg, accent] = palette;
  const escapeXml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const safeTitle = escapeXml(title);
  const safeCode = escapeXml(code);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <defs>
      <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke="${fg}" stroke-opacity="0.07" stroke-width="1"/>
      </pattern>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="${bg}"/>
    <rect width="1200" height="800" fill="url(#grid)"/>
    <circle cx="920" cy="240" r="320" fill="url(#glow)"/>
    <rect x="110" y="130" width="980" height="540" rx="24" fill="none" stroke="${fg}" stroke-opacity="0.16" stroke-width="1.5"/>
    <rect x="150" y="170" width="440" height="290" rx="16" fill="${fg}" fill-opacity="0.04" stroke="${fg}" stroke-opacity="0.12"/>
    <circle cx="370" cy="315" r="88" fill="none" stroke="${accent}" stroke-width="2.5"/>
    <circle cx="370" cy="315" r="46" fill="${accent}" fill-opacity="0.18"/>
    <line x1="630" y1="205" x2="1020" y2="205" stroke="${fg}" stroke-opacity="0.2" stroke-width="2"/>
    <rect x="630" y="240" width="240" height="18" rx="9" fill="${accent}"/>
    <rect x="630" y="278" width="380" height="12" rx="6" fill="${fg}" fill-opacity="0.25"/>
    <rect x="630" y="304" width="330" height="12" rx="6" fill="${fg}" fill-opacity="0.16"/>
    <rect x="630" y="355" width="180" height="95" rx="12" fill="${fg}" fill-opacity="0.05" stroke="${fg}" stroke-opacity="0.1"/>
    <rect x="830" y="355" width="180" height="95" rx="12" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-opacity="0.4"/>
    <text x="150" y="565" font-family="monospace" font-size="18" font-weight="600" letter-spacing="4" fill="${accent}">${safeCode}</text>
    <text x="150" y="615" font-family="system-ui, sans-serif" font-size="40" font-weight="700" fill="${fg}">${safeTitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const TOKEN_KEY = 'webtrex_session_token_v1';

export function getAuthToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token: string): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data as T;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  companyName: 'WEBTREX',
  tagline: 'We Turn Ideas Into Digital Reality.',
  heroTitle: 'Building Digital Experiences That Matter.',
  heroSubtitle:
    'We design and develop powerful websites, mobile applications, and innovative digital solutions that help businesses grow.',
  email: 'muhammedzahran5434@gmail.com',
  phone: '+1 (415) 890-4312',
  location: 'San Francisco & Bengaluru — Global Remote Studio',
  githubUrl: 'https://github.com/muhammedzahran5434-ops',
  linkedinUrl: 'https://www.linkedin.com/in/muhammed-zahran-b8b111406',
  pinterestUrl: 'https://in.pinterest.com/webtrex/',
};

export const ApiClient = {
  getBootstrap() {
    return request<{
      projects: Project[];
      categories: Category[];
      settings: SiteSettings;
      dbEngine: string;
      dbStatus: string;
    }>('/api/bootstrap');
  },

  async login(email: string, password: string) {
    const res = await request<{ token: string; admin: AdminSession }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.token);
    return res.admin;
  },

  checkSession() {
    return request<{ authenticated: boolean; admin: AdminSession }>('/api/auth/session');
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken('');
    }
  },

  updateProfile(payload: { name: string; currentPassword: string; newPassword: string }) {
    return request<{ admin: AdminSession }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  getAdminData() {
    return request<{
      projects: Project[];
      categories: Category[];
      files: ReleaseFile[];
      messages: ClientMessage[];
      logs: ActivityLog[];
      settings: SiteSettings;
      stats: DatabaseStats;
    }>('/api/admin/data');
  },

  async uploadFile(name: string, dataUrl: string): Promise<string> {
    if (!dataUrl || !dataUrl.startsWith('data:') || dataUrl.startsWith('data:image/svg+xml')) {
      return dataUrl;
    }
    const res = await request<{ url: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ name, dataUrl }),
    });
    return res.url;
  },

  createProject(project: Partial<Project>) {
    return request<{ project: Project }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  updateProject(id: string, project: Partial<Project>) {
    return request<{ project: Project }>(`/api/projects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  },

  setProjectStatus(id: string, status: 'published' | 'draft') {
    return request<{ project: Project }>(`/api/projects/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  deleteProject(id: string) {
    return request<{ ok: boolean }>(`/api/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  deleteAllProjects() {
    return request<{ ok: boolean }>('/api/projects', {
      method: 'DELETE',
    });
  },

  createCategory(name: string, description: string) {
    return request<{ category: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  deleteCategory(id: string) {
    return request<{ ok: boolean }>(`/api/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  deleteFile(id: string) {
    return request<{ ok: boolean }>(`/api/files/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  submitMessage(payload: {
    name: string;
    email: string;
    projectType: string;
    message: string;
  }) {
    return request<{ message: ClientMessage }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  toggleMessageRead(id: string, read: boolean) {
    return request<{ ok: boolean; read: boolean }>(`/api/messages/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ read }),
    });
  },

  deleteMessage(id: string) {
    return request<{ ok: boolean }>(`/api/messages/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  updateSettings(settings: SiteSettings) {
    return request<{ settings: SiteSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  exportBackup() {
    return request<Record<string, unknown>>('/api/backup/export');
  },

  importBackup(payload: unknown) {
    return request<{ ok: boolean }>('/api/backup/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
