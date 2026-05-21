/**
 * PluginsContext — frontend state for installed plugins.
 *
 * Mirrors the pattern of PersistenceContext / WidgetsContext: a context
 * provider that owns a fetched list, exposes refresh + mutation helpers,
 * and is consumed by both the Settings panel and the conditional
 * "Plugins" menu in the main overlay menu (FR-012a).
 *
 * @feature 060-plugin-system
 */

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { listen, type UnlistenFn } from '@tauri-apps/api/event';

import { pluginService } from '@/stores/pluginService';
import type { RegisteredPlugin } from '@/types/plugins';

interface PluginsContextValue {
  /** All installed plugins, regardless of enabled state. */
  plugins: RegisteredPlugin[];
  /** Just the enabled subset — drives the conditional Plugins menu. */
  enabledPlugins: RegisteredPlugin[];
  /** True until the first fetch resolves (or fails). */
  loading: boolean;
  /** Last fetch error if any. */
  error: string | null;
  /** Re-fetch from the backend's in-memory registry. */
  refresh: () => Promise<void>;
}

const PluginsContext = createContext<PluginsContextValue | null>(null);

export function PluginsProvider({ children }: { children: ReactNode }) {
  const [plugins, setPlugins] = useState<RegisteredPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const rows = await pluginService.list();
      // Sort by name for stable rendering in both Settings and the menu.
      rows.sort((a, b) => a.name.localeCompare(b.name));
      setPlugins(rows);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // The backend emits four events that should refresh our list:
  //   raic:plugin-installed         after confirm install
  //   raic:plugin-changed           after enable/disable
  //   raic:plugin-uninstalled       after uninstall
  //   raic:plugin-update-available  after the daily poller detects upstream
  useEffect(() => {
    const subs: Array<Promise<UnlistenFn>> = [
      listen('raic:plugin-installed', () => void refresh()),
      listen('raic:plugin-changed', () => void refresh()),
      listen('raic:plugin-uninstalled', () => void refresh()),
      listen('raic:plugin-update-available', () => void refresh()),
    ];
    return () => {
      subs.forEach((p) => p.then((f) => f()).catch(() => {}));
    };
  }, [refresh]);

  const value = useMemo<PluginsContextValue>(() => {
    const enabledPlugins = plugins.filter((p) => p.enabled);
    return { plugins, enabledPlugins, loading, error, refresh };
  }, [plugins, loading, error, refresh]);

  return (
    <PluginsContext.Provider value={value}>{children}</PluginsContext.Provider>
  );
}

export function usePlugins(): PluginsContextValue {
  const ctx = useContext(PluginsContext);
  if (!ctx) {
    throw new Error('usePlugins must be used inside <PluginsProvider>');
  }
  return ctx;
}
