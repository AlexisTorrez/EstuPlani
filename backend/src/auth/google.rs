use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct GoogleTokenInfo {
    pub aud: Option<String>,
    pub sub: String,
    pub email: String,
    pub name: Option<String>,
    pub picture: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GoogleAuthRequest {
    pub id_token: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: crate::models::user::User,
}

pub async fn verify_google_token(id_token: &str, expected_client_id: &str) -> Result<GoogleTokenInfo, String> {
    let client = reqwest::Client::new();
    let url = format!("https://oauth2.googleapis.com/tokeninfo?id_token={}", id_token);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Fallo al conectar con Google OAuth: {}", e))?;

    if !response.status().is_success() {
        return Err("Token de Google inválido o rechazado por Google".to_string());
    }

    let token_info = response
        .json::<GoogleTokenInfo>()
        .await
        .map_err(|e| format!("Respuesta de Google malformada: {}", e))?;

    // Validación estricta del Audience (aud) contra el Client ID de EstuPlani
    if !expected_client_id.is_empty() {
        match &token_info.aud {
            Some(aud) if aud == expected_client_id => (),
            Some(_) => {
                return Err("Acceso denegado: El token de Google no fue generado para esta aplicación".to_string());
            }
            None => {
                return Err("Token de Google inválido: no contiene información de audiencia".to_string());
            }
        }
    }

    Ok(token_info)
}
