import React from 'react';
import { 
  Calendar, Clock, DollarSign, XCircle, 
  MessageCircle, Scissors, ArrowLeft, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { useBarbershop } from '../../context/BarbershopContext';
import { formatCurrency, formatPhone, createWhatsAppLink, createGoogleCalendarUrl } from '../../utils/timeUtils';

interface MyAppointmentsProps {
  onBackToBooking: () => void;
}

export const MyAppointments: React.FC<MyAppointmentsProps> = ({ onBackToBooking }) => {
  const { appointments, clientAppointmentIds, cancelAppointment, profile } = useBarbershop();

  // Find appointments that belong to this browser session
  const myAppointments = appointments
    .filter((a) => clientAppointmentIds.includes(a.id))
    .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  const handleCancel = (id: string, serviceName: string) => {
    if (window.confirm(`Deseja realmente cancelar o agendamento de "${serviceName}"?`)) {
      cancelAppointment(id);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToBooking}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Voltar ao agendamento"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-amber-100 font-serif">
              Meus Agendamentos
            </h1>
            <p className="text-xs text-zinc-400">
              Histórico de horários reservados por você neste dispositivo.
            </p>
          </div>
        </div>

        <button
          onClick={onBackToBooking}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all shadow"
        >
          Novo Agendamento
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {myAppointments.map((apt) => {
          const isConfirmed = apt.status === 'confirmed';
          const isCompleted = apt.status === 'completed';
          const isCancelled = apt.status === 'cancelled';

          return (
            <div
              key={apt.id}
              className={`bg-[#181a20] border rounded-2xl p-5 transition-all shadow-md ${
                isCancelled
                  ? 'border-zinc-800/60 opacity-60 bg-zinc-900/40'
                  : isCompleted
                  ? 'border-emerald-500/30 bg-emerald-950/5'
                  : 'border-amber-500/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-amber-400 shrink-0">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-zinc-100 font-serif">
                        {apt.serviceName}
                      </h3>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isConfirmed
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : isCompleted
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}
                      >
                        {isConfirmed ? 'Confirmado' : isCompleted ? 'Concluído' : 'Cancelado'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        {apt.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {apt.time} ({apt.durationMinutes} min)
                      </span>
                      <span>•</span>
                      <span className="font-bold text-amber-300">
                        {formatCurrency(apt.servicePrice)}
                      </span>
                    </div>

                    {apt.notes && (
                      <p className="text-xs text-zinc-400 mt-2 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
                        Obs: {apt.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status-specific action buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isConfirmed && (
                    <>
                      <a
                        href={createWhatsAppLink(apt, profile.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors flex items-center gap-1"
                        title="Falar no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">WhatsApp</span>
                      </a>

                      <button
                        onClick={() => handleCancel(apt.id, apt.serviceName)}
                        className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {myAppointments.length === 0 && (
          <div className="p-12 text-center bg-[#181a20] border border-zinc-800 rounded-2xl">
            <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-200">
              Você ainda não possui agendamentos
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Quando você agendar um horário com o barbeiro, ele ficará registrado aqui para fácil consulta e cancelamento se necessário.
            </p>
            <button
              onClick={onBackToBooking}
              className="mt-5 px-5 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20"
            >
              Agendar Meu Primeiro Horário
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
