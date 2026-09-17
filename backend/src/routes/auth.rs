use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use crate::{
    auth::{
        google::{verify_google_credentials, AuthResponse, GoogleAuthRequest},
        jwt::create_jwt,
        middleware::AuthUser,
    },
    models::user::User,
    state::AppState,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/google", post(google_login))
        .route("/me", get(get_current_user))
}

async fn google_login(
    State(state): State<AppState>,
    Json(payload): Json<GoogleAuthRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let token_info = verify_google_credentials(&payload, &state.config.google_client_id)
        .await
        .map_err(|e| (StatusCode::UNAUTHORIZED, e))?;

    let name = token_info.name.unwrap_or_else(|| "Usuario".to_string());

    // Upsert usuario en PostgreSQL
    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (email, google_id, full_name, avatar_url, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (email) DO UPDATE 
        SET google_id = EXCLUDED.google_id,
            full_name = EXCLUDED.full_name,
            avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
            updated_at = NOW()
        RETURNING id, email, google_id, full_name, avatar_url, created_at, updated_at
        "#,
    )
    .bind(&token_info.email)
    .bind(&token_info.sub)
    .bind(&name)
    .bind(&token_info.picture)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error guardando usuario de Google: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al registrar usuario".to_string())
    })?;

    let token = create_jwt(&user.id, &user.email, &state.config.jwt_secret)
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Error al generar token de sesión".to_string()))?;

    Ok(Json(AuthResponse { token, user }))
}

async fn get_current_user(AuthUser(user): AuthUser) -> impl IntoResponse {
    Json(user)
}
