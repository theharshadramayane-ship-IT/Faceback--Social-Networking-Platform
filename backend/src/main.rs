mod auth;
mod posts; // <-- Added posts module

use axum::{
    extract::{State, Query},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::net::SocketAddr;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    db: &'static str,
}

async fn health(State(state): State<AppState>) -> (StatusCode, Json<HealthResponse>) {
    match sqlx::query_scalar::<_, i32>("SELECT 1")
        .fetch_one(&state.db)
        .await
    {
        Ok(_) => (
            StatusCode::OK,
            Json(HealthResponse { status: "ok", db: "connected" }),
        ),
        Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(HealthResponse { status: "degraded", db: "down" }),
        ),
    }
}

#[derive(Deserialize)]
struct SearchQuery {
    q: String,
}

#[derive(Serialize, sqlx::FromRow)]
struct UserSearchResult {
    id: Uuid,
    username: String,
    display_name: String,
}

async fn search_users(
    State(state): State<AppState>,
    Query(params): Query<SearchQuery>,
) -> Result<Json<Vec<UserSearchResult>>, (StatusCode, String)> {
    let search_term = format!("%{}%", params.q.to_lowercase());
    
    let users = sqlx::query_as::<_, UserSearchResult>(
        "SELECT id, username, display_name FROM users 
         WHERE LOWER(username) LIKE $1 OR LOWER(display_name) LIKE $1
         LIMIT 10"
    )
    .bind(&search_term)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(users))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,faceback_backend=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let db = PgPoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await?;

    tracing::info!("connected to postgres");

    let state = AppState { db };

    let app = Router::new()
        .route("/api/health", get(health))
        .route("/api/users/search", get(search_users))
        .route("/api/auth/register", post(auth::handler::register))
        .route("/api/auth/login", post(auth::handler::login))
        // New Post Routes:
        .route("/api/posts", post(posts::create_post))
        .route("/api/posts", get(posts::get_feed))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let bind = std::env::var("BIND_ADDR").unwrap_or_else(|_| "127.0.0.1:8080".into());
    let addr: SocketAddr = bind.parse()?;

    tracing::info!("listening on http://{addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}