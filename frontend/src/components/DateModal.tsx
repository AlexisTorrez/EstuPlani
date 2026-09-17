import React, { useEffect, useState } from 'react';
import { ImportantDate, Subject } from '../types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    subject_id?: string | null;
    title: string;
    description: string;
    event_date: string;
  }) => Promise<void>;
  initialData?: ImportantDate | null;
  subjects: Subject[];
}

export const DateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  subjects,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setEventDate(initialData.event_date);
      setSubjectId(initialData.subject_id || '');
    } else {
      setTitle('');
      setDescription('');
      // Default to today or tomorrow formatted YYYY-MM-DD
      const now = new Date();
      setEventDate(now.toISOString().split('T')[0]);
      setSubjectId('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }
    if (!eventDate) {
      setError('La fecha del evento es requerida');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        event_date: eventDate,
        subject_id: subjectId ? subjectId : null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la fecha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {initialData ? 'Editar Fecha Importante' : 'Nueva Fecha Importante'}
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: 1er Parcial, Entrega TP Final..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Categoría / Materia</label>
            <select
              className="form-select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Sin Categoría (Ej: Turno médico, personal)</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Fecha del Evento *</label>
            <input
              type="date"
              className="form-input"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              placeholder="Ej: Aula 302, Paseo Colón. Traer calculadora y hojas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : initialData ? 'Guardar Cambios' : 'Crear Fecha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
