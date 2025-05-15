use tauri::Manager;
use tauri::Emitter;
use std::env;

pub fn handle_file_associations(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Handle file associations and command line arguments
    let args: Vec<String> = env::args().collect();
    if args.len() > 1 {
        let file_path = &args[1];
        if file_path.ends_with(".table") {
            // Get the main window
            if let Some(window) = app.get_webview_window("main") {
                // Emit event to open file
                window.emit_to("main", "open-table-file", file_path)?;
            }
        }
    }
    Ok(())
}