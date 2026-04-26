export type Participant = {
  id: number;
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  checkedIn: boolean;
  checkedInAt?: string | null;
};
