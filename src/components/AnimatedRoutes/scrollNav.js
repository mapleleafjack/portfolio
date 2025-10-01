// This file enables scroll wheel navigation between pages in order.
// Import and use in AnimatedRoutes.js

export const orderedRoutes = ['/', '/projects', '/portfolio', '/contact'];

export function getNextRoute(currentPath) {
  const idx = orderedRoutes.indexOf(currentPath);
  if (idx === -1) return orderedRoutes[0];
  if (idx === orderedRoutes.length - 1) return currentPath; // at end, don't loop
  return orderedRoutes[idx + 1];
}

export function getPrevRoute(currentPath) {
  const idx = orderedRoutes.indexOf(currentPath);
  if (idx === -1) return orderedRoutes[0];
  if (idx === 0) return currentPath; // at start, don't loop
  return orderedRoutes[idx - 1];
}
