import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Subject, SubjectDetailResponse, ImportantDate, Task, Link } from '../types';
import { DateCard } from '../components/DateCard';
import { TaskItem } from '../components/TaskItem';
import { SubjectModal } from '../components/SubjectModal';
import { DateModal } from '../components/DateModal';
import { TaskModal } from '../components/TaskModal';
import { LinkModal } from '../components/LinkModal';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Edit2,
  ExternalLink,
  FileText,
  Link2,
  List,
  Plus,
  Trash2,
} from 'lucide-react';

export const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [subjectDetail, setSubjectDetail] = useState<SubjectDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Notas de la materia
  const [notesText, setNotesText] = useState<string>('');
  const [notesSaveStatus, setNotesSaveStatus] = useState<'saved' | 'saving' | 'dirty' | null>(null);
  const notesTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modales
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await api.getSubjects();
      setSubjects(data);
      if (data.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(data[0].id);
      }
    } catch (err) {
      console.error('Error cargando materias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const detail = await api.getSubjectDetail(id);
      setSubjectDetail(detail);
    } catch (err) {
      console.error('Error cargando detalle de materia:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      loadDetail(selectedSubjectId);
    } else {
      setSubjectDetail(null);
    }
  }, [selectedSubjectId]);

  // Sincronizar notas cuando cambia la materia seleccionada
  useEffect(() => {
    if (subjectDetail?.subject) {
      setNotesText(subjectDetail.subject.notes || '');
      setNotesSaveStatus('saved');
    }
  }, [subjectDetail?.subject?.id]);

  const handleNotesChange = (newText: string) => {
    setNotesText(newText);
    setNotesSaveStatus('dirty');

    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }

    notesTimeoutRef.current = setTimeout(async () => {
      if (!selectedSubjectId) return;
      try {
        setNotesSaveStatus('saving');
        await api.updateSubject(selectedSubjectId, undefined, undefined, newText);
        setNotesSaveStatus('saved');
        setSubjects((prev) =>
          prev.map((s) => (s.id === selectedSubjectId ? { ...s, notes: newText } : s))
        );
      } catch (err) {
        console.error('Error al guardar notas:', err);
      }
    }, 600);
  };

  const insertBullet = () => {
    const bullet = '• ';
    const updated = notesText
      ? notesText.endsWith('\n')
        ? `${notesText}${bullet}`
        : `${notesText}\n${bullet}`
      : bullet;
    handleNotesChange(updated);
  };

  // Handlers Materia
  const handleSaveSubject = async (name: string, color: string) => {
    if (editingSubject) {
      await api.updateSubject(editingSubject.id, name, color);
    } else {
      const created = await api.createSubject(name, color);
      setSelectedSubjectId(created.id);
    }
    await loadSubjects();
    if (selectedSubjectId) await loadDetail(selectedSubjectId);
  };

  const handleDeleteSubject = async (id: string) => {
    if (
      window.confirm(
        '¿Seguro que deseas eliminar esta materia? Sus enlaces se borrarán y sus fechas/tareas pasarán a "Sin Categoría".'
      )
    ) {
      await api.deleteSubject(id);
      setSelectedSubjectId(null);
      await loadSubjects();
    }
  };

  // Handlers Fechas en Materia
  const handleSaveDate = async (data: {
    title: string;
    description: string;
    event_date: string;
  }) => {
    if (!selectedSubjectId) return;
    if (editingDate) {
      await api.updateDate(editingDate.id, { ...data, subject_id: selectedSubjectId });
    } else {
      await api.createDate({ ...data, subject_id: selectedSubjectId });
    }
    await loadDetail(selectedSubjectId);
  };

  const handleDeleteDate = async (id: string) => {
    if (window.confirm('¿Eliminar esta fecha?')) {
      await api.deleteDate(id);
      if (selectedSubjectId) await loadDetail(selectedSubjectId);
    }
  };

  // Handlers Tareas en Materia
  const handleSaveTask = async (data: {
    title: string;
    description: string;
    due_date?: string | null;
  }) => {
    if (!selectedSubjectId) return;
    if (editingTask) {
      await api.updateTask(editingTask.id, { ...data, subject_id: selectedSubjectId });
    } else {
      await api.createTask({ ...data, subject_id: selectedSubjectId });
    }
    await loadDetail(selectedSubjectId);
  };

  const handleToggleTask = async (id: string, isCompleted: boolean) => {
    await api.toggleTask(id, isCompleted);
    if (selectedSubjectId) await loadDetail(selectedSubjectId);
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('¿Eliminar esta tarea?')) {
      await api.deleteTask(id);
      if (selectedSubjectId) await loadDetail(selectedSubjectId);
    }
  };

  // Handlers Links en Materia
  const handleSaveLink = async (title: string, url: string) => {
    if (!selectedSubjectId) return;
    if (editingLink) {
      await api.updateLink(editingLink.id, { title, url });
    } else {
      await api.createLink({ subject_id: selectedSubjectId, title, url });
    }
    await loadDetail(selectedSubjectId);
  };

  const handleDeleteLink = async (id: string) => {
    if (window.confirm('¿Eliminar este enlace?')) {
      await api.deleteLink(id);
      if (selectedSubjectId) await loadDetail(selectedSubjectId);
    }
  };

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div>
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Materias y Recursos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Cada materia funciona como una categoría con sus fechas importantes, tareas y enlaces de interés.
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          onClick={() => {
            setEditingSubject(null);
            setIsSubjectModalOpen(true);
          }}
        >
          <Plus size={16} />
          <span>Nueva Materia</span>
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-title">Cargando materias...</div>
        </div>
      ) : subjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <BookOpen size={28} />
          </div>
          <div className="empty-title">No tenés materias creadas todavía</div>
          <p className="empty-desc">
            Creá tus materias (por ejemplo: Matemática, Sociales, Ciencia de Datos) para organizar todas tus actividades académicas.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingSubject(null);
              setIsSubjectModalOpen(true);
            }}
          >
            <Plus size={16} />
            Crear primera materia
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Barra Horizontal de Selección de Materias */}
          <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '10px' }}>
              SELECCIONAR MATERIA ({subjects.length}):
            </div>
            <div className="filter-bar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: 0 }}>
              {subjects.map((sub) => {
                const isSelected = sub.id === selectedSubjectId;
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    style={{
                      background: isSelected ? 'rgba(99, 102, 241, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1.5px solid ${isSelected ? sub.color : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-full)',
                      padding: '6px 10px 6px 14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 0 10px ${sub.color}35` : undefined,
                    }}
                  >
                    <span
                      style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        backgroundColor: sub.color,
                        boxShadow: `0 0 6px ${sub.color}`,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontWeight: isSelected ? 700 : 600,
                        fontSize: '0.88rem',
                        color: isSelected ? 'var(--text-main)' : 'var(--text-secondary)',
                      }}
                    >
                      {sub.name}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
                      <button
                        className="btn-icon"
                        style={{ padding: '3px', borderRadius: '50%', background: 'none', border: 'none' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSubject(sub);
                          setIsSubjectModalOpen(true);
                        }}
                        title="Editar materia"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="btn-icon delete"
                        style={{ padding: '3px', borderRadius: '50%', background: 'none', border: 'none' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(sub.id);
                        }}
                        title="Eliminar materia"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contenido Completo de la Materia Seleccionada (Ancho Completo) */}
          {activeSubject && subjectDetail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Cabecera sutil de la materia activa */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '2px 4px',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: activeSubject.color,
                        boxShadow: `0 0 10px ${activeSubject.color}90`,
                      }}
                    />
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{activeSubject.name}</h2>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {subjectDetail.dates.length} {subjectDetail.dates.length === 1 ? 'fecha' : 'fechas'} ·{' '}
                    {subjectDetail.tasks.length} {subjectDetail.tasks.length === 1 ? 'tarea' : 'tareas'} ·{' '}
                    {subjectDetail.links.length} {subjectDetail.links.length === 1 ? 'enlace' : 'enlaces'}
                  </div>
                </div>

                {/* Sección de Notas y Recordatorios de la Materia */}
                <section
                  className="dashboard-panel panel-notes"
                  style={{ borderTop: `3px solid ${activeSubject.color}` }}
                >
                  <div className="panel-header" style={{ marginBottom: '14px' }}>
                    <div className="panel-title-group">
                      <div
                        className="panel-icon-badge panel-icon-notes"
                        style={{
                          background: `${activeSubject.color}18`,
                          color: activeSubject.color,
                          borderColor: `${activeSubject.color}40`,
                        }}
                      >
                        <FileText size={18} />
                      </div>
                      <div>
                        <h3
                          className="panel-title"
                          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                          <span>Notas y Recordatorios</span>
                          {notesSaveStatus === 'saving' && (
                            <span
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--text-muted)',
                                fontWeight: 500,
                              }}
                            >
                              Guardando...
                            </span>
                          )}
                          {notesSaveStatus === 'saved' && (
                            <span
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--success)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600,
                              }}
                            >
                              <Check size={13} /> Guardado
                            </span>
                          )}
                          {notesSaveStatus === 'dirty' && (
                            <span
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--warning)',
                                fontWeight: 500,
                              }}
                            >
                              Escribiendo...
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={insertBullet}
                      title="Insertar viñeta rápida"
                      type="button"
                    >
                      <List size={13} style={{ marginRight: 4 }} />
                      <span>+ Viñeta</span>
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <textarea
                      className="form-input"
                      value={notesText}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Escribí cosas importantes de esta materia (ej: No hablar fuerte en clase porque el profe se enoja, no llegar tarde, solo se permiten faltar 2 clases...)"
                      rows={4}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '8px',
                      fontSize: '0.74rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>💡 Se guarda automáticamente a medida que escribís.</span>
                    <span>
                      {notesText.trim()
                        ? notesText.split('\n').filter(Boolean).length
                        : 0}{' '}
                      {notesText.split('\n').filter(Boolean).length === 1
                        ? 'nota / regla'
                        : 'notas / reglas'}
                    </span>
                  </div>
                </section>

                {/* Sección 1: Enlaces Útiles en su propio panel */}
                <section className="dashboard-panel panel-links">
                  <div className="panel-header">
                    <div className="panel-title-group">
                      <div className="panel-icon-badge panel-icon-links">
                        <Link2 size={18} />
                      </div>
                      <div>
                        <h3 className="panel-title">
                          Enlaces de Interés
                          <span className="panel-count">{subjectDetail.links.length}</span>
                        </h3>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setEditingLink(null);
                        setIsLinkModalOpen(true);
                      }}
                    >
                      <Plus size={14} />
                      Agregar Enlace
                    </button>
                  </div>

                  {subjectDetail.links.length === 0 ? (
                    <div className="empty-state" style={{ padding: '24px' }}>
                      <div className="empty-title">Sin enlaces guardados</div>
                      <p className="empty-desc">
                        Guardá links a Google Drive, carpetas compartidas, campus virtual o apuntes.
                      </p>
                    </div>
                  ) : (
                    <div className="links-grid">
                      {subjectDetail.links.map((link) => (
                        <div key={link.id} className="link-card">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-info"
                            style={{ flex: 1, textDecoration: 'none' }}
                          >
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: 'rgba(99, 102, 241, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--accent)',
                                flexShrink: 0,
                              }}
                            >
                              <ExternalLink size={16} />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <div className="link-title">{link.title}</div>
                              <div className="link-url">{link.url}</div>
                            </div>
                          </a>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className="btn-icon"
                              onClick={() => {
                                setEditingLink(link);
                                setIsLinkModalOpen(true);
                              }}
                              style={{ padding: '6px' }}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              className="btn-icon delete"
                              onClick={() => handleDeleteLink(link.id)}
                              style={{ padding: '6px' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Grid Split Simétrica: Fechas de esta materia y Tareas de esta materia */}
                <div className="subject-detail-grid">
                  {/* Fechas de la materia en panel dedicado */}
                  <section className="dashboard-panel panel-dates">
                    <div className="panel-header">
                      <div className="panel-title-group">
                        <div className="panel-icon-badge panel-icon-dates">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <h3 className="panel-title">
                            Fechas
                            <span className="panel-count">{subjectDetail.dates.length}</span>
                          </h3>
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setEditingDate(null);
                          setIsDateModalOpen(true);
                        }}
                      >
                        <Plus size={14} />
                        Agregar
                      </button>
                    </div>

                    {subjectDetail.dates.length === 0 ? (
                      <div className="empty-state" style={{ padding: '24px' }}>
                        <div className="empty-title">Sin fechas para esta materia</div>
                      </div>
                    ) : (
                      <div className="date-cards-list">
                        {subjectDetail.dates.map((d) => (
                          <DateCard
                            key={d.id}
                            dateItem={d}
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

                  {/* Tareas de la materia en panel dedicado */}
                  <section className="dashboard-panel panel-tasks">
                    <div className="panel-header">
                      <div className="panel-title-group">
                        <div className="panel-icon-badge panel-icon-tasks">
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <h3 className="panel-title">
                            Tareas
                            <span className="panel-count">{subjectDetail.tasks.length}</span>
                          </h3>
                        </div>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditingTask(null);
                          setIsTaskModalOpen(true);
                        }}
                      >
                        <Plus size={14} />
                        Agregar
                      </button>
                    </div>

                    {subjectDetail.tasks.length === 0 ? (
                      <div className="empty-state" style={{ padding: '24px' }}>
                        <div className="empty-title">Sin tareas para esta materia</div>
                      </div>
                    ) : (
                      <div className="task-list">
                        {subjectDetail.tasks.map((t) => (
                          <TaskItem
                            key={t.id}
                            task={t}
                            onToggle={handleToggleTask}
                            onEdit={(item) => {
                              setEditingTask(item);
                              setIsTaskModalOpen(true);
                            }}
                            onDelete={handleDeleteTask}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            ) : loadingDetail ? (
              <div className="empty-state">
                <div className="empty-title">Cargando detalles de la materia...</div>
              </div>
            ) : null}
        </div>
      )}

      {/* Modals */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSubmit={handleSaveSubject}
        initialData={editingSubject}
      />

      <DateModal
        isOpen={isDateModalOpen}
        onClose={() => {
          setIsDateModalOpen(false);
          setEditingDate(null);
        }}
        onSubmit={async (data) => {
          await handleSaveDate({
            title: data.title,
            description: data.description,
            event_date: data.event_date,
          });
        }}
        initialData={editingDate}
        subjects={subjects}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={async (data) => {
          await handleSaveTask({
            title: data.title,
            description: data.description,
            due_date: data.due_date,
          });
        }}
        initialData={editingTask}
        subjects={subjects}
      />

      {activeSubject && (
        <LinkModal
          isOpen={isLinkModalOpen}
          onClose={() => {
            setIsLinkModalOpen(false);
            setEditingLink(null);
          }}
          onSubmit={handleSaveLink}
          initialData={editingLink}
          subjectName={activeSubject.name}
        />
      )}
    </div>
  );
};
