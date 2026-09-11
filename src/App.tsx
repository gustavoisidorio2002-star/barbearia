/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BarbershopProvider, useBarbershop } from './context/BarbershopContext';
import { Navbar } from './components/Navbar';
import { BookingFlow } from './components/ClientBooking/BookingFlow';
import { BarberDashboard } from './components/BarberAdmin/BarberDashboard';
import { MyAppointments } from './components/ClientBooking/MyAppointments';
import { ActiveTab } from './types';
import { Scissors, Phone, MapPin, Clock, Instagram } from 'lucide-react';
import { SupabaseModal } from './components/BarberAdmin/SupabaseModal';

function BarbershopApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('booking');
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const { profile, businessHours } = useBarbershop();

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1115] text-[#f3f4f6] selection:bg-amber-500 selection:text-zinc-950 font-sans">
      {/* Header Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)} 
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {activeTab === 'booking' && (
          <BookingFlow onGoToMyAppointments={() => setActiveTab('my-appointments')} />
        )}

        {activeTab === 'barber-dashboard' && <BarberDashboard />}

        {activeTab === 'my-appointments' && (
          <MyAppointments onBackToBooking={() => setActiveTab('booking')} />
        )}

        <SupabaseModal
          isOpen={supabaseModalOpen}
          onClose={() => setSupabaseModalOpen(false)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#121418] text-zinc-400 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            {/* Column 1: Shop */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-200 font-serif font-black text-base">
                <Scissors className="w-5 h-5 text-amber-400" />
                <span>{profile.shopName}</span>
              </div>
              <p className="text-zinc-400 leading-relaxed max-w-xs">
                {profile.tagline}
              </p>
              <div className="text-zinc-500 text-[11px]">
                Barbeiro Responsável: <span className="text-zinc-300 font-medium">{profile.name}</span>
              </div>
            </div>

            {/* Column 2: Hours & Contact */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-zinc-200 uppercase tracking-wider text-[11px]">
                Atendimento & Horários
              </h4>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Segunda a Sábado: {businessHours.openTime} às {businessHours.closeTime}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{profile.phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{profile.instagram}</span>
              </p>
            </div>

            {/* Column 3: Location & Mode Switcher */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-zinc-200 uppercase tracking-wider text-[11px]">
                Localização & Acessos
              </h4>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{profile.address}</span>
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('booking')}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] transition-colors ${
                    activeTab === 'booking'
                      ? 'border-amber-500 text-amber-300 bg-amber-500/10'
                      : 'border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Agendamento Cliente
                </button>
                <button
                  onClick={() => setActiveTab('barber-dashboard')}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] transition-colors ${
                    activeTab === 'barber-dashboard'
                      ? 'border-amber-500 text-amber-300 bg-amber-500/10'
                      : 'border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Área do Barbeiro
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
            <span>© {new Date().getFullYear()} {profile.shopName}. Todos os direitos reservados.</span>
            <span>Sistema de Agendamento Inteligente para Barbearias</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BarbershopProvider>
      <BarbershopApp />
    </BarbershopProvider>
  );
}
