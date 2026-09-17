mod auth;
mod config;
mod models;
mod routes;
mod state;

use std::net::SocketAddr;
use axum::{
    extract::{DefaultBodyLimit, Request},
    http::{header::HeaderValue, Method},
    middleware::{self, Next},
    response::Response,
    routing::get,
    Json, Router,
};
use serde_json::json;
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::{config::Config, state::AppState};

/// Middleware de cabeceras de seguridad HTTP
async fn set_security_headers(req: Request, next: Next) -> Response {
    let mut response = next.run(req).await;
    let headers = response.headers_mut();
    headers.insert(
        "X-Content-Type-Options",
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        "X-Frame-Options",
        HeaderValue::from_static("DENY"),
    );
    headers.insert(
        "Referrer-Policy",
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );
    response
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Cargar variables de entorno
    dotenvy::dotenv().ok();

    // Iniciar sistema de logs
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env();

    tracing::info!("Conectando a PostgreSQL en: {}", config.database_url);

    // Pool de conexiones asíncrono de alto rendimiento
    let db = PgPoolOptions::new()
        .max_connections(50)
        .min_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(&config.database_url)
        .await
        .expect("No se pudo conectar a la base de datos PostgreSQL");

    tracing::info!("Conexión a PostgreSQL establecida con éxito");

    // Ejecución automática del esquema y migraciones al iniciar
    tracing::info!("Verificando y ejecutando esquema de base de datos...");
    let init_sql = include_str!("../migrations/0001_init.sql");
    sqlx::raw_sql(init_sql)
        .execute(&db)
        .await
        .expect("Error al inicializar las tablas de la base de datos");
    tracing::info!("Esquema de base de datos listo y actualizado");

    let state = AppState::new(db, config.clone());

    // Configuración de CORS según el entorno
    let cors = if config.environment == "production" && config.frontend_url != "*" {
        let origins: Vec<HeaderValue> = config
            .frontend_url
            .split(',')
            .filter_map(|s| s.trim().parse::<HeaderValue>().ok())
            .collect();

        if origins.is_empty() {
            CorsLayer::new().allow_origin(Any)
        } else {
            CorsLayer::new().allow_origin(origins)
        }
    } else {
        CorsLayer::new().allow_origin(Any)
    }
    .allow_methods([
        Method::GET,
        Method::POST,
        Method::PUT,
        Method::PATCH,
        Method::DELETE,
        Method::OPTIONS,
    ])
    .allow_headers(Any);

    // Rutas de la API
    let api_routes = Router::new()
        .route("/health", get(|| async {
            Json(json!({ "status": "ok", "service": "EstuPlani API (Rust Axum)" }))
        }))
        .nest("/auth", routes::auth::router())
        .nest("/subjects", routes::subjects::router())
        .nest("/dates", routes::dates::router())
        .nest("/tasks", routes::tasks::router())
        .nest("/links", routes::links::router());

    let app = Router::new()
        .nest("/api", api_routes)
        .layer(middleware::from_fn(set_security_headers))
        .layer(DefaultBodyLimit::max(256 * 1024)) // Límite de 256KB por petición para prevenir ataques de DoS por memoria
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("🚀 Servidor EstuPlani Backend iniciado en http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
