/**
 * T012 (051): Update Window Page Route
 *
 * Next.js page route for the dedicated update notification window.
 * This is loaded in a separate Tauri WebView window that appears in the taskbar.
 *
 * @feature 051-fix-update-popup
 */

import { UpdatePage } from "@/components/update/UpdatePage";

export default function UpdateRoute() {
  return <UpdatePage />;
}
