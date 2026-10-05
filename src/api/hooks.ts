import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { Collection, Me, Meal, Order, OrderStatus } from './types';

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

export function useRegisterDevice() {
  return useMutation({
    mutationFn: (input: { expo_token: string; platform?: 'ios' | 'android' }) =>
      apiFetch<{ message: string }>('/device-tokens', { method: 'POST', body: input }),
  });
}
