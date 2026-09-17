use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::post,
    Json, Router,
};
use uuid::Uuid;

use crate::{
    auth::middleware::AuthUser,
    models::link::{CreateLinkDto, Link, UpdateLinkDto},
    state::AppState,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", post(create_link))
        .route("/:id", axum::routing::put(update_link).delete(delete_link))
}

fn is_valid_http_url(url: &str) -> bool {
    let lower = url.to_lowercase();
    (lower.starts_with("http://") || lower.starts_with("https://")) 
        && !lower.contains("javascript:") 
        && !lower.contains("data:")
        && !lower.contains("vbscript:")
}

async fn create_link(
    AuthUser(user): AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateLinkDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let title = payload.title.trim();
    let url = payload.url.trim();

    if title.is_empty() || url.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "Título y URL son obligatorios".to_string()));
    }

    if !is_valid_http_url(url) {
        return Err((
            StatusCode::BAD_REQUEST,
            "La URL debe ser un enlace web válido que comience con http:// o https://".to_string(),
        ));
    }

    // Verify subject ownership
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM subjects WHERE id = $1 AND user_id = $2)",
    )
    .bind(payload.subject_id)
    .bind(user.id)
    .fetch_one(&state.db)
    .await
    .unwrap_or(false);

    if !exists {
        return Err((StatusCode::BAD_REQUEST, "La materia seleccionada no existe".to_string()));
    }

    let link = sqlx::query_as::<_, Link>(
        r#"
        INSERT INTO links (user_id, subject_id, title, url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, subject_id, title, url, created_at
        "#,
    )
    .bind(user.id)
    .bind(payload.subject_id)
    .bind(title)
    .bind(url)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al guardar enlace: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al crear enlace".to_string())
    })?;

    Ok((StatusCode::CREATED, Json(link)))
}

async fn update_link(
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateLinkDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    if let Some(ref u) = payload.url {
        let trimmed = u.trim();
        if !trimmed.is_empty() && !is_valid_http_url(trimmed) {
            return Err((
                StatusCode::BAD_REQUEST,
                "La URL debe comenzar con http:// o https://".to_string(),
            ));
        }
    }

    let link = sqlx::query_as::<_, Link>(
        r#"
        UPDATE links
        SET 
            title = COALESCE(NULLIF(TRIM($1), ''), title),
            url = COALESCE(NULLIF(TRIM($2), ''), url)
        WHERE id = $3 AND user_id = $4
        RETURNING id, user_id, subject_id, title, url, created_at
        "#,
    )
    .bind(payload.title)
    .bind(payload.url)
    .bind(id)
    .bind(user.id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al actualizar enlace: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al actualizar enlace".to_string())
    })?
    .ok_or((StatusCode::NOT_FOUND, "Enlace no encontrado".to_string()))?;

    Ok(Json(link))
}

async fn delete_link(
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let res = sqlx::query("DELETE FROM links WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user.id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("Error al eliminar enlace: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Error al eliminar enlace".to_string())
        })?;

    if res.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Enlace no encontrado".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
