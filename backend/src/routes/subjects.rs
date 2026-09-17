use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use uuid::Uuid;

use crate::{
    auth::middleware::AuthUser,
    models::{
        date::ImportantDateWithSubject,
        link::Link,
        subject::{CreateSubjectDto, Subject, SubjectDetailResponse, UpdateSubjectDto},
        task::TaskWithSubject,
    },
    state::AppState,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_subjects).post(create_subject))
        .route("/:id", get(get_subject_detail).put(update_subject).delete(delete_subject))
}

async fn list_subjects(
    AuthUser(user): AuthUser,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let subjects = sqlx::query_as::<_, Subject>(
        "SELECT id, user_id, name, color, notes, created_at FROM subjects WHERE user_id = $1 ORDER BY name ASC",
    )
    .bind(user.id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al obtener materias: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al listar materias".to_string())
    })?;

    Ok(Json(subjects))
}

async fn get_subject_detail(
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let subject = sqlx::query_as::<_, Subject>(
        "SELECT id, user_id, name, color, notes, created_at FROM subjects WHERE id = $1 AND user_id = $2",
    )
    .bind(id)
    .bind(user.id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al buscar materia: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error de base de datos".to_string())
    })?
    .ok_or((StatusCode::NOT_FOUND, "Materia no encontrada".to_string()))?;

    // Fechas importantes de esta materia
    let dates = sqlx::query_as::<_, ImportantDateWithSubject>(
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
        WHERE d.subject_id = $1 AND d.user_id = $2
        ORDER BY d.event_date ASC
        "#,
    )
    .bind(id)
    .bind(user.id)
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    // Tareas de esta materia
    let tasks = sqlx::query_as::<_, TaskWithSubject>(
        r#"
        SELECT 
            t.id, t.user_id, t.subject_id,
            s.name as subject_name, s.color as subject_color,
            t.title, t.description, t.due_date, t.is_completed, t.created_at
        FROM tasks t
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE t.subject_id = $1 AND t.user_id = $2
        ORDER BY t.is_completed ASC, t.due_date ASC NULLS LAST, t.created_at DESC
        "#,
    )
    .bind(id)
    .bind(user.id)
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    // Links de esta materia
    let links = sqlx::query_as::<_, Link>(
        "SELECT id, user_id, subject_id, title, url, created_at FROM links WHERE subject_id = $1 AND user_id = $2 ORDER BY created_at ASC",
    )
    .bind(id)
    .bind(user.id)
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    Ok(Json(SubjectDetailResponse {
        subject,
        dates,
        tasks,
        links,
    }))
}

async fn create_subject(
    AuthUser(user): AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateSubjectDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let name = payload.name.trim();
    if name.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "El nombre de la materia no puede estar vacío".to_string()));
    }

    let color = payload.color.unwrap_or_else(|| "#6366f1".to_string());
    let notes = payload.notes.unwrap_or_default();

    let subject = sqlx::query_as::<_, Subject>(
        r#"
        INSERT INTO subjects (user_id, name, color, notes)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, name) DO NOTHING
        RETURNING id, user_id, name, color, notes, created_at
        "#,
    )
    .bind(user.id)
    .bind(name)
    .bind(color)
    .bind(notes)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error creando materia: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al crear materia".to_string())
    })?
    .ok_or((StatusCode::CONFLICT, "Ya existe una materia con ese nombre".to_string()))?;

    Ok((StatusCode::CREATED, Json(subject)))
}

async fn update_subject(
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateSubjectDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let subject = sqlx::query_as::<_, Subject>(
        r#"
        UPDATE subjects
        SET 
            name = COALESCE(NULLIF(TRIM($1), ''), name),
            color = COALESCE($2, color),
            notes = COALESCE($3, notes)
        WHERE id = $4 AND user_id = $5
        RETURNING id, user_id, name, color, notes, created_at
        "#,
    )
    .bind(payload.name)
    .bind(payload.color)
    .bind(payload.notes)
    .bind(id)
    .bind(user.id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al actualizar materia: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al actualizar materia".to_string())
    })?
    .ok_or((StatusCode::NOT_FOUND, "Materia no encontrada".to_string()))?;

    Ok(Json(subject))
}

async fn delete_subject(
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let result = sqlx::query(
        "DELETE FROM subjects WHERE id = $1 AND user_id = $2",
    )
    .bind(id)
    .bind(user.id)
    .execute(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al eliminar materia: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al eliminar materia".to_string())
    })?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Materia no encontrada".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
