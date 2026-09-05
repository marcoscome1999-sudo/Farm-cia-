import React, { useState } from 'react';
import { X, ShieldAlert, FileText, CheckCircle2, UserCheck } from 'lucide-react';
import { MedicalPrescription } from '../types.ts';

interface PrescriptionModalProps {
  controlledItemsNames: string[];
  initialData?: MedicalPrescription | null;
  onSave: (prescription: MedicalPrescription) => void;
  onClose: () => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  controlledItemsNames,
  initialData,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<MedicalPrescription>(
    initialData || {
      numero_receita: '',
      nome_medico: '',
      numero_ordem_medico: '',
      hospital_clinica: '',
      nome_paciente: '',
      documento_paciente: '',
      data_prescricao: new Date().toISOString().split('T')[0],
      medicamentos_retidos: controlledItemsNames.join(', '),
      observacoes: '',
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.numero_receita.trim()) errs.numero_receita = 'Nº da receita é obrigatório';
    if (!formData.nome_medico.trim()) errs.nome_medico = 'Nome do médico é obrigatório';
    if (!formData.nome_paciente.trim()) errs.nome_paciente = 'Nome do paciente é obrigatório';
    if (!formData.data_prescricao) errs.data_prescricao = 'Data da receita é obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...formData,
        medicamentos_retidos: formData.medicamentos_retidos || controlledItemsNames.join(', '),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden my-6">
        
        {/* Header com Alerta de Controlo Sanitário */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Registo de Receita Médica</h3>
              <p className="text-xs text-amber-800 font-medium">Obrigatório para medicamentos controlados / psicotrópicos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900">
            <span className="font-semibold">Substâncias sujeitas a retenção no carrinho:</span>
            <div className="mt-1 font-mono font-medium text-slate-800">
              {controlledItemsNames.join(', ')}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº da Receita Médica *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: REC-2026/8941"
                value={formData.numero_receita}
                onChange={e => setFormData({ ...formData, numero_receita: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              {errors.numero_receita && <p className="text-[11px] text-rose-500 mt-0.5">{errors.numero_receita}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data da Prescrição *
              </label>
              <input
                type="date"
                required
                value={formData.data_prescricao}
                onChange={e => setFormData({ ...formData, data_prescricao: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              {errors.data_prescricao && <p className="text-[11px] text-rose-500 mt-0.5">{errors.data_prescricao}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Médico Prescritor *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Dr. Salvador Cossa"
                value={formData.nome_medico}
                onChange={e => setFormData({ ...formData, nome_medico: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              {errors.nome_medico && <p className="text-[11px] text-rose-500 mt-0.5">{errors.nome_medico}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº Cédula / Ordem dos Médicos
              </label>
              <input
                type="text"
                placeholder="Ex: OMM-1849"
                value={formData.numero_ordem_medico || ''}
                onChange={e => setFormData({ ...formData, numero_ordem_medico: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hospital / Clínica / Consultório
            </label>
            <input
              type="text"
              placeholder="Ex: Hospital Central de Maputo / Clínica 24h"
              value={formData.hospital_clinica || ''}
              onChange={e => setFormData({ ...formData, hospital_clinica: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Paciente *
              </label>
              <input
                type="text"
                required
                placeholder="Nome completo do paciente"
                value={formData.nome_paciente}
                onChange={e => setFormData({ ...formData, nome_paciente: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              {errors.nome_paciente && <p className="text-[11px] text-rose-500 mt-0.5">{errors.nome_paciente}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Doc. Identificação (BI / Passaporte)
              </label>
              <input
                type="text"
                placeholder="Ex: BI 110293847291F"
                value={formData.documento_paciente || ''}
                onChange={e => setFormData({ ...formData, documento_paciente: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Posologia e Observações Médicas
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Tomar 1 comprimido ao deitar por 30 dias."
              value={formData.observacoes || ''}
              onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Validar e Reter Receita</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
