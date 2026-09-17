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
pub struct GoogleUserInfo {
    pub sub: String,
    pub email: String,
    pub name: Option<String>,
    pub picture: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GoogleAuthRequest {
    pub id_token: Option<String>,
    pub access_token: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: crate::models::user::User,
}

pub async fn verify_google_credentials(
    payload: &GoogleAuthRequest,
    expected_client_id: &str,
) -> Result<GoogleTokenInfo, String> {
    let client = reqwest::Client::new();

    // 1. Flujo con Access Token (generado por botón nativo first-party)
    if let Some(access_token) = &payload.access_token {
        let tokeninfo_url = format!(
            "https://oauth2.googleapis.com/tokeninfo?access_token={}",
            access_token
        );
        let resp = client
            .get(&tokeninfo_url)
            .send()
            .await
            .map_err(|e| format!("Fallo al conectar con Google OAuth: {}", e))?;

        if !resp.status().is_success() {
            return Err("Access token de Google inválido o expirado".to_string());
        }

        #[derive(Deserialize)]
        struct TokenInfoCheck {
            aud: Option<String>,
            azp: Option<String>,
        }

        let check = resp
            .json::<TokenInfoCheck>()
            .await
            .map_err(|e| format!("Respuesta de Google malformada: {}", e))?;

        if !expected_client_id.is_empty() {
            let client_match = check.aud.as_deref() == Some(expected_client_id)
                || check.azp.as_deref() == Some(expected_client_id);
            if !client_match {
                return Err(
                    "Acceso denegado: El token de Google no corresponde a esta aplicación"
                        .to_string(),
                );
            }
        }

        let userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo";
        let userinfo_resp = client
            .get(userinfo_url)
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| format!("Fallo al consultar perfil de Google: {}", e))?;

        if !userinfo_resp.status().is_success() {
            return Err("Error al obtener información de perfil de Google".to_string());
        }

        let user_info = userinfo_resp
            .json::<GoogleUserInfo>()
            .await
            .map_err(|e| format!("Respuesta de perfil de Google malformada: {}", e))?;

        return Ok(GoogleTokenInfo {
            aud: Some(expected_client_id.to_string()),
            sub: user_info.sub,
            email: user_info.email,
            name: user_info.name,
            picture: user_info.picture,
        });
    }

    // 2. Flujo tradicional con ID Token (JWT)
    if let Some(id_token) = &payload.id_token {
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

        if !expected_client_id.is_empty() {
            match &token_info.aud {
                Some(aud) if aud == expected_client_id => (),
                Some(_) => {
                    return Err(
                        "Acceso denegado: El token de Google no fue generado para esta aplicación"
                            .to_string(),
                    );
                }
                None => {
                    return Err(
                        "Token de Google inválido: no contiene información de audiencia"
                            .to_string(),
                    );
                }
            }
        }

        return Ok(token_info);
    }

    Err("Se requiere id_token o access_token para autenticarse".to_string())
}
