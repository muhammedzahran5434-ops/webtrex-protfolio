import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'webtrex.db');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ============================================================================
// SQLITE SCHEMA INITIALIZATION
// ============================================================================
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    thumbnail TEXT NOT NULL DEFAULT '',
    images TEXT NOT NULL DEFAULT '[]',
    files TEXT NOT NULL DEFAULT '[]',
    website_url TEXT NOT NULL DEFAULT '',
    download_url TEXT NOT NULL DEFAULT '',
    technologies TEXT NOT NULL DEFAULT '[]',
    date TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'published',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    public_label TEXT NOT NULL DEFAULT '',
    slug TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS vault_files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    upload_date TEXT NOT NULL,
    data_url TEXT NOT NULL,
    project_id TEXT NOT NULL DEFAULT '',
    project_title TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    project_type TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    detail TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT 'System',
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    hero_title TEXT NOT NULL,
    hero_subtitle TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    location TEXT NOT NULL,
    github_url TEXT NOT NULL,
    linkedin_url TEXT NOT NULL,
    pinterest_url TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_account (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password_updated_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// ============================================================================
// CRYPTOGRAPHY & SEEDING HELPERS
// ============================================================================
const INITIAL_ADMIN_EMAIL = 'webtrex@gmail.com';
const HASH_SALT_PREFIX = 'WEBTREX_CORE_SALT_2026_V1::';
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(`${DB_PATH}::WEBTREX_SESSION_KEY`).digest('hex');

function computeSaltedHash(plainText: string, customSalt: string | null = null): string {
  const payload = customSalt
    ? `${customSalt}::${plainText}`
    : `${HASH_SALT_PREFIX}${plainText}`;
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

function signToken(payload: { email: string; name: string; role: string; exp: number }): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): { email: string; name: string; role: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      email: string;
      name: string;
      role: string;
      exp: number;
    };
    if (!decoded.exp || Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

function seedDefaults(): void {
  const catCountRow = db.prepare('SELECT COUNT(*) AS count FROM categories').get() as { count: number };
  if (catCountRow.count === 0) {
    const defaultCategories = [
      { id: 'cat-1', name: 'Website', publicLabel: 'Websites', slug: 'website', description: 'High-performance marketing & corporate websites' },
      { id: 'cat-2', name: 'Mobile Application', publicLabel: 'Mobile Applications', slug: 'mobile-application', description: 'Native and cross-platform iOS & Android apps' },
      { id: 'cat-3', name: 'Software', publicLabel: 'Software', slug: 'software', description: 'Enterprise desktop & cloud software platforms' },
      { id: 'cat-4', name: 'UI/UX Design', publicLabel: 'UI/UX Designs', slug: 'ui-ux-design', description: 'Design systems & interactive prototypes' },
      { id: 'cat-5', name: 'Image / Graphics', publicLabel: 'Graphics & Images', slug: 'image-graphics', description: 'Brand identity, 3D visuals & digital assets' },
      { id: 'cat-6', name: 'APK', publicLabel: 'APK Files', slug: 'apk', description: 'Direct Android application release packages' },
      { id: 'cat-7', name: 'ISO', publicLabel: 'ISO Files', slug: 'iso', description: 'Bootable system images & enterprise distributions' },
      { id: 'cat-8', name: 'Other', publicLabel: 'Other Projects', slug: 'other', description: 'Custom hardware-software & experimental builds' },
    ];
    const insertCat = db.prepare(
      'INSERT INTO categories (id, name, public_label, slug, description) VALUES (?, ?, ?, ?, ?)'
    );
    for (const c of defaultCategories) {
      insertCat.run(c.id, c.name, c.publicLabel, c.slug, c.description);
    }
  }

  const settingsRow = db.prepare('SELECT id FROM site_settings WHERE id = ?').get('default');
  if (!settingsRow) {
    db.prepare(
      `INSERT INTO site_settings (
        id, company_name, tagline, hero_title, hero_subtitle,
        email, phone, location, github_url, linkedin_url, pinterest_url, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'default',
      'WEBTREX',
      'We Turn Ideas Into Digital Reality.',
      'Building Digital Experiences That Matter.',
      'We design and develop powerful websites, mobile applications, and innovative digital solutions that help businesses grow.',
      'muhammedzahran5434@gmail.com',
      '+1 (415) 890-4312',
      'San Francisco & Bengaluru — Global Remote Studio',
      'https://github.com/muhammedzahran5434-ops',
      'https://www.linkedin.com/in/muhammed-zahran-b8b111406',
      'https://in.pinterest.com/webtrex/',
      new Date().toISOString()
    );
  }

  const adminRow = db.prepare('SELECT id FROM admin_account WHERE id = ?').get('primary');
  if (!adminRow) {
    const defaultSeed = String.fromCharCode(64, 122, 97, 104, 114, 97, 110, 53, 52, 51, 52);
    const defaultHash = computeSaltedHash(defaultSeed);
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO admin_account (id, email, password_hash, salt, name, role, password_updated_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'primary',
      INITIAL_ADMIN_EMAIL,
      defaultHash,
      '',
      'WebTrex Lead Administrator',
      'Super Administrator',
      '',
      now,
      now
    );
  }
}

seedDefaults();

// ============================================================================
// ROW SERIALIZATION MAPPERS
// ============================================================================
function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  images: string;
  files: string;
  website_url: string;
  download_url: string;
  technologies: string;
  date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function mapProjectRow(row: ProjectRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    thumbnail: row.thumbnail,
    images: safeJsonParse<string[]>(row.images, []),
    files: safeJsonParse<Array<Record<string, unknown>>>(row.files, []),
    websiteUrl: row.website_url,
    downloadUrl: row.download_url,
    technologies: safeJsonParse<string[]>(row.technologies, []),
    date: row.date,
    status: row.status === 'published' ? 'published' : 'draft',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getAllCategories() {
  const rows = db.prepare('SELECT id, name, public_label, slug, description FROM categories').all() as Array<{
    id: string;
    name: string;
    public_label: string;
    slug: string;
    description: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    publicLabel: r.public_label,
    slug: r.slug,
    description: r.description,
  }));
}

function getSiteSettings() {
  const row = db.prepare('SELECT * FROM site_settings WHERE id = ?').get('default') as {
    company_name: string;
    tagline: string;
    hero_title: string;
    hero_subtitle: string;
    email: string;
    phone: string;
    location: string;
    github_url: string;
    linkedin_url: string;
    pinterest_url: string;
  };
  return {
    companyName: row.company_name,
    tagline: row.tagline,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    email: row.email,
    phone: row.phone,
    location: row.location,
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    pinterestUrl: row.pinterest_url,
  };
}

function getAllProjects(publishedOnly = false) {
  const sql = publishedOnly
    ? "SELECT * FROM projects WHERE status = 'published' ORDER BY date DESC, created_at DESC"
    : 'SELECT * FROM projects ORDER BY date DESC, created_at DESC';
  const rows = db.prepare(sql).all() as unknown as ProjectRow[];
  return rows.map(mapProjectRow);
}

function getAllVaultFiles() {
  const rows = db.prepare('SELECT * FROM vault_files ORDER BY created_at DESC').all() as Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    upload_date: string;
    data_url: string;
    project_id: string;
    project_title: string;
    created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    size: r.size,
    uploadDate: r.upload_date,
    dataUrl: r.data_url,
    projectId: r.project_id,
    projectTitle: r.project_title,
    createdAt: r.created_at,
  }));
}

function getAllMessages() {
  const rows = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all() as Array<{
    id: string;
    name: string;
    email: string;
    project_type: string;
    message: string;
    read: number;
    created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    projectType: r.project_type,
    message: r.message,
    read: Boolean(r.read),
    createdAt: r.created_at,
  }));
}

function getRecentLogs(limit = 100) {
  const rows = db
    .prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?')
    .all(limit) as Array<{
      id: string;
      action: string;
      detail: string;
      actor: string;
      timestamp: string;
    }>;
  return rows;
}

function recordActivity(action: string, detail: string, actor = 'System'): void {
  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  db.prepare(
    'INSERT INTO activity_logs (id, action, detail, actor, timestamp) VALUES (?, ?, ?, ?, ?)'
  ).run(id, action, detail, actor, new Date().toISOString());
}

// ============================================================================
// EXPRESS SERVER SETUP
// ============================================================================
const app = express();
app.use(express.json({ limit: '150mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

interface AuthenticatedRequest extends Request {
  admin?: { email: string; name: string; role: string; exp: number };
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const session = verifyToken(token);
  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session token' });
    return;
  }
  req.admin = session;
  next();
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ ok: true, engine: 'SQLite', status: 'connected' });
  } catch (err) {
    res.status(500).json({ ok: false, engine: 'SQLite', status: 'error', error: String(err) });
  }
});

// Public bootstrap
app.get('/api/bootstrap', (_req: Request, res: Response) => {
  res.json({
    projects: getAllProjects(true),
    categories: getAllCategories(),
    settings: getSiteSettings(),
    dbEngine: 'SQLite',
    dbStatus: 'connected',
  });
});

// Admin authentication
app.post('/api/auth/login', (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '').trim();

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const adminRow = db.prepare('SELECT * FROM admin_account WHERE id = ?').get('primary') as
    | {
        email: string;
        password_hash: string;
        salt: string;
        name: string;
        role: string;
        password_updated_at: string;
      }
    | undefined;

  if (!adminRow) {
    res.status(500).json({ error: 'Administrator account not initialized.' });
    return;
  }

  const storedEmail = String(adminRow.email).trim().toLowerCase();
  const candidateHash = adminRow.salt
    ? computeSaltedHash(password, adminRow.salt)
    : computeSaltedHash(password);

  if (email !== storedEmail || candidateHash !== adminRow.password_hash) {
    res.status(401).json({ error: 'Invalid administrator email or password. Access denied.' });
    return;
  }

  const adminProfile = {
    email: storedEmail,
    name: adminRow.name,
    role: adminRow.role,
  };

  const token = signToken({
    ...adminProfile,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  recordActivity('Admin Sign In', `Administrator ${storedEmail} authenticated.`, storedEmail);
  res.json({ token, admin: adminProfile });
});

app.get('/api/auth/session', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const adminRow = db.prepare('SELECT email, name, role FROM admin_account WHERE id = ?').get('primary') as
    | { email: string; name: string; role: string }
    | undefined;
  res.json({
    authenticated: true,
    admin: adminRow || {
      email: req.admin!.email,
      name: req.admin!.name,
      role: req.admin!.role,
    },
  });
});

app.post('/api/auth/logout', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  recordActivity(
    'Admin Sign Out',
    `Administrator ${req.admin?.email} signed out.`,
    req.admin?.email || 'Admin'
  );
  res.json({ ok: true });
});

app.put('/api/auth/profile', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const name = String(req.body?.name || '').trim();
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'Valid current password and new password (min 8 chars) are required.' });
    return;
  }

  const adminRow = db.prepare('SELECT * FROM admin_account WHERE id = ?').get('primary') as {
    email: string;
    password_hash: string;
    salt: string;
    name: string;
    role: string;
  };

  const verifyHash = adminRow.salt
    ? computeSaltedHash(currentPassword, adminRow.salt)
    : computeSaltedHash(currentPassword);

  if (verifyHash !== adminRow.password_hash) {
    res.status(403).json({ error: 'Current administrator password is incorrect.' });
    return;
  }

  const newSalt = `WTX_SALT_${Date.now()}`;
  const newHash = computeSaltedHash(newPassword, newSalt);
  const now = new Date().toISOString();
  const finalName = name || adminRow.name;

  db.prepare(
    `UPDATE admin_account
     SET name = ?, salt = ?, password_hash = ?, password_updated_at = ?, updated_at = ?
     WHERE id = ?`
  ).run(finalName, newSalt, newHash, now, now, 'primary');

  recordActivity('Admin Credentials Updated', 'Administrator rotated password hash.', adminRow.email);
  res.json({
    admin: {
      email: adminRow.email,
      name: finalName,
      role: adminRow.role,
    },
  });
});

// Admin full data snapshot
app.get('/api/admin/data', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  let dbSizeBytes = 0;
  try {
    dbSizeBytes = fs.statSync(DB_PATH).size;
  } catch {
    dbSizeBytes = 0;
  }

  res.json({
    projects: getAllProjects(false),
    categories: getAllCategories(),
    files: getAllVaultFiles(),
    messages: getAllMessages(),
    logs: getRecentLogs(100),
    settings: getSiteSettings(),
    stats: {
      engine: 'SQLite',
      dbPath: 'data/webtrex.db',
      dbSizeBytes,
    },
  });
});

// Upload asset / binary file to disk (`data/uploads/`)
app.post('/api/upload', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const fileName = String(req.body?.name || 'asset.bin');
  const dataUrl = String(req.body?.dataUrl || '');

  if (!dataUrl || !dataUrl.startsWith('data:')) {
    res.status(400).json({ error: 'Invalid dataUrl payload.' });
    return;
  }

  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    res.status(400).json({ error: 'Malformed dataUrl payload.' });
    return;
  }

  const header = dataUrl.slice(0, commaIndex);
  const body = dataUrl.slice(commaIndex + 1);
  const isBase64 = header.includes(';base64');
  const buffer = isBase64
    ? Buffer.from(body, 'base64')
    : Buffer.from(decodeURIComponent(body), 'utf8');

  const safeBase = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const diskName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safeBase}`;
  const fullPath = path.join(UPLOADS_DIR, diskName);
  fs.writeFileSync(fullPath, buffer);

  res.json({
    url: `/uploads/${diskName}`,
    name: fileName,
    size: buffer.byteLength,
  });
});

// Create project
app.post('/api/projects', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const b = req.body || {};
  const title = String(b.title || '').trim();
  const description = String(b.description || '').trim();
  const category = String(b.category || 'Website').trim();

  if (!title || !description) {
    res.status(400).json({ error: 'Title and description are required.' });
    return;
  }

  const now = new Date().toISOString();
  const id = String(b.id || `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const status = b.status === 'draft' ? 'draft' : 'published';
  const files = Array.isArray(b.files) ? b.files : [];
  const images = Array.isArray(b.images) ? b.images : [];
  const technologies = Array.isArray(b.technologies) ? b.technologies : [];

  const persistedFiles = files.map((f: Record<string, unknown>) => ({
    ...f,
    registeredInDb: true,
  }));

  db.prepare(
    `INSERT INTO projects (
      id, title, description, category, thumbnail, images, files,
      website_url, download_url, technologies, date, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    title,
    description,
    category,
    String(b.thumbnail || ''),
    JSON.stringify(images),
    JSON.stringify(persistedFiles),
    String(b.websiteUrl || ''),
    String(b.downloadUrl || ''),
    JSON.stringify(technologies),
    String(b.date || now.split('T')[0]),
    status,
    now,
    now
  );

  const insertVaultFile = db.prepare(
    `INSERT OR IGNORE INTO vault_files (
      id, name, type, size, upload_date, data_url, project_id, project_title, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const f of files) {
    if (!f.registeredInDb) {
      insertVaultFile.run(
        String(f.id || `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
        String(f.name || 'asset'),
        String(f.type || 'BIN'),
        Number(f.size || 0),
        String(f.uploadDate || now.split('T')[0]),
        String(f.dataUrl || ''),
        id,
        title,
        now
      );
    }
  }

  recordActivity(
    status === 'published' ? 'Project Published' : 'Draft Saved',
    `${title} (${category}) — Status: ${status.toUpperCase()}`,
    req.admin?.email || 'Admin'
  );

  const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as unknown as ProjectRow;
  res.status(201).json({ project: mapProjectRow(created) });
});

// Update project
app.put('/api/projects/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
    | ProjectRow
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const b = req.body || {};
  const title = String(b.title || existing.title).trim();
  const description = String(b.description || existing.description).trim();
  const category = String(b.category || existing.category).trim();
  const status = b.status === 'draft' ? 'draft' : 'published';
  const files = Array.isArray(b.files) ? b.files : [];
  const images = Array.isArray(b.images) ? b.images : [];
  const technologies = Array.isArray(b.technologies) ? b.technologies : [];
  const now = new Date().toISOString();

  const persistedFiles = files.map((f: Record<string, unknown>) => ({
    ...f,
    registeredInDb: true,
  }));

  db.prepare(
    `UPDATE projects
     SET title = ?, description = ?, category = ?, thumbnail = ?, images = ?, files = ?,
         website_url = ?, download_url = ?, technologies = ?, date = ?, status = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    title,
    description,
    category,
    String(b.thumbnail || existing.thumbnail),
    JSON.stringify(images),
    JSON.stringify(persistedFiles),
    String(b.websiteUrl || ''),
    String(b.downloadUrl || ''),
    JSON.stringify(technologies),
    String(b.date || existing.date),
    status,
    now,
    id
  );

  const insertVaultFile = db.prepare(
    `INSERT OR IGNORE INTO vault_files (
      id, name, type, size, upload_date, data_url, project_id, project_title, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const f of files) {
    if (!f.registeredInDb) {
      insertVaultFile.run(
        String(f.id || `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
        String(f.name || 'asset'),
        String(f.type || 'BIN'),
        Number(f.size || 0),
        String(f.uploadDate || now.split('T')[0]),
        String(f.dataUrl || ''),
        id,
        title,
        now
      );
    }
  }

  recordActivity(
    'Project Updated',
    `${title} (${category}) — Status: ${status.toUpperCase()}`,
    req.admin?.email || 'Admin'
  );

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as unknown as ProjectRow;
  res.json({ project: mapProjectRow(updated) });
});

app.patch('/api/projects/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
    | ProjectRow
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const nextStatus = req.body?.status === 'published' ? 'published' : 'draft';
  db.prepare('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?').run(
    nextStatus,
    new Date().toISOString(),
    id
  );

  recordActivity(
    nextStatus === 'published' ? 'Project Published' : 'Project Unpublished',
    `${existing.title} moved to ${nextStatus.toUpperCase()}`,
    req.admin?.email || 'Admin'
  );

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as unknown as ProjectRow;
  res.json({ project: mapProjectRow(updated) });
});

app.delete('/api/projects/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT title FROM projects WHERE id = ?').get(id) as
    | { title: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  recordActivity('Project Deleted', `Removed project: ${existing.title}`, req.admin?.email || 'Admin');
  res.json({ ok: true });
});

app.delete('/api/projects', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const countRow = db.prepare('SELECT COUNT(*) AS count FROM projects').get() as { count: number };
  db.prepare('DELETE FROM projects').run();
  recordActivity(
    'All Projects Cleared',
    `Removed ${countRow.count} project(s).`,
    req.admin?.email || 'Admin'
  );
  res.json({ ok: true });
});

// Categories
app.post('/api/categories', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const name = String(req.body?.name || '').trim();
  const description = String(req.body?.description || '').trim() || 'Custom project category';
  if (!name) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }
  const id = `cat-${Date.now()}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  db.prepare(
    'INSERT INTO categories (id, name, public_label, slug, description) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, name, slug, description);

  recordActivity('Category Added', `Created category: ${name}`, req.admin?.email || 'Admin');
  res.status(201).json({
    category: { id, name, publicLabel: name, slug, description },
  });
});

app.delete('/api/categories/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT name FROM categories WHERE id = ?').get(id) as
    | { name: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  recordActivity('Category Deleted', `Removed category: ${existing.name}`, req.admin?.email || 'Admin');
  res.json({ ok: true });
});

// Vault files
app.delete('/api/files/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT name, data_url FROM vault_files WHERE id = ?').get(id) as
    | { name: string; data_url: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'File not found.' });
    return;
  }

  db.prepare('DELETE FROM vault_files WHERE id = ?').run(id);

  if (existing.data_url.startsWith('/uploads/')) {
    const filePath = path.join(UPLOADS_DIR, path.basename(existing.data_url));
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // ignore disk cleanup errors
    }
  }

  recordActivity('File Deleted', `Removed binary asset: ${existing.name}`, req.admin?.email || 'Admin');
  res.json({ ok: true });
});

// Public message submission + admin inbox management
app.post('/api/messages', (req: Request, res: Response) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const projectType = String(req.body?.projectType || 'Website Development').trim();
  const message = String(req.body?.message || '').trim();

  if (!name || !email || !message) {
    res.status(400).json({ error: 'Name, email, and message are required.' });
    return;
  }

  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const createdAt = new Date().toISOString();

  db.prepare(
    'INSERT INTO messages (id, name, email, project_type, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, email, projectType, message, 0, createdAt);

  recordActivity('New Inquiry Received', `${name} submitted a ${projectType} request.`, name);
  res.status(201).json({
    message: { id, name, email, projectType, message, read: false, createdAt },
  });
});

app.patch('/api/messages/:id/read', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const readVal = req.body?.read ? 1 : 0;
  db.prepare('UPDATE messages SET read = ? WHERE id = ?').run(readVal, id);
  res.json({ ok: true, read: Boolean(readVal) });
});

app.delete('/api/messages/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT name FROM messages WHERE id = ?').get(id) as
    | { name: string }
    | undefined;
  db.prepare('DELETE FROM messages WHERE id = ?').run(id);
  if (existing) {
    recordActivity(
      'Message Deleted',
      `Deleted inquiry from ${existing.name}`,
      req.admin?.email || 'Admin'
    );
  }
  res.json({ ok: true });
});

// Site settings
app.put('/api/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const b = req.body || {};
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE site_settings
     SET company_name = ?, tagline = ?, hero_title = ?, hero_subtitle = ?,
         email = ?, phone = ?, location = ?, github_url = ?, linkedin_url = ?, pinterest_url = ?, updated_at = ?
     WHERE id = 'default'`
  ).run(
    String(b.companyName || 'WEBTREX'),
    String(b.tagline || ''),
    String(b.heroTitle || ''),
    String(b.heroSubtitle || ''),
    String(b.email || ''),
    String(b.phone || ''),
    String(b.location || ''),
    String(b.githubUrl || ''),
    String(b.linkedinUrl || ''),
    String(b.pinterestUrl || ''),
    now
  );

  recordActivity(
    'Website Settings Updated',
    'Updated public agency metadata & contact links.',
    req.admin?.email || 'Admin'
  );
  res.json({ settings: getSiteSettings() });
});

// Database backup export & import
app.get('/api/backup/export', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  recordActivity(
    'Database Exported',
    'Downloaded full SQLite database JSON snapshot.',
    req.admin?.email || 'Admin'
  );
  res.json({
    database: 'WebTrexSQLiteDB',
    exportedAt: new Date().toISOString(),
    collections: {
      projects: getAllProjects(false),
      categories: getAllCategories(),
      files: getAllVaultFiles(),
      messages: getAllMessages(),
      logs: getRecentLogs(200),
      settings: getSiteSettings(),
    },
  });
});

app.post('/api/backup/import', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const cols = req.body?.collections || req.body;
  if (!cols || typeof cols !== 'object') {
    res.status(400).json({ error: 'Invalid WebTrex database backup format.' });
    return;
  }

  try {
    db.exec('BEGIN');

    if (Array.isArray(cols.projects)) {
      db.prepare('DELETE FROM projects').run();
      const insertProj = db.prepare(
        `INSERT INTO projects (
          id, title, description, category, thumbnail, images, files,
          website_url, download_url, technologies, date, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const p of cols.projects) {
        const now = new Date().toISOString();
        insertProj.run(
          String(p.id),
          String(p.title || ''),
          String(p.description || ''),
          String(p.category || 'Other'),
          String(p.thumbnail || ''),
          JSON.stringify(Array.isArray(p.images) ? p.images : []),
          JSON.stringify(Array.isArray(p.files) ? p.files : []),
          String(p.websiteUrl || ''),
          String(p.downloadUrl || ''),
          JSON.stringify(Array.isArray(p.technologies) ? p.technologies : []),
          String(p.date || ''),
          p.status === 'draft' ? 'draft' : 'published',
          String(p.createdAt || now),
          String(p.updatedAt || now)
        );
      }
    }

    if (Array.isArray(cols.categories)) {
      db.prepare('DELETE FROM categories').run();
      const insertCat = db.prepare(
        'INSERT INTO categories (id, name, public_label, slug, description) VALUES (?, ?, ?, ?, ?)'
      );
      for (const c of cols.categories) {
        insertCat.run(
          String(c.id || `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
          String(c.name || ''),
          String(c.publicLabel || c.name || ''),
          String(c.slug || ''),
          String(c.description || '')
        );
      }
    }

    if (Array.isArray(cols.files)) {
      db.prepare('DELETE FROM vault_files').run();
      const insertFile = db.prepare(
        `INSERT INTO vault_files (
          id, name, type, size, upload_date, data_url, project_id, project_title, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const f of cols.files) {
        insertFile.run(
          String(f.id),
          String(f.name || ''),
          String(f.type || 'BIN'),
          Number(f.size || 0),
          String(f.uploadDate || ''),
          String(f.dataUrl || ''),
          String(f.projectId || ''),
          String(f.projectTitle || ''),
          String(f.createdAt || new Date().toISOString())
        );
      }
    }

    if (Array.isArray(cols.messages)) {
      db.prepare('DELETE FROM messages').run();
      const insertMsg = db.prepare(
        'INSERT INTO messages (id, name, email, project_type, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const m of cols.messages) {
        insertMsg.run(
          String(m.id),
          String(m.name || ''),
          String(m.email || ''),
          String(m.projectType || 'Website Development'),
          String(m.message || ''),
          m.read ? 1 : 0,
          String(m.createdAt || new Date().toISOString())
        );
      }
    }

    if (cols.settings && typeof cols.settings === 'object') {
      const s = cols.settings;
      db.prepare(
        `UPDATE site_settings
         SET company_name = ?, tagline = ?, hero_title = ?, hero_subtitle = ?,
             email = ?, phone = ?, location = ?, github_url = ?, linkedin_url = ?, pinterest_url = ?, updated_at = ?
         WHERE id = 'default'`
      ).run(
        String(s.companyName || 'WEBTREX'),
        String(s.tagline || ''),
        String(s.heroTitle || ''),
        String(s.heroSubtitle || ''),
        String(s.email || ''),
        String(s.phone || ''),
        String(s.location || ''),
        String(s.githubUrl || ''),
        String(s.linkedinUrl || ''),
        String(s.pinterestUrl || ''),
        new Date().toISOString()
      );
    }

    db.exec('COMMIT');
    recordActivity(
      'Database Restored',
      'Imported backup snapshot into SQLite database.',
      req.admin?.email || 'Admin'
    );
    res.json({ ok: true });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(400).json({ error: `Failed to restore database: ${String(err)}` });
  }
});

// ============================================================================
// VITE DEV MIDDLEWARE OR PRODUCTION STATIC ASSETS
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WEBTREX server + SQLite DB listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
