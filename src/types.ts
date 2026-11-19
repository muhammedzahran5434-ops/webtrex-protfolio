export interface ReleaseFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  dataUrl: string;
  projectId?: string;
  projectTitle?: string;
  registeredInDb?: boolean;
  createdAt?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  images: string[];
  files: ReleaseFile[];
  websiteUrl: string;
  downloadUrl: string;
  technologies: string[];
  date: string;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  publicLabel: string;
  slug: string;
  description: string;
}

export interface ClientMessage {
  id: string;
  name: string;
  email: string;
  projectType: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  detail: string;
  actor: string;
  timestamp: string;
}

export interface SiteSettings {
  companyName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  email: string;
  phone: string;
  location: string;
  githubUrl: string;
  linkedinUrl: string;
  pinterestUrl: string;
}

export interface AdminSession {
  email: string;
  name: string;
  role: string;
}

export interface DatabaseStats {
  engine: string;
  dbPath: string;
  dbSizeBytes: number;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error';
}
