import React, { useEffect, useState } from 'react';
import { Subject, Task } from '../types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    subject_id?: string | null;
    title: string;
    description: string;
    due_date?: string | null;
  }) => Promise<void>;
  initialData?: Task | null;
  subjects: Subject[];
}

export const TaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  subjects,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setDueDate(initialData.due_date || '');
      setSubjectId(initialData.subject_id || '');
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setSubjectId(''); // Por default Sin Categoria
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

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate ? dueDate : null,
        subject_id: subjectId ? subjectId : null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {initialData ? 'Editar Tarea Pendiente' : 'Nueva Tarea Pendiente'}
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
              placeholder="Ej: Terminar entregables TP1, Leer capítulo 4..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Categoría / Materia (Por defecto Sin Categoría)</label>
            <select
              className="form-select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Sin Categoría (Por Defecto)</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Fecha Límite (Opcional)</label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              placeholder="Detalles adicionales de la tarea..."
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
              {loading ? 'Guardando...' : initialData ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
