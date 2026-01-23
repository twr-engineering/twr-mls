

export type SupportedTimezones =
  | 'Pacific/Midway'
  | 'Pacific/Niue'
  | 'Pacific/Honolulu'
  | 'Pacific/Rarotonga'
  | 'America/Anchorage'
  | 'Pacific/Gambier'
  | 'America/Los_Angeles'
  | 'America/Tijuana'
  | 'America/Denver'
  | 'America/Phoenix'
  | 'America/Chicago'
  | 'America/Guatemala'
  | 'America/New_York'
  | 'America/Bogota'
  | 'America/Caracas'
  | 'America/Santiago'
  | 'America/Buenos_Aires'
  | 'America/Sao_Paulo'
  | 'Atlantic/South_Georgia'
  | 'Atlantic/Azores'
  | 'Atlantic/Cape_Verde'
  | 'Europe/London'
  | 'Europe/Berlin'
  | 'Africa/Lagos'
  | 'Europe/Athens'
  | 'Africa/Cairo'
  | 'Europe/Moscow'
  | 'Asia/Riyadh'
  | 'Asia/Dubai'
  | 'Asia/Baku'
  | 'Asia/Karachi'
  | 'Asia/Tashkent'
  | 'Asia/Calcutta'
  | 'Asia/Dhaka'
  | 'Asia/Almaty'
  | 'Asia/Jakarta'
  | 'Asia/Bangkok'
  | 'Asia/Shanghai'
  | 'Asia/Singapore'
  | 'Asia/Tokyo'
  | 'Asia/Seoul'
  | 'Australia/Brisbane'
  | 'Australia/Sydney'
  | 'Pacific/Guam'
  | 'Pacific/Noumea'
  | 'Pacific/Auckland'
  | 'Pacific/Fiji';

export interface Config {
  auth: {
    users: UserAuthOperations;
  };
  blocks: {};
  collections: {
    users: User;
    media: Media;
    cities: City;
    barangays: Barangay;
    developments: Development;
    estates: Estate;
    townships: Township;
    listings: Listing;
    documents: Document;
    notifications: Notification;
    'external-share-links': ExternalShareLink;
    'payload-kv': PayloadKv;
    'payload-locked-documents': PayloadLockedDocument;
    'payload-preferences': PayloadPreference;
    'payload-migrations': PayloadMigration;
  };
  collectionsJoins: {};
  collectionsSelect: {
    users: UsersSelect<false> | UsersSelect<true>;
    media: MediaSelect<false> | MediaSelect<true>;
    cities: CitiesSelect<false> | CitiesSelect<true>;
    barangays: BarangaysSelect<false> | BarangaysSelect<true>;
    developments: DevelopmentsSelect<false> | DevelopmentsSelect<true>;
    estates: EstatesSelect<false> | EstatesSelect<true>;
    townships: TownshipsSelect<false> | TownshipsSelect<true>;
    listings: ListingsSelect<false> | ListingsSelect<true>;
    documents: DocumentsSelect<false> | DocumentsSelect<true>;
    notifications: NotificationsSelect<false> | NotificationsSelect<true>;
    'external-share-links': ExternalShareLinksSelect<false> | ExternalShareLinksSelect<true>;
    'payload-kv': PayloadKvSelect<false> | PayloadKvSelect<true>;
    'payload-locked-documents': PayloadLockedDocumentsSelect<false> | PayloadLockedDocumentsSelect<true>;
    'payload-preferences': PayloadPreferencesSelect<false> | PayloadPreferencesSelect<true>;
    'payload-migrations': PayloadMigrationsSelect<false> | PayloadMigrationsSelect<true>;
  };
  db: {
    defaultIDType: number;
  };
  fallbackLocale: null;
  globals: {};
  globalsSelect: {};
  locale: null;
  user: User & {
    collection: 'users';
  };
  jobs: {
    tasks: unknown;
    workflows: unknown;
  };
}
export interface UserAuthOperations {
  forgotPassword: {
    email: string;
    password: string;
  };
  login: {
    email: string;
    password: string;
  };
  registerFirstUser: {
    email: string;
    password: string;
  };
  unlock: {
    email: string;
    password: string;
  };
}

export interface User {
  id: number;

  role: 'agent' | 'approver' | 'admin';
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;

  isActive?: boolean | null;
  updatedAt: string;
  createdAt: string;
  email: string;
  resetPasswordToken?: string | null;
  resetPasswordExpiration?: string | null;
  salt?: string | null;
  hash?: string | null;
  loginAttempts?: number | null;
  lockUntil?: string | null;
  sessions?:
    | {
        id: string;
        createdAt?: string | null;
        expiresAt: string;
      }[]
    | null;
  password?: string | null;
}

export interface Media {
  id: number;

  alt: string;

  uploadedBy?: (number | null) | User;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
}

export interface City {
  id: number;
  name: string;

  slug: string;

  isActive?: boolean | null;
  updatedAt: string;
  createdAt: string;
}

export interface Barangay {
  id: number;
  name: string;

  city: number | City;

  slug: string;

  isActive?: boolean | null;
  updatedAt: string;
  createdAt: string;
}

export interface Development {
  id: number;
  name: string;

  barangay: number | Barangay;

  primaryEstate?: (number | null) | Estate;

  slug: string;

  isActive?: boolean | null;
  updatedAt: string;
  createdAt: string;
}

export interface Estate {
  id: number;
  name: string;

  slug: string;

  includedDevelopments: (number | Development)[];

  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface Township {
  id: number;
  name: string;

  slug: string;

  coveredBarangays: (number | Barangay)[];

  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface Listing {
  id: number;
  title: string;

  description?: {
    root: {
      type: string;
      children: {
        type: any;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;

  listingType: 'resale' | 'preselling';

  createdBy?: (number | null) | User;
  status: 'draft' | 'submitted' | 'needs_revision' | 'published' | 'rejected';
  transactionType: 'sale' | 'rent';
  price: number;

  pricePerSqm?: number | null;

  floorAreaSqm?: number | null;

  lotAreaSqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parkingSlots?: number | null;
  furnishing?: ('unfurnished' | 'semi_furnished' | 'fully_furnished') | null;
  constructionYear?: number | null;
  tenure?: ('freehold' | 'leasehold') | null;
  titleStatus?: ('clean' | 'mortgaged') | null;
  paymentTerms?: ('cash' | 'bank' | 'pagibig' | 'deferred')[] | null;

  city: number | City;

  barangay: number | Barangay;

  development?: (number | null) | Development;

  township?: (number | null) | Township;

  estate?: (number | null) | Estate;

  fullAddress: string;

  images?: (number | Media)[] | null;

  modelName?: string | null;

  indicativePriceMin?: number | null;

  indicativePriceMax?: number | null;
  minLotArea?: number | null;
  minFloorArea?: number | null;

  standardInclusions?: {
    root: {
      type: string;
      children: {
        type: any;
        version: number;
        [k: string]: unknown;
      }[];
      direction: ('ltr' | 'rtl') | null;
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
      indent: number;
      version: number;
    };
    [k: string]: unknown;
  } | null;

  presellingNotes?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Document {
  id: number;

  type:
    | 'title'
    | 'tax_declaration'
    | 'contract'
    | 'floor_plan'
    | 'site_plan'
    | 'photo_id'
    | 'proof_of_billing'
    | 'other';

  file: number | Media;

  listing: number | Listing;
  notes?: string | null;

  visibility: 'private' | 'internal';

  uploadedBy?: (number | null) | User;
  uploadedAt?: string | null;

  verified?: boolean | null;

  verifiedBy?: (number | null) | User;
  verifiedAt?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Notification {
  id: number;

  type: 'listing_published' | 'listing_needs_revision' | 'listing_rejected' | 'listing_submitted';

  message: string;

  recipient: number | User;

  listing?: (number | null) | Listing;

  read?: boolean | null;

  readAt?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface ExternalShareLink {
  id: number;

  token: string;

  listing: number | Listing;

  createdBy: number | User;

  expiresAt?: string | null;

  isActive?: boolean | null;

  viewCount?: number | null;

  lastViewedAt?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface PayloadKv {
  id: number;
  key: string;
  data:
    | {
        [k: string]: unknown;
      }
    | unknown[]
    | string
    | number
    | boolean
    | null;
}

export interface PayloadLockedDocument {
  id: number;
  document?:
    | ({
        relationTo: 'users';
        value: number | User;
      } | null)
    | ({
        relationTo: 'media';
        value: number | Media;
      } | null)
    | ({
        relationTo: 'cities';
        value: number | City;
      } | null)
    | ({
        relationTo: 'barangays';
        value: number | Barangay;
      } | null)
    | ({
        relationTo: 'developments';
        value: number | Development;
      } | null)
    | ({
        relationTo: 'estates';
        value: number | Estate;
      } | null)
    | ({
        relationTo: 'townships';
        value: number | Township;
      } | null)
    | ({
        relationTo: 'listings';
        value: number | Listing;
      } | null)
    | ({
        relationTo: 'documents';
        value: number | Document;
      } | null)
    | ({
        relationTo: 'notifications';
        value: number | Notification;
      } | null)
    | ({
        relationTo: 'external-share-links';
        value: number | ExternalShareLink;
      } | null);
  globalSlug?: string | null;
  user: {
    relationTo: 'users';
    value: number | User;
  };
  updatedAt: string;
  createdAt: string;
}

export interface PayloadPreference {
  id: number;
  user: {
    relationTo: 'users';
    value: number | User;
  };
  key?: string | null;
  value?:
    | {
        [k: string]: unknown;
      }
    | unknown[]
    | string
    | number
    | boolean
    | null;
  updatedAt: string;
  createdAt: string;
}

export interface PayloadMigration {
  id: number;
  name?: string | null;
  batch?: number | null;
  updatedAt: string;
  createdAt: string;
}

export interface UsersSelect<T extends boolean = true> {
  role?: T;
  firstName?: T;
  lastName?: T;
  phone?: T;
  isActive?: T;
  updatedAt?: T;
  createdAt?: T;
  email?: T;
  resetPasswordToken?: T;
  resetPasswordExpiration?: T;
  salt?: T;
  hash?: T;
  loginAttempts?: T;
  lockUntil?: T;
  sessions?:
    | T
    | {
        id?: T;
        createdAt?: T;
        expiresAt?: T;
      };
}

export interface MediaSelect<T extends boolean = true> {
  alt?: T;
  uploadedBy?: T;
  updatedAt?: T;
  createdAt?: T;
  url?: T;
  thumbnailURL?: T;
  filename?: T;
  mimeType?: T;
  filesize?: T;
  width?: T;
  height?: T;
  focalX?: T;
  focalY?: T;
}

export interface CitiesSelect<T extends boolean = true> {
  name?: T;
  slug?: T;
  isActive?: T;
  updatedAt?: T;
  createdAt?: T;
}

export interface BarangaysSelect<T extends boolean = true> {
  name?: T;
  city?: T;
  slug?: T;
  isActive?: T;
  updatedAt?: T;
  createdAt?: T;
}

export interface DevelopmentsSelect<T extends boolean = true> {
  name?: T;
  barangay?: T;
  primaryEstate?: T;
  slug?: T;
  isActive?: T;
  updatedAt?: T;
  createdAt?: T;
}

export interface EstatesSelect<T extends boolean = true> {
  name?: T;
  slug?: T;
  includedDevelopments?: T;
  isActive?: T;
  updatedAt?: T;
  createdAt?: T;
}

export interface TownshipsSelect<T extends boolean = true> {
  name?: T;
  slug?: T;
  coveredBarangays?: T;
  isActive?: T;
  updatedAt?: T;
  createdAt?: T;
}

export interface ListingsSelect<T extends boolean = true> {
  title?: T;
  description?: T;
  listingType?: T;
  createdBy?: T;
  status?: T;
  transactionType?: T;
  price?: T;
  pricePerSqm?: T;
  floorAreaSqm?: T;
  lotAreaSqm?: T;
  bedrooms?: T;
  bathrooms?: T;
  parkingSlots?: T;
  furnishing?: T;
  constructionYear?: T;
  tenure?: T;
  titleStatus?: T;
  paymentTerms?: T;
  city?: T;
  barangay?: T;
  development?: T;
  township?: T;
  estate?: T;
  fullAddress?: T;
  images?: T;
  modelName?: T;
  indicativePriceMin?: T;
  indicativePriceMax?: T;
  minLotArea?: T;
  minFloorArea?: T;
  standardInclusions?: T;
  presellingNotes?: T;
  updatedAt?: T;
  createdAt?: T;
}

export interface DocumentsSelect<T extends boolean = true> {
  type?: T;
  file?: T;
  listing?: T;
  notes?: T;
  visibility?: T;
  uploadedBy?: T;
  uploadedAt?: T;
  verified?: T;
  verifiedBy?: T;
  verifiedAt?: T;
  updatedAt?: T;
  createdAt?: T;
}

export interface NotificationsSelect<T extends boolean = true> {
  type?: T;
  message?: T;
  recipient?: T;
  listing?: T;
  read?: T;
  readAt?: T;
  updatedAt?: T;
  createdAt?: T;
}

export interface ExternalShareLinksSelect<T extends boolean = true> {
  token?: T;
  listing?: T;
  createdBy?: T;
  expiresAt?: T;
  isActive?: T;
  viewCount?: T;
  lastViewedAt?: T;
  updatedAt?: T;
  createdAt?: T;
}

export interface PayloadKvSelect<T extends boolean = true> {
  key?: T;
  data?: T;
}

export interface PayloadLockedDocumentsSelect<T extends boolean = true> {
  document?: T;
  globalSlug?: T;
  user?: T;
  updatedAt?: T;
  createdAt?: T;
}

export interface PayloadPreferencesSelect<T extends boolean = true> {
  user?: T;
  key?: T;
  value?: T;
  updatedAt?: T;
  createdAt?: T;
}

export interface PayloadMigrationsSelect<T extends boolean = true> {
  name?: T;
  batch?: T;
  updatedAt?: T;
  createdAt?: T;
}

export interface Auth {
  [k: string]: unknown;
}

declare module 'payload' {
  export interface GeneratedTypes extends Config {}
}