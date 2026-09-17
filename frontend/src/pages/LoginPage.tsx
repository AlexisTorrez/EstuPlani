import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Moon,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, enterDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detectar retorno de redirección con access_token o id_token en el hash
  useEffect(() => {
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const idToken = hashParams.get('id_token');
      if (accessToken || idToken) {
        setLoading(true);
        window.history.replaceState(null, '', window.location.pathname);
        loginWithGoogle(accessToken ? { access_token: accessToken } : { id_token: idToken! })
          .catch((err: any) => setError(err.message || 'Error al validar sesión con Google'))
          .finally(() => setLoading(false));
      }
    }
  }, [loginWithGoogle]);

  const redirectToGoogleOAuth = () => {
    const redirectUri = window.location.origin;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${encodeURIComponent('openid email profile')}&prompt=select_account`;
    window.location.href = authUrl;
  };

  const handleGoogleLogin = () => {
    if (!clientId) {
      setError('No se ha configurado el Client ID de Google.');
      return;
    }

    setError(null);
    setLoading(true);

    // Intentar con OAuth2 Token Client (abre popup nativo directo desde el evento click del usuario)
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              try {
                await loginWithGoogle({ access_token: tokenResponse.access_token });
              } catch (err: any) {
                setError(err.message || 'Error al validar credencial con el servidor');
              } finally {
                setLoading(false);
              }
            } else if (tokenResponse?.error) {
              setError(`Google: ${tokenResponse.error_description || tokenResponse.error}`);
              setLoading(false);
            }
          },
          error_callback: (err: any) => {
            console.error('[Google OAuth] Error callback:', err);
            // Si el popup fue bloqueado por una extensión, usamos redirección directa
            redirectToGoogleOAuth();
          },
        });

        client.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('Fallo initTokenClient, recurriendo a redirección:', e);
      }
    }

    // Fallback directo si el script de Google no cargó por AdBlock
    redirectToGoogleOAuth();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass-card login-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Alternar Tema Claro / Oscuro */}
        <button
          className="btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Alternar tema claro u oscuro"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#4f46e5" />}
        </button>

        {/* Encabezado y Marca */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div
            className="brand-icon"
            style={{ width: '56px', height: '56px', margin: '0 auto 16px' }}
          >
            <GraduationCap size={32} />
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            EstuPlani
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
            Planificador Universitario de Alto Rendimiento
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '11px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              marginBottom: '20px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}
          >
            {error}
          </div>
        )}

        {/* Resumen de Funcionalidades */}
        <div className="login-features-grid">
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Calendar size={15} color="var(--primary)" />
            <span>Fechas con cuenta regresiva</span>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={15} color="var(--success)" />
            <span>To-Do list por materias</span>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <BookOpen size={15} color="var(--warning)" />
            <span>Materias con links útiles</span>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Zap size={15} color="#ec4899" />
            <span>Motor en Rust & PostgreSQL</span>
          </div>
        </div>

        {/* Sección de Autenticación Oficial con Google */}
        <div style={{ marginBottom: '22px' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            ACCESO CON GOOGLE
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <button
              id="google-native-login-btn"
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '13px 18px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.95rem',
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#ffffff',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Iniciando sesión...' : 'Continuar con Google'}</span>
            </button>
          </div>
          <p
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            Tus materias y fechas se sincronizarán en la base de datos de tu cuenta.
          </p>
        </div>

        {/* Separador */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--text-muted)',
            fontSize: '0.72rem',
            margin: '22px 0 16px',
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span>O EXPLORA LA APLICACIÓN</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {/* Botón para entrar a la cuenta de prueba local */}
        <button
          className="btn btn-secondary"
          style={{
            width: '100%',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            border: '1px dashed var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.02)',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          }}
          onClick={enterDemoMode}
          disabled={loading}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '0.92rem',
              color: 'var(--text-main)',
            }}
          >
            <Sparkles size={16} color="#f59e0b" />
            <span>Probar con Cuenta Demo (Modo Local)</span>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            Sin iniciar sesión. Los datos se guardan sólo en este navegador y no tocan la base de datos.
          </span>
        </button>
      </div>
    </div>
  );
};
