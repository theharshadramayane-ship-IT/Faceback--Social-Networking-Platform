use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::AppState;

#[derive(Deserialize)]
pub struct CreatePostRequest {
    pub content: String,
    // For now, we will pass user_id directly in the body to keep it simple.
    // Later we will use JWT middleware.
    pub user_id: Uuid, 
}

#[derive(Serialize, sqlx::FromRow)]
pub struct PostResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub display_name: String,
    pub username: String,
    pub content: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn create_post(
    State(state): State<AppState>,
    Json(payload): Json<CreatePostRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    sqlx::query("INSERT INTO posts (user_id, content) VALUES ($1, $2)")
        .bind(&payload.user_id)
        .bind(&payload.content)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::CREATED)
}

pub async fn get_feed(
    State(state): State<AppState>,
) -> Result<Json<Vec<PostResponse>>, (StatusCode, String)> {
    let posts = sqlx::query_as::<_, PostResponse>(
        "SELECT p.id, p.user_id, u.display_name, u.username, p.content, p.created_at 
         FROM posts p 
         JOIN users u ON p.user_id = u.id 
         ORDER BY p.created_at DESC 
         LIMIT 50"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(posts))
}