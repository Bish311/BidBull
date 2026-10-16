#!/usr/bin/env python3
"""
BidBull High-Concurrency Load Generator
Generates high request volume against BidBull API endpoints to demonstrate:
1. Horizontal Pod Autoscaler (HPA) CPU trigger and replica expansion.
2. Prometheus request throughput rate spikes (http_requests_total).
3. Grafana p95 latency and status distribution dashboards.
"""

import argparse
import asyncio
import time
import httpx

async def worker(client: httpx.AsyncClient, base_url: str, stop_time: float, counter: list[int]) -> None:
    while time.time() < stop_time:
        try:
            # Hit health and catalog endpoints
            resp = await client.get(f"{base_url}/health", timeout=3.0)
            if resp.status_code == 200:
                counter[0] += 1
            resp2 = await client.get(f"{base_url}/api/items", timeout=3.0)
            if resp2.status_code == 200:
                counter[0] += 1
        except Exception:
            counter[1] += 1
        await asyncio.sleep(0.01)

async def main() -> None:
    parser = argparse.ArgumentParser(description="BidBull Load Test Helper")
    parser.add_argument("--url", default="http://localhost:8000", help="Target base URL")
    parser.add_argument("--concurrency", type=int, default=30, help="Number of concurrent workers")
    parser.add_argument("--duration", type=int, default=30, help="Test duration in seconds")
    args = parser.parse_args()

    print(f"[*] Starting load test on {args.url}")
    print(f"[*] Concurrency: {args.concurrency} workers | Duration: {args.duration}s")

    stop_time = time.time() + args.duration
    stats = [0, 0]  # [success, errors]

    limits = httpx.Limits(max_keepalive_connections=50, max_connections=100)
    async with httpx.AsyncClient(limits=limits) as client:
        tasks = [
            worker(client, args.url, stop_time, stats)
            for _ in range(args.concurrency)
        ]
        await asyncio.gather(*tasks)

    print("\n[+] Load test completed.")
    print(f"    Successful Requests: {stats[0]}")
    print(f"    Errors Encountered:  {stats[1]}")
    print(f"    Throughput:          {stats[0] / max(args.duration, 1):.2f} req/s")

if __name__ == "__main__":
    asyncio.run(main())
