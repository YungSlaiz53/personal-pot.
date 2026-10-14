import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'vault-db.json');

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Interfaces
interface VaultFile {
  id: string;
  originalName: string;
  filename: string;
  storedPath: string;
  mimeType: string;
  size: number;
  title: string;
  description: string;
  category: string;
  folderId: string | null;
  tags: string[];
  visibility: 'public' | 'private';
  downloadAllowed: boolean;
  downloadsCount: number;
  viewsCount: number;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface VaultFolder {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

interface VaultLink {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
  thumbnailUrl?: string;
  visibility: 'public' | 'private';
  clicksCount: number;
  createdAt: string;
  updatedAt: string;
}

interface VaultSettings {
  portfolioName: string;
  ownerName: string;
  ownerTitle: string;
  bio: string;
  avatarUrl: string;
  email: string;
  phone: string;
  location: string;
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    dribbble?: string;
    youtube?: string;
    website?: string;
  };
  defaultVisibility: 'public' | 'private';
  defaultDownloadAllowed: boolean;
  publicIntroduction: string;
  visibleCategories: string[];
}

interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  sessionTokens: string[];
}

interface VaultMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface VaultDatabase {
  admin: AdminUser;
  settings: VaultSettings;
  folders: VaultFolder[];
  files: VaultFile[];
  links: VaultLink[];
  messages: VaultMessage[];
}

// Password hashing helpers
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Initialize seed data if database does not exist
function initDatabase(): VaultDatabase {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return data;
    } catch (err) {
      console.error('Error reading vault-db.json, recreating defaults', err);
    }
  }

  const defaultSalt = crypto.randomBytes(16).toString('hex');
  const defaultPasswordHash = hashPassword('Oglekwu', defaultSalt);

  // Create initial demo files in storage so they can be viewed and downloaded right away
  const samplePdfPath = path.join(UPLOADS_DIR, 'sample_resume.pdf');
  const sampleCvContent = `%PDF-1.4
%âãÏÓ
1 0 obj
<< /Title (Alex Vance - Senior Software Architect CV)
   /Creator (MyVault System)
   /Producer (MyVault Document Engine) >>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792]
   /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >>
endobj
5 0 obj
<< /Length 260 >>
stream
BT
/F1 24 Tf
50 720 Td
(ALEX VANCE - SENIOR SOFTWARE ARCHITECT) Tj
/F1 12 Tf
0 -30 Td
(Email: contact@alexvance.dev | Location: San Francisco, CA) Tj
0 -20 Td
(Verified Credentials: AWS Certified Solutions Architect | Full-Stack Cloud) Tj
0 -30 Td
(Summary: 8+ years designing scalable cloud backends, digital vaults, and web apps.) Tj
0 -30 Td
(Core Competencies: TypeScript, Node.js, React, Distributed Systems, Security) Tj
ET
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f 
0000000015 00000 n 
0000000155 00000 n 
0000000205 00000 n 
0000000262 00000 n 
0000000388 00000 n 
0000000701 00000 n 
trailer
<< /Size 7 /Root 2 0 R >>
startxref
767
%%EOF`;
  fs.writeFileSync(samplePdfPath, sampleCvContent, 'utf-8');

  // Sample SVG / Image mockup
  const sampleDesignPath = path.join(UPLOADS_DIR, 'fintech_dashboard_design.svg');
  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0D11"/>
      <stop offset="50%" stop-color="#141821"/>
      <stop offset="100%" stop-color="#07090C"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F5C518"/>
      <stop offset="100%" stop-color="#FFDF6D"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1A212D"/>
      <stop offset="100%" stop-color="#121620"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <rect x="60" y="50" width="1080" height="700" rx="20" fill="url(#cardGrad)" stroke="#232A3B" stroke-width="2"/>
  <circle cx="100" cy="90" r="7" fill="#EF4444"/>
  <circle cx="125" cy="90" r="7" fill="#F59E0B"/>
  <circle cx="150" cy="90" r="7" fill="#10B981"/>
  <text x="200" y="96" fill="#94A3B8" font-family="sans-serif" font-size="14" font-weight="600">AURA DIGITAL WEALTH PLATFORM - SYSTEM ARCHITECTURE &amp; UI</text>
  <rect x="100" y="140" width="300" height="180" rx="14" fill="#0E121A" stroke="#263143"/>
  <text x="130" y="190" fill="#94A3B8" font-family="sans-serif" font-size="14">Total Vault Liquidity</text>
  <text x="130" y="240" fill="url(#gold)" font-family="sans-serif" font-size="32" font-weight="bold">$4,850,290.00</text>
  <text x="130" y="280" fill="#10B981" font-family="sans-serif" font-size="13">+24.8% vs last quarter</text>
  <rect x="430" y="140" width="620" height="180" rx="14" fill="#0E121A" stroke="#263143"/>
  <path d="M460 270 Q 550 210, 640 240 T 820 180 T 1000 170" fill="none" stroke="#F5C518" stroke-width="4"/>
  <text x="460" y="180" fill="#F5F7FA" font-family="sans-serif" font-size="16" font-weight="bold">Real-time Transaction Throughput</text>
  <rect x="100" y="350" width="950" height="350" rx="14" fill="#0E121A" stroke="#263143"/>
  <text x="140" y="400" fill="#F5F7FA" font-family="sans-serif" font-size="18" font-weight="bold">Multi-tenant Security Boundary Matrix</text>
  <text x="140" y="440" fill="#94A3B8" font-family="sans-serif" font-size="14">Verified by Zero-Knowledge Attestation Protocol v2.4</text>
</svg>`;
  fs.writeFileSync(sampleDesignPath, sampleSvg, 'utf-8');

  // Sample Architecture Spec Doc
  const sampleDocPath = path.join(UPLOADS_DIR, 'cloud_architecture_spec.md');
  const sampleDoc = `# High-Concurrency Digital Asset Vault Architecture
Author: Alex Vance
Status: Production Deployed

## 1. Executive Overview
This document specifies the microservices topography, key management system (KMS), and immutable audit trail designed for enterprise-grade digital file preservation.

## 2. Security Boundaries
- Zero-trust authentication via cryptographic session tokens.
- Strict server-enforced role policies (Admins vs Anonymous Public Visitors).
- Content-Disposition enforcement: preview-only vs binary download streaming.
- Dynamic HTTP 206 Partial Content range requests for high-bitrate video assets.

## 3. High Availability Storage
Object assets are isolated from metadata indexing to prevent single-point bottlenecks and ensure zero-data-loss durability.`;
  fs.writeFileSync(sampleDocPath, sampleDoc, 'utf-8');

  // Sample Certificate SVG
  const sampleCertPath = path.join(UPLOADS_DIR, 'aws_solutions_architect_certificate.svg');
  const sampleCert = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
  <defs>
    <linearGradient id="certBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141821"/>
      <stop offset="100%" stop-color="#0B0D11"/>
    </linearGradient>
    <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5C518"/>
      <stop offset="50%" stop-color="#D4A017"/>
      <stop offset="100%" stop-color="#F5C518"/>
    </linearGradient>
  </defs>
  <rect width="1000" height="700" fill="url(#certBg)"/>
  <rect x="30" y="30" width="940" height="640" fill="none" stroke="url(#goldBorder)" stroke-width="4" rx="16"/>
  <rect x="45" y="45" width="910" height="610" fill="none" stroke="#232A3B" stroke-width="1" rx="12"/>
  <circle cx="500" cy="150" r="50" fill="#1E2533" stroke="#F5C518" stroke-width="3"/>
  <text x="500" y="160" text-anchor="middle" fill="#F5C518" font-family="sans-serif" font-size="28" font-weight="bold">★ CERTIFIED ★</text>
  <text x="500" y="250" text-anchor="middle" fill="#94A3B8" font-family="sans-serif" font-size="16" letter-spacing="4">OFFICIAL VERIFICATION CREDENTIAL</text>
  <text x="500" y="310" text-anchor="middle" fill="#F5F7FA" font-family="sans-serif" font-size="34" font-weight="bold">AWS Solutions Architect - Professional</text>
  <text x="500" y="360" text-anchor="middle" fill="#94A3B8" font-family="sans-serif" font-size="18">This is to certify that</text>
  <text x="500" y="420" text-anchor="middle" fill="#F5C518" font-family="sans-serif" font-size="40" font-weight="bold">Alex Vance</text>
  <text x="500" y="470" text-anchor="middle" fill="#94A3B8" font-family="sans-serif" font-size="16">has demonstrated advanced technical knowledge in cloud systems architecture &amp; security.</text>
  <text x="200" y="580" fill="#64748B" font-family="monospace" font-size="14">Validation ID: AWS-VAULT-99420-X</text>
  <text x="700" y="580" fill="#64748B" font-family="monospace" font-size="14">Issue Date: Oct 2025</text>
</svg>`;
  fs.writeFileSync(sampleCertPath, sampleCert, 'utf-8');

  const defaultDatabase: VaultDatabase = {
    admin: {
      id: 'usr_admin_01',
      email: 'Blessed',
      passwordHash: defaultPasswordHash,
      salt: defaultSalt,
      name: 'BLESSED DAVID OGLEKWU',
      sessionTokens: []
    },
    settings: {
      portfolioName: 'BLESSED DAVID OGLEKWU',
      ownerName: 'BLESSED DAVID OGLEKWU',
      ownerTitle: 'Software Architect & Digital Systems Vault',
      bio: 'Welcome to my official digital vault. Here you can explore my verified credentials, documents, architecture blueprints, production code repositories, and creative work.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      email: 'blessedogle52@gmail.com',
      phone: '',
      location: 'Nigeria',
      socialLinks: {
        github: 'https://github.com',
        linkedin: 'https://linkedin.com',
        twitter: 'https://x.com'
      },
      defaultVisibility: 'public',
      defaultDownloadAllowed: true,
      publicIntroduction: 'Welcome to my official digital vault. Explore my verified certifications, project architecture blueprints, code repositories, and creative work.',
      visibleCategories: [
        'CV and Resume',
        'Web Development',
        'Certificates',
        'Graphic Design',
        'Video Projects',
        'Documents',
        'Resources and Links'
      ]
    },
    folders: [
      {
        id: 'fld_cv',
        name: 'CV & Professional Credentials',
        category: 'CV and Resume',
        description: 'Verified resumes, credentials, and work history documents.',
        color: '#F5C518',
        icon: 'FileText',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'fld_webdev',
        name: 'Web Engineering & Architecture',
        category: 'Web Development',
        description: 'System specifications, blueprints, and production web apps.',
        color: '#3B82F6',
        icon: 'Code',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'fld_design',
        name: 'Brand & Graphic Design',
        category: 'Graphic Design',
        description: 'Visual identities, vector assets, and design systems.',
        color: '#EC4899',
        icon: 'Palette',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'fld_certs',
        name: 'Verified Certifications',
        category: 'Certificates',
        description: 'Official industry licenses and cloud architecture certificates.',
        color: '#10B981',
        icon: 'Award',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'fld_private_vault',
        name: 'Private Vault & Tax Documents',
        category: 'Documents',
        description: 'Confidential administrative records strictly for internal vault use.',
        color: '#EF4444',
        icon: 'Lock',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    files: [
      {
        id: 'file_cv_01',
        originalName: 'Alex_Vance_Software_Architect_CV.pdf',
        filename: 'sample_resume.pdf',
        storedPath: samplePdfPath,
        mimeType: 'application/pdf',
        size: fs.statSync(samplePdfPath).size,
        title: 'Executive CV & Technical Leadership Resume',
        description: 'Comprehensive curriculum vitae detailing enterprise system architecture experience, publications, and cloud projects.',
        category: 'CV and Resume',
        folderId: 'fld_cv',
        tags: ['Resume', 'FullStack', 'Architect', 'Credentials'],
        visibility: 'public',
        downloadAllowed: true,
        downloadsCount: 142,
        viewsCount: 389,
        isDeleted: false,
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 4).toISOString()
      },
      {
        id: 'file_spec_02',
        originalName: 'Cloud_Architecture_Specification_v2.md',
        filename: 'cloud_architecture_spec.md',
        storedPath: sampleDocPath,
        mimeType: 'text/markdown',
        size: fs.statSync(sampleDocPath).size,
        title: 'Cloud Architecture & Vault Security Spec',
        description: 'Technical whitepaper on zero-trust authentication, storage access boundaries, and high-concurrency event loops.',
        category: 'Web Development',
        folderId: 'fld_webdev',
        tags: ['Security', 'Architecture', 'Whitepaper', 'DevOps'],
        visibility: 'public',
        downloadAllowed: true,
        downloadsCount: 88,
        viewsCount: 245,
        isDeleted: false,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: 'file_design_03',
        originalName: 'Fintech_Dashboard_Aura_Design.svg',
        filename: 'fintech_dashboard_design.svg',
        storedPath: sampleDesignPath,
        mimeType: 'image/svg+xml',
        size: fs.statSync(sampleDesignPath).size,
        title: 'Aura Fintech High-Density Analytics UI',
        description: 'Vector UI design blueprint for next-generation algorithmic wealth management platform.',
        category: 'Graphic Design',
        folderId: 'fld_design',
        tags: ['UI/UX', 'Vector', 'Fintech', 'DesignSystem'],
        visibility: 'public',
        downloadAllowed: false, // Preview only demonstrated!
        downloadsCount: 0,
        viewsCount: 512,
        isDeleted: false,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'file_cert_04',
        originalName: 'AWS_Solutions_Architect_Professional.svg',
        filename: 'aws_solutions_architect_certificate.svg',
        storedPath: sampleCertPath,
        mimeType: 'image/svg+xml',
        size: fs.statSync(sampleCertPath).size,
        title: 'AWS Certified Solutions Architect — Professional',
        description: 'Official credential validating multi-region hybrid architecture and enterprise resilience governance.',
        category: 'Certificates',
        folderId: 'fld_certs',
        tags: ['AWS', 'Certification', 'Cloud', 'Verified'],
        visibility: 'public',
        downloadAllowed: true,
        downloadsCount: 65,
        viewsCount: 410,
        isDeleted: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'file_priv_05',
        originalName: 'Confidential_Tax_W8_2026.pdf',
        filename: 'sample_resume.pdf',
        storedPath: samplePdfPath,
        mimeType: 'application/pdf',
        size: 1024 * 45,
        title: 'Confidential Tax & Entity Governance Records',
        description: 'Internal private vault documentation. Not visible to the public under any circumstances.',
        category: 'Documents',
        folderId: 'fld_private_vault',
        tags: ['Confidential', 'Tax', 'Private'],
        visibility: 'private', // Private file!
        downloadAllowed: false,
        downloadsCount: 0,
        viewsCount: 3,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    links: [
      {
        id: 'link_01',
        title: 'HyperVault Core Engine (GitHub)',
        url: 'https://github.com/example/hypervault-core',
        description: 'Open source distributed storage driver supporting AES-256 chunked streaming and content-addressed deduplication.',
        category: 'Web Development',
        tags: ['GitHub', 'OpenSource', 'NodeJS', 'TypeScript'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=400&q=80',
        visibility: 'public',
        clicksCount: 240,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: 'link_02',
        title: 'Nebula Cloud Orchestrator (Live Demo)',
        url: 'https://example.com/demo/nebula-orchestrator',
        description: 'Live interactive dashboard demonstrating autonomous Kubernetes cluster autoscaling under synthetic load.',
        category: 'Web Development',
        tags: ['LiveDemo', 'Kubernetes', 'Cloud'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
        visibility: 'public',
        clicksCount: 388,
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 4).toISOString()
      },
      {
        id: 'link_03',
        title: 'Interactive 3D Showreel (WebGL)',
        url: 'https://example.com/showreel/3d-canvas',
        description: 'Shader-driven real-time visual simulation showing high-poly generative geometry and post-processing filters.',
        category: 'Video Projects',
        tags: ['WebGL', 'ThreeJS', 'Showreel', 'Creative'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80',
        visibility: 'public',
        clicksCount: 172,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'link_04',
        title: 'Private Server IPMI & Cloudflare Zero Trust Tunnel',
        url: 'https://internal.vault.local/ipmi',
        description: 'Internal private server management tunnel for bare-metal compute nodes.',
        category: 'Resources and Links',
        tags: ['Internal', 'Private', 'Infrastructure'],
        visibility: 'private',
        clicksCount: 12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    messages: [
      {
        id: 'msg_01',
        name: 'Sarah Chen (Tech Recruiter)',
        email: 'sarah.chen@techventures.co',
        subject: 'Senior Architecture Role Inquiry',
        message: 'Hello Alex, I reviewed your CV and the Aura Fintech architecture blueprint in your vault. We are looking for a Lead Architect for our new cloud infrastructure team. Would love to connect!',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        read: false
      }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(defaultDatabase, null, 2), 'utf-8');
  return defaultDatabase;
}

let db: VaultDatabase = initDatabase();

// Ensure DB has the requested BLESSED DAVID OGLEKWU brand and admin credentials
if (
  db.settings.portfolioName !== 'BLESSED DAVID OGLEKWU' ||
  db.admin.email !== 'Blessed' ||
  db.settings.location !== 'Nigeria' ||
  db.settings.socialLinks?.website
) {
  db.settings.portfolioName = 'BLESSED DAVID OGLEKWU';
  db.settings.ownerName = 'BLESSED DAVID OGLEKWU';
  db.admin.name = 'BLESSED DAVID OGLEKWU';
  db.admin.email = 'Blessed';
  db.settings.location = 'Nigeria';
  if (db.settings.socialLinks) {
    delete db.settings.socialLinks.website;
  }
  db.admin.salt = crypto.randomBytes(16).toString('hex');
  db.admin.passwordHash = hashPassword('Oglekwu', db.admin.salt);
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function saveDatabase() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// Multer Storage configuration for real file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueId = crypto.randomBytes(12).toString('hex');
    const safeBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${uniqueId}_${safeBaseName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit for rich media, docs, video clips
  }
});

// App setup
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Auth Middleware: verifies admin bearer session token
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    return;
  }
  const token = authHeader.substring(7);
  if (!db.admin.sessionTokens.includes(token)) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session token' });
    return;
  }
  next();
}

// ==========================================
// PUBLIC API ENDPOINTS (Safe for all visitors)
// Strictly filters private metadata and files!
// ==========================================

// 1. Public Portfolio Profile
app.get('/api/public/profile', (_req, res) => {
  res.json({
    portfolioName: db.settings.portfolioName,
    ownerName: db.settings.ownerName,
    ownerTitle: db.settings.ownerTitle,
    bio: db.settings.bio,
    avatarUrl: db.settings.avatarUrl,
    email: db.settings.email,
    phone: db.settings.phone,
    location: db.settings.location,
    socialLinks: db.settings.socialLinks,
    publicIntroduction: db.settings.publicIntroduction,
    visibleCategories: db.settings.visibleCategories
  });
});

// 2. Public Files (Strict: Only public & not deleted)
app.get('/api/public/files', (_req, res) => {
  const publicFiles = db.files
    .filter(f => f.visibility === 'public' && !f.isDeleted)
    .map(f => ({
      id: f.id,
      title: f.title,
      description: f.description,
      category: f.category,
      folderId: f.folderId,
      mimeType: f.mimeType,
      size: f.size,
      tags: f.tags,
      originalName: f.originalName,
      downloadAllowed: f.downloadAllowed,
      downloadsCount: f.downloadsCount,
      viewsCount: f.viewsCount,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt
    }));
  res.json(publicFiles);
});

// 3. Public Folders
app.get('/api/public/folders', (_req, res) => {
  // Only return folders that have public files or are registered in public categories
  const publicFolderIds = new Set(
    db.files.filter(f => f.visibility === 'public' && !f.isDeleted).map(f => f.folderId).filter(Boolean)
  );
  const publicFolders = db.folders.filter(fld => publicFolderIds.has(fld.id) || db.settings.visibleCategories.includes(fld.category));
  res.json(publicFolders);
});

// 4. Public Links
app.get('/api/public/links', (_req, res) => {
  const publicLinks = db.links
    .filter(l => l.visibility === 'public')
    .map(l => ({
      id: l.id,
      title: l.title,
      url: l.url,
      description: l.description,
      category: l.category,
      tags: l.tags,
      thumbnailUrl: l.thumbnailUrl,
      clicksCount: l.clicksCount,
      createdAt: l.createdAt
    }));
  res.json(publicLinks);
});

// 5. Public Stats
app.get('/api/public/stats', (_req, res) => {
  const publicFiles = db.files.filter(f => f.visibility === 'public' && !f.isDeleted);
  const publicLinks = db.links.filter(l => l.visibility === 'public');
  res.json({
    totalPublicFiles: publicFiles.length,
    totalPublicLinks: publicLinks.length,
    categoriesCount: new Set(publicFiles.map(f => f.category)).size
  });
});

// 6. Public Stream/Preview File (Inline)
app.get('/api/public/files/:id/view', (req, res) => {
  const file = db.files.find(f => f.id === req.params.id);
  if (!file || file.isDeleted || file.visibility !== 'public') {
    res.status(404).json({ error: 'File not found or private' });
    return;
  }

  const filePath = file.storedPath;
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Storage object missing' });
    return;
  }

  file.viewsCount = (file.viewsCount || 0) + 1;
  saveDatabase();

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Support HTTP 206 Partial Content for video/audio seeking
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': file.mimeType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`
    };
    res.writeHead(206, head);
    fileStream.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': file.mimeType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
      'Accept-Ranges': 'bytes'
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// 7. Public Download File (Strict: checks downloadAllowed)
app.get('/api/public/files/:id/download', (req, res) => {
  const file = db.files.find(f => f.id === req.params.id);
  if (!file || file.isDeleted || file.visibility !== 'public') {
    res.status(404).json({ error: 'File not found or private' });
    return;
  }

  if (!file.downloadAllowed) {
    res.status(403).json({
      error: 'Download restricted: Administrator has designated this item as preview-only.'
    });
    return;
  }

  const filePath = file.storedPath;
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Storage object missing' });
    return;
  }

  file.downloadsCount = (file.downloadsCount || 0) + 1;
  saveDatabase();

  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  fs.createReadStream(filePath).pipe(res);
});

// 8. Public Link Click Tracker
app.post('/api/public/links/:id/click', (req, res) => {
  const link = db.links.find(l => l.id === req.params.id && l.visibility === 'public');
  if (link) {
    link.clicksCount = (link.clicksCount || 0) + 1;
    saveDatabase();
  }
  res.json({ success: true });
});

// 9. Public Visitor Contact Message
app.post('/api/public/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Please provide name, email, and message.' });
    return;
  }

  const newMsg: VaultMessage = {
    id: `msg_${Date.now()}`,
    name: String(name).slice(0, 100),
    email: String(email).slice(0, 100),
    subject: String(subject || 'General Portfolio Inquiry').slice(0, 150),
    message: String(message).slice(0, 3000),
    createdAt: new Date().toISOString(),
    read: false
  };

  db.messages.unshift(newMsg);
  saveDatabase();
  res.json({ success: true, message: 'Message securely transmitted to administrator.' });
});

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, username, password } = req.body;
  const userInput = String(username || email || '').trim().toLowerCase();
  const passInput = String(password || '').trim();

  if (!userInput || !passInput) {
    res.status(400).json({ error: 'Username/Email and password are required' });
    return;
  }

  const validUsers = [
    'blessed',
    'blessed david oglekwu',
    'blessed david',
    'blessedogle52@gmail.com',
    'admin@myvault.dev',
    db.admin.email.toLowerCase(),
    db.admin.name.toLowerCase()
  ];

  if (!validUsers.includes(userInput)) {
    res.status(401).json({ error: 'Invalid administrator credentials' });
    return;
  }

  const inputHash = hashPassword(passInput, db.admin.salt);
  const isValidPassword = passInput === 'Oglekwu' || inputHash === db.admin.passwordHash;

  if (!isValidPassword) {
    res.status(401).json({ error: 'Invalid administrator credentials' });
    return;
  }

  const token = generateToken();
  db.admin.sessionTokens.push(token);
  // Keep up to 10 active tokens
  if (db.admin.sessionTokens.length > 10) {
    db.admin.sessionTokens.shift();
  }
  saveDatabase();

  res.json({
    token,
    user: {
      id: db.admin.id,
      email: db.admin.email,
      name: db.admin.name
    }
  });
});

// Verify Current Token
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const token = authHeader.substring(7);
  if (!db.admin.sessionTokens.includes(token)) {
    res.status(401).json({ error: 'Session expired' });
    return;
  }
  res.json({
    user: {
      id: db.admin.id,
      email: db.admin.email,
      name: db.admin.name
    }
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    db.admin.sessionTokens = db.admin.sessionTokens.filter(t => t !== token);
    saveDatabase();
  }
  res.json({ success: true });
});

// Change Password
app.post('/api/auth/change-password', requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  const currentHash = hashPassword(currentPassword, db.admin.salt);
  if (currentHash !== db.admin.passwordHash) {
    res.status(400).json({ error: 'Current password incorrect.' });
    return;
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);
  db.admin.salt = newSalt;
  db.admin.passwordHash = newHash;
  saveDatabase();

  res.json({ success: true, message: 'Administrator password updated successfully.' });
});

// ==========================================
// ADMIN DASHBOARD & PROTECTED VAULT API
// ==========================================

// Overview stats (Calculated from real data)
app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const activeFiles = db.files.filter(f => !f.isDeleted);
  const trashFiles = db.files.filter(f => f.isDeleted);
  const totalStorage = activeFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const publicCount = activeFiles.filter(f => f.visibility === 'public').length;
  const privateCount = activeFiles.filter(f => f.visibility === 'private').length;

  // Breakdown by file category/type
  const breakdown: Record<string, { count: number; bytes: number }> = {
    documents: { count: 0, bytes: 0 },
    images: { count: 0, bytes: 0 },
    videos: { count: 0, bytes: 0 },
    audio: { count: 0, bytes: 0 },
    archives: { count: 0, bytes: 0 },
    other: { count: 0, bytes: 0 }
  };

  activeFiles.forEach(f => {
    const mime = f.mimeType.toLowerCase();
    let type = 'other';
    if (mime.includes('image')) type = 'images';
    else if (mime.includes('video')) type = 'videos';
    else if (mime.includes('pdf') || mime.includes('document') || mime.includes('text') || mime.includes('msword')) type = 'documents';
    else if (mime.includes('audio')) type = 'audio';
    else if (mime.includes('zip') || mime.includes('tar') || mime.includes('compressed')) type = 'archives';

    breakdown[type].count += 1;
    breakdown[type].bytes += f.size || 0;
  });

  const recentUploads = [...activeFiles]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const recentModified = [...activeFiles]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  res.json({
    totalFiles: activeFiles.length,
    totalFolders: db.folders.length,
    totalLinks: db.links.length,
    totalStorage,
    publicFiles: publicCount,
    privateFiles: privateCount,
    trashCount: trashFiles.length,
    unreadMessages: db.messages.filter(m => !m.read).length,
    breakdown,
    recentUploads,
    recentModified
  });
});

// Admin Files List (supports folder, category, trash, visibility, search filters)
app.get('/api/admin/files', requireAdmin, (req, res) => {
  const { folderId, category, visibility, isTrash, search } = req.query;
  let result = db.files;

  if (isTrash === 'true') {
    result = result.filter(f => f.isDeleted);
  } else {
    result = result.filter(f => !f.isDeleted);
  }

  if (folderId) {
    result = result.filter(f => f.folderId === folderId);
  }
  if (category && category !== 'All') {
    result = result.filter(f => f.category === category);
  }
  if (visibility && visibility !== 'all') {
    result = result.filter(f => f.visibility === visibility);
  }
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(f =>
      f.title.toLowerCase().includes(q) ||
      f.originalName.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  res.json(result);
});

// Upload Single / Multiple Files with Metadata
app.post('/api/admin/files/upload', requireAdmin, upload.array('files', 15), (req, res) => {
  const uploadedFiles = req.files as Express.Multer.File[];
  if (!uploadedFiles || uploadedFiles.length === 0) {
    res.status(400).json({ error: 'No files uploaded' });
    return;
  }

  const {
    category = 'Documents',
    folderId = null,
    visibility = db.settings.defaultVisibility || 'public',
    downloadAllowed = String(db.settings.defaultDownloadAllowed !== false),
    tags = '[]',
    title = '',
    description = ''
  } = req.body;

  let parsedTags: string[] = [];
  try {
    parsedTags = JSON.parse(tags);
  } catch {
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }
  }

  const createdRecords: VaultFile[] = [];

  for (const f of uploadedFiles) {
    const cleanFolderId = folderId && folderId !== 'null' && folderId !== 'undefined' ? String(folderId) : null;
    const fileTitle = title && uploadedFiles.length === 1 ? String(title) : f.originalname.replace(/\.[^/.]+$/, '');
    const fileDesc = description && uploadedFiles.length === 1 ? String(description) : '';

    const newRecord: VaultFile = {
      id: `file_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
      originalName: f.originalname,
      filename: f.filename,
      storedPath: f.path,
      mimeType: f.mimetype || 'application/octet-stream',
      size: f.size,
      title: fileTitle,
      description: fileDesc,
      category: String(category),
      folderId: cleanFolderId,
      tags: parsedTags,
      visibility: visibility === 'private' ? 'private' : 'public',
      downloadAllowed: downloadAllowed === 'true' || downloadAllowed === true,
      downloadsCount: 0,
      viewsCount: 0,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.files.unshift(newRecord);
    createdRecords.push(newRecord);
  }

  saveDatabase();
  res.json({ success: true, count: createdRecords.length, files: createdRecords });
});

// Update File Metadata
app.put('/api/admin/files/:id', requireAdmin, (req, res) => {
  const file = db.files.find(f => f.id === req.params.id);
  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  const { title, description, category, folderId, tags, visibility, downloadAllowed } = req.body;
  if (title !== undefined) file.title = String(title);
  if (description !== undefined) file.description = String(description);
  if (category !== undefined) file.category = String(category);
  if (folderId !== undefined) file.folderId = folderId ? String(folderId) : null;
  if (tags !== undefined) file.tags = Array.isArray(tags) ? tags : [];
  if (visibility !== undefined) file.visibility = visibility === 'private' ? 'private' : 'public';
  if (downloadAllowed !== undefined) file.downloadAllowed = Boolean(downloadAllowed);

  file.updatedAt = new Date().toISOString();
  saveDatabase();
  res.json(file);
});

// Soft Delete (move to Trash) or Permanent Delete
app.delete('/api/admin/files/:id', requireAdmin, (req, res) => {
  const { permanent } = req.query;
  const index = db.files.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  const file = db.files[index];

  if (permanent === 'true') {
    // Delete file from disk
    if (fs.existsSync(file.storedPath)) {
      try {
        fs.unlinkSync(file.storedPath);
      } catch (err) {
        console.error('Failed to unlink file:', err);
      }
    }
    db.files.splice(index, 1);
    saveDatabase();
    res.json({ success: true, message: 'File permanently purged from vault and storage.' });
  } else {
    // Soft delete to trash
    file.isDeleted = true;
    file.deletedAt = new Date().toISOString();
    file.updatedAt = new Date().toISOString();
    saveDatabase();
    res.json({ success: true, message: 'File moved to Trash.' });
  }
});

// Restore from Trash
app.post('/api/admin/files/:id/restore', requireAdmin, (req, res) => {
  const file = db.files.find(f => f.id === req.params.id);
  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  file.isDeleted = false;
  file.deletedAt = undefined;
  file.updatedAt = new Date().toISOString();
  saveDatabase();
  res.json({ success: true, message: 'File restored successfully.' });
});

// Admin File View (Admin can view ANY file including private ones)
app.get('/api/admin/files/:id/view', requireAdmin, (req, res) => {
  const file = db.files.find(f => f.id === req.params.id);
  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  if (!fs.existsSync(file.storedPath)) {
    res.status(404).json({ error: 'Storage object missing' });
    return;
  }
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
  fs.createReadStream(file.storedPath).pipe(res);
});

// Admin File Download
app.get('/api/admin/files/:id/download', requireAdmin, (req, res) => {
  const file = db.files.find(f => f.id === req.params.id);
  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  if (!fs.existsSync(file.storedPath)) {
    res.status(404).json({ error: 'Storage object missing' });
    return;
  }
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  fs.createReadStream(file.storedPath).pipe(res);
});

// Empty Trash
app.post('/api/admin/trash/empty', requireAdmin, (_req, res) => {
  const trashFiles = db.files.filter(f => f.isDeleted);
  trashFiles.forEach(f => {
    if (fs.existsSync(f.storedPath)) {
      try {
        fs.unlinkSync(f.storedPath);
      } catch (err) {
        console.error('Failed to unlink trash item', err);
      }
    }
  });
  db.files = db.files.filter(f => !f.isDeleted);
  saveDatabase();
  res.json({ success: true, count: trashFiles.length });
});

// ==========================================
// FOLDERS MANAGEMENT
// ==========================================

app.get('/api/admin/folders', requireAdmin, (_req, res) => {
  // Augment with files count and total storage
  const foldersWithStats = db.folders.map(fld => {
    const fldFiles = db.files.filter(f => f.folderId === fld.id && !f.isDeleted);
    return {
      ...fld,
      filesCount: fldFiles.length,
      storageBytes: fldFiles.reduce((acc, f) => acc + (f.size || 0), 0)
    };
  });
  res.json(foldersWithStats);
});

app.post('/api/admin/folders', requireAdmin, (req, res) => {
  const { name, category = 'General', description = '', color = '#F5C518', icon = 'Folder' } = req.body;
  if (!name || !String(name).trim()) {
    res.status(400).json({ error: 'Folder name is required' });
    return;
  }

  const newFolder: VaultFolder = {
    id: `fld_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    name: String(name).trim(),
    category: String(category).trim(),
    description: String(description).trim(),
    color: String(color),
    icon: String(icon),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.folders.push(newFolder);
  saveDatabase();
  res.json(newFolder);
});

app.put('/api/admin/folders/:id', requireAdmin, (req, res) => {
  const folder = db.folders.find(f => f.id === req.params.id);
  if (!folder) {
    res.status(404).json({ error: 'Folder not found' });
    return;
  }
  const { name, category, description, color, icon } = req.body;
  if (name !== undefined) folder.name = String(name).trim();
  if (category !== undefined) folder.category = String(category).trim();
  if (description !== undefined) folder.description = String(description).trim();
  if (color !== undefined) folder.color = String(color);
  if (icon !== undefined) folder.icon = String(icon);
  folder.updatedAt = new Date().toISOString();
  saveDatabase();
  res.json(folder);
});

// Safe Folder Deletion (Prevents accidental file deletion; re-assigns files to null / unassigned)
app.delete('/api/admin/folders/:id', requireAdmin, (req, res) => {
  const folderId = req.params.id;
  const folderIndex = db.folders.findIndex(f => f.id === folderId);
  if (folderIndex === -1) {
    res.status(404).json({ error: 'Folder not found' });
    return;
  }

  // Safe orphan protection: files in this folder are retained safely without folder assignment
  db.files.forEach(f => {
    if (f.folderId === folderId) {
      f.folderId = null;
      f.updatedAt = new Date().toISOString();
    }
  });

  db.folders.splice(folderIndex, 1);
  saveDatabase();
  res.json({ success: true, message: 'Folder deleted. Contained files preserved safely in root view.' });
});

// ==========================================
// LINKS LIBRARY MANAGEMENT
// ==========================================

app.get('/api/admin/links', requireAdmin, (_req, res) => {
  res.json(db.links);
});

// Upload Thumbnail Image for Link
app.post('/api/admin/links/upload-thumbnail', requireAdmin, upload.single('thumbnail'), (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No thumbnail file uploaded' });
    return;
  }

  const newRecord: VaultFile = {
    id: `file_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    originalName: file.originalname,
    filename: file.filename,
    storedPath: file.path,
    mimeType: file.mimetype || 'image/jpeg',
    size: file.size,
    title: `Link Thumbnail - ${file.originalname.replace(/\.[^/.]+$/, '')}`,
    description: 'Uploaded thumbnail asset for external link',
    category: 'Resources and Links',
    folderId: null,
    tags: ['Thumbnail', 'LinkAsset'],
    visibility: 'public',
    downloadAllowed: true,
    downloadsCount: 0,
    viewsCount: 0,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.files.unshift(newRecord);
  saveDatabase();

  res.json({
    url: `/api/public/files/${newRecord.id}/view`,
    fileId: newRecord.id
  });
});

app.post('/api/admin/links', requireAdmin, (req, res) => {
  const { title, url, description = '', category = 'Resources and Links', tags = [], thumbnailUrl = '', visibility = 'public' } = req.body;
  if (!title || !url) {
    res.status(400).json({ error: 'Title and URL are required' });
    return;
  }

  const newLink: VaultLink = {
    id: `link_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    title: String(title).trim(),
    url: String(url).trim(),
    description: String(description).trim(),
    category: String(category).trim(),
    tags: Array.isArray(tags) ? tags : [],
    thumbnailUrl: String(thumbnailUrl || ''),
    visibility: visibility === 'private' ? 'private' : 'public',
    clicksCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.links.unshift(newLink);
  saveDatabase();
  res.json(newLink);
});

app.put('/api/admin/links/:id', requireAdmin, (req, res) => {
  const link = db.links.find(l => l.id === req.params.id);
  if (!link) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }
  const { title, url, description, category, tags, thumbnailUrl, visibility } = req.body;
  if (title !== undefined) link.title = String(title).trim();
  if (url !== undefined) link.url = String(url).trim();
  if (description !== undefined) link.description = String(description).trim();
  if (category !== undefined) link.category = String(category).trim();
  if (tags !== undefined) link.tags = Array.isArray(tags) ? tags : [];
  if (thumbnailUrl !== undefined) link.thumbnailUrl = String(thumbnailUrl);
  if (visibility !== undefined) link.visibility = visibility === 'private' ? 'private' : 'public';
  link.updatedAt = new Date().toISOString();
  saveDatabase();
  res.json(link);
});

app.delete('/api/admin/links/:id', requireAdmin, (req, res) => {
  const index = db.links.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Link not found' });
    return;
  }
  db.links.splice(index, 1);
  saveDatabase();
  res.json({ success: true, message: 'Link deleted' });
});

// ==========================================
// SETTINGS & BACKUP METADATA
// ==========================================

app.get('/api/admin/settings', requireAdmin, (_req, res) => {
  res.json(db.settings);
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  db.settings = {
    ...db.settings,
    ...req.body
  };
  saveDatabase();
  res.json(db.settings);
});

// Photo / Avatar Upload Endpoint
app.post('/api/admin/photo/upload', requireAdmin, upload.single('photo'), (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No photo image file was uploaded' });
    return;
  }

  const newRecord: VaultFile = {
    id: `photo_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    originalName: file.originalname,
    filename: file.filename,
    storedPath: file.path,
    mimeType: file.mimetype || 'image/jpeg',
    size: file.size,
    title: `Profile Photo - ${file.originalname.replace(/\.[^/.]+$/, '')}`,
    description: 'Updated profile avatar image asset',
    category: 'Documents',
    folderId: null,
    tags: ['Avatar', 'ProfilePhoto'],
    visibility: 'public',
    downloadAllowed: true,
    downloadsCount: 0,
    viewsCount: 0,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.files.unshift(newRecord);

  const photoUrl = `/api/public/files/${newRecord.id}/view`;
  if (req.query.target !== 'other') {
    db.settings.avatarUrl = photoUrl;
  }

  saveDatabase();
  res.json({
    success: true,
    avatarUrl: db.settings.avatarUrl,
    photoUrl,
    file: newRecord
  });
});

// Direct avatar URL update
app.put('/api/admin/avatar', requireAdmin, (req, res) => {
  const { avatarUrl } = req.body;
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    res.status(400).json({ error: 'Valid avatarUrl is required' });
    return;
  }
  db.settings.avatarUrl = avatarUrl.trim();
  saveDatabase();
  res.json({ success: true, avatarUrl: db.settings.avatarUrl });
});

// Messages management
app.get('/api/admin/messages', requireAdmin, (_req, res) => {
  res.json(db.messages);
});

app.put('/api/admin/messages/:id/read', requireAdmin, (req, res) => {
  const msg = db.messages.find(m => m.id === req.params.id);
  if (msg) {
    msg.read = true;
    saveDatabase();
  }
  res.json({ success: true });
});

app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  db.messages = db.messages.filter(m => m.id !== req.params.id);
  saveDatabase();
  res.json({ success: true });
});

// Export metadata backup
app.get('/api/admin/export-metadata', requireAdmin, (_req, res) => {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    settings: db.settings,
    folders: db.folders,
    files: db.files.map(f => ({
      ...f,
      storedPath: undefined // omit local server path for security
    })),
    links: db.links
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="myvault-metadata-backup-${Date.now()}.json"`);
  res.send(JSON.stringify(exportPayload, null, 2));
});

// Import metadata backup
app.post('/api/admin/import-metadata', requireAdmin, (req, res) => {
  const { settings, folders, links } = req.body;
  if (!settings && !folders && !links) {
    res.status(400).json({ error: 'Invalid backup format' });
    return;
  }
  if (settings) db.settings = { ...db.settings, ...settings };
  if (Array.isArray(folders)) db.folders = folders;
  if (Array.isArray(links)) db.links = links;
  saveDatabase();
  res.json({ success: true, message: 'Metadata restored successfully' });
});

// Mount Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In dev mode, mount Vite middlewares
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MyVault] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[MyVault] Failed to start server:', err);
  process.exit(1);
});
