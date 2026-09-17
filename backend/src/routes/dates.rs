use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    auth::middleware::AuthUser,
    models::date::{CreateImportantDateDto, ImportantDateWithSubject, UpdateImportantDateDto},
    state::AppState,
};

#[derive(Debug, Deserialize)]
pub struct DateFilter {
    pub subject_id: Option<Uuid>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_dates).post(create_date))
        .route("/:id", get(get_date).put(update_date).delete(delete_date))
}

async fn list_dates(
    AuthUser(user): AuthUser,
    State(state): State<AppState>,
    Query(filter): Query<DateFilter>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let dates = if let Some(subject_id) = filter.subject_id {
        sqlx::query_as::<_, ImportantDateWithSubject>(
            r#"
            SELECT 
                d.id, d.user_id, d.subject_id, 
                s.name as subject_name, s.color as subject_color,
                d.title, d.description, d.event_date,
                (d.event_date - CURRENT_DATE)::bigint as days_remaining,
                (d.event_date < CURRENT_DATE) as is_overdue,
                d.created_at
            FROM important_dates d
            LEFT JOIN subjects s ON d.subject_id = s.id
            WHERE d.user_id = $1 AND d.subject_id = $2
            ORDER BY d.event_date ASC
            "#,
        )
        .bind(user.id)
        .bind(subject_id)
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query_as::<_, ImportantDateWithSubject>(
            r#"
            SELECT 
                d.id, d.user_id, d.subject_id, 
                s.name as subject_name, s.color as subject_color,
                d.title, d.description, d.event_date,
                (d.event_date - CURRENT_DATE)::bigint as days_remaining,
                (d.event_date < CURRENT_DATE) as is_overdue,
                d.created_at
            FROM important_dates d
            LEFT JOIN subjects s ON d.subject_id = s.id
            WHERE d.user_id = $1
            ORDER BY d.event_date ASC
            "#,
        )
        .bind(user.id)
        .fetch_all(&state.db)
        .await
    }
    .map_err(|e| {
        tracing::error!("Error listando fechas: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al obtener fechas importantes".to_string())
    })?;

    Ok(Json(dates))
}

async fn get_date(
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let date = sqlx::query_as::<_, ImportantDateWithSubject>(
        r#"
        SELECT 
            d.id, d.user_id, d.subject_id, 
            s.name as subject_name, s.color as subject_color,
            d.title, d.description, d.event_date,
            (d.event_date - CURRENT_DATE)::bigint as days_remaining,
            (d.event_date < CURRENT_DATE) as is_overdue,
            d.created_at
        FROM important_dates d
        LEFT JOIN subjects s ON d.subject_id = s.id
        WHERE d.id = $1 AND d.user_id = $2
        "#,
    )
    .bind(id)
    .bind(user.id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al buscar fecha: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error de base de datos".to_string())
    })?
    .ok_or((StatusCode::NOT_FOUND, "Fecha importante no encontrada".to_string()))?;

    Ok(Json(date))
}

async fn create_date(
    AuthUser(user): AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateImportantDateDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let title = payload.title.trim();
    if title.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "El título no puede estar vacío".to_string()));
    }

    let description = payload.description.unwrap_or_default();

    // Verify subject ownership if provided
    if let Some(sub_id) = payload.subject_id {
        let exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM subjects WHERE id = $1 AND user_id = $2)",
        )
        .bind(sub_id)
        .bind(user.id)
        .fetch_one(&state.db)
        .await
        .unwrap_or(false);

        if !exists {
            return Err((StatusCode::BAD_REQUEST, "La materia seleccionada no existe".to_string()));
        }
    }

    let inserted = sqlx::query_as::<_, ImportantDateWithSubject>(
        r#"
        WITH inserted AS (
            INSERT INTO important_dates (user_id, subject_id, title, description, event_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        )
        SELECT 
            i.id, i.user_id, i.subject_id, 
            s.name as subject_name, s.color as subject_color,
            i.title, i.description, i.event_date,
            (i.event_date - CURRENT_DATE)::bigint as days_remaining,
            (i.event_date < CURRENT_DATE) as is_overdue,
            i.created_at
        FROM inserted i
        LEFT JOIN subjects s ON i.subject_id = s.id
        "#,
    )
    .bind(user.id)
    .bind(payload.subject_id)
    .bind(title)
    .bind(description)
    .bind(payload.event_date)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al insertar fecha: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al guardar fecha importante".to_string())
    })?;

    Ok((StatusCode::CREATED, Json(inserted)))
}

async fn update_date(
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateImportantDateDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    if let Some(Some(sub_id)) = payload.subject_id {
        let exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM subjects WHERE id = $1 AND user_id = $2)",
        )
        .bind(sub_id)
        .bind(user.id)
        .fetch_one(&state.db)
        .await
        .unwrap_or(false);

        if !exists {
            return Err((StatusCode::BAD_REQUEST, "La materia seleccionada no existe".to_string()));
        }
    }

    let current = sqlx::query_as::<_, crate::models::date::ImportantDate>(
        "SELECT id, user_id, subject_id, title, description, event_date, created_at FROM important_dates WHERE id = $1 AND user_id = $2",
    )
    .bind(id)
    .bind(user.id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Error al consultar fecha".to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Fecha no encontrada".to_string()))?;

    let new_subject_id = match payload.subject_id {
        Some(val) => val,
        None => current.subject_id,
    };
    let new_title = payload.title.unwrap_or(current.title);
    let new_description = payload.description.unwrap_or(current.description);
    let new_event_date = payload.event_date.unwrap_or(current.event_date);

    let updated = sqlx::query_as::<_, ImportantDateWithSubject>(
        r#"
        WITH upd AS (
            UPDATE important_dates
            SET 
                subject_id = $1,
                title = $2,
                description = $3,
                event_date = $4
            WHERE id = $5 AND user_id = $6
            RETURNING *
        )
        SELECT 
            u.id, u.user_id, u.subject_id, 
            s.name as subject_name, s.color as subject_color,
            u.title, u.description, u.event_date,
            (u.event_date - CURRENT_DATE)::bigint as days_remaining,
            (u.event_date < CURRENT_DATE) as is_overdue,
            u.created_at
        FROM upd u
        LEFT JOIN subjects s ON u.subject_id = s.id
        "#,
    )
    .bind(new_subject_id)
    .bind(new_title)
    .bind(new_description)
    .bind(new_event_date)
    .bind(id)
    .bind(user.id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al actualizar fecha: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al actualizar fecha".to_string())
    })?;

    Ok(Json(updated))
}

async fn delete_date(
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let res = sqlx::query("DELETE FROM important_dates WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user.id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("Error al eliminar fecha: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Error al eliminar fecha".to_string())
        })?;

    if res.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Fecha no encontrada".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
