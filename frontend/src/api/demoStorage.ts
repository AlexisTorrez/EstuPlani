import { ImportantDate, Link, Subject, SubjectDetailResponse, Task } from '../types';

const DEMO_USER_ID = 'demo-local-user';

const STORAGE_KEYS = {
  SUBJECTS: 'estuplani_demo_subjects',
  DATES: 'estuplani_demo_dates',
  TASKS: 'estuplani_demo_tasks',
  LINKS: 'estuplani_demo_links',
  INITIALIZED: 'estuplani_demo_initialized',
};

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function computeDateDiff(eventDateStr: string): { days_remaining: number; is_overdue: boolean } {
  try {
    const parts = eventDateStr.split('-');
    if (parts.length < 3) return { days_remaining: 0, is_overdue: false };
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const target = new Date(year, month, day);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const msPerDay = 1000 * 60 * 60 * 24;
    const days_remaining = Math.round((target.getTime() - today.getTime()) / msPerDay);
    const is_overdue = days_remaining < 0;

    return { days_remaining, is_overdue };
  } catch {
    return { days_remaining: 0, is_overdue: false };
  }
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// Inicializa datos de ejemplo si es la primera vez que entra en modo Demo
export function initializeDemoData(): void {
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (initialized) return;

  const today = new Date();

  const in3Days = new Date(today);
  in3Days.setDate(today.getDate() + 3);

  const in10Days = new Date(today);
  in10Days.setDate(today.getDate() + 10);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  const subjects: Subject[] = [
    {
      id: 'demo-sub-1',
      user_id: DEMO_USER_ID,
      name: 'Álgebra Lineal',
      color: '#6366f1',
      notes:
        '• No hablar fuerte en clase porque el profe se enoja mucho.\n• No llegar tarde a clase porque cierra la puerta puntual.\n• Solo se permiten faltar a 2 clases.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-sub-2',
      user_id: DEMO_USER_ID,
      name: 'Algoritmos y Estructuras de Datos',
      color: '#10b981',
      notes:
        '• Los TPs se entregan por GitHub en parejas con tests unitarios.\n• Consultas de ejercitación los jueves 17:00 hs en aula 204.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-sub-3',
      user_id: DEMO_USER_ID,
      name: 'Arquitectura de Computadoras',
      color: '#f59e0b',
      notes:
        '• Tener instalado el simulador Logisim Evolution para los prácticos.\n• Asistencia obligatoria del 75% para regularizar.',
      created_at: new Date().toISOString(),
    },
  ];

  const dates: ImportantDate[] = [
    {
      id: 'demo-date-1',
      user_id: DEMO_USER_ID,
      subject_id: 'demo-sub-1',
      subject_name: 'Álgebra Lineal',
      subject_color: '#6366f1',
      title: 'Segundo Parcial Teórico-Práctico',
      description: 'Temas: Diagonalización, matrices ortogonales y autovalores.',
      event_date: formatDate(in3Days),
      days_remaining: 3,
      is_overdue: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-date-2',
      user_id: DEMO_USER_ID,
      subject_id: 'demo-sub-2',
      subject_name: 'Algoritmos y Estructuras de Datos',
      subject_color: '#10b981',
      title: 'Entrega Trabajo Práctico: Grafos y Árboles',
      description: 'Subir repositorio de GitHub con tests unitarios.',
      event_date: formatDate(in10Days),
      days_remaining: 10,
      is_overdue: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-date-3',
      user_id: DEMO_USER_ID,
      subject_id: 'demo-sub-3',
      subject_name: 'Arquitectura de Computadoras',
      subject_color: '#f59e0b',
      title: 'Guía de Ejercicios 3: Memorias Caché',
      description: 'Ejercicios de correspondencia directa y asociativa.',
      event_date: formatDate(twoDaysAgo),
      days_remaining: -2,
      is_overdue: true,
      created_at: new Date().toISOString(),
    },
  ];

  const tasks: Task[] = [
    {
      id: 'demo-task-1',
      user_id: DEMO_USER_ID,
      subject_id: 'demo-sub-1',
      subject_name: 'Álgebra Lineal',
      subject_color: '#6366f1',
      title: 'Repasar diagonalización de matrices',
      description: 'Hacer ejercicios del capítulo 5 del apunte',
      due_date: formatDate(in3Days),
      is_completed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-task-2',
      user_id: DEMO_USER_ID,
      subject_id: 'demo-sub-2',
      subject_name: 'Algoritmos y Estructuras de Datos',
      subject_color: '#10b981',
      title: 'Implementar algoritmo de Dijkstra',
      description: 'Optimizar con cola de prioridad',
      due_date: formatDate(in10Days),
      is_completed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-task-3',
      user_id: DEMO_USER_ID,
      subject_id: 'demo-sub-3',
      subject_name: 'Arquitectura de Computadoras',
      subject_color: '#f59e0b',
      title: 'Instalar simulador Logisim Evolution',
      description: 'Descargar versión para Linux/Windows',
      due_date: null,
      is_completed: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-task-4',
      user_id: DEMO_USER_ID,
      subject_id: null,
      subject_name: null,
      subject_color: null,
      title: 'Consultar fechas de inscripción a finales',
      description: 'Revisar cartelera del departamento de alumnos',
      due_date: null,
      is_completed: false,
      created_at: new Date().toISOString(),
    },
  ];

  const links: Link[] = [
    {
      id: 'demo-link-1',
      user_id: DEMO_USER_ID,
      subject_id: 'demo-sub-1',
      title: 'Apuntes Oficiales de Cátedra',
      url: 'https://campus.universidad.edu.ar',
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-link-2',
      user_id: DEMO_USER_ID,
      subject_id: 'demo-sub-2',
      title: 'Visualizador de Algoritmos (VisuAlgo)',
      url: 'https://visualgo.net',
      created_at: new Date().toISOString(),
    },
  ];

  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  localStorage.setItem(STORAGE_KEYS.DATES, JSON.stringify(dates));
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

function load<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error guardando en localStorage:', e);
  }
}

export const demoStorage = {
  // Materias
  async getSubjects(): Promise<Subject[]> {
    initializeDemoData();
    return load<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
  },

  async getSubjectDetail(id: string): Promise<SubjectDetailResponse> {
    initializeDemoData();
    const subjects = load<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
    const subject = subjects.find((s) => s.id === id);
    if (!subject) throw new Error('Materia no encontrada');

    const allDates = await this.getDates(id);
    const allTasks = await this.getTasks(undefined, id);
    const allLinks = load<Link[]>(STORAGE_KEYS.LINKS, []).filter((l) => l.subject_id === id);

    return {
      subject,
      dates: allDates,
      tasks: allTasks,
      links: allLinks,
    };
  },

  async createSubject(name: string, color?: string, notes?: string): Promise<Subject> {
    initializeDemoData();
    const subjects = load<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
    const newSubject: Subject = {
      id: generateId('sub'),
      user_id: DEMO_USER_ID,
      name: name.trim(),
      color: color || '#6366f1',
      notes: notes || '',
      created_at: new Date().toISOString(),
    };
    subjects.push(newSubject);
    save(STORAGE_KEYS.SUBJECTS, subjects);
    return newSubject;
  },

  async updateSubject(id: string, name?: string, color?: string, notes?: string): Promise<Subject> {
    initializeDemoData();
    const subjects = load<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
    const idx = subjects.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Materia no encontrada');

    if (name) subjects[idx].name = name.trim();
    if (color) subjects[idx].color = color;
    if (notes !== undefined) subjects[idx].notes = notes;
    save(STORAGE_KEYS.SUBJECTS, subjects);

    // Actualizar cache en fechas y tareas asociadas
    const dates = load<ImportantDate[]>(STORAGE_KEYS.DATES, []).map((d) => {
      if (d.subject_id === id) {
        return {
          ...d,
          subject_name: subjects[idx].name,
          subject_color: subjects[idx].color,
        };
      }
      return d;
    });
    save(STORAGE_KEYS.DATES, dates);

    const tasks = load<Task[]>(STORAGE_KEYS.TASKS, []).map((t) => {
      if (t.subject_id === id) {
        return {
          ...t,
          subject_name: subjects[idx].name,
          subject_color: subjects[idx].color,
        };
      }
      return t;
    });
    save(STORAGE_KEYS.TASKS, tasks);

    return subjects[idx];
  },

  async deleteSubject(id: string): Promise<void> {
    initializeDemoData();
    const subjects = load<Subject[]>(STORAGE_KEYS.SUBJECTS, []).filter((s) => s.id !== id);
    save(STORAGE_KEYS.SUBJECTS, subjects);

    // Cascada: eliminar o desasociar
    const dates = load<ImportantDate[]>(STORAGE_KEYS.DATES, []).filter((d) => d.subject_id !== id);
    save(STORAGE_KEYS.DATES, dates);

    const tasks = load<Task[]>(STORAGE_KEYS.TASKS, []).filter((t) => t.subject_id !== id);
    save(STORAGE_KEYS.TASKS, tasks);

    const links = load<Link[]>(STORAGE_KEYS.LINKS, []).filter((l) => l.subject_id !== id);
    save(STORAGE_KEYS.LINKS, links);
  },

  // Fechas
  async getDates(subjectId?: string): Promise<ImportantDate[]> {
    initializeDemoData();
    let dates = load<ImportantDate[]>(STORAGE_KEYS.DATES, []);
    if (subjectId) {
      dates = dates.filter((d) => d.subject_id === subjectId);
    }

    // Recalcular días restantes dinámicamente según la fecha de hoy
    dates = dates.map((d) => {
      const diff = computeDateDiff(d.event_date);
      return { ...d, ...diff };
    });

    dates.sort((a, b) => a.event_date.localeCompare(b.event_date));
    return dates;
  },

  async createDate(data: {
    subject_id?: string | null;
    title: string;
    description?: string;
    event_date: string;
  }): Promise<ImportantDate> {
    initializeDemoData();
    const subjects = load<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
    const subj = subjects.find((s) => s.id === data.subject_id);

    const diff = computeDateDiff(data.event_date);
    const newDate: ImportantDate = {
      id: generateId('date'),
      user_id: DEMO_USER_ID,
      subject_id: data.subject_id || null,
      subject_name: subj ? subj.name : null,
      subject_color: subj ? subj.color : null,
      title: data.title.trim(),
      description: (data.description || '').trim(),
      event_date: data.event_date,
      days_remaining: diff.days_remaining,
      is_overdue: diff.is_overdue,
      created_at: new Date().toISOString(),
    };

    const dates = load<ImportantDate[]>(STORAGE_KEYS.DATES, []);
    dates.push(newDate);
    save(STORAGE_KEYS.DATES, dates);
    return newDate;
  },

  async updateDate(
    id: string,
    data: {
      subject_id?: string | null;
      title?: string;
      description?: string;
      event_date?: string;
    }
  ): Promise<ImportantDate> {
    initializeDemoData();
    const dates = load<ImportantDate[]>(STORAGE_KEYS.DATES, []);
    const idx = dates.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Fecha no encontrada');

    const subjects = load<Subject[]>(STORAGE_KEYS.SUBJECTS, []);

    if (data.subject_id !== undefined) {
      dates[idx].subject_id = data.subject_id;
      const s = subjects.find((sub) => sub.id === data.subject_id);
      dates[idx].subject_name = s ? s.name : null;
      dates[idx].subject_color = s ? s.color : null;
    }

    if (data.title !== undefined) dates[idx].title = data.title.trim();
    if (data.description !== undefined) dates[idx].description = data.description.trim();
    if (data.event_date !== undefined) {
      dates[idx].event_date = data.event_date;
      const diff = computeDateDiff(data.event_date);
      dates[idx].days_remaining = diff.days_remaining;
      dates[idx].is_overdue = diff.is_overdue;
    }

    save(STORAGE_KEYS.DATES, dates);
    return dates[idx];
  },

  async deleteDate(id: string): Promise<void> {
    initializeDemoData();
    const dates = load<ImportantDate[]>(STORAGE_KEYS.DATES, []).filter((d) => d.id !== id);
    save(STORAGE_KEYS.DATES, dates);
  },

  // Tareas
  async getTasks(completed?: boolean, subjectId?: string): Promise<Task[]> {
    initializeDemoData();
    let tasks = load<Task[]>(STORAGE_KEYS.TASKS, []);
    if (completed !== undefined) {
      tasks = tasks.filter((t) => t.is_completed === completed);
    }
    if (subjectId) {
      tasks = tasks.filter((t) => t.subject_id === subjectId);
    }
    tasks.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return tasks;
  },

  async createTask(data: {
    subject_id?: string | null;
    title: string;
    description?: string;
    due_date?: string | null;
  }): Promise<Task> {
    initializeDemoData();
    const subjects = load<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
    const subj = subjects.find((s) => s.id === data.subject_id);

    const newTask: Task = {
      id: generateId('task'),
      user_id: DEMO_USER_ID,
      subject_id: data.subject_id || null,
      subject_name: subj ? subj.name : null,
      subject_color: subj ? subj.color : null,
      title: data.title.trim(),
      description: (data.description || '').trim(),
      due_date: data.due_date || null,
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    const tasks = load<Task[]>(STORAGE_KEYS.TASKS, []);
    tasks.push(newTask);
    save(STORAGE_KEYS.TASKS, tasks);
    return newTask;
  },

  async updateTask(
    id: string,
    data: {
      subject_id?: string | null;
      title?: string;
      description?: string;
      due_date?: string | null;
      is_completed?: boolean;
    }
  ): Promise<Task> {
    initializeDemoData();
    const tasks = load<Task[]>(STORAGE_KEYS.TASKS, []);
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Tarea no encontrada');

    const subjects = load<Subject[]>(STORAGE_KEYS.SUBJECTS, []);

    if (data.subject_id !== undefined) {
      tasks[idx].subject_id = data.subject_id;
      const s = subjects.find((sub) => sub.id === data.subject_id);
      tasks[idx].subject_name = s ? s.name : null;
      tasks[idx].subject_color = s ? s.color : null;
    }

    if (data.title !== undefined) tasks[idx].title = data.title.trim();
    if (data.description !== undefined) tasks[idx].description = data.description.trim();
    if (data.due_date !== undefined) tasks[idx].due_date = data.due_date;
    if (data.is_completed !== undefined) tasks[idx].is_completed = data.is_completed;

    save(STORAGE_KEYS.TASKS, tasks);
    return tasks[idx];
  },

  async toggleTask(id: string, isCompleted: boolean): Promise<Task> {
    initializeDemoData();
    const tasks = load<Task[]>(STORAGE_KEYS.TASKS, []);
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Tarea no encontrada');

    tasks[idx].is_completed = isCompleted;
    save(STORAGE_KEYS.TASKS, tasks);
    return tasks[idx];
  },

  async deleteTask(id: string): Promise<void> {
    initializeDemoData();
    const tasks = load<Task[]>(STORAGE_KEYS.TASKS, []).filter((t) => t.id !== id);
    save(STORAGE_KEYS.TASKS, tasks);
  },

  // Links
  async createLink(data: { subject_id: string; title: string; url: string }): Promise<Link> {
    initializeDemoData();
    const newLink: Link = {
      id: generateId('link'),
      user_id: DEMO_USER_ID,
      subject_id: data.subject_id,
      title: data.title.trim(),
      url: data.url.trim(),
      created_at: new Date().toISOString(),
    };

    const links = load<Link[]>(STORAGE_KEYS.LINKS, []);
    links.push(newLink);
    save(STORAGE_KEYS.LINKS, links);
    return newLink;
  },

  async updateLink(id: string, data: { title?: string; url?: string }): Promise<Link> {
    initializeDemoData();
    const links = load<Link[]>(STORAGE_KEYS.LINKS, []);
    const idx = links.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Enlace no encontrado');

    if (data.title !== undefined) links[idx].title = data.title.trim();
    if (data.url !== undefined) links[idx].url = data.url.trim();

    save(STORAGE_KEYS.LINKS, links);
    return links[idx];
  },

  async deleteLink(id: string): Promise<void> {
    initializeDemoData();
    const links = load<Link[]>(STORAGE_KEYS.LINKS, []).filter((l) => l.id !== id);
    save(STORAGE_KEYS.LINKS, links);
  },
};
