import { useRouter } from 'expo-router';

import { TripActionButton } from '@/components/ui/trip-action-button';

type NotifyButtonProps = {
  tripId: number;
  tripName?: string;
};

export function NotifyButton({ tripId, tripName }: NotifyButtonProps) {
  const router = useRouter();

  return (
    <TripActionButton
      icon="notifications"
      label="Notify"
      onPress={() =>
        router.push({
          pathname: '/trips/[id]/notify',
          params: { id: String(tripId), tripName: tripName ?? '' },
        })
      }
    />
  );
}
