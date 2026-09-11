import React, { useState, useMemo } from 'react';
import { 
  Scissors, Calendar, Clock, DollarSign, Check, ChevronRight, 
  ChevronLeft, Sparkles, User, Phone, MessageSquare, AlertCircle, 
  MapPin, CheckCircle, CalendarPlus, MessageCircle, ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useBarbershop } from '../../context/BarbershopContext';
import { BarberService, ServiceCategory, Appointment } from '../../types';
import { 
  formatCurrency, formatPhone, getAvailableDays, 
  calculateAvailableSlots, createWhatsAppLink, createGoogleCalendarUrl 
} from '../../utils/timeUtils';

interface BookingFlowProps {
  onGoToMyAppointments: () => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ onGoToMyAppointments }) => {
  const { activeServices, businessHours, appointments, bookAppointment, profile } = useBarbershop();

  // Booking Steps: 1 = Service, 2 = Date & Time, 3 = Client Info, 4 = Success Receipt
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Selections
  const [selectedService, setSelectedService] = useState<BarberService | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all');

  // Date & Time
  const availableDays = useMemo(() => getAvailableDays(14), []);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to the first open day
    const firstOpen = availableDays.find((d) => businessHours.daysOfWeek.includes(d.dayOfWeek));
    return firstOpen ? firstOpen.dateStr : availableDays[0]?.dateStr || '';
  });
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Client Details
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmed Appointment Result
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  // Filtered Services
  const filteredServices = useMemo(() => {
    if (categoryFilter === 'all') return activeServices;
    return activeServices.filter((s) => s.category === categoryFilter);
  }, [activeServices, categoryFilter]);

  // Available Time Slots for chosen date and selected service duration
  const availableSlots = useMemo(() => {
    if (!selectedService || !selectedDate) return [];
    return calculateAvailableSlots(
      selectedDate,
      selectedService.durationMinutes,
      businessHours,
      appointments
    );
  }, [selectedDate, selectedService, businessHours, appointments]);

  // Selected Day Details
  const selectedDayInfo = useMemo(() => {
    return availableDays.find((d) => d.dateStr === selectedDate);
  }, [availableDays, selectedDate]);

  const isSelectedDayOpen = selectedDayInfo 
    ? businessHours.daysOfWeek.includes(selectedDayInfo.dayOfWeek) 
    : false;

  // Phone input handler with Brazilian formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setClientPhone(formatPhone(raw));
  };

  // Step 1 -> Step 2
  const handleSelectService = (service: BarberService) => {
    setSelectedService(service);
    setSelectedTime(null);
    setCurrentStep(2);
  };

  // Step 2 -> Step 3
  const handleSelectTimeAndProceed = (time: string) => {
    setSelectedTime(time);
    setCurrentStep(3);
  };

  // Submit Booking
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) {
      setFormError('Por favor, selecione o serviço, data e horário.');
      return;
    }
    if (!clientName.trim()) {
      setFormError('Por favor, informe o seu nome completo.');
      return;
    }
    const cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Por favor, informe um telefone/WhatsApp válido com DDD.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const newBooking = await bookAppointment({
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        durationMinutes: selectedService.durationMinutes,
        date: selectedDate,
        time: selectedTime,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        notes: notes.trim() || undefined,
      });

      setConfirmedBooking(newBooking);
      setCurrentStep(4);
    } catch (err: any) {
      console.error('Error saving appointment:', err);
      setFormError('Ocorreu um erro ao processar seu agendamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNewBooking = () => {
    setSelectedService(null);
    setSelectedTime(null);
    setClientName('');
    setClientPhone('');
    setNotes('');
    setConfirmedBooking(null);
    setCurrentStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Welcome & Shop Info */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Agendamento Online 24h</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-amber-100 font-serif tracking-tight">
          Reserve seu Horário na Barbearia
        </h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-lg mx-auto">
          Escolha o serviço desejado, confira os horários livres e garanta o seu atendimento sem filas.
        </p>

        {/* Step Progress Tracker */}
        {currentStep < 4 && (
          <div className="mt-8 flex items-center justify-center gap-2 sm:gap-4 max-w-md mx-auto">
            {[
              { num: 1, label: 'Serviço' },
              { num: 2, label: 'Data & Hora' },
              { num: 3, label: 'Seus Dados' },
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <div 
                  onClick={() => {
                    if (step.num < currentStep) setCurrentStep(step.num as 1 | 2 | 3);
                  }}
                  className={`flex items-center gap-2 cursor-pointer transition-colors ${
                    currentStep === step.num
                      ? 'text-amber-400 font-bold'
                      : currentStep > step.num
                      ? 'text-zinc-300'
                      : 'text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      currentStep === step.num
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                        : currentStep > step.num
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {currentStep > step.num ? <Check className="w-3.5 h-3.5" /> : step.num}
                  </div>
                  <span className="text-xs sm:text-sm hidden xs:inline">{step.label}</span>
                </div>
                {idx < 2 && (
                  <div
                    className={`h-[2px] w-8 sm:w-12 transition-colors ${
                      currentStep > step.num ? 'bg-amber-500/60' : 'bg-zinc-800'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* STEP 1: ESCOLHA DO SERVIÇO */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fade-in">
          {/* Category Filter Pills */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {(
              [
                { id: 'all', label: 'Todos os Serviços' },
                { id: 'cabelo', label: 'Cabelo' },
                { id: 'barba', label: 'Barba' },
                { id: 'combo', label: 'Combos Especiais' },
                { id: 'tratamento', label: 'Tratamentos' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold shadow-lg shadow-amber-500/20'
                    : 'border-zinc-800 bg-[#16181e] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Services Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => handleSelectService(service)}
                className="group bg-[#181a20] hover:bg-[#1f222a] border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-5 cursor-pointer transition-all shadow-md hover:shadow-xl hover:shadow-amber-500/5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {service.category}
                      </span>
                      {service.featured && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Mais Pedido
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-black text-amber-300">
                      {formatCurrency(service.price)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-100 font-serif group-hover:text-amber-200 transition-colors">
                    {service.name}
                  </h3>

                  <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                    {service.description || 'Atendimento de alta precisão com navalha e tesoura.'}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {service.durationMinutes} minutos
                  </span>

                  <button
                    id={`select-service-${service.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-zinc-950 text-amber-400 text-xs font-bold border border-amber-500/30 group-hover:border-amber-500 transition-all flex items-center gap-1"
                  >
                    <span>Escolher Horário</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="p-12 text-center bg-[#181a20] border border-zinc-800 rounded-2xl">
              <Scissors className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-300">Nenhum serviço disponível no momento.</p>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: ESCOLHA DE DATA E HORÁRIO */}
      {currentStep === 2 && selectedService && (
        <div className="space-y-6 animate-fade-in">
          {/* Selected Service Bar with back button */}
          <div className="bg-[#181a20] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                title="Trocar serviço"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[11px] text-zinc-400 block">Serviço Selecionado:</span>
                <span className="text-sm font-bold text-amber-200 font-serif">
                  {selectedService.name}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-black text-amber-300">
                {formatCurrency(selectedService.price)}
              </span>
              <span className="text-xs text-zinc-400 block">
                {selectedService.durationMinutes} min
              </span>
            </div>
          </div>

          {/* Date Picker Header & Carousel */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Selecione o Dia
              </h3>
              <span className="text-xs text-zinc-500">Próximos 14 dias disponíveis</span>
            </div>

            {/* Days Horizontal Scroll */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {availableDays.map((day) => {
                const isOpen = businessHours.daysOfWeek.includes(day.dayOfWeek);
                const isSelected = selectedDate === day.dateStr;

                return (
                  <button
                    key={day.dateStr}
                    disabled={!isOpen}
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                      setSelectedTime(null);
                    }}
                    className={`flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] py-3 px-2 rounded-2xl border transition-all text-center shrink-0 ${
                      !isOpen
                        ? 'opacity-35 bg-zinc-900/40 border-zinc-800 cursor-not-allowed text-zinc-600'
                        : isSelected
                        ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold shadow-lg shadow-amber-500/20'
                        : 'bg-[#181a20] border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-[#20232b]'
                    }`}
                  >
                    <span className={`text-[11px] uppercase font-semibold ${isSelected ? 'text-zinc-950' : 'text-zinc-400'}`}>
                      {day.dayName}
                    </span>
                    <span className="text-lg font-black my-0.5">
                      {day.dayNumber}
                    </span>
                    <span className={`text-[10px] ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}>
                      {isOpen ? day.monthName : 'Fechado'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Horários Disponíveis
              </h3>
              {isSelectedDayOpen && (
                <span className="text-xs text-zinc-400">
                  {availableSlots.filter((s) => s.available).length} horários livres
                </span>
              )}
            </div>

            {!isSelectedDayOpen ? (
              <div className="p-8 text-center bg-[#181a20] border border-zinc-800 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-amber-500/60 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-zinc-200">Barbearia fechada neste dia</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Não realizamos atendimentos no dia selecionado. Por favor, escolha outra data acima.
                </p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="p-8 text-center bg-[#181a20] border border-zinc-800 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-zinc-200">Nenhum horário disponível</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Todos os horários deste dia já foram preenchidos ou o expediente já encerrou.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {availableSlots.map((slot) => {
                  const isSelected = selectedTime === slot.time;

                  if (!slot.available) {
                    const reasonText =
                      slot.reason === 'occupied'
                        ? 'Ocupado'
                        : slot.reason === 'lunch'
                        ? 'Almoço'
                        : slot.reason === 'past'
                        ? 'Passou'
                        : 'Esgotado';

                    return (
                      <div
                        key={slot.time}
                        className="py-2.5 px-2 rounded-xl border border-zinc-800/60 bg-zinc-900/30 text-center text-zinc-600 cursor-not-allowed opacity-50"
                        title={reasonText}
                      >
                        <span className="text-xs font-mono line-through block">{slot.time}</span>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-600">
                          {reasonText}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={slot.time}
                      id={`time-slot-${slot.time.replace(':', '-')}`}
                      onClick={() => handleSelectTimeAndProceed(slot.time)}
                      className={`py-3 px-2 rounded-xl border font-mono text-sm font-bold transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-[#181a20] border-zinc-700/80 text-zinc-200 hover:border-amber-500 hover:text-amber-300 hover:bg-[#20232b]'
                      }`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: SEUS DADOS & CONFIRMAÇÃO */}
      {currentStep === 3 && selectedService && selectedDate && selectedTime && (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => setCurrentStep(2)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar para escolha de horário</span>
          </button>

          {/* Booking Summary Box */}
          <div className="bg-[#181a20] border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider border-b border-zinc-800 pb-3 flex items-center justify-between">
              <span>Resumo da Reserva</span>
              <span className="text-xs font-normal text-zinc-400">Verifique os detalhes</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block">Serviço:</span>
                <span className="font-bold text-zinc-200 text-sm">{selectedService.name}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Valor:</span>
                <span className="font-black text-amber-300 text-sm">
                  {formatCurrency(selectedService.price)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Data:</span>
                <span className="font-bold text-zinc-200">
                  {selectedDayInfo?.dayName}, {selectedDayInfo?.dayNumber} de {selectedDayInfo?.monthName}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Horário:</span>
                <span className="font-bold text-zinc-200">
                  {selectedTime} ({selectedService.durationMinutes} minutos)
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 flex items-center gap-2 text-xs text-zinc-400">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{profile.shopName} - {profile.address}</span>
            </div>
          </div>

          {/* Client Input Form */}
          <form onSubmit={handleConfirmBooking} className="bg-[#181a20] border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-zinc-100 font-serif">
              Informe seus dados para contato
            </h3>
            <p className="text-xs text-zinc-400">
              O barbeiro usará essas informações para confirmar o corte e preparar a bancada.
            </p>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Seu Nome Completo *
              </label>
              <input
                id="client-name-input"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Gustavo Silva"
                className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                Seu WhatsApp / Telefone *
              </label>
              <input
                id="client-phone-input"
                type="tel"
                value={clientPhone}
                onChange={handlePhoneChange}
                placeholder="(11) 98888-8888"
                maxLength={15}
                className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                required
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Você receberá a confirmação e lembretes por WhatsApp.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                Observações ou Preferências (Opcional)
              </label>
              <textarea
                id="client-notes-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Prefiro fade na zero baixa; toalha morna..."
                className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="pt-3">
              <button
                id="confirm-booking-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Confirmando Agendamento...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 stroke-[2.5]" />
                    <span>Confirmar Agendamento</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 4: TELA DE SUCESSO / COMPROVANTE */}
      {currentStep === 4 && confirmedBooking && (
        <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-[#181a20] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6 relative overflow-hidden">
            {/* Background glow badge */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
              <CheckCircle className="w-10 h-10 stroke-[2.2]" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block mb-2">
                Agendamento Confirmado!
              </span>
              <h2 className="text-2xl font-black text-zinc-100 font-serif">
                Tudo pronto, {confirmedBooking.clientName}!
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Seu horário está reservado com sucesso na {profile.shopName}.
              </p>
            </div>

            {/* Ticket Card Details */}
            <div className="bg-[#121418] border border-zinc-800 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <span className="text-xs text-zinc-500 font-mono">
                  Código: #{confirmedBooking.id ? confirmedBooking.id.slice(-6).toUpperCase() : 'CONFIRMADO'}
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {formatCurrency(confirmedBooking.servicePrice || 0)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Serviço:</span>
                  <span className="font-bold text-zinc-200">{confirmedBooking.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Data:</span>
                  <span className="font-bold text-zinc-200">{confirmedBooking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Horário:</span>
                  <span className="font-bold text-zinc-200">
                    {confirmedBooking.time} até {confirmedBooking.endTime} ({confirmedBooking.durationMinutes} min)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cliente:</span>
                  <span className="font-bold text-zinc-200">{confirmedBooking.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">WhatsApp:</span>
                  <span className="font-bold text-zinc-200">{formatPhone(confirmedBooking.clientPhone)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Local:</span>
                  <span className="font-medium text-zinc-400">{profile.address}</span>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-3 pt-2">
              {/* WhatsApp direct notification */}
              <a
                href={createWhatsAppLink(confirmedBooking, profile.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Avisar o Barbeiro no WhatsApp</span>
              </a>

              {/* Google Calendar Link */}
              <a
                href={createGoogleCalendarUrl(confirmedBooking)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <CalendarPlus className="w-4 h-4 text-amber-400" />
                <span>Salvar no Google Agenda</span>
              </a>
            </div>

            {/* Bottom Navigation */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-4 text-xs">
              <button
                onClick={handleStartNewBooking}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Agendar outro horário
              </button>

              <button
                onClick={onGoToMyAppointments}
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Ver Meus Agendamentos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
