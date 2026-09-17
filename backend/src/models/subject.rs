use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Subject {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub color: String,
    pub notes: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSubjectDto {
    pub name: String,
    pub color: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSubjectDto {
    pub name: Option<String>,
    pub color: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SubjectDetailResponse {
    pub subject: Subject,
    pub dates: Vec<crate::models::date::ImportantDateWithSubject>,
    pub tasks: Vec<crate::models::task::TaskWithSubject>,
    pub links: Vec<crate::models::link::Link>,
}
