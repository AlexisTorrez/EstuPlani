use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Link {
    pub id: Uuid,
    pub user_id: Uuid,
    pub subject_id: Uuid,
    pub title: String,
    pub url: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLinkDto {
    pub subject_id: Uuid,
    pub title: String,
    pub url: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLinkDto {
    pub title: Option<String>,
    pub url: Option<String>,
}
