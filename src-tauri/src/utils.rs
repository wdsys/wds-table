use std::path::PathBuf;
use log::info;
use tauri::{AppHandle, WebviewUrl};
use urlencoding::encode;

pub fn generate_window_label(file_path: &str) -> String {
    let mut hash: i64 = 5381;

    for c in file_path.chars() {
        hash = match hash
            .checked_shl(5)
            .and_then(|h| h.checked_sub(hash))
            .and_then(|h| h.checked_add(c as i64))
        {
            Some(h) => h,
            None => {
                let h = ((hash << 5) as i128 - hash as i128 + c as i128) % (i64::MAX as i128);
                h as i64
            }
        };
    }

    format!("window_{}", hash.abs())
}

pub fn handle_file_associations(app: AppHandle, files: Vec<PathBuf>) {
    let files: Vec<String> = files.iter().map(|p| p.display().to_string()).collect();
    info!("Received files: {:?}", files);
    if let Some(file) = files.first() {
        let encoded_path = encode(file);
        info!("Encoded path: {}", encoded_path);
        let window_label = generate_window_label(&encoded_path);
        let window_url = format!("/table?file={file}");

        tauri::WebviewWindowBuilder::new(&app, window_label, WebviewUrl::App(window_url.into()))
            .decorations(false)
            .center()
            .min_inner_size(970.0, 600.0)
            .resizable(true)
            .build()
            .unwrap();
    }
}
