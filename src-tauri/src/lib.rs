// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod utils;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}, Manager
};
use crate::utils::{ generate_window_label, handle_file_associations};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new()
        .target(tauri_plugin_log::Target::new(
            tauri_plugin_log::TargetKind::LogDir {
              file_name: Some("wds-table-logs".to_string()),
            },
          ))
        .build())
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {

            let args: Vec<String> = args.into_iter().skip(1).collect();

            if let Some(file_path) = args.into_iter().find(|arg| !arg.starts_with('-')) {
                // 生成窗口标签
                let encode_path = urlencoding::encode(&file_path);
                let window_label = generate_window_label(&encode_path);
                
                // 检查该文件的窗口是否已存在
                if let Some(existing_window) = app.get_webview_window(&window_label) {
                    let _ = existing_window.set_focus();
                } else {
                    // 创建新窗口打开文件
                    let _ = tauri::WebviewWindowBuilder::new(
                        app,
                        window_label,
                        tauri::WebviewUrl::App(format!("/table?file={}", file_path).into())
                    )
                    .decorations(false)
                    .center()
                    .min_inner_size(970.0, 600.0)
                    .drag_and_drop(false)
                    .resizable(true)
                    .build()
                    .unwrap();  
                }
            } else {
                let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
            }

        }))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        println!("quit menu item was clicked");
                        app.exit(0);
                    }
                    _ => {
                        println!("menu item {:?} not handled", event.id);
                    }
                })
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        println!("left click pressed and released");
                        // in this example, let's show and focus the main window when the tray is clicked
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {
                        println!("unhandled event {event:?}");
                    }
                })
                .build(app)?;

            #[cfg(any(windows, target_os = "linux"))]
            {
                let mut files = Vec::new();
                // NOTICE: `args` may include URL protocol (`your-app-protocol://`)
                // or arguments (`--`) if your app supports them.
                // files may aslo be passed as `file://path/to/file`
                for maybe_file in std::env::args().skip(1) {
                    // skip flags like -f or --flag
                    if maybe_file.starts_with('-') {
                        continue;
                    }

                    // handle `file://` path urls and skip other urls
                    // if let Ok(url) = Url::parse(&maybe_file) {
                    //     info!("parse ok");
                    //     if let Ok(path) = url.to_file_path() {
                    //         info!("to file path ok");
                    //         files.push(path);
                    //     }
                    // } else {
                    //     files.push(PathBuf::from(maybe_file))
                    // }
                    files.push(maybe_file)
                }
                handle_file_associations(app.handle().clone(), files);
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(
            #[allow(unused_variables)]
            |app, event| {
                #[cfg(any(target_os = "macos", target_os = "ios"))]
                if let tauri::RunEvent::Opened { urls } = event {
                    let files = urls
                        .into_iter()
                        .filter_map(|url| url.to_file_path().ok())
                        .collect::<Vec<_>>();

                    handle_file_associations(app.clone(), files);
                }
            },
        );
}
