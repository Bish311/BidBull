#!/usr/bin/env bash
# BidBull Shell-based load generator using curl and parallel execution
TARGET_URL="${1:-http://localhost:8000}"
REQUEST_COUNT="${2:-500}"

echo "[*] Triggering $REQUEST_COUNT requests against $TARGET_URL/health and /metrics..."
for i in $(seq 1 "$REQUEST_COUNT"); do
  curl -s -o /dev/null -w "%{http_code}\n" "$TARGET_URL/health" &
  if (( i % 20 == 0 )); then
    wait
  fi
done
wait
echo "[+] Load burst complete. Inspect Prometheus metrics at $TARGET_URL/metrics."
