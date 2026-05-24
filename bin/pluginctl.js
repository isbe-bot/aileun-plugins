#!/usr/bin/env node
import { main } from '../src/cli/main.js';

const asJson = process.argv.slice(2).includes('--json');

main(process.argv.slice(2)).catch((error) => {
  const message = error?.message || String(error);
  if (asJson) {
    process.stderr.write(`${JSON.stringify({ ok: false, error: message }, null, 2)}
`);
  } else {
    process.stderr.write(`Error: ${message}
`);
  }
  process.exit(1);
});
