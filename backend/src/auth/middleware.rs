use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{header, request::Parts, StatusCode},
};
use uuid::Uuid;

use crate::{
    auth::jwt::verify_jwt,
    models::user::User,
    state::AppState,
};

pub struct AuthUser(pub User);

#[async_trait]
impl FromRequestParts<AppState> for AuthUser {
    type Rejection = (StatusCode, String);

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|h| h.to_str().ok())
            .ok_or((
                StatusCode::UNAUTHORIZED,
                "Cabecera de autorización faltante".to_string(),
            ))?;

        if !auth_header.starts_with("Bearer ") {
            return Err((
                StatusCode::UNAUTHORIZED,
                "Formato de token inválido (debe ser Bearer <token>)".to_string(),
            ));
        }

        let token = &auth_header[7..];
        let claims = verify_jwt(token, &state.config.jwt_secret).map_err(|_| {
            (
                StatusCode::UNAUTHORIZED,
                "Token inválido o expirado".to_string(),
            )
        })?;

        let user_id = Uuid::parse_str(&claims.sub).map_err(|_| {
            (
                StatusCode::UNAUTHORIZED,
                "Identificador de usuario inválido en token".to_string(),
            )
        })?;

        let user = sqlx::query_as::<_, User>(
            "SELECT id, email, google_id, full_name, avatar_url, created_at, updated_at FROM users WHERE id = $1",
        )
        .bind(user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("Error de base de datos al autenticar: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error interno de base de datos".to_string(),
            )
        })?
        .ok_or((
            StatusCode::UNAUTHORIZED,
            "Usuario no encontrado".to_string(),
        ))?;

        Ok(AuthUser(user))
    }
}
