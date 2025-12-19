/**
 * Loading Screen Component for State Persistence System
 *
 * Displays a loading indicator while the application hydrates
 * persisted state on startup.
 *
 * @feature 010-state-persistence-system
 */

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}
