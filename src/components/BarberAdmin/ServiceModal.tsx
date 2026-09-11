import React, { useState, useEffect } from 'react';
import { X, Check, Clock, DollarSign, Tag, Sparkles } from 'lucide-react';
import { BarberService, ServiceCategory } from '../../types';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Omit<BarberService, 'id'>) => void;
  serviceToEdit?: BarberService | null;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  serviceToEdit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>(45);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [category, setCategory] = useState<ServiceCategory>('cabelo');
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name);
      setDescription(serviceToEdit.description);
      setPrice(serviceToEdit.price);
      setDurationMinutes(serviceToEdit.durationMinutes);
      setCategory(serviceToEdit.category);
      setFeatured(!!serviceToEdit.featured);
      setActive(serviceToEdit.active);
    } else {
      setName('');
      setDescription('');
      setPrice(40);
      setDurationMinutes(30);
      setCategory('cabelo');
      setFeatured(false);
      setActive(true);
    }
    setError('');
  }, [serviceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do serviço.');
      return;
    }
    if (price === '' || price <= 0) {
      setError('Por favor, defina um preço válido maior que zero.');
      return;
    }
    if (durationMinutes <= 0) {
      setError('Por favor, defina uma duração válida em minutos.');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      category,
      featured,
      active,
    });
    onClose();
  };

  const durationPresets = [15, 20, 30, 40, 45, 60, 75, 90];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#181a20] border border-zinc-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#1f222a]">
          <div>
            <h2 className="text-lg font-bold text-amber-100">
              {serviceToEdit ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Defina os dados que os clientes verão no agendamento.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Nome do Serviço */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Nome do Serviço *
            </label>
            <input
              id="service-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Corte Degradê Navalhado"
              className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              Categoria
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: 'cabelo', label: 'Cabelo' },
                  { id: 'barba', label: 'Barba' },
                  { id: 'combo', label: 'Combo' },
                  { id: 'tratamento', label: 'Tratamento' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center ${
                    category === cat.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-semibold'
                      : 'bg-zinc-800/40 border-zinc-700/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preço e Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preço */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Preço (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-semibold">
                  R$
                </span>
                <input
                  id="service-price-input"
                  type="number"
                  step="1"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="40"
                  className="w-full bg-[#121418] border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Duração em Minutos */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Duração (Minutos) *
              </label>
              <div className="relative">
                <input
                  id="service-duration-input"
                  type="number"
                  step="5"
                  min="5"
                  max="300"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">
                  min
                </span>
              </div>
            </div>
          </div>

          {/* Duração Presets */}
          <div>
            <span className="text-[11px] text-zinc-400 block mb-1">
              Atalhos de duração:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {durationPresets.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    durationMinutes === mins
                      ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500'
                      : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Descrição Detalhada
            </label>
            <textarea
              id="service-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Corte com acabamento na navalha, lavatório com shampoo refrescante e pomada matte..."
              className="w-full bg-[#121418] border border-zinc-700 rounded-xl px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
            />
          </div>

          {/* Opções: Destaque e Ativo */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900 accent-amber-500"
              />
              <span className="text-xs text-zinc-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Destacar no cardápio
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-zinc-900 accent-amber-500"
              />
              <span className="text-xs text-zinc-300">
                Disponível para agendamento
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              id="save-service-btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{serviceToEdit ? 'Salvar Alterações' : 'Cadastrar Serviço'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
