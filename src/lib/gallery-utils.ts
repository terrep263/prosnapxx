import { PackageType, ViewMode, GalleryPermissions } from '@/components/Gallery/types';

export interface EventData {
  id: string;
  name: string;
  slug: string;
  package?: string | null;
  header_image?: string | null;
  profile_image?: string | null;
  is_freebie?: boolean;
  is_free?: boolean;
  payment_type?: string | null;
  feed_enabled?: boolean;
  password_hash?: string | null;
  owner_email?: string | null;
  owner_id?: string | null;
  watermark_enabled?: boolean;
  max_storage_bytes?: number | null;
  max_photos?: number | null;
  // Whitelabel extras
  tenant_primary_color?: string;
  tenant_logo_url?: string | null;
  tenant_name?: string;
}

export function getPackageType(event: EventData): PackageType {
  if (event.package === 'premium') return 'premium';
  if (event.package === 'freebie') return 'freebie';
  if (event.package === 'basic') return 'basic';
  if (event.is_freebie === true || event.payment_type === 'freebie') return 'freebie';
  if (event.feed_enabled === true || event.password_hash) return 'premium';
  return 'basic';
}

export function getViewMode(event: EventData, userEmail?: string | null): ViewMode {
  if (typeof window !== 'undefined') {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        if (session.isAuthenticated) return 'admin';
      } catch {}
    }
  }
  if (userEmail && event.owner_email) {
    if (userEmail.toLowerCase() === event.owner_email.toLowerCase()) return 'owner';
  }
  return 'public';
}

export function getGalleryPermissions(packageType: PackageType, viewMode: ViewMode): GalleryPermissions {
  const isOwnerOrAdmin = viewMode === 'owner' || viewMode === 'admin';
  return {
    canUpload: true,
    canDelete: isOwnerOrAdmin,
    canManage: isOwnerOrAdmin,
    canBulkDownload: packageType === 'premium',
  };
}
