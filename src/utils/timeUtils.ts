import { Appointment, BusinessHoursConfig } from '../types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
}

export function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMin = parseMinutes(startTime);
  const endMin = startMin + durationMinutes;
  return formatMinutesToTime(endMin);
}

// Generate the next N days starting from today or a reference date
export function getAvailableDays(count = 14): Array<{
  dateStr: string;
  dayOfWeek: number;
  dayName: string;
  dayNumber: number;
  monthName: string;
  isToday: boolean;
}> {
  const days = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayOfWeek = d.getDay();
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    days.push({
      dateStr,
      dayOfWeek,
      dayName: dayNames[dayOfWeek],
      dayNumber: d.getDate(),
      monthName: monthNames[d.getMonth()],
      isToday: i === 0,
    });
  }

  return days;
}

export interface SlotAvailability {
  time: string;
  available: boolean;
  reason?: 'occupied' | 'lunch' | 'past' | 'overflow';
}

export function calculateAvailableSlots(
  dateStr: string,
  serviceDuration: number,
  businessHours: BusinessHoursConfig,
  existingAppointments: Appointment[]
): SlotAvailability[] {
  // Check if shop is open on this day
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = dateObj.getDay();

  if (!businessHours.daysOfWeek.includes(dayOfWeek)) {
    return [];
  }

  const openMin = parseMinutes(businessHours.openTime);
  const closeMin = parseMinutes(businessHours.closeTime);
  const interval = businessHours.intervalMinutes || 30;

  const lunchStartMin = businessHours.hasLunchBreak ? parseMinutes(businessHours.lunchStart) : -1;
  const lunchEndMin = businessHours.hasLunchBreak ? parseMinutes(businessHours.lunchEnd) : -1;

  // Active appointments on this date
  const dayAppointments = existingAppointments.filter(
    (app) => app.date === dateStr && app.status === 'confirmed'
  );

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = dateStr === todayStr;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: SlotAvailability[] = [];

  for (let slotTimeMin = openMin; slotTimeMin < closeMin; slotTimeMin += interval) {
    const slotEndTimeMin = slotTimeMin + serviceDuration;
    const timeStr = formatMinutesToTime(slotTimeMin);

    // 1. Check if it exceeds close time
    if (slotEndTimeMin > closeMin) {
      slots.push({ time: timeStr, available: false, reason: 'overflow' });
      continue;
    }

    // 2. Check if already passed today
    if (isToday && slotTimeMin <= currentMinutes + 15) {
      // 15 min buffer
      slots.push({ time: timeStr, available: false, reason: 'past' });
      continue;
    }

    // 3. Check lunch break overlap
    if (businessHours.hasLunchBreak && lunchStartMin >= 0 && lunchEndMin >= 0) {
      const overlapsLunch =
        (slotTimeMin >= lunchStartMin && slotTimeMin < lunchEndMin) ||
        (slotEndTimeMin > lunchStartMin && slotEndTimeMin <= lunchEndMin) ||
        (slotTimeMin <= lunchStartMin && slotEndTimeMin >= lunchEndMin);

      if (overlapsLunch) {
        slots.push({ time: timeStr, available: false, reason: 'lunch' });
        continue;
      }
    }

    // 4. Check overlap with existing appointments
    let hasConflict = false;
    for (const app of dayAppointments) {
      const appStartMin = parseMinutes(app.time);
      const appEndMin = app.endTime ? parseMinutes(app.endTime) : appStartMin + app.durationMinutes;

      // Overlap condition: startA < endB && endA > startB
      if (slotTimeMin < appEndMin && slotEndTimeMin > appStartMin) {
        hasConflict = true;
        break;
      }
    }

    if (hasConflict) {
      slots.push({ time: timeStr, available: false, reason: 'occupied' });
    } else {
      slots.push({ time: timeStr, available: true });
    }
  }

  return slots;
}

export function createWhatsAppLink(appointment: Appointment, barberPhone: string): string {
  if (!appointment || !appointment.date) return '#';
  const cleanPhone = (barberPhone || '').replace(/\D/g, '');
  const parts = appointment.date.split('-');
  const y = parts[0] || '';
  const m = parts[1] || '';
  const d = parts[2] || '';
  const dateFormatted = `${d}/${m}/${y}`;

  const message = `Olá! Acabei de agendar um horário na barbearia:%0A%0A` +
    `👤 *Cliente:* ${encodeURIComponent(appointment.clientName || '')}%0A` +
    `✂️ *Serviço:* ${encodeURIComponent(appointment.serviceName || '')}%0A` +
    `📅 *Data:* ${dateFormatted}%0A` +
    `⏰ *Horário:* ${appointment.time || ''}%0A` +
    `💰 *Valor:* ${encodeURIComponent(formatCurrency(appointment.servicePrice || 0))}%0A` +
    `${appointment.notes ? `📝 *Obs:* ${encodeURIComponent(appointment.notes)}%0A` : ''}` +
    `%0AConfirmado pelo sistema de agendamento!`;

  return `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${message}`;
}

export function createGoogleCalendarUrl(appointment: Appointment): string {
  if (!appointment || !appointment.date || !appointment.time || !appointment.endTime) return '#';
  const [y, m, d] = appointment.date.split('-');
  const [h, min] = (appointment.time || '00:00').split(':');
  const [endH, endMin] = (appointment.endTime || '00:00').split(':');

  const startIso = `${y}${m}${d}T${h}${min}00`;
  const endIso = `${y}${m}${d}T${endH}${endMin}00`;

  const title = encodeURIComponent(`Corte de Cabelo / Barba: ${appointment.serviceName || ''}`);
  const details = encodeURIComponent(
    `Agendamento na Barbearia\nServiço: ${appointment.serviceName || ''}\nValor: ${formatCurrency(appointment.servicePrice || 0)}\nDuração: ${appointment.durationMinutes || 0}min\nCliente: ${appointment.clientName || ''}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}`;
}
