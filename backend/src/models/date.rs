use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ImportantDate {
    pub id: Uuid,
    pub user_id: Uuid,
    pub subject_id: Option<Uuid>,
    pub title: String,
    pub description: String,
    pub event_date: NaiveDate,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ImportantDateWithSubject {
    pub id: Uuid,
    pub user_id: Uuid,
    pub subject_id: Option<Uuid>,
    pub subject_name: Option<String>,
    pub subject_color: Option<String>,
    pub title: String,
    pub description: String,
    pub event_date: NaiveDate,
    pub days_remaining: i64,
    pub is_overdue: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateImportantDateDto {
    pub subject_id: Option<Uuid>,
    pub title: String,
    pub description: Option<String>,
    pub event_date: NaiveDate,
}

#[derive(Debug, Deserialize)]
pub struct UpdateImportantDateDto {
    pub subject_id: Option<Option<Uuid>>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub event_date: Option<NaiveDate>,
}
