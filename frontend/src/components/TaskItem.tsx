import React from 'react';
import { Task } from '../types';
import { Calendar, Edit2, Trash2 } from 'lucide-react';

interface Props {
  task: Task;
  onToggle: (id: string, isCompleted: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskItem: React.FC<Props> = ({ task, onToggle, onEdit, onDelete }) => {
  const formattedDate = task.due_date
    ? new Date(`${task.due_date}T00:00:00`).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className={`task-item ${task.is_completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.is_completed}
        onChange={(e) => onToggle(task.id, e.target.checked)}
        aria-label="Marcar tarea como completada"
      />

      <div className="task-body">
        <span className="task-title">{task.title}</span>
        {task.description && <p className="task-desc">{task.description}</p>}

        <div className="task-footer">
          <div className="category-pill" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
            <span
              className="category-dot"
              style={{ backgroundColor: task.subject_color || '#64748b', width: '6px', height: '6px' }}
            />
            {task.subject_name || 'Sin Categoría'}
          </div>

          {formattedDate && (
            <div className="date-meta" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>
      </div>

      <div className="task-actions">
        <button
          className="btn-icon"
          onClick={() => onEdit(task)}
          title="Editar tarea"
          style={{ padding: '6px' }}
        >
          <Edit2 size={13} />
        </button>
        <button
          className="btn-icon delete"
          onClick={() => onDelete(task.id)}
          title="Eliminar tarea"
          style={{ padding: '6px' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
