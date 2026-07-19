#!/usr/bin/env python3
"""Start Next.js dev server in a fully detached, persistent subprocess."""
import subprocess
import os
import sys
import time

project_dir = "/home/z/my-project"
log_path = "/home/z/my-project/dev.log"

# Kill any existing dev servers
subprocess.run(["pkill", "-f", "next dev"], capture_output=True)
subprocess.run(["pkill", "-f", "next-server"], capture_output=True)
time.sleep(2)

# Open log file
log_fd = open(log_path, "w")

# Start dev server in a new session (detached from this script's process group)
proc = subprocess.Popen(
    ["bun", "run", "dev"],
    cwd=project_dir,
    stdout=log_fd,
    stderr=subprocess.STDOUT,
    stdin=subprocess.DEVNULL,
    start_new_session=True,  # This is the key — detaches from controlling terminal
    env={**os.environ, "NODE_OPTIONS": "--max-old-space-size=2048"},
)

print(f"Started dev server, PID={proc.pid}")
print(f"Waiting for boot...")

# Wait up to 60s for the server to start
for i in range(30):
    time.sleep(2)
    try:
        result = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "5", "http://localhost:3000/"],
            capture_output=True, text=True
        )
        code = result.stdout
        if code and code != "000":
            print(f"Server responding with HTTP {code}")
            sys.exit(0)
    except Exception:
        pass

print("Server did not respond within 60s, but process may still be running")
print(f"Process alive: {proc.poll() is None}")
sys.exit(0)
