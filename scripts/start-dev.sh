#!/bin/bash
# Start dev server in a robust way
cd /home/z/my-project
exec bun run dev > /home/z/my-project/dev.log 2>&1
