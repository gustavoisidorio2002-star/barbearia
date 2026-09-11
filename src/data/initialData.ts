import { BarberProfile, BarberService, BusinessHoursConfig, Appointment } from '../types';

export const INITIAL_SERVICES: BarberService[] = [
  {
    id: 'srv-1',
    name: 'Corte Degradê / Fade Moderno',
    description: 'Corte com máquina e tesoura, degradê na navalha ou shaver, lavagem e finalização com pomada matte.',
    price: 45,
    durationMinutes: 40,
    category: 'cabelo',
    active: true,
    featured: true,
  },
  {
    id: 'srv-2',
    name: 'Barba Terapia com Toalha Quente',
    description: 'Design alinhado de barba com navalha, toalha quente com essência de eucalipto, pós-barba e óleo hidratante.',
    price: 40,
    durationMinutes: 35,
    category: 'barba',
    active: true,
    featured: true,
  },
  {
    id: 'srv-3',
    name: 'Combo Premium (Cabelo + Barba + Sobrancelha)',
    description: 'Experiência completa: corte degradê ou clássico, barba terapia com toalha quente e alinhamento de sobrancelha.',
    price: 85,
    durationMinutes: 75,
    category: 'combo',
    active: true,
    featured: true,
  },
  {
    id: 'srv-4',
    name: 'Pezinho & Acabamento Navalhado',
    description: 'Limpeza dos contornos do cabelo, nuca e costeletas na navalha com produto calmante.',
    price: 25,
    durationMinutes: 20,
    category: 'cabelo',
    active: true,
    featured: false,
  },
  {
    id: 'srv-5',
    name: 'Pigmentação de Barba & Alinhamento',
    description: 'Coloração temporária para preenchimento de falhas na barba, dando aspecto volumoso e nítido.',
    price: 35,
    durationMinutes: 30,
    category: 'barba',
    active: true,
    featured: false,
  },
  {
    id: 'srv-6',
    name: 'Corte Tradicional / Tesoura',
    description: 'Corte totalmente na tesoura ou social clássico, acabamento suave e modelagem natural.',
    price: 50,
    durationMinutes: 45,
    category: 'cabelo',
    active: true,
    featured: false,
  },
  {
    id: 'srv-7',
    name: 'Tratamento Antiqueda & Hidratação',
    description: 'Lavagem esfoliante do couro cabeludo, hidratação profunda e massagem capilar relaxante.',
    price: 45,
    durationMinutes: 30,
    category: 'tratamento',
    active: true,
    featured: false,
  },
];

export const INITIAL_BARBER_PROFILE: BarberProfile = {
  name: 'Rodrigo "Navalha" Silva',
  title: 'Barbeiro Chefe & Especialista em Visagismo',
  shopName: 'Barbearia Dom Navalha',
  tagline: 'Tradição clássica com o corte moderno e pontualidade.',
  phone: '(11) 98765-4321',
  address: 'Rua Augusta, 1420 - Consolação, São Paulo - SP',
  instagram: '@domnavalhabarbearia',
};

export const INITIAL_BUSINESS_HOURS: BusinessHoursConfig = {
  daysOfWeek: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
  openTime: '09:00',
  closeTime: '20:00',
  hasLunchBreak: true,
  lunchStart: '12:30',
  lunchEnd: '13:30',
  intervalMinutes: 30,
};

// Generate realistic sample appointments for today and tomorrow
export function getInitialAppointments(): Appointment[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tmY = tomorrow.getFullYear();
  const tmM = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const tmD = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${tmY}-${tmM}-${tmD}`;

  return [
    {
      id: 'apt-seed-1',
      serviceId: 'srv-1',
      serviceName: 'Corte Degradê / Fade Moderno',
      servicePrice: 45,
      durationMinutes: 40,
      date: todayStr,
      time: '10:00',
      endTime: '10:40',
      clientName: 'Lucas Ferreira',
      clientPhone: '(11) 97123-4567',
      notes: 'Gosta do degradê médio com fade zero nas laterais',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'apt-seed-2',
      serviceId: 'srv-3',
      serviceName: 'Combo Premium (Cabelo + Barba + Sobrancelha)',
      servicePrice: 85,
      durationMinutes: 75,
      date: todayStr,
      time: '14:00',
      endTime: '15:15',
      clientName: 'Matheus Oliveira',
      clientPhone: '(11) 98321-9988',
      notes: 'Barba quadrada bem desenhada',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'apt-seed-3',
      serviceId: 'srv-2',
      serviceName: 'Barba Terapia com Toalha Quente',
      servicePrice: 40,
      durationMinutes: 35,
      date: tomorrowStr,
      time: '11:00',
      endTime: '11:35',
      clientName: 'Gabriel Siqueira',
      clientPhone: '(11) 99876-1234',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'apt-seed-4',
      serviceId: 'srv-1',
      serviceName: 'Corte Degradê / Fade Moderno',
      servicePrice: 45,
      durationMinutes: 40,
      date: tomorrowStr,
      time: '16:00',
      endTime: '16:40',
      clientName: 'Felipe Santos',
      clientPhone: '(11) 96543-2109',
      notes: 'Primeira vez na barbearia',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ];
}
