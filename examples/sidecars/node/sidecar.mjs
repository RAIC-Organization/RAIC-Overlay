#!/usr/bin/env node
// Minimal RAIC Overlay sidecar in Node.js (ESM).
//
// Implements docs/plugins/sidecar-protocol.md:
//   raic.init       -> responds with { name, version, methods }
//   ping            -> responds with { reply: 'pong', receivedAt }
//   echo            -> mirrors params back
//   raic.shutdown   -> exits cleanly within 5 seconds
//
// Build a single-file executable with e.g. `bun build --compile`, `pkg`,
// or Node's `--experimental-sea-config` to ship as `bin/<platform>/sidecar.exe`.

import { stdin, stdout, stderr, exit, env } from 'node:process';
import { createInterface } from 'node:readline';

const PLUGIN_ID = env.RAIC_PLUGIN_ID ?? '?';
stderr.write(`node sidecar starting for plugin ${PLUGIN_ID}\n`);

function write(obj) {
  stdout.write(JSON.stringify(obj) + '\n');
}

function nowRfc3339() {
  return new Date().toISOString();
}

const rl = createInterface({ input: stdin, crlfDelay: Infinity });

for await (const line of rl) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch (e) {
    stderr.write(`invalid JSON: ${e.message}\n`);
    continue;
  }

  const { method, id, params } = msg;

  switch (method) {
    case 'raic.init':
      write({
        jsonrpc: '2.0',
        id,
        result: {
          name: 'sidecar-node',
          version: '0.1.0',
          methods: ['ping', 'echo'],
        },
      });
      break;

    case 'ping':
      write({
        jsonrpc: '2.0',
        id,
        result: { reply: 'pong', receivedAt: nowRfc3339() },
      });
      break;

    case 'echo':
      write({ jsonrpc: '2.0', id, result: params });
      break;

    case 'raic.shutdown':
      stderr.write('shutdown received; exiting\n');
      exit(0);
      break;

    default:
      write({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `method '${method}' not found` },
      });
  }
}
