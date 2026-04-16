import { useLocalSearchParams } from 'expo-router';
import PopupUserNeeds from '@/components/popup-userneeds';

export default function PopupUserNeedsScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  return <PopupUserNeeds tripId={tripId} />;
}