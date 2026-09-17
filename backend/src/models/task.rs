use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Task {
    pub id: Uuid,
    pub user_id: Uuid,
    pub subject_id: Option<Uuid>,
    pub title: String,
    pub description: String,
    pub due_date: Option<NaiveDate>,
    pub is_completed: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TaskWithSubject {
    pub id: Uuid,
    pub user_id: Uuid,
    pub subject_id: Option<Uuid>,
    pub subject_name: Option<String>,
    pub subject_color: Option<String>,
    pub title: String,
    pub description: String,
    pub due_date: Option<NaiveDate>,
    pub is_completed: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskDto {
    pub subject_id: Option<Uuid>,
    pub title: String,
    pub description: Option<String>,
    pub due_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskDto {
    pub subject_id: Option<Option<Uuid>>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub due_date: Option<Option<NaiveDate>>,
    pub is_completed: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ToggleTaskDto {
    pub is_completed: bool,
}
