import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Appointment, AppointmentStatus, BarberProfile, BarberService, BusinessHoursConfig } from '../types';
import { INITIAL_BARBER_PROFILE, INITIAL_BUSINESS_HOURS, INITIAL_SERVICES, getInitialAppointments } from '../data/initialData';
import { calculateEndTime } from '../utils/timeUtils';
import { 
  supabase as initialSupabase, 
  isSupabaseConfigured as initialIsConfigured,
  getStoredSupabaseCredentials,
  saveStoredSupabaseCredentials,
  clearStoredSupabaseCredentials,
  updateActiveSupabaseClient
} from '../lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

interface BarbershopContextType {
  services: BarberService[];
  activeServices: BarberService[];
  addService: (serviceData: Omit<BarberService, 'id'>) => Promise<BarberService>;
  updateService: (id: string, serviceData: Partial<BarberService>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  toggleServiceActive: (id: string) => Promise<void>;

  businessHours: BusinessHoursConfig;
  updateBusinessHours: (config: BusinessHoursConfig) => Promise<void>;

  profile: BarberProfile;
  updateProfile: (profileData: Partial<BarberProfile>) => Promise<void>;

  appointments: Appointment[];
  bookAppointment: (data: {
    serviceId: string;
    serviceName: string;
    servicePrice: number;
    durationMinutes: number;
    date: string;
    time: string;
    clientName: string;
    clientPhone: string;
    notes?: string;
  }) => Promise<Appointment>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;

  clientAppointmentIds: string[];
  resetToDefault: () => Promise<void>;

  // Supabase API state
  isUsingSupabase: boolean;
  syncStatus: 'synced' | 'syncing' | 'local' | 'error';
  syncError: string | null;
  supabaseCredentials: { url: string; anonKey: string };
  saveSupabaseCredentials: (url: string, anonKey: string) => Promise<void>;
  disconnectSupabase: () => void;
  refreshFromSupabase: (clientOverride?: SupabaseClient) => Promise<void>;
}

const STORAGE_KEYS = {
  SERVICES: 'barbershop_services_v1',
  BUSINESS_HOURS: 'barbershop_business_hours_v1',
  PROFILE: 'barbershop_profile_v1',
  APPOINTMENTS: 'barbershop_appointments_v1',
  CLIENT_APPOINTMENT_IDS: 'barbershop_my_appointments_v1',
};

const BarbershopContext = createContext<BarbershopContextType | undefined>(undefined);

export const BarbershopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(initialSupabase);
  const [supabaseCredentials, setSupabaseCredentials] = useState<{ url: string; anonKey: string }>(
    getStoredSupabaseCredentials
  );
  const [isUsingSupabase, setIsUsingSupabase] = useState<boolean>(initialIsConfigured);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'local' | 'error'>(
    initialIsConfigured ? 'syncing' : 'local'
  );
  const [syncError, setSyncError] = useState<string | null>(null);

  const [services, setServices] = useState<BarberService[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
      return saved ? JSON.parse(saved) : INITIAL_SERVICES;
    } catch {
      return INITIAL_SERVICES;
    }
  });

  const [businessHours, setBusinessHours] = useState<BusinessHoursConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUSINESS_HOURS);
      return saved ? JSON.parse(saved) : INITIAL_BUSINESS_HOURS;
    } catch {
      return INITIAL_BUSINESS_HOURS;
    }
  });

  const [profile, setProfile] = useState<BarberProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : INITIAL_BARBER_PROFILE;
    } catch {
      return INITIAL_BARBER_PROFILE;
    }
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return saved ? JSON.parse(saved) : getInitialAppointments();
    } catch {
      return getInitialAppointments();
    }
  });

  const [clientAppointmentIds, setClientAppointmentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENT_APPOINTMENT_IDS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // LocalStorage backups
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    } catch (e) {
      console.error('Failed to cache services', e);
    }
  }, [services]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUSINESS_HOURS, JSON.stringify(businessHours));
    } catch (e) {
      console.error('Failed to cache business hours', e);
    }
  }, [businessHours]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to cache profile', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch (e) {
      console.error('Failed to cache appointments', e);
    }
  }, [appointments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENT_APPOINTMENT_IDS, JSON.stringify(clientAppointmentIds));
    } catch (e) {
      console.error('Failed to cache client appointment IDs', e);
    }
  }, [clientAppointmentIds]);

  // Synchronize initial data from Supabase API
  const refreshFromSupabase = useCallback(async (clientOverride?: SupabaseClient) => {
    const activeClient = clientOverride || supabaseClient;
    if (!activeClient) {
      setSyncStatus('local');
      return;
    }

    try {
      setSyncStatus('syncing');
      setSyncError(null);

      // 1. Fetch Services
      const { data: servicesData, error: servicesError } = await activeClient
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;

      if (servicesData && servicesData.length > 0) {
        const mappedServices: BarberService[] = servicesData.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          price: Number(s.price),
          durationMinutes: Number(s.duration_minutes),
          category: s.category,
          active: Boolean(s.active),
          featured: Boolean(s.featured),
        }));
        setServices(mappedServices);
      } else {
        // Table exists but empty, seed default services
        const seedPayload = INITIAL_SERVICES.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: s.price,
          duration_minutes: s.durationMinutes,
          category: s.category,
          active: s.active,
          featured: s.featured,
        }));
        await activeClient.from('services').upsert(seedPayload);
      }

      // 2. Fetch Appointments
      const { data: appointmentsData, error: appointmentsError } = await activeClient
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      if (appointmentsData && appointmentsData.length > 0) {
        const mappedAppointments: Appointment[] = appointmentsData.map((a: any) => ({
          id: a.id,
          serviceId: a.service_id,
          serviceName: a.service_name,
          servicePrice: Number(a.service_price),
          durationMinutes: Number(a.duration_minutes),
          date: a.date,
          time: a.time,
          endTime: a.end_time,
          clientName: a.client_name,
          clientPhone: a.client_phone,
          notes: a.notes || undefined,
          status: a.status,
          createdAt: a.created_at,
        }));
        setAppointments(mappedAppointments);
      }

      // 3. Fetch Settings
      const { data: settingsData, error: settingsError } = await activeClient
        .from('barbershop_settings')
        .select('*');

      if (settingsError) throw settingsError;

      if (settingsData) {
        settingsData.forEach((row: any) => {
          if (row.key === 'profile' && row.value) {
            setProfile((prev) => ({ ...prev, ...row.value }));
          }
          if (row.key === 'business_hours' && row.value) {
            setBusinessHours((prev) => ({ ...prev, ...row.value }));
          }
        });
      }

      setSyncStatus('synced');
    } catch (err: any) {
      console.warn('Supabase fetch error:', err.message || err);
      setSyncStatus('error');
      setSyncError(err.message || 'Falha ao sincronizar com o Supabase');
    }
  }, [supabaseClient]);

  // Connect new credentials
  const saveSupabaseCredentials = async (url: string, anonKey: string) => {
    saveStoredSupabaseCredentials(url, anonKey);
    setSupabaseCredentials({ url, anonKey });

    const newClient = updateActiveSupabaseClient(url, anonKey);
    setSupabaseClient(newClient);
    setIsUsingSupabase(Boolean(newClient));

    if (newClient) {
      await refreshFromSupabase(newClient);
    } else {
      setSyncStatus('local');
    }
  };

  const disconnectSupabase = () => {
    clearStoredSupabaseCredentials();
    setSupabaseCredentials({ url: '', anonKey: '' });
    setSupabaseClient(null);
    setIsUsingSupabase(false);
    setSyncStatus('local');
    setSyncError(null);
  };

  // Realtime subscription
  useEffect(() => {
    if (supabaseClient && isUsingSupabase) {
      refreshFromSupabase();

      const channel = supabaseClient
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments' },
          () => {
            refreshFromSupabase();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'services' },
          () => {
            refreshFromSupabase();
          }
        )
        .subscribe();

      return () => {
        supabaseClient.removeChannel(channel);
      };
    }
  }, [supabaseClient, isUsingSupabase, refreshFromSupabase]);

  // Service CRUD
  const addService = async (serviceData: Omit<BarberService, 'id'>): Promise<BarberService> => {
    const newService: BarberService = {
      ...serviceData,
      id: `srv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setServices((prev) => [newService, ...prev]);

    if (supabaseClient && isUsingSupabase) {
      try {
        await supabaseClient.from('services').insert({
          id: newService.id,
          name: newService.name,
          description: newService.description,
          price: newService.price,
          duration_minutes: newService.durationMinutes,
          category: newService.category,
          active: newService.active,
          featured: newService.featured,
        });
      } catch (err) {
        console.error('Error adding service to Supabase:', err);
      }
    }

    return newService;
  };

  const updateService = async (id: string, serviceData: Partial<BarberService>) => {
    setServices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...serviceData } : item))
    );

    if (supabaseClient && isUsingSupabase) {
      try {
        const payload: any = {};
        if (serviceData.name !== undefined) payload.name = serviceData.name;
        if (serviceData.description !== undefined) payload.description = serviceData.description;
        if (serviceData.price !== undefined) payload.price = serviceData.price;
        if (serviceData.durationMinutes !== undefined) payload.duration_minutes = serviceData.durationMinutes;
        if (serviceData.category !== undefined) payload.category = serviceData.category;
        if (serviceData.active !== undefined) payload.active = serviceData.active;
        if (serviceData.featured !== undefined) payload.featured = serviceData.featured;

        await supabaseClient.from('services').update(payload).eq('id', id);
      } catch (err) {
        console.error('Error updating service in Supabase:', err);
      }
    }
  };

  const deleteService = async (id: string) => {
    setServices((prev) => prev.filter((item) => item.id !== id));

    if (supabaseClient && isUsingSupabase) {
      try {
        await supabaseClient.from('services').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting service in Supabase:', err);
      }
    }
  };

  const toggleServiceActive = async (id: string) => {
    const target = services.find((s) => s.id === id);
    if (!target) return;
    const newActive = !target.active;

    setServices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: newActive } : item))
    );

    if (supabaseClient && isUsingSupabase) {
      try {
        await supabaseClient.from('services').update({ active: newActive }).eq('id', id);
      } catch (err) {
        console.error('Error toggling service in Supabase:', err);
      }
    }
  };

  const updateBusinessHours = async (config: BusinessHoursConfig) => {
    setBusinessHours(config);

    if (supabaseClient && isUsingSupabase) {
      try {
        await supabaseClient
          .from('barbershop_settings')
          .upsert({ key: 'business_hours', value: config });
      } catch (err) {
        console.error('Error saving business hours in Supabase:', err);
      }
    }
  };

  const updateProfile = async (profileData: Partial<BarberProfile>) => {
    const newProfile = { ...profile, ...profileData };
    setProfile(newProfile);

    if (supabaseClient && isUsingSupabase) {
      try {
        await supabaseClient
          .from('barbershop_settings')
          .upsert({ key: 'profile', value: newProfile });
      } catch (err) {
        console.error('Error saving profile in Supabase:', err);
      }
    }
  };

  const bookAppointment = async (data: {
    serviceId: string;
    serviceName: string;
    servicePrice: number;
    durationMinutes: number;
    date: string;
    time: string;
    clientName: string;
    clientPhone: string;
    notes?: string;
  }): Promise<Appointment> => {
    const endTime = calculateEndTime(data.time, data.durationMinutes);
    const newAppointment: Appointment = {
      ...data,
      id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      endTime,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [newAppointment, ...prev]);
    setClientAppointmentIds((prev) => [newAppointment.id, ...prev]);

    if (supabaseClient && isUsingSupabase) {
      try {
        await supabaseClient.from('appointments').insert({
          id: newAppointment.id,
          service_id: newAppointment.serviceId,
          service_name: newAppointment.serviceName,
          service_price: newAppointment.servicePrice,
          duration_minutes: newAppointment.durationMinutes,
          date: newAppointment.date,
          time: newAppointment.time,
          end_time: newAppointment.endTime,
          client_name: newAppointment.clientName,
          client_phone: newAppointment.clientPhone,
          notes: newAppointment.notes || null,
          status: newAppointment.status,
          created_at: newAppointment.createdAt,
        });
      } catch (err) {
        console.error('Error booking appointment in Supabase:', err);
      }
    }

    return newAppointment;
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
    );

    if (supabaseClient && isUsingSupabase) {
      try {
        await supabaseClient.from('appointments').update({ status }).eq('id', id);
      } catch (err) {
        console.error('Error updating appointment in Supabase:', err);
      }
    }
  };

  const cancelAppointment = async (id: string) => {
    await updateAppointmentStatus(id, 'cancelled');
  };

  const resetToDefault = async () => {
    setServices(INITIAL_SERVICES);
    setBusinessHours(INITIAL_BUSINESS_HOURS);
    setProfile(INITIAL_BARBER_PROFILE);
    const initialApts = getInitialAppointments();
    setAppointments(initialApts);
    setClientAppointmentIds([]);

    if (supabaseClient && isUsingSupabase) {
      try {
        const seedServices = INITIAL_SERVICES.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: s.price,
          duration_minutes: s.durationMinutes,
          category: s.category,
          active: s.active,
          featured: s.featured,
        }));
        await supabaseClient.from('services').upsert(seedServices);
        await supabaseClient
          .from('barbershop_settings')
          .upsert({ key: 'business_hours', value: INITIAL_BUSINESS_HOURS });
        await supabaseClient
          .from('barbershop_settings')
          .upsert({ key: 'profile', value: INITIAL_BARBER_PROFILE });
      } catch (err) {
        console.error('Error resetting Supabase defaults:', err);
      }
    }
  };

  const activeServices = services.filter((s) => s.active);

  return (
    <BarbershopContext.Provider
      value={{
        services,
        activeServices,
        addService,
        updateService,
        deleteService,
        toggleServiceActive,
        businessHours,
        updateBusinessHours,
        profile,
        updateProfile,
        appointments,
        bookAppointment,
        updateAppointmentStatus,
        cancelAppointment,
        clientAppointmentIds,
        resetToDefault,
        isUsingSupabase,
        syncStatus,
        syncError,
        supabaseCredentials,
        saveSupabaseCredentials,
        disconnectSupabase,
        refreshFromSupabase,
      }}
    >
      {children}
    </BarbershopContext.Provider>
  );
};

export const useBarbershop = () => {
  const context = useContext(BarbershopContext);
  if (!context) {
    throw new Error('useBarbershop must be used within a BarbershopProvider');
  }
  return context;
};
