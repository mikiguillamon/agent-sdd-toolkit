export function createReporter() {
  const lines = [];

  function push(level, message) {
    const line = `${level}: ${message}`;
    lines.push(line);
    console.log(line);
  }

  return {
    lines,
    ok(message) {
      push('OK', message);
    },
    warn(message) {
      push('WARN', message);
    },
    error(message) {
      push('ERROR', message);
    },
    info(message) {
      push('INFO', message);
    }
  };
}
