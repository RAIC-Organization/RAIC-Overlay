'use client';

/**
 * Conditional "Plugins" entry in the main overlay menu (FR-012a).
 *
 * - Hidden entirely when there are zero installed-and-enabled plugins, so
 *   the menu bar does not grow for users who have no plugins.
 * - When visible, the button opens a dropdown listing every enabled
 *   plugin. Clicking a row calls plugin_open.
 * - Accessibility (FR-029 / WCAG 2.1 AA): button uses aria-haspopup="menu"
 *   + aria-expanded, the list uses role="menu", arrow keys navigate,
 *   Escape closes, focus returns to the trigger.
 *
 * @feature 060-plugin-system
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Puzzle, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { pluginService } from '@/stores/pluginService';
import { usePlugins } from '@/contexts/PluginsContext';

export function PluginsMenu() {
  const { enabledPlugins } = usePlugins();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.parentElement?.contains(t)) {
        close();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  // When the menu opens, focus the first item (or the previously-active one).
  useEffect(() => {
    if (!open) return;
    const idx = Math.min(activeIndex, enabledPlugins.length - 1);
    itemsRef.current[idx]?.focus();
  }, [open, activeIndex, enabledPlugins.length]);

  // FR-012a: hide entirely when no enabled plugins.
  if (enabledPlugins.length === 0) {
    return null;
  }

  function handleTriggerKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveIndex(0);
      setOpen(true);
    }
  }

  function handleItemKey(
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((idx + 1) % enabledPlugins.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((idx - 1 + enabledPlugins.length) % enabledPlugins.length);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(enabledPlugins.length - 1);
        break;
      case 'Tab':
        // Tab closes the menu without selection (focus moves on).
        close();
        break;
    }
  }

  async function handleSelect(pluginId: string) {
    setOpen(false);
    try {
      await pluginService.open(pluginId);
    } catch (e) {
      console.error(`Failed to open plugin ${pluginId}:`, e);
    }
    triggerRef.current?.focus();
  }

  const menuId = 'plugins-menu-dropdown';

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        variant="secondary"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKey}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="inline-flex items-center gap-1.5"
      >
        <Puzzle className="h-3.5 w-3.5" aria-hidden />
        Plugins
        <ChevronDown className="h-3 w-3" aria-hidden />
      </Button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Installed plugins"
          className="
            absolute left-1/2 top-full mt-1 -translate-x-1/2 z-50
            min-w-[180px] max-w-[280px]
            rounded border border-border bg-background/95 backdrop-blur-xl
            shadow-glow-sm py-1
          "
        >
          {enabledPlugins.map((p, idx) => (
            <button
              key={p.id}
              ref={(el) => {
                itemsRef.current[idx] = el;
              }}
              role="menuitem"
              type="button"
              onClick={() => void handleSelect(p.id)}
              onKeyDown={(e) => handleItemKey(e, idx)}
              tabIndex={activeIndex === idx ? 0 : -1}
              className="
                w-full text-left px-3 py-1.5 text-sm
                hover:bg-muted/50 focus:bg-muted/60
                focus-visible:outline-none
                sc-glow-transition truncate
              "
            >
              {p.name}{' '}
              <span className="text-xs text-muted-foreground">v{p.installedVersion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
