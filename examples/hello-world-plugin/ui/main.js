// Hello World plugin entry script.
// Demonstrates the documented window.raic surface: window.setTitle, state
// (persists across restarts), and the SC HUD theme tokens via CSS.
//
// See docs/plugins/quickstart.md and docs/plugins/jsonrpc-v1.md.

async function init() {
  // Title the window. Falls back gracefully on Phase 2 hosts that don't yet
  // route window.setTitle (returns MethodNotFound) — we ignore the error.
  try {
    await window.raic.rpc('window.setTitle', { title: 'Hello World' });
  } catch (_) { /* OK in Phase 2/3 */ }

  let storedName = null;
  try {
    const { value } = await window.raic.rpc('state.get', { key: 'name' });
    storedName = value;
  } catch (_) { /* state handlers wired in Phase 4 */ }

  const greeting = document.getElementById('greeting');
  greeting.textContent = storedName ? `Hi, ${storedName}!` : 'Hi, stranger!';

  document.getElementById('name-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = document.getElementById('name-input').value.trim();
    if (!value) return;
    try {
      await window.raic.rpc('state.set', { key: 'name', value });
    } catch (err) {
      console.warn('state.set not yet wired:', err);
    }
    greeting.textContent = `Hi, ${value}!`;
  });
}

init().catch((err) => {
  console.error('hello-world plugin failed to init', err);
});
