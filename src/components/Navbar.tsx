import React from 'react';
import { Scissors, Calendar, UserCheck, Clock, MapPin, Store, Database } from 'lucide-react';
import { ActiveTab } from '../types';
import { useBarbershop } from '../context/BarbershopContext';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSupabaseModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenSupabaseModal }) => {
  const { profile, appointments, clientAppointmentIds, isUsingSupabase, syncStatus } = useBarbershop();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointmentsCount = appointments.filter(
    (a) => a.date === todayStr && a.status === 'confirmed'
  ).length;

  const myActiveAppointmentsCount = appointments.filter(
    (a) => clientAppointmentIds.includes(a.id) && a.status === 'confirmed'
  ).length;

  return (
    <header className="border-b border-zinc-800 bg-[#14171d]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Shop Identity */}
          <div 
            onClick={() => setActiveTab('booking')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Scissors className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black tracking-wide text-xl text-amber-100 uppercase">
                  {profile.shopName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Online
                </span>

                {/* Status / Botão Adicionar API Supabase */}
                <button
                  id="navbar-supabase-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSupabaseModal?.();
                  }}
                  title={isUsingSupabase ? 'Supabase Conectado - Gerenciar chaves' : 'Conectar API Supabase'}
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-colors border ${
                    isUsingSupabase
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border-amber-500/30 hover:border-amber-400'
                  }`}
                >
                  <Database className="w-2.5 h-2.5" />
                  <span>{isUsingSupabase ? `API ${syncStatus === 'synced' ? 'Online' : 'Sinc.'}` : 'Adicionar Supabase'}</span>
                </button>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                <span className="line-clamp-1">{profile.address}</span>
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tab: Agendar Horário (Cliente) */}
            <button
              id="tab-booking-btn"
              onClick={() => setActiveTab('booking')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'booking'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Horário</span>
            </button>

            {/* Tab: Meus Agendamentos (Cliente) */}
            <button
              id="tab-my-appointments-btn"
              onClick={() => setActiveTab('my-appointments')}
              className={`relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'my-appointments'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Meus Agendamentos</span>
              <span className="sm:hidden">Meus</span>
              {myActiveAppointmentsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-zinc-950 text-[11px] font-extrabold flex items-center justify-center">
                  {myActiveAppointmentsCount}
                </span>
              )}
            </button>

            {/* Tab: Painel do Barbeiro */}
            <button
              id="tab-barber-dashboard-btn"
              onClick={() => setActiveTab('barber-dashboard')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                activeTab === 'barber-dashboard'
                  ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-bold shadow-md shadow-white/10'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>Painel do Barbeiro</span>
              {todayAppointmentsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {todayAppointmentsCount} hoje
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
