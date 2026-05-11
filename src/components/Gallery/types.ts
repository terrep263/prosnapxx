export interface GalleryItem {
  id: string;
  url: string;
  filename?: string;
  alt?: string;
  title?: string;
  description?: string;
  type?: 'header' | 'profile' | 'photo' | 'video';
  created_at?: string;
  uploadedAt?: string;
  isVideo?: boolean;
  duration?: number;
  size?: number;
  width?: number;
  height?: number;
  thumb?: string;
  poster?: string;
  thumbnail_url?: string;
  storage_url?: string;
  mimeType?: string;
}

export type LayoutType = 'masonry' | 'grid';
export type ViewMode = 'public' | 'owner' | 'admin';
export type PackageType = 'basic' | 'premium' | 'freebie';

export interface GalleryPermissions {
  canUpload: boolean;
  canDelete: boolean;
  canManage: boolean;
  canBulkDownload: boolean;
}

export interface GalleryProps {
  items: GalleryItem[];
  eventName?: string;
  eventSlug?: string;
  eventId?: string;
  headerImage?: string;
  profileImage?: string;
  viewMode?: ViewMode;
  packageType?: PackageType;
  layout?: LayoutType;
  showHeader?: boolean;
  onDownload?: (item: GalleryItem) => void;
  onDelete?: (itemId: string) => void;
}

export interface LightboxProps {
  items: GalleryItem[];
  open: boolean;
  index: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
  eventName?: string;
}
