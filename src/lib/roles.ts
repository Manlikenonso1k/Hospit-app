import type { Department } from '@/api/types';

/**
 * Role is assigned by the business and delivered in /api/me — the user never
 * picks it. This maps the seeded role names to the home each lands on. Order
 * matters: the most privileged matching role wins.
 */
export type HomeKind = 'manager' | 'ceo' | 'waitress' | 'chef' | 'host';

export function homeForRoles(roles: string[]): HomeKind {
  if (roles.includes('Manager') || roles.includes('Super Admin') || roles.includes('Admin')) {
    return 'manager';
  }
  if (roles.includes('CEO')) return 'ceo';
  if (roles.includes('Chef')) return 'chef';
  if (roles.includes('Host') || roles.includes('Front Desk')) return 'host';
  return 'waitress'; // Waiter and any floor role
}

export const HOME_ROUTE: Record<HomeKind, string> = {
  manager: '/(app)/board',
  ceo: '/(app)/revenue',
  waitress: '/(app)/order',
  chef: '/(app)/kitchen',
  host: '/(app)/hosts',
};

/** Human label for a department key. */
export function departmentLabel(dept: Department | string): string {
  const map: Record<string, string> = {
    main_kitchen: 'Main Kitchen',
    barbecue: 'Barbecue',
    ice_cream: 'Ice Cream',
    gate_sales: 'Gate Sales',
    hosts: 'Hosts',
    front_desk: 'Front Desk',
  };
  return map[dept] ?? dept;
}
