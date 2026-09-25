use crate::{AppSettings, SettingsState};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

fn get_settings_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config dir: {}", e))?;
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create config dir: {}", e))?;
    }
    Ok(dir.join("settings.json"))
}

pub fn load_settings(app: &AppHandle) -> AppSettings {
    if let Ok(path) = get_settings_file_path(app) {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(path) {
                if let Ok(settings) = serde_json::from_str::<AppSettings>(&content) {
                    return settings;
                }
            }
        }
    }
    AppSettings::default()
}

#[tauri::command]
pub fn get_settings(state: State<'_, SettingsState>) -> Result<AppSettings, String> {
    let settings = state
        .settings
        .lock()
        .map_err(|e| format!("Mutex poisoned: {}", e))?;
    Ok(settings.clone())
}

#[tauri::command]
pub fn set_settings(
    app: AppHandle,
    state: State<'_, SettingsState>,
    new_settings: serde_json::Value,
) -> Result<AppSettings, String> {
    let mut current = state
        .settings
        .lock()
        .map_err(|e| format!("Mutex poisoned: {}", e))?;

    if let Some(url) = new_settings.get("ankiConnectUrl").and_then(|v| v.as_str()) {
        current.anki_connect_url = url.to_string();
    }
    if let Some(theme) = new_settings.get("theme").and_then(|v| v.as_str()) {
        current.theme = theme.to_string();
    }
    if let Some(auto_sync) = new_settings.get("autoSync").and_then(|v| v.as_bool()) {
        current.auto_sync = auto_sync;
    }
    if let Some(new_cards) = new_settings.get("newCardsPerDay").and_then(|v| v.as_u64()) {
        current.new_cards_per_day = new_cards as u32;
    }
    if let Some(review_cards) = new_settings.get("reviewCardsPerDay").and_then(|v| v.as_u64()) {
        current.review_cards_per_day = review_cards as u32;
    }

    let file_path = get_settings_file_path(&app)?;
    let serialized = serde_json::to_string_pretty(&*current)
        .map_err(|e| format!("Serialization error: {}", e))?;
    fs::write(file_path, serialized).map_err(|e| format!("Failed to write settings: {}", e))?;

    Ok(current.clone())
}
