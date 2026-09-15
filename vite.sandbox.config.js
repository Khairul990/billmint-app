// Sandbox-only wrapper config — allows the Arena preview host without touching the tracked vite.config.js
import base from './vite.config.js';

export default async ({ mode = 'development', command = 'serve' } = {}) => {
  const resolved = await (typeof base === 'function' ? base({ mode, command }) : base);
  return {
    ...resolved,
    server: {
      ...(resolved.server || {}),
      host: true,
      allowedHosts: true,
    },
  };
};
