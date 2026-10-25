import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import type { CreateBroadcastNotificationRequest } from '../types/notification';

const BROADCAST_KEY = ['notifications', 'broadcast'];

export function useBroadcastNotifications() {
  return useQuery({
    queryKey: BROADCAST_KEY,
    queryFn: () => notificationService.listBroadcasts(),
  });
}

export function useBroadcastNotificationMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: BROADCAST_KEY });

  return {
    create: useMutation({
      mutationFn: (payload: CreateBroadcastNotificationRequest) => notificationService.createBroadcast(payload),
      onSuccess: invalidate,
    }),
    send: useMutation({
      mutationFn: (id: number) => notificationService.sendBroadcast(id),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number) => notificationService.deleteBroadcast(id),
      onSuccess: invalidate,
    }),
  };
}
