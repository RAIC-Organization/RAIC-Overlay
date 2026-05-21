#!/usr/bin/env python3
"""
Minimal RAIC Overlay sidecar in Python.

Implements docs/plugins/sidecar-protocol.md:
  - raic.init        → responds with { name, version, methods }
  - ping             → responds with { reply: 'pong', receivedAt }
  - echo             → mirrors params back
  - raic.shutdown    → exits cleanly within 5 seconds

Usage from a plugin manifest:

    "sidecar": {
      "platforms": {
        "windows-x86_64": { "bin": "bin/windows-x86_64/sidecar.exe" }
      }
    }

(Wrap with PyInstaller or similar to ship as a single exe.)
"""
from __future__ import annotations

import datetime
import json
import os
import sys


def now_rfc3339() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def write(obj: dict) -> None:
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def log(msg: str) -> None:
    # Host captures stderr lines and tags them with the plugin id.
    sys.stderr.write(msg + "\n")
    sys.stderr.flush()


def main() -> int:
    plugin_id = os.environ.get("RAIC_PLUGIN_ID", "?")
    log(f"python sidecar starting for plugin {plugin_id}")

    for line in sys.stdin:
        try:
            msg = json.loads(line)
        except json.JSONDecodeError as e:
            log(f"invalid JSON: {e}")
            continue

        method = msg.get("method")
        msg_id = msg.get("id")

        if method == "raic.init":
            write(
                {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {
                        "name": "sidecar-python",
                        "version": "0.1.0",
                        "methods": ["ping", "echo"],
                    },
                }
            )
        elif method == "ping":
            write(
                {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": {"reply": "pong", "receivedAt": now_rfc3339()},
                }
            )
        elif method == "echo":
            write(
                {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "result": msg.get("params"),
                }
            )
        elif method == "raic.shutdown":
            log("shutdown received; exiting")
            return 0
        else:
            write(
                {
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "error": {
                        "code": -32601,
                        "message": f"method {method!r} not found",
                    },
                }
            )

    return 0


if __name__ == "__main__":
    sys.exit(main())
