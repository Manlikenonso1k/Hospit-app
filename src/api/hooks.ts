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

function useOrderAction(action: 'accept' | 'ready' | 'complete') {
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

export function useRegisterDevice() {
  return useMutation({
    mutationFn: (input: { expo_token: string; platform?: 'ios' | 'android' }) =>
      apiFetch<{ message: string }>('/device-tokens', { method: 'POST', body: input }),
  });
}
