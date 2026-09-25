pub mod commands;

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    AppHandle, Emitter, Manager,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub anki_connect_url: String,
    pub theme: String,
    pub auto_sync: bool,
    pub new_cards_per_day: u32,
    pub review_cards_per_day: u32,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            anki_connect_url: "http://localhost:8765".to_string(),
            theme: "system".to_string(),
            auto_sync: true,
            new_cards_per_day: 20,
            review_cards_per_day: 200,
        }
    }
}

pub struct SettingsState {
    pub settings: Mutex<AppSettings>,
}

fn setup_menu(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(
            &MenuItemBuilder::with_id("menu-new-card", "New Card")
                .accelerator("CmdOrCtrl+N")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("menu-import", "Import")
                .accelerator("CmdOrCtrl+I")
                .build(app)?,
        )
        .separator()
        .quit()
        .build()?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;

    let study_menu = SubmenuBuilder::new(app, "Study")
        .item(
            &MenuItemBuilder::with_id("menu-review", "Review Cards")
                .accelerator("CmdOrCtrl+R")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("menu-sync", "Sync with Anki")
                .accelerator("CmdOrCtrl+S")
                .build(app)?,
        )
        .build()?;

    let help_menu = SubmenuBuilder::new(app, "Help")
        .item(&MenuItemBuilder::with_id("menu-about", "About Ankiniki").build(app)?)
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&file_menu, &edit_menu, &study_menu, &help_menu])
        .build()?;

    app.set_menu(menu)?;

    app.on_menu_event(move |app_handle, event| {
        let id = event.id().as_ref();
        match id {
            "menu-new-card" => {
                let _ = app_handle.emit("menu-new-card", ());
            }
            "menu-import" => {
                let _ = app_handle.emit("menu-import", ());
            }
            "menu-review" => {
                let _ = app_handle.emit("menu-review", ());
            }
            "menu-sync" => {
                let _ = app_handle.emit("menu-sync", ());
            }
            "menu-about" => {
                let _ = app_handle.emit("menu-about", ());
            }
            _ => {}
        }
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .setup(|app| {
            let initial_settings = commands::load_settings(app.handle());
            app.manage(SettingsState {
                settings: Mutex::new(initial_settings),
            });
            if let Err(e) = setup_menu(app.handle()) {
                eprintln!("Failed to setup menu: {}", e);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::set_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
