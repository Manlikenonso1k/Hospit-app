import type { StatusColour } from '@/theme/colors';

export type Department =
  | 'main_kitchen'
  | 'grill_kitchen'
  | 'barbecue'
  | 'ice_cream'
  | 'gate_sales'
  | 'hosts'
  | 'front_desk';

export type Me = {
  user: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    department: string | null;
    roles: string[];
  };
  tenant: {
    id: number;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_colour: string;
    enabled_departments: Department[];
    timezone: string;
  } | null;
  prices: {
    gate_ticket: number;
    per_head: number;
    swimming_per_head: number;
  };
};

export type Meal = {
  id: number;
  department: Department;
  name: string;
  category: string | null;
  price: number; // kobo
  prep_time_minutes: number;
  is_available: boolean;
  image_url: string | null;
};

export type OrderItem = {
  id: number;
  meal_id: number;
  name: string;
  unit_price: number; // kobo
  quantity: number;
  prep_time_minutes: number;
  notes: string | null;
};

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type Order = {
  id: number;
  department: Department;
  status: OrderStatus;
  status_colour: StatusColour;
  table_id: number | null;
  guest_ref: string | null;
  placed_by?: string | null;
  chef?: string | null;
  placed_at: string | null;
  target_minutes: number;
  due_at: string | null;
  accepted_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  last_nudged_at: string | null;
  expedited_at: string | null;
  total_amount: number; // kobo
  seconds_remaining: number;
  server_time: string;
  items?: OrderItem[];
};

export type Collection<T> = {
  data: T[];
  server_time?: string;
};
