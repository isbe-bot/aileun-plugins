export function printResult(data, asJson = false) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
    return;
  }

  if (typeof data === 'string') {
    process.stdout.write(`${data}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

export function fail(message, code = 1, asJson = false, extra = {}) {
  if (asJson) {
    process.stderr.write(`${JSON.stringify({ ok: false, error: message, ...extra }, null, 2)}\n`);
  } else {
    process.stderr.write(`Error: ${message}\n`);
  }
  process.exit(code);
}
