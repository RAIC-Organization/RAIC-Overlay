use std::sync::atomic::{AtomicBool, Ordering};

pub struct OverlayState {
    pub visible: AtomicBool,
    pub initialized: AtomicBool,
}

impl Default for OverlayState {
    fn default() -> Self {
        Self {
            visible: AtomicBool::new(false),
            initialized: AtomicBool::new(false),
        }
    }
}

impl OverlayState {
    pub fn is_visible(&self) -> bool {
        self.visible.load(Ordering::SeqCst)
    }

    pub fn set_visible(&self, visible: bool) {
        self.visible.store(visible, Ordering::SeqCst);
    }

    pub fn toggle_visible(&self) -> bool {
        let previous = self.visible.fetch_xor(true, Ordering::SeqCst);
        !previous
    }

    pub fn is_initialized(&self) -> bool {
        self.initialized.load(Ordering::SeqCst)
    }

    pub fn set_initialized(&self, initialized: bool) {
        self.initialized.store(initialized, Ordering::SeqCst);
    }
}
