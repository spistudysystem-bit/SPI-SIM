export interface AdminMediaItem {
  id: string;
  title: string;
  description: string;
  category: string;
  module: string; // matches target viewMode like 'probe', 'doppler', 'imaging', 'artifacts', 'safety', 'library'
  url: string;    // Base64 string or Web URL
  mediaType: 'image' | 'video';
  uploadedAt: string;
}

export interface SystemUser {
  username: string;
  role: 'admin' | 'regular';
  createdAt: string;
}

const DEFAULT_USERS: SystemUser[] = [
  { username: 'admin', role: 'admin', createdAt: '2026-05-31T12:00:00Z' },
  { username: 'staff_john', role: 'regular', createdAt: '2026-05-31T12:00:00Z' }
];

// Initialize default users if not present
export function initializeAdminSystem() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('sonicbuild_system_users')) {
    localStorage.setItem('sonicbuild_system_users', JSON.stringify(DEFAULT_USERS));
  }
}

// Get all custom media
export function getAdminMedia(): AdminMediaItem[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('sonicbuild_admin_media');
  return saved ? JSON.parse(saved) : [];
}

// Get media specifically attached to a module
export function getAdminMediaForModule(module: string): AdminMediaItem[] {
  return getAdminMedia().filter(item => item.module === module);
}

// Save media
export function saveAdminMedia(items: AdminMediaItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sonicbuild_admin_media', JSON.stringify(items));
}

// Get all users
export function getSystemUsers(): SystemUser[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  const saved = localStorage.getItem('sonicbuild_system_users');
  return saved ? JSON.parse(saved) : DEFAULT_USERS;
}

// Save system users
export function saveSystemUsers(users: SystemUser[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sonicbuild_system_users', JSON.stringify(users));
}
