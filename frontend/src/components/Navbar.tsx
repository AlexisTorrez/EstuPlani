import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';

interface Props {
  activeTab: 'dashboard' | 'subjects';
  setActiveTab: (tab: 'dashboard' | 'subjects') => void;
  metrics?: {
    upcoming: number;
    pending: number;
    overdue: number;
  };
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab, metrics }) => {
  const { user, logout, isDemo } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <div className="brand-icon">
            <GraduationCap size={22} />
          </div>
          <span>EstuPlani</span>
        </div>

        <div className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Calendar size={16} />
            <span>Inicio</span>
          </button>
          <button
            className={`nav-btn ${activeTab === 'subjects' ? 'active' : ''}`}
            onClick={() => setActiveTab('subjects')}
          >
            <BookOpen size={16} />
            <span>Materias</span>
          </button>
        </div>

        <div className="navbar-right">
          {/* Métricas compactas y discretas en la barra superior */}
          {metrics && (
            <div
              className="navbar-metrics"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '3px 6px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#a5b4fc',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                }}
                title="Próximos eventos / exámenes"
              >
                <Calendar size={13} color="#818cf8" />
                <span>
                  {metrics.upcoming} {metrics.upcoming === 1 ? 'evento' : 'eventos'}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#6ee7b7',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                }}
                title="Tareas pendientes"
              >
                <CheckCircle2 size={13} color="#10b981" />
                <span>
                  {metrics.pending} {metrics.pending === 1 ? 'tarea' : 'tareas'}
                </span>
              </div>

              {metrics.overdue > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: 'var(--danger)',
                    background: 'var(--danger-bg)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                  }}
                  title="Fechas vencidas"
                >
                  <AlertTriangle size={13} />
                  <span>
                    {metrics.overdue} vencido{metrics.overdue > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Botón para alternar Modo Claro / Modo Oscuro */}
          <button
            className="btn-icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Alternar tema claro u oscuro"
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#4f46e5" />}
          </button>

          <div className="user-profile">
            <div className="user-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="user-name">{user.full_name}</span>
                {isDemo && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                    title="Modo local: Los datos se guardan únicamente en tu navegador"
                  >
                    LOCAL
                  </span>
                )}
              </div>
              <span className="user-email">{user.email}</span>
            </div>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="user-avatar" />
            ) : (
              <div className="user-avatar">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              className="btn-icon"
              onClick={logout}
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
