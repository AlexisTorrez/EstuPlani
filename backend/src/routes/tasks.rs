use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, patch},
    Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    auth::middleware::AuthUser,
    models::task::{CreateTaskDto, TaskWithSubject, ToggleTaskDto, UpdateTaskDto},
    state::AppState,
};

#[derive(Debug, Deserialize)]
pub struct TaskFilter {
    pub completed: Option<bool>,
    pub subject_id: Option<Uuid>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_tasks).post(create_task))
        .route("/:id", get(get_task).put(update_task).delete(delete_task))
        .route("/:id/toggle", patch(toggle_task))
}

async fn list_tasks(
    AuthUser(user): AuthUser,
    State(state): State<AppState>,
    Query(filter): Query<TaskFilter>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let tasks = sqlx::query_as::<_, TaskWithSubject>(
        r#"
        SELECT 
            t.id, t.user_id, t.subject_id,
            s.name as subject_name, s.color as subject_color,
            t.title, t.description, t.due_date, t.is_completed, t.created_at
        FROM tasks t
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE t.user_id = $1
          AND ($2::uuid IS NULL OR t.subject_id = $2)
          AND ($3::boolean IS NULL OR t.is_completed = $3)
        ORDER BY t.is_completed ASC, t.due_date ASC NULLS LAST, t.created_at DESC
        "#,
    )
    .bind(user.id)
    .bind(filter.subject_id)
    .bind(filter.completed)
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al listar tareas: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al listar tareas".to_string())
    })?;

    Ok(Json(tasks))
}

async fn get_task(
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let task = sqlx::query_as::<_, TaskWithSubject>(
        r#"
        SELECT 
            t.id, t.user_id, t.subject_id,
            s.name as subject_name, s.color as subject_color,
            t.title, t.description, t.due_date, t.is_completed, t.created_at
        FROM tasks t
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE t.id = $1 AND t.user_id = $2
        "#,
    )
    .bind(id)
    .bind(user.id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al buscar tarea: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error de base de datos".to_string())
    })?
    .ok_or((StatusCode::NOT_FOUND, "Tarea no encontrada".to_string()))?;

    Ok(Json(task))
}

async fn create_task(
    AuthUser(user): AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateTaskDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let title = payload.title.trim();
    if title.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "El título no puede estar vacío".to_string()));
    }

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

    let description = payload.description.unwrap_or_default();

    let task = sqlx::query_as::<_, TaskWithSubject>(
        r#"
        WITH inserted AS (
            INSERT INTO tasks (user_id, subject_id, title, description, due_date, is_completed)
            VALUES ($1, $2, $3, $4, $5, FALSE)
            RETURNING *
        )
        SELECT 
            i.id, i.user_id, i.subject_id,
            s.name as subject_name, s.color as subject_color,
            i.title, i.description, i.due_date, i.is_completed, i.created_at
        FROM inserted i
        LEFT JOIN subjects s ON i.subject_id = s.id
        "#,
    )
    .bind(user.id)
    .bind(payload.subject_id)
    .bind(title)
    .bind(description)
    .bind(payload.due_date)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al crear tarea: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al crear tarea".to_string())
    })?;

    Ok((StatusCode::CREATED, Json(task)))
}

async fn update_task(
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateTaskDto>,
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

    let current = sqlx::query_as::<_, crate::models::task::Task>(
        "SELECT id, user_id, subject_id, title, description, due_date, is_completed, created_at FROM tasks WHERE id = $1 AND user_id = $2",
    )
    .bind(id)
    .bind(user.id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Error al consultar tarea".to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Tarea no encontrada".to_string()))?;

    let new_subject_id = match payload.subject_id {
        Some(val) => val,
        None => current.subject_id,
    };
    let new_title = payload.title.unwrap_or(current.title);
    let new_description = payload.description.unwrap_or(current.description);
    let new_due_date = match payload.due_date {
        Some(val) => val,
        None => current.due_date,
    };
    let new_is_completed = payload.is_completed.unwrap_or(current.is_completed);

    let updated = sqlx::query_as::<_, TaskWithSubject>(
        r#"
        WITH upd AS (
            UPDATE tasks
            SET 
                subject_id = $1,
                title = $2,
                description = $3,
                due_date = $4,
                is_completed = $5
            WHERE id = $6 AND user_id = $7
            RETURNING *
        )
        SELECT 
            u.id, u.user_id, u.subject_id,
            s.name as subject_name, s.color as subject_color,
            u.title, u.description, u.due_date, u.is_completed, u.created_at
        FROM upd u
        LEFT JOIN subjects s ON u.subject_id = s.id
        "#,
    )
    .bind(new_subject_id)
    .bind(new_title)
    .bind(new_description)
    .bind(new_due_date)
    .bind(new_is_completed)
    .bind(id)
    .bind(user.id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al actualizar tarea: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al actualizar tarea".to_string())
    })?;

    Ok(Json(updated))
}

async fn toggle_task(
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<ToggleTaskDto>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let updated = sqlx::query_as::<_, TaskWithSubject>(
        r#"
        WITH upd AS (
            UPDATE tasks
            SET is_completed = $1
            WHERE id = $2 AND user_id = $3
            RETURNING *
        )
        SELECT 
            u.id, u.user_id, u.subject_id,
            s.name as subject_name, s.color as subject_color,
            u.title, u.description, u.due_date, u.is_completed, u.created_at
        FROM upd u
        LEFT JOIN subjects s ON u.subject_id = s.id
        "#,
    )
    .bind(payload.is_completed)
    .bind(id)
    .bind(user.id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Error al alternar estado de tarea: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error al actualizar estado".to_string())
    })?
    .ok_or((StatusCode::NOT_FOUND, "Tarea no encontrada".to_string()))?;

    Ok(Json(updated))
}

async fn delete_task(
    AuthUser(user): AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let res = sqlx::query("DELETE FROM tasks WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user.id)
        .execute(&state.db)
        .await
        .map_err(|e| {
            tracing::error!("Error al eliminar tarea: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Error al eliminar tarea".to_string())
        })?;

    if res.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Tarea no encontrada".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
