// shared/js/store/event-bus.js
const listeners = {};

export function on(event, callback) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
}

export function off(event, callback) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(cb => cb !== callback);
}

export function emit(event, data) {
  if (!listeners[event]) return;
  listeners[event].forEach(cb => {
    try {
      cb(data);
    } catch (err) {
      console.error(`Error in '${event}' listener:`, err);
    }
  });
}

// ✅ Convenience object for modules using EventBus.on()
export const EventBus = { on, off, emit };
export default { on, off, emit };
