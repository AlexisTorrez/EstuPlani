import React, { useEffect, useState } from 'react';
import { Link } from '../types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, url: string) => Promise<void>;
  initialData?: Link | null;
  subjectName: string;
}

export const LinkModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  subjectName,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setUrl(initialData.url);
    } else {
      setTitle('');
      setUrl('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setError('El nombre y el enlace son obligatorios');
      return;
    }

    const lower = url.trim().toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
      setError('Por seguridad, solo se permiten enlaces web legítimos (http:// o https://)');
      return;
    }

    // Asegurar prefijo http/https si falta
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(title.trim(), finalUrl);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el enlace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {initialData ? 'Editar Enlace' : 'Nuevo Enlace Útil'}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Asociado a: {subjectName}
            </span>
          </div>
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
            <label className="form-label">Nombre del Enlace *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Drive de documentos, Campus Virtual, Notion..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">URL del Enlace *</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://drive.google.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
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
              {loading ? 'Guardando...' : initialData ? 'Guardar Cambios' : 'Agregar Enlace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
