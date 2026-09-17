import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ImportantDate, Subject, Task } from '../types';
import { DateCard } from '../components/DateCard';
import { TaskItem } from '../components/TaskItem';
import { DateModal } from '../components/DateModal';
import { TaskModal } from '../components/TaskModal';
import { SubjectModal } from '../components/SubjectModal';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react';

interface Props {
  onMetricsUpdate?: (m: { upcoming: number; pending: number; overdue: number }) => void;
}

export const Dashboard: React.FC<Props> = ({ onMetricsUpdate }) => {
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [taskFilter, setTaskFilter] = useState<'pending' | 'completed' | 'all'>('pending');

  // Modals
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [datesData, tasksData, subjectsData] = await Promise.all([
        api.getDates(),
        api.getTasks(),
        api.getSubjects(),
      ]);
      setDates(datesData);
      setTasks(tasksData);
      setSubjects(subjectsData);
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers para Fechas
  const handleSaveDate = async (data: {
    subject_id?: string | null;
    title: string;
    description: string;
    event_date: string;
  }) => {
    if (editingDate) {
      await api.updateDate(editingDate.id, data);
    } else {
      await api.createDate(data);
    }
    await loadData();
  };

  const handleDeleteDate = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta fecha importante?')) {
      await api.deleteDate(id);
      setDates((prev) => prev.filter((d) => d.id !== id));
    }
  };

  // Handlers para Tareas
  const handleSaveTask = async (data: {
    subject_id?: string | null;
    title: string;
    description: string;
    due_date?: string | null;
  }) => {
    if (editingTask) {
      await api.updateTask(editingTask.id, data);
    } else {
      await api.createTask(data);
    }
    await loadData();
  };

  const handleToggleTask = async (id: string, isCompleted: boolean) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_completed: isCompleted } : t))
    );
    try {
      await api.toggleTask(id, isCompleted);
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
      await loadData();
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta tarea?')) {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // Filtrado de fechas
  const filteredDates = dates.filter((date) => {
    if (selectedSubjectFilter === 'all') return true;
    if (selectedSubjectFilter === 'none') return !date.subject_id;
    return date.subject_id === selectedSubjectFilter;
  });

  // Filtrado de tareas
  const filteredTasks = tasks.filter((task) => {
    // Primero filtro por pestaña
    if (taskFilter === 'pending' && task.is_completed) return false;
    if (taskFilter === 'completed' && !task.is_completed) return false;

    // Luego filtro por materia si está seleccionada
    if (selectedSubjectFilter === 'all') return true;
    if (selectedSubjectFilter === 'none') return !task.subject_id;
    return task.subject_id === selectedSubjectFilter;
  });

  // Sincronizar métricas hacia el Navbar
  useEffect(() => {
    if (onMetricsUpdate) {
      const upcoming = dates.filter((d) => !d.is_overdue).length;
      const overdue = dates.filter((d) => d.is_overdue).length;
      const pending = tasks.filter((t) => !t.is_completed).length;
      onMetricsUpdate({ upcoming, pending, overdue });
    }
  }, [dates, tasks, onMetricsUpdate]);

  return (
    <div>

      {/* Global Category Filter */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
          FILTRAR POR MATERIA / CATEGORÍA:
        </div>
        <div className="filter-bar">
          <button
            className={`filter-chip ${selectedSubjectFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedSubjectFilter('all')}
          >
            Todas las categorías
          </button>
          <button
            className={`filter-chip ${selectedSubjectFilter === 'none' ? 'active' : ''}`}
            onClick={() => setSelectedSubjectFilter('none')}
          >
            Sin Categoría
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              className={`filter-chip ${selectedSubjectFilter === sub.id ? 'active' : ''}`}
              onClick={() => setSelectedSubjectFilter(sub.id)}
              style={{
                borderColor: selectedSubjectFilter === sub.id ? sub.color : undefined,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: sub.color,
                  marginRight: 6,
                }}
              />
              {sub.name}
            </button>
          ))}
          <button
            className="filter-chip"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => setIsSubjectModalOpen(true)}
          >
            <Plus size={13} />
            Nueva Materia
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="dashboard-grid">
        {/* Columna Izquierda: Fechas Importantes */}
        <section className="dashboard-panel panel-dates">
          <div className="panel-header">
            <div className="panel-title-group">
              <div className="panel-icon-badge panel-icon-dates">
                <Clock size={19} />
              </div>
              <div>
                <h2 className="panel-title">
                  Fechas Importantes
                  <span className="panel-count">{filteredDates.length}</span>
                </h2>
              </div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditingDate(null);
                setIsDateModalOpen(true);
              }}
            >
              <Plus size={15} />
              <span>Agregar Fecha</span>
            </button>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-title">Cargando fechas importantes...</div>
            </div>
          ) : filteredDates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Calendar size={24} />
              </div>
              <div className="empty-title">No hay fechas importantes registradas</div>
              <p className="empty-desc">
                Agregá parciales, exámenes finales, entregas de trabajos o turnos médicos.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditingDate(null);
                  setIsDateModalOpen(true);
                }}
              >
                <Plus size={14} />
                Agregar primera fecha
              </button>
            </div>
          ) : (
            <div className="date-cards-list">
              {filteredDates.map((dateItem) => (
                <DateCard
                  key={dateItem.id}
                  dateItem={dateItem}
                  onEdit={(item) => {
                    setEditingDate(item);
                    setIsDateModalOpen(true);
                  }}
                  onDelete={handleDeleteDate}
                />
              ))}
            </div>
          )}
        </section>

        {/* Columna Derecha: To-Do List (Tareas Pendientes) */}
        <section className="dashboard-panel panel-tasks">
          <div className="panel-header">
            <div className="panel-title-group">
              <div className="panel-icon-badge panel-icon-tasks">
                <CheckCircle2 size={19} />
              </div>
              <div>
                <h2 className="panel-title">
                  Tareas Pendientes
                  <span className="panel-count">{filteredTasks.length}</span>
                </h2>
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
            >
              <Plus size={15} />
              <span>Nueva Tarea</span>
            </button>
          </div>

          {/* Filtros de estado para tareas */}
          <div className="filter-bar" style={{ marginBottom: '14px' }}>
            <button
              className={`filter-chip ${taskFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setTaskFilter('pending')}
            >
              Pendientes ({tasks.filter((t) => !t.is_completed).length})
            </button>
            <button
              className={`filter-chip ${taskFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTaskFilter('all')}
            >
              Todas ({tasks.length})
            </button>
            <button
              className={`filter-chip ${taskFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setTaskFilter('completed')}
            >
              Completadas ({tasks.filter((t) => t.is_completed).length})
            </button>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-title">Cargando tareas...</div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <CheckCircle2 size={24} />
              </div>
              <div className="empty-title">
                {taskFilter === 'pending'
                  ? '¡No tenés tareas pendientes!'
                  : 'No se encontraron tareas'}
              </div>
              <p className="empty-desc">
                Anotá tareas informales como leer apuntes, coordinar con tu grupo de estudio o tareas personales.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
              >
                <Plus size={14} />
                Agregar tarea
              </button>
            </div>
          ) : (
            <div className="task-list">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setIsTaskModalOpen(true);
                  }}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      <DateModal
        isOpen={isDateModalOpen}
        onClose={() => {
          setIsDateModalOpen(false);
          setEditingDate(null);
        }}
        onSubmit={handleSaveDate}
        initialData={editingDate}
        subjects={subjects}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        initialData={editingTask}
        subjects={subjects}
      />

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSubmit={async (name, color) => {
          await api.createSubject(name, color);
          await loadData();
        }}
      />
    </div>
  );
};
