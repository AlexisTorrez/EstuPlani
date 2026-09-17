import { ImportantDate, Link, Subject, SubjectDetailResponse, Task, User } from '../types';
import { demoStorage } from './demoStorage';
const rawApiUrl = (import.meta.env.VITE_API_URL as string || '').replace(/\/+$/, '');
const API_BASE = rawApiUrl ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`) : '/api';

export function isDemoMode(): boolean {
  return localStorage.getItem('estuplani_demo_mode') === 'true';
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('estuplani_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'Error en la petición';
    try {
      const errorText = await response.text();
      errorMessage = errorText || `HTTP ${response.status}`;
    } catch {
      // Ignorar error al parsear
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  googleLogin: async (idToken: string) => {
    // Al iniciar sesión real con Google, salimos de modo demo
    localStorage.removeItem('estuplani_demo_mode');
    return request<{ token: string; user: User }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    });
  },


  getMe: async (): Promise<User> => {
    if (isDemoMode()) {
      return {
        id: 'demo-local-user',
        email: 'invitado@estuplani.local',
        full_name: 'Cuenta de Prueba',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return request<User>('/auth/me');
  },

  // Materias (Subjects)
  getSubjects: async (): Promise<Subject[]> => {
    if (isDemoMode()) {
      return demoStorage.getSubjects();
    }
    return request<Subject[]>('/subjects');
  },

  getSubjectDetail: async (id: string): Promise<SubjectDetailResponse> => {
    if (isDemoMode()) {
      return demoStorage.getSubjectDetail(id);
    }
    return request<SubjectDetailResponse>(`/subjects/${id}`);
  },

  createSubject: async (name: string, color?: string, notes?: string): Promise<Subject> => {
    if (isDemoMode()) {
      return demoStorage.createSubject(name, color, notes);
    }
    return request<Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify({ name, color, notes }),
    });
  },

  updateSubject: async (
    id: string,
    name?: string,
    color?: string,
    notes?: string
  ): Promise<Subject> => {
    if (isDemoMode()) {
      return demoStorage.updateSubject(id, name, color, notes);
    }
    return request<Subject>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, color, notes }),
    });
  },

  deleteSubject: async (id: string): Promise<void> => {
    if (isDemoMode()) {
      return demoStorage.deleteSubject(id);
    }
    return request<void>(`/subjects/${id}`, {
      method: 'DELETE',
    });
  },

  // Fechas Importantes (Important Dates)
  getDates: async (subjectId?: string): Promise<ImportantDate[]> => {
    if (isDemoMode()) {
      return demoStorage.getDates(subjectId);
    }
    const query = subjectId ? `?subject_id=${subjectId}` : '';
    return request<ImportantDate[]>(`/dates${query}`);
  },

  createDate: async (data: {
    subject_id?: string | null;
    title: string;
    description?: string;
    event_date: string;
  }): Promise<ImportantDate> => {
    if (isDemoMode()) {
      return demoStorage.createDate(data);
    }
    return request<ImportantDate>('/dates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateDate: async (
    id: string,
    data: {
      subject_id?: string | null;
      title?: string;
      description?: string;
      event_date?: string;
    }
  ): Promise<ImportantDate> => {
    if (isDemoMode()) {
      return demoStorage.updateDate(id, data);
    }
    return request<ImportantDate>(`/dates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteDate: async (id: string): Promise<void> => {
    if (isDemoMode()) {
      return demoStorage.deleteDate(id);
    }
    return request<void>(`/dates/${id}`, {
      method: 'DELETE',
    });
  },

  // Tareas (Tasks)
  getTasks: async (completed?: boolean, subjectId?: string): Promise<Task[]> => {
    if (isDemoMode()) {
      return demoStorage.getTasks(completed, subjectId);
    }
    const params = new URLSearchParams();
    if (completed !== undefined) params.append('completed', completed.toString());
    if (subjectId) params.append('subject_id', subjectId);
    const qs = params.toString();
    return request<Task[]>(`/tasks${qs ? `?${qs}` : ''}`);
  },

  createTask: async (data: {
    subject_id?: string | null;
    title: string;
    description?: string;
    due_date?: string | null;
  }): Promise<Task> => {
    if (isDemoMode()) {
      return demoStorage.createTask(data);
    }
    return request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTask: async (
    id: string,
    data: {
      subject_id?: string | null;
      title?: string;
      description?: string;
      due_date?: string | null;
      is_completed?: boolean;
    }
  ): Promise<Task> => {
    if (isDemoMode()) {
      return demoStorage.updateTask(id, data);
    }
    return request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  toggleTask: async (id: string, isCompleted: boolean): Promise<Task> => {
    if (isDemoMode()) {
      return demoStorage.toggleTask(id, isCompleted);
    }
    return request<Task>(`/tasks/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_completed: isCompleted }),
    });
  },

  deleteTask: async (id: string): Promise<void> => {
    if (isDemoMode()) {
      return demoStorage.deleteTask(id);
    }
    return request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  // Links
  createLink: async (data: {
    subject_id: string;
    title: string;
    url: string;
  }): Promise<Link> => {
    if (isDemoMode()) {
      return demoStorage.createLink(data);
    }
    return request<Link>('/links', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateLink: async (
    id: string,
    data: { title?: string; url?: string }
  ): Promise<Link> => {
    if (isDemoMode()) {
      return demoStorage.updateLink(id, data);
    }
    return request<Link>(`/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteLink: async (id: string): Promise<void> => {
    if (isDemoMode()) {
      return demoStorage.deleteLink(id);
    }
    return request<void>(`/links/${id}`, {
      method: 'DELETE',
    });
  },
};
