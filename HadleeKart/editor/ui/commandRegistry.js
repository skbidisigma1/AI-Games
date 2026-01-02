export function createCommandRegistry() {
  const commands = new Map();

  function register(id, handler) {
    if (!id) throw new Error('Command id required');
    if (typeof handler !== 'function') throw new Error(`Handler for ${id} must be a function`);
    commands.set(id, handler);
  }

  function run(id, payload) {
    const fn = commands.get(id);
    if (!fn) return false;
    fn(payload);
    return true;
  }

  return { register, run };
}
