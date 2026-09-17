use std::env;

#[derive(Clone, Debug)]
#[allow(dead_code)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
    pub frontend_url: String,
    pub google_client_id: String,
    pub google_client_secret: String,
    pub environment: String,
}

impl Config {
    pub fn from_env() -> Self {
        let environment = env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string());
        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://estuplani:estuplani_password@localhost:5433/estuplanidb".to_string());
        
        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "estuplani_super_secret_jwt_key_2026_dev".to_string());

        if environment == "production"
            && (jwt_secret == "estuplani_super_secret_jwt_key_2026_dev" || jwt_secret.len() < 32)
        {
            panic!("FATAL: En producción se requiere configurar una variable JWT_SECRET segura con al menos 32 caracteres.");
        }

        let port = env::var("PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(3001);

        let frontend_url = env::var("FRONTEND_URL")
            .unwrap_or_else(|_| "http://localhost:5173".to_string());

        let google_client_id = env::var("GOOGLE_CLIENT_ID").unwrap_or_default();
        let google_client_secret = env::var("GOOGLE_CLIENT_SECRET").unwrap_or_default();

        Self {
            database_url,
            jwt_secret,
            port,
            frontend_url,
            google_client_id,
            google_client_secret,
            environment,
        }
    }
}
