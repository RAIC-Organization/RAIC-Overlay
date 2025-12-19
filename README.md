# RAICOverlay

<p align="center">
  <strong>A Windows-native overlay application for attaching customizable, always-on-top UI to other applications</strong>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#built-with">Built With</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#usage">Usage</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## About The Project

RAICOverlay is a Tauri-based desktop overlay framework specifically designed for game overlays (initially targeting Star Citizen). It provides a seamless, click-through interactive experience combining a performant Rust backend with a modern React frontend.

The overlay supports dual interaction modes—a transparent, click-through fullscreen mode that doesn't interfere with your game, and an interactive windowed mode for active tool usage. With built-in keyboard shortcuts, multi-window management, and automatic target window attachment, RAICOverlay enhances your gameplay experience without getting in the way.

## Key Features

- **Dual-Mode Overlay** — Toggle between fullscreen (click-through, 60% transparent) and windowed (interactive, fully opaque) modes
- **Keyboard Shortcuts** — F3 to show/hide overlay, F5 to toggle between modes
- **Target Window Attachment** — Automatically positions and scales the overlay to match your target application
- **Multi-Window System** — Spawn and manage multiple tool windows within the overlay
- **Built-in Tools**
  - **Notes Window** — Rich text editing with TipTap (formatting, alignment, lists)
  - **Draw Window** — Sketch and annotate with Excalidraw integration
- **Auto-Hide** — Overlay automatically hides when target window loses focus
- **Dark Theme** — Modern dark UI with smooth motion animations
- **Accessibility** — Respects reduced motion preferences

## Built With

### Frontend
- [TypeScript](https://www.typescriptlang.org/) 5.7.2
- [React](https://react.dev/) 19.0.0
- [Next.js](https://nextjs.org/) 16.x (static export)
- [Tailwind CSS](https://tailwindcss.com/) 4.x
- [shadcn/ui](https://ui.shadcn.com/) — UI components
- [Motion](https://motion.dev/) 12.x — Animations
- [TipTap](https://tiptap.dev/) 3.13.0 — Rich text editor
- [Excalidraw](https://excalidraw.com/) 0.18.0 — Drawing canvas

### Backend
- [Rust](https://www.rust-lang.org/) 1.92 (2021 Edition)
- [Tauri](https://tauri.app/) 2.x — Desktop framework
- [windows-rs](https://github.com/microsoft/windows-rs) — Windows API bindings
- tauri-plugin-global-shortcut 2.x

## Getting Started

### Prerequisites

- **Windows 11 (64-bit)** — Required for full functionality
- **Node.js** and npm
- **Rust** 1.92 or later
- Target application (default: Star Citizen)

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/your-username/RAICOverlay.git
   cd RAICOverlay
   ```

2. Install Node.js dependencies
   ```sh
   npm install
   ```

3. Configure environment
   ```sh
   cp .env.example .env
   ```
   Edit `.env` to set your target window:
   ```env
   TARGET_WINDOW_NAME="Star Citizen"
   ```

4. Build and run in development mode
   ```sh
   npm run tauri:dev
   ```

### Building for Production

```sh
npm run tauri:build
```

The built executable will be available in `src-tauri/target/release`.

## Usage

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **F3** | Show/Hide overlay |
| **F5** | Toggle between click-through and interactive modes |

### Modes

- **Fullscreen Mode** (Click-through)
  - 60% transparent overlay
  - Clicks pass through to underlying application
  - Ideal for passive monitoring

- **Windowed Mode** (Interactive)
  - Fully opaque overlay
  - Full interaction with overlay tools
  - Use for notes, drawing, and other activities

### Available Commands

```sh
# Development
npm run dev              # Start Next.js dev server
npm run tauri:dev        # Start Tauri with hot reload

# Building
npm run build            # Build Next.js frontend
npm run tauri:build      # Build production executable

# Testing
npm run test             # Run Vitest tests
cargo test               # Run Rust tests
cargo clippy             # Run Rust linter
```

## Project Structure

```
RAICOverlay/
├── app/                          # Next.js app directory
│   └── page.tsx                  # Main page component
├── src/                          # TypeScript/React frontend
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── windows/              # Window components (Notes, Draw)
│   │   ├── MainMenu.tsx          # Main button menu
│   │   ├── AppIcon.tsx           # App icon branding
│   │   └── ErrorModal.tsx        # Error modal
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities
│   └── types/                    # TypeScript type definitions
├── src-tauri/                    # Rust/Tauri backend
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   ├── lib.rs                # Main library setup
│   │   ├── state.rs              # Overlay state management
│   │   ├── hotkey.rs             # Keyboard shortcut handling
│   │   ├── window.rs             # Window positioning
│   │   ├── target_window.rs      # Windows API integration
│   │   └── focus_monitor.rs      # Target window focus tracking
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
├── .env.example                  # Environment variable template
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
└── next.config.mjs               # Next.js configuration
```

## Roadmap

- [x] Core overlay framework
- [x] Dual-mode (fullscreen/windowed) support
- [x] Target window attachment
- [x] Multi-window management system
- [x] Notes window (TipTap rich text)
- [x] Draw window (Excalidraw)
- [ ] Persistent state (notes/drawings saved to disk)
- [ ] Additional tool windows
- [ ] Custom keyboard shortcut configuration
- [ ] Cross-platform support (Linux, macOS)

## Contributing

Contributions are welcome! If you have a suggestion that would improve RAICOverlay:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with Tauri + React
</p>
