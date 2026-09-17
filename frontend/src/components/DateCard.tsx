import React from 'react';
import { ImportantDate } from '../types';
import { CountdownBadge } from './CountdownBadge';
import { Calendar, Edit2, Trash2 } from 'lucide-react';

interface Props {
  dateItem: ImportantDate;
  onEdit: (item: ImportantDate) => void;
  onDelete: (id: string) => void;
}

export const DateCard: React.FC<Props> = ({ dateItem, onEdit, onDelete }) => {
  const formattedDate = new Date(`${dateItem.event_date}T00:00:00`).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="date-card">
      <div className="date-card-top">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="category-pill">
            <span
              className="category-dot"
              style={{ backgroundColor: dateItem.subject_color || '#64748b' }}
            />
            {dateItem.subject_name || 'Sin Categoría'}
          </div>
          <h3 className="date-card-title">{dateItem.title}</h3>
        </div>

        <CountdownBadge
          daysRemaining={dateItem.days_remaining}
          isOverdue={dateItem.is_overdue}
        />
      </div>

      {dateItem.description && (
        <p className="date-card-desc">{dateItem.description}</p>
      )}

      <div className="date-card-footer">
        <div className="date-meta">
          <Calendar size={14} />
          <span>{formattedDate}</span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn-icon"
            onClick={() => onEdit(dateItem)}
            title="Editar fecha"
          >
            <Edit2 size={14} />
          </button>
          <button
            className="btn-icon delete"
            onClick={() => onDelete(dateItem.id)}
            title="Eliminar fecha"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
