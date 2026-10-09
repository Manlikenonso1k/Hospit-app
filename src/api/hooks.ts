import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { Collection, Me, Meal, Order, OrderStatus, RevenueDashboard, RevenuePeriod } from './types';

/** Polling cadences from the brief — server owns time; polling drives the view. */
export const POLL = {
  managerBoard: 10_000,
  chefQueue: 10_000,
  waitressList: 30_000,
  ceoDashboard: 60_000,
} as const;

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<Me>('/me'),
    staleTime: 5 * 60_000,
  });
}

export function useMeals(department?: string) {
  return useQuery({
    queryKey: ['meals', department ?? 'all'],
    queryFn: () =>
      apiFetch<Collection<Meal>>(
        `/meals${department ? `?department=${encodeURIComponent(department)}` : ''}`,
      ),
    enabled: department !== undefined,
  });
}

/** Manager catalogue — includes unavailable meals for menu management. */
export function useManagedMeals(department?: string) {
  const qs = new URLSearchParams({ include_unavailable: '1' });
  if (department) qs.set('department', department);
  return useQuery({
    queryKey: ['meals', 'manage', department ?? 'all'],
    queryFn: () => apiFetch<Collection<Meal>>(`/meals?${qs.toString()}`),
  });
}

type MealInput = {
  department?: string;
  name?: string;
  category?: string | null;
  price_naira?: number;
  prep_time_minutes?: number;
  is_available?: boolean;
};

export function useCreateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MealInput) => apiFetch<{ data: Meal }>('/meals', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  });
}

export function useUpdateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: MealInput & { id: number }) =>
      apiFetch<{ data: Meal }>(`/meals/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  });
}

export function useUploadMealImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, image_base64, mime }: { id: number; image_base64: string; mime: string }) =>
      apiFetch<{ data: Meal }>(`/meals/${id}/image`, { method: 'POST', body: { image_base64, mime } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals'] }),
  });
}

export function useOrders(params: { status?: OrderStatus; dept?: string } = {}, refetchInterval?: number) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.dept) qs.set('dept', params.dept);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => apiFetch<Collection<Order>>(`/orders${suffix}`),
    refetchInterval,
  });
}

export function useBoard(dept?: string, refetchInterval: number = POLL.managerBoard) {
  return useQuery({
    queryKey: ['board', dept ?? 'all'],
    queryFn: () =>
      apiFetch<Collection<Order>>(`/orders/board${dept ? `?dept=${encodeURIComponent(dept)}` : ''}`),
    refetchInterval,
  });
}

type PlaceOrderInput = {
  department: string;
  table_id?: number | null;
  guest_ref?: string | null;
  items: { meal_id: number; quantity: number; notes?: string }[];
};

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceOrderInput) =>
      apiFetch<{ data: Order }>('/orders', { method: 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

function useOrderAction(action: 'accept' | 'ready' | 'complete' | 'nudge' | 'expedite') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) =>
      apiFetch<{ data: Order }>(`/orders/${orderId}/${action}`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export const useAcceptOrder = () => useOrderAction('accept');
export const useReadyOrder = () => useOrderAction('ready');
export const useCompleteOrder = () => useOrderAction('complete');
export const useNudgeOrder = () => useOrderAction('nudge');
export const useExpediteOrder = () => useOrderAction('expedite');

export function useReassignOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, server_user_id, chef_user_id }: { orderId: number; server_user_id?: number; chef_user_id?: number }) =>
      apiFetch<{ data: Order }>(`/orders/${orderId}/reassign`, { method: 'POST', body: { server_user_id, chef_user_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/** CEO / Manager operations dashboard — department revenue + delay accountability. */
export function useRevenue(period: RevenuePeriod, refetchInterval: number = POLL.ceoDashboard) {
  return useQuery({
    queryKey: ['dashboard', 'revenue', period],
    queryFn: () => apiFetch<RevenueDashboard>(`/dashboard/revenue?period=${period}`),
    refetchInterval,
    // Keep the current numbers on screen while a new period loads, so switching
    // Today/Week/Month never flashes a blank spinner — it just updates in place.
    placeholderData: keepPreviousData,
  });
}

export function useUnreadCount(refetchInterval: number = POLL.managerBoard) {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiFetch<{ count: number }>('/notifications/unread-count'),
    refetchInterval,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ count: number }>('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useDeclineOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason: string }) =>
      apiFetch<{ data: Order }>(`/orders/${orderId}/decline`, {
        method: 'POST',
        body: { reason },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { enabled_departments?: string[]; name?: string; primary_colour?: string }) =>
      apiFetch<{ tenant: Me['tenant'] }>('/tenant', { method: 'PATCH', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export type Shift = { id: number; department: string; started_at: string } | null;

export function useCurrentShift() {
  return useQuery({
    queryKey: ['shift', 'current'],
    queryFn: () => apiFetch<{ data: Shift }>('/shifts/current'),
  });
}

export function useStartShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (department?: string) =>
      apiFetch<{ data: Shift }>('/shifts/start', { method: 'POST', body: department ? { department } : {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shift'] }),
  });
}

export function useEndShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ data: null }>('/shifts/end', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shift'] }),
  });
}

// ---- Staff accounts --------------------------------------------------------
export type StaffMember = { id: number; name: string; email: string | null; phone: string | null; department: string | null; roles: string[] };

export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: () => apiFetch<{ data: StaffMember[]; assignable_roles: string[] }>('/staff'),
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; email?: string; phone?: string; password: string; role: string; department?: string }) =>
      apiFetch<{ data: StaffMember }>('/staff', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  });
}

// ---- Tables ----------------------------------------------------------------
export type VenueTable = { id: number; name: string; zone: string | null; is_active: boolean };

export function useTables(manage = false) {
  return useQuery({
    queryKey: ['tables', manage ? 'manage' : 'active'],
    queryFn: () => apiFetch<{ data: VenueTable[] }>(`/tables${manage ? '?manage=1' : ''}`),
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; zone?: string }) => apiFetch<{ data: VenueTable }>('/tables', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  });
}

export function useUpdateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number; name?: string; zone?: string | null; is_active?: boolean }) =>
      apiFetch<{ data: VenueTable }>(`/tables/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
  });
}

// ---- Order transfers -------------------------------------------------------
export type TransferTarget = { id: number; name: string };
export type IncomingTransfer = {
  id: number;
  order_id: number;
  kind: 'server' | 'chef';
  status: string;
  from: string | null;
  order: { id: number; department: string; guest_ref: string | null; table_id: number | null; total_amount: number; items: { name: string; quantity: number }[] } | null;
};

export function useTransferTargets(orderId: number | null) {
  return useQuery({
    queryKey: ['transfer-targets', orderId],
    queryFn: () => apiFetch<{ data: TransferTarget[] }>(`/orders/${orderId}/transfer-targets`),
    enabled: orderId != null,
  });
}

export function useSendTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, toUserId }: { orderId: number; toUserId: number }) =>
      apiFetch<{ data: unknown }>(`/orders/${orderId}/transfer`, { method: 'POST', body: { to_user_id: toUserId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

export function useIncomingTransfers(refetchInterval?: number) {
  return useQuery({
    queryKey: ['transfers', 'incoming'],
    queryFn: () => apiFetch<{ data: IncomingTransfer[] }>('/transfers'),
    refetchInterval,
  });
}

export function useRespondTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'accept' | 'decline' }) =>
      apiFetch<{ data: unknown }>(`/transfers/${id}/${action}`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

export function useRegisterDevice() {
  return useMutation({
    mutationFn: (input: { expo_token: string; platform?: 'ios' | 'android' }) =>
      apiFetch<{ message: string }>('/device-tokens', { method: 'POST', body: input }),
  });
}
