export interface Volunteer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  checked_in_at?: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
}
