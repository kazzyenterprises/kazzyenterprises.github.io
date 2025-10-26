// shared/js/utils/component-loader.js
export async function loadComponent(path, targetId) {
  const target = document.getElementById(targetId);
  if (!target) {
    throw new Error(`[Component Loader] Target #${targetId} not found.`);
  }

  const response = await fetch(path);
  if (!response.ok) throw new Error(`[Component Loader] Failed to load ${path}: ${response.status}`);
  const html = await response.text();
  target.innerHTML = html;
}
