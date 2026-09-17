import type { UserAccount, PermissionResource, PermissionAction, AdminPermissions } from '../types';

export interface ResourceDefinition {
  id: PermissionResource;
  nameUz: string;
  descriptionUz: string;
  availableActions: PermissionAction[];
}

export const PERMISSION_RESOURCES: ResourceDefinition[] = [
  {
    id: 'dashboard',
    nameUz: 'Dashboard / Bosh sahifa',
    descriptionUz: 'Umumiy hisobot va tezkor boshqaruv paneli',
    availableActions: ['view'],
  },
  {
    id: 'students',
    nameUz: 'Talabalar',
    descriptionUz: 'Talabalar profili, paroli, ma’lumotlarini boshqarish',
    availableActions: ['view', 'create', 'edit', 'delete', 'export'],
  },
  {
    id: 'supervisors',
    nameUz: 'Ilmiy rahbarlar',
    descriptionUz: 'Ilmiy rahbarlar profili va biriktirilgan talabalar',
    availableActions: ['view', 'create', 'edit', 'delete', 'export'],
  },
  {
    id: 'projects',
    nameUz: 'Ilmiy loyihalar',
    descriptionUz: 'Talabalar ilmiy-tadqiqot loyihalari',
    availableActions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  {
    id: 'startups',
    nameUz: 'Startap tashabbuslari',
    descriptionUz: 'Startap va innovatsion ishlanmalar',
    availableActions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  {
    id: 'achievements',
    nameUz: 'Talabalar yutuqlari',
    descriptionUz: 'Olimpiada, tanlov va stipendiyalar',
    availableActions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  {
    id: 'certificates',
    nameUz: 'Diplom va Sertifikatlar',
    descriptionUz: 'Sertifikat berish, tahrirlash, bekor qilish va QR verifikatsiya',
    availableActions: ['view', 'create', 'edit', 'delete', 'export'],
  },
  {
    id: 'events',
    nameUz: 'Tadbirlar va anjumanlar',
    descriptionUz: 'Universitet tadbirlari va ishtirokchilar ro‘yxati',
    availableActions: ['view', 'create', 'edit', 'delete', 'export'],
  },
  {
    id: 'competitions',
    nameUz: 'Tanlovlar va musobaqalar',
    descriptionUz: 'Grant va tanlov arizalarini ko‘rish hamda baholash',
    availableActions: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  {
    id: 'announcements',
    nameUz: 'E’lonlar va xabarnomalar',
    descriptionUz: 'Talabalar va rahbarlar uchun e’lonlar chiqarish',
    availableActions: ['view', 'create', 'edit', 'delete'],
  },
  {
    id: 'statistics',
    nameUz: 'Statistika va tahlil',
    descriptionUz: '18 ta ta’lim yo‘nalishi bo‘yicha chuqur ko‘rsatkichlar',
    availableActions: ['view', 'export'],
  },
  {
    id: 'excel',
    nameUz: 'Excel ma’lumotlarni yuklab olish',
    descriptionUz: 'Barcha reestr va ro‘yxatlarni Excel fayl shaklida yuklash',
    availableActions: ['view', 'export'],
  },
  {
    id: 'portfolio',
    nameUz: 'Iqtidorli talaba portfoliosi',
    descriptionUz: 'Talabaning jamlangan elektron portfoliosini ko‘rish',
    availableActions: ['view', 'export'],
  },
  {
    id: 'notifications',
    nameUz: 'Tizimli bildirishnomalar',
    descriptionUz: 'Ichki tizim bildirishnomalarini boshqarish',
    availableActions: ['view', 'create', 'delete'],
  },
  {
    id: 'admins',
    nameUz: 'Adminlarni boshqarish',
    descriptionUz: 'Yangi admin qo‘shish, ruxsatlar berish va parolini yangilash (Super Admin)',
    availableActions: ['view', 'create', 'edit', 'delete'],
  },
  {
    id: 'audit_logs',
    nameUz: 'Audit jurnali (Xavfsizlik)',
    descriptionUz: 'Tizimda bajarilgan harakatlar tarixi va xavfsizlik loglari',
    availableActions: ['view', 'export'],
  },
  {
    id: 'trash',
    nameUz: 'Chiqindilar qutisi (Trash)',
    descriptionUz: 'Soft-delete qilingan yozuvlarni tiklash yoki butunlay tozalash',
    availableActions: ['view', 'edit', 'delete'],
  },
  {
    id: 'settings',
    nameUz: 'Tizim sozlamalari',
    descriptionUz: 'Universitet va platforma parametrlari',
    availableActions: ['view', 'edit'],
  },
];

export const ACTION_NAMES_UZ: Record<PermissionAction, string> = {
  view: 'Ko‘rish',
  create: 'Qo‘shish',
  edit: 'Tahrirlash',
  delete: 'O‘chirish',
  approve: 'Tasdiqlash/Rad etish',
  export: 'Excel eksport',
};

/**
 * Checks whether user has permission to perform action on resource.
 * Super Admin has unconditional full access to everything.
 */
export function hasPermission(
  user: UserAccount | null | undefined,
  resource: PermissionResource,
  action: PermissionAction = 'view'
): boolean {
  if (!user || !user.isActive || user.isDeleted) return false;

  // Super Admin has ALL permissions always
  if (user.role === 'superAdmin') return true;

  // Normal admin permissions check
  if (user.role === 'admin') {
    // Admins management, Audit logs delete, and Trash permanent delete are strictly Super Admin only
    if (resource === 'admins' && (action === 'create' || action === 'delete' || action === 'edit')) {
      return false;
    }
    if (resource === 'trash' && action === 'delete') {
      return false; // Only Super Admin can permanent delete
    }

    // Check custom permissions if configured on the user
    if (user.permissions !== undefined && user.permissions !== null) {
      const resPerms = user.permissions[resource];
      const hasDirect = !!resPerms?.[action];
      if (hasDirect) return true;

      // If checking export action, also allow if global 'excel' export is granted
      if (action === 'export' && !!user.permissions['excel']?.export) {
        return true;
      }

      // If checking view action, grant access if user has any action permitted on this resource
      if (action === 'view') {
        if (resPerms && Object.values(resPerms).some(Boolean)) return true;
        if (resource === 'statistics' && !!user.permissions['dashboard']?.view) return true;
        if (resource === 'dashboard' && !!user.permissions['statistics']?.view) return true;
      }

      return false;
    }

    // Default fallback permissions ONLY for legacy admin accounts where permissions object was never configured:
    if (action === 'view') return true;
    if (['projects', 'startups', 'achievements', 'certificates', 'events', 'announcements'].includes(resource)) {
      if (['create', 'edit', 'approve', 'export'].includes(action)) return true;
    }
    if (['students', 'supervisors'].includes(resource)) {
      if (['edit', 'export'].includes(action)) return true;
    }
    return false;
  }

  return false;
}

/**
 * Standard complete permission preset for full Admin
 */
export function getFullAdminPermissions(): AdminPermissions {
  const perms: AdminPermissions = {};
  PERMISSION_RESOURCES.forEach(res => {
    // Exclude admins and trash delete for regular admins
    perms[res.id] = {};
    res.availableActions.forEach(act => {
      if (res.id === 'admins' && (act === 'create' || act === 'delete' || act === 'edit')) {
        perms[res.id]![act] = false;
      } else if (res.id === 'trash' && act === 'delete') {
        perms[res.id]![act] = false;
      } else {
        perms[res.id]![act] = true;
      }
    });
  });
  return perms;
}

/**
 * Standard read-only permission preset
 */
export function getReadOnlyPermissions(): AdminPermissions {
  const perms: AdminPermissions = {};
  PERMISSION_RESOURCES.forEach(res => {
    perms[res.id] = { view: true };
  });
  return perms;
}
