import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';
import { useAuthStore } from '@/store/authStore';

type LoginInput = { login: string; password: string };
type LoginResponse = {
  token: string;
  user: { id: number; name: string; roles: string[] };
};

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { ...input, device_name: 'hospi-mobile' },
        public: true,
      }),
    onSuccess: async (data) => {
      await setToken(data.token);
      qc.invalidateQueries();
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),
    // Clear locally regardless — even if the network call fails the session ends.
    onSettled: async () => {
      await clear();
      qc.clear();
    },
  });
}
