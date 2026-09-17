import React, { useEffect, useState } from 'react';
import { Subject } from '../types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: string) => Promise<void>;
  initialData?: Subject | null;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Azul
  '#06b6d4', // Cian
  '#10b981', // Esmeralda
  '#84cc16', // Lima
  '#eab308', // Amarillo
  '#f97316', // Naranja
  '#ef4444', // Rojo
  '#ec4899', // Rosa
  '#a855f7', // Violeta
];

export const SubjectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setColor(initialData.color);
    } else {
      setName('');
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la materia es requerido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(name.trim(), color);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la materia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {initialData ? 'Editar Materia / Categoría' : 'Nueva Materia / Categoría'}
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
            <label className="form-label">Nombre de la Materia *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Matemática, Ciencia de Datos, Algoritmos..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Color Distintivo</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: c,
                    border: color === c ? '3px solid #ffffff' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
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
              {loading ? 'Guardando...' : initialData ? 'Guardar Cambios' : 'Crear Materia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
