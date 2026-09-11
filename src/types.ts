export type ServiceCategory = 'cabelo' | 'barba' | 'combo' | 'tratamento';

export interface BarberService {
  id: string;
  name: string;
  description: string;
  price: number; // in R$
  durationMinutes: number; // in minutes (e.g. 30, 45, 60)
  category: ServiceCategory;
  active: boolean;
  featured?: boolean;
}

export interface BusinessHoursConfig {
  daysOfWeek: number[]; // 0 = Domingo, 1 = Segunda, etc.
  openTime: string; // "09:00"
  closeTime: string; // "20:00"
  hasLunchBreak: boolean;
  lunchStart: string; // "12:00"
  lunchEnd: string; // "13:00"
  intervalMinutes: number; // 30 mins
}

export interface BarberProfile {
  name: string;
  title: string;
  shopName: string;
  tagline: string;
  phone: string;
  address: string;
  instagram: string;
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  endTime: string; // "HH:MM"
  clientName: string;
  clientPhone: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
}

export type ActiveTab = 'booking' | 'barber-dashboard' | 'my-appointments';
