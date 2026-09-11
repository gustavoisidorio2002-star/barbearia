import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, CheckCircle2, XCircle, Clock, 
  Calendar, DollarSign, Users, Scissors, MessageCircle, 
  Settings, Sparkles, AlertCircle, RefreshCw, Eye, EyeOff,
  Database, Key
} from 'lucide-react';
import { useBarbershop } from '../../context/BarbershopContext';
import { BarberService, ServiceCategory, AppointmentStatus } from '../../types';
import { formatCurrency, formatPhone } from '../../utils/timeUtils';
import { ServiceModal } from './ServiceModal';
import { SupabaseModal } from './SupabaseModal';

type AdminTab = 'services' | 'agenda' | 'settings';

export const BarberDashboard: React.FC = () => {
  const {
    services,
    addService,
    updateService,
    deleteService,
    toggleServiceActive,
    appointments,
    updateAppointmentStatus,
    businessHours,
    updateBusinessHours,
    profile,
    updateProfile,
    resetToDefault,
    isUsingSupabase,
    syncStatus,
    refreshFromSupabase,
  } = useBarbershop();

  const [currentTab, setCurrentTab] = useState<AdminTab>('services');
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<BarberService | null>(null);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  // Agenda filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [agendaStatusFilter, setAgendaStatusFilter] = useState<AppointmentStatus | 'all'>('all');

  // Filtered Services
  const filteredServices = services.filter((s) => {
    if (categoryFilter === 'all') return true;
    return s.category === categoryFilter;
  });

  // Filtered Appointments for the selected date
  const dateAppointments = appointments
    .filter((a) => a.date === selectedDate)
    .filter((a) => (agendaStatusFilter === 'all' ? true : a.status === agendaStatusFilter))
    .sort((a, b) => a.time.localeCompare(b.time));

  // Daily statistics for selected date
  const confirmedForDate = appointments.filter(
    (a) => a.date === selectedDate && a.status === 'confirmed'
  );
  const completedForDate = appointments.filter(
    (a) => a.date === selectedDate && a.status === 'completed'
  );
  const totalRevenueProjected = [...confirmedForDate, ...completedForDate].reduce(
    (sum, a) => sum + a.servicePrice,
    0
  );
  const totalRevenueRealized = completedForDate.reduce((sum, a) => sum + a.servicePrice, 0);

  const handleOpenNewModal = () => {
    setEditingService(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (service: BarberService) => {
    setEditingService(service);
    setModalOpen(true);
  };

  const handleSaveService = (serviceData: Omit<BarberService, 'id'>) => {
    if (editingService) {
      updateService(editingService.id, serviceData);
    } else {
      addService(serviceData);
    }
  };

  const handleDeleteService = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover o serviço "${name}"?`)) {
      deleteService(id);
    }
  };

  // WhatsApp quick reminder link
  const openWhatsAppReminder = (apt: typeof appointments[0]) => {
    const cleanPhone = apt.clientPhone.replace(/\D/g, '');
    const [y, m, d] = apt.date.split('-');
    const formattedDate = `${d}/${m}`;
    const text = encodeURIComponent(
      `Fala, ${apt.clientName}! Tudo certo? Barbearia ${profile.shopName} passando para confirmar seu horário de ${apt.serviceName} no dia ${formattedDate} às ${apt.time}. Te esperamos lá!`
    );
    window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${text}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181a20] border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Scissors className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-amber-100 font-serif">
                Painel do Barbeiro
              </h1>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sistema Ativo
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Gerencie seus serviços, consulte a agenda diária e configure os horários de atendimento.
            </p>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1.5 bg-[#121418] p-1.5 rounded-xl border border-zinc-800">
          <button
            id="tab-admin-services"
            onClick={() => setCurrentTab('services')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              currentTab === 'services'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Serviços ({services.length})</span>
          </button>

          <button
            id="tab-admin-agenda"
            onClick={() => setCurrentTab('agenda')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              currentTab === 'agenda'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agenda & Clientes</span>
          </button>

          <button
            id="tab-admin-settings"
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              currentTab === 'settings'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Horários & Loja</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SERVIÇOS */}
      {currentTab === 'services' && (
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Category filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: 'all', label: 'Todos os Serviços' },
                  { id: 'cabelo', label: 'Cabelo' },
                  { id: 'barba', label: 'Barba' },
                  { id: 'combo', label: 'Combos' },
                  { id: 'tratamento', label: 'Tratamento' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    categoryFilter === cat.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                      : 'border-zinc-800 bg-[#16181e] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Cadastrar Novo Serviço Button */}
            <button
              id="add-service-btn"
              onClick={handleOpenNewModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Cadastrar Novo Serviço</span>
            </button>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`bg-[#181a20] border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  service.active
                    ? 'border-zinc-800 hover:border-zinc-700 shadow-lg'
                    : 'border-zinc-800/60 opacity-60 bg-zinc-900/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {service.category}
                      </span>
                      {service.featured && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Destaque
                        </span>
                      )}
                    </div>

                    {/* Active toggle */}
                    <button
                      onClick={() => toggleServiceActive(service.id)}
                      title={service.active ? 'Desativar serviço' : 'Ativar serviço'}
                      className={`text-xs px-2 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
                        service.active
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {service.active ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Ativo</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Pausado</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-zinc-100 font-serif leading-tight">
                    {service.name}
                  </h3>

                  <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                    {service.description || 'Nenhuma descrição informada.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-500 block">Preço / Duração</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-amber-300">
                        {formatCurrency(service.price)}
                      </span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {service.durationMinutes} min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(service)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all"
                      title="Editar serviço"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id, service.name)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                      title="Excluir serviço"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="p-12 text-center bg-[#181a20] border border-zinc-800 rounded-2xl">
              <Scissors className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-300">Nenhum serviço encontrado</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Não há serviços cadastrados nesta categoria ou todos foram removidos.
              </p>
              <button
                onClick={handleOpenNewModal}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors"
              >
                Cadastrar Primeiro Serviço
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AGENDA DE CORTES */}
      {currentTab === 'agenda' && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#181a20] border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span>Agendamentos do Dia</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-zinc-100">
                {dateAppointments.length}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                {confirmedForDate.length} confirmados • {completedForDate.length} concluídos
              </span>
            </div>

            <div className="bg-[#181a20] border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span>Faturamento Previsto</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300">
                {formatCurrency(totalRevenueProjected)}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Total se todos comparecerem
              </span>
            </div>

            <div className="bg-[#181a20] border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span>Faturamento Realizado</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {formatCurrency(totalRevenueRealized)}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Cortes já marcados como concluídos
              </span>
            </div>

            <div className="bg-[#181a20] border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                <span>Horário de Atendimento</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-zinc-100">
                {businessHours.openTime} às {businessHours.closeTime}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                {businessHours.hasLunchBreak
                  ? `Almoço: ${businessHours.lunchStart} - ${businessHours.lunchEnd}`
                  : 'Sem pausa de almoço'}
              </span>
            </div>
          </div>

          {/* Agenda Filter & Date Picker Controls */}
          <div className="bg-[#181a20] border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                Ver Data:
              </label>
              <input
                id="agenda-date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#121418] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => setSelectedDate(todayStr)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors ${
                  selectedDate === todayStr
                    ? 'bg-amber-500 text-zinc-950 border-amber-500'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                Hoje
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 w-full md:w-auto justify-end overflow-x-auto">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'confirmed', label: 'Confirmados' },
                  { id: 'completed', label: 'Concluídos' },
                  { id: 'cancelled', label: 'Cancelados' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  onClick={() => setAgendaStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    agendaStatusFilter === st.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                      : 'border-zinc-800 bg-[#121418] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Appointments List for Selected Date */}
          <div className="space-y-3">
            {dateAppointments.map((apt) => {
              const isPastTime = false; // Could be computed based on now
              const statusBadgeStyles = {
                confirmed: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
              };

              const statusLabels = {
                confirmed: 'Confirmado',
                completed: 'Concluído',
                cancelled: 'Cancelado',
              };

              return (
                <div
                  key={apt.id}
                  className={`bg-[#181a20] border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    apt.status === 'completed'
                      ? 'border-emerald-500/30 bg-emerald-950/10'
                      : apt.status === 'cancelled'
                      ? 'border-red-500/20 opacity-50 bg-red-950/5'
                      : 'border-zinc-800 hover:border-zinc-700 shadow-md'
                  }`}
                >
                  {/* Left: Time & Client */}
                  <div className="flex items-start gap-4">
                    {/* Time Slot Badge */}
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex flex-col items-center justify-center text-center shrink-0">
                      <span className="text-base font-black text-amber-400 font-mono">
                        {apt.time}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        até {apt.endTime}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-base font-bold text-zinc-100">
                          {apt.clientName}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            statusBadgeStyles[apt.status]
                          }`}
                        >
                          {statusLabels[apt.status]}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-zinc-400">
                        <span className="text-amber-200 font-semibold">
                          {apt.serviceName}
                        </span>
                        <span>•</span>
                        <span>{formatCurrency(apt.servicePrice)}</span>
                        <span>•</span>
                        <span>{apt.durationMinutes} min</span>
                        <span>•</span>
                        <span className="text-zinc-300 font-mono">
                          {formatPhone(apt.clientPhone)}
                        </span>
                      </div>

                      {apt.notes && (
                        <p className="text-xs text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg mt-2 inline-block">
                          Obs: {apt.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {/* WhatsApp notification button */}
                    <button
                      onClick={() => openWhatsAppReminder(apt)}
                      className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors flex items-center gap-1.5"
                      title="Enviar confirmação / lembrete no WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Status Toggle Actions */}
                    {apt.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                          className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Concluir</span>
                        </button>
                        <button
                          onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                          className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancelar</span>
                        </button>
                      </>
                    )}

                    {apt.status === 'completed' && (
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                        className="px-3 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                      >
                        Reabrir
                      </button>
                    )}

                    {apt.status === 'cancelled' && (
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                        className="px-3 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                      >
                        Restaurar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {dateAppointments.length === 0 && (
              <div className="p-12 text-center bg-[#181a20] border border-zinc-800 rounded-2xl">
                <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-300">
                  Nenhum agendamento para este dia
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Não há reservas cadastradas para a data selecionada ({selectedDate}). Os novos agendamentos feitos pelos clientes aparecerão aqui automaticamente.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURAÇÕES DE HORÁRIOS E BARBEARIA */}
      {currentTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Horários de Funcionamento */}
          <div className="bg-[#181a20] border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-amber-100 font-serif">
                  Horário de Funcionamento
                </h3>
                <p className="text-xs text-zinc-400">
                  Controla os horários gerados automaticamente para o cliente agendar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Horário de Abertura
                </label>
                <input
                  type="time"
                  value={businessHours.openTime}
                  onChange={(e) =>
                    updateBusinessHours({ ...businessHours, openTime: e.target.value })
                  }
                  className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Horário de Fechamento
                </label>
                <input
                  type="time"
                  value={businessHours.closeTime}
                  onChange={(e) =>
                    updateBusinessHours({ ...businessHours, closeTime: e.target.value })
                  }
                  className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100"
                />
              </div>
            </div>

            {/* Pausa para Almoço */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={businessHours.hasLunchBreak}
                  onChange={(e) =>
                    updateBusinessHours({
                      ...businessHours,
                      hasLunchBreak: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                />
                <span className="text-xs font-semibold text-zinc-300">
                  Pausar agendamentos durante o almoço
                </span>
              </label>

              {businessHours.hasLunchBreak && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Início do Almoço
                    </label>
                    <input
                      type="time"
                      value={businessHours.lunchStart}
                      onChange={(e) =>
                        updateBusinessHours({
                          ...businessHours,
                          lunchStart: e.target.value,
                        })
                      }
                      className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Retorno do Almoço
                    </label>
                    <input
                      type="time"
                      value={businessHours.lunchEnd}
                      onChange={(e) =>
                        updateBusinessHours({
                          ...businessHours,
                          lunchEnd: e.target.value,
                        })
                      }
                      className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dias de Funcionamento */}
            <div className="pt-2 border-t border-zinc-800/80">
              <label className="block text-xs font-semibold text-zinc-400 mb-2">
                Dias de Atendimento na Semana
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {[
                  { day: 0, label: 'Dom' },
                  { day: 1, label: 'Seg' },
                  { day: 2, label: 'Ter' },
                  { day: 3, label: 'Qua' },
                  { day: 4, label: 'Qui' },
                  { day: 5, label: 'Sex' },
                  { day: 6, label: 'Sáb' },
                ].map(({ day, label }) => {
                  const isSelected = businessHours.daysOfWeek.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const newDays = isSelected
                          ? businessHours.daysOfWeek.filter((d) => d !== day)
                          : [...businessHours.daysOfWeek, day];
                        updateBusinessHours({ ...businessHours, daysOfWeek: newDays });
                      }}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-500'
                          : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intervalo entre agendamentos */}
            <div className="pt-2 border-t border-zinc-800/80">
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Intervalo Base entre Horários (Minutos)
              </label>
              <select
                value={businessHours.intervalMinutes}
                onChange={(e) =>
                  updateBusinessHours({
                    ...businessHours,
                    intervalMinutes: Number(e.target.value),
                  })
                }
                className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value={15}>A cada 15 minutos</option>
                <option value={20}>A cada 20 minutos</option>
                <option value={30}>A cada 30 minutos (Recomendado)</option>
                <option value={45}>A cada 45 minutos</option>
                <option value={60}>A cada 60 minutos</option>
              </select>
            </div>
          </div>

          {/* Dados da Barbearia & Perfil */}
          <div className="bg-[#181a20] border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <Scissors className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-amber-100 font-serif">
                  Perfil da Barbearia
                </h3>
                <p className="text-xs text-zinc-400">
                  Informações exibidas no cabeçalho e na confirmação do WhatsApp.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Nome da Barbearia
              </label>
              <input
                type="text"
                value={profile.shopName}
                onChange={(e) => updateProfile({ shopName: e.target.value })}
                className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Nome do Barbeiro / Responsável
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
                className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                WhatsApp de Atendimento (Para receber confirmações)
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => updateProfile({ phone: e.target.value })}
                placeholder="(11) 98765-4321"
                className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Endereço da Barbearia
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => updateProfile({ address: e.target.value })}
                className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100"
              />
            </div>

            {/* Reset data helper */}
            <div className="pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Deseja restaurar os serviços e horários padrão da barbearia?'
                    )
                  ) {
                    resetToDefault();
                  }
                }}
                className="text-xs text-zinc-500 hover:text-amber-400 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restaurar dados de demonstração originais</span>
              </button>
            </div>

            {/* Configuração da API Supabase */}
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-200">
                    API Supabase (Banco de Dados em Nuvem)
                  </span>
                </div>
                {isUsingSupabase ? (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {syncStatus === 'synced' ? 'Conectado e Ativo' : 'Sincronizando'}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    Modo Local (Offline)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                {isUsingSupabase
                  ? 'Os serviços cadastrados, horários agendados e regras de atendimento estão sendo salvos e atualizados em tempo real no Supabase.'
                  : 'Conecte as chaves da API do Supabase (Project URL e Anon Key) para sincronizar dados em tempo real.'}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSupabaseModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow transition-all flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isUsingSupabase ? 'Gerenciar Chaves da API' : 'Adicionar API Supabase'}</span>
                </button>

                {isUsingSupabase && (
                  <button
                    type="button"
                    onClick={() => refreshFromSupabase()}
                    className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sincronizar agora</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for creating or editing service */}
      <ServiceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveService}
        serviceToEdit={editingService}
      />

      {/* Modal for connecting Supabase API */}
      <SupabaseModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />
    </div>
  );
};
