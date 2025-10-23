# WDS-Table

WDS-Table is a desktop application built with Tauri, React, and TypeScript that allows users to create, edit, and manage tabular data in a customizable format. The application features a modern UI with internationalization support and is designed for efficient data manipulation.

## Features

- Create and edit tabular data with a rich UI
- Save/load files in a custom `.table` format
- Recent files tracking
- Cross-platform desktop application (Windows, macOS, Linux)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Ant Design (antd)
- **Desktop Framework**: Tauri 2.x with Rust backend
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 16 or higher)
- [pnpm](https://pnpm.io/) (package manager)
- [Rust](https://www.rust-lang.org/) (required for Tauri)

For Windows users, you'll also need:
- WebView2 (usually comes with Windows 10+)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd wds-table
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Install Tauri CLI (if not already installed):
   ```bash
   pnpm tauri add cli
   ```

## Development

To start the development server:

```bash
pnpm tauri dev
```

This will launch the Tauri development environment with hot reloading.

## Building

To build the application for production:

```bash
pnpm build
```

To build the desktop application bundle:

```bash
pnpm tauri build
```

The built application will be available in the `src-tauri/target/release` directory.

## Running Tests

Currently, there are no automated tests configured for this project. Manual testing is recommended.

## Project Structure

```
src/
├── components/         # Reusable UI components
├── locale/             # Internationalization files
├── pages/              # Page components
├── utils/              # Utility functions
├── App.tsx             # Main application component
└── main.tsx            # Entry point

src-tauri/
├── src/                # Rust backend code
├── Cargo.toml          # Rust dependencies
└── tauri.conf.json     # Tauri configuration
```

## Contributing

Contributions are welcome! Here's how you can contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate documentation.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) for the desktop application framework
- [React](https://reactjs.org/) for the frontend library
- [Ant Design](https://ant.design/) for the UI components