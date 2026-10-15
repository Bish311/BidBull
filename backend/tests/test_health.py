import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_liveness_endpoint_returns_ok(async_client: AsyncClient) -> None:
    response = await async_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data


@pytest.mark.asyncio
async def test_ready_readiness_endpoint_returns_ready(async_client: AsyncClient) -> None:
    response = await async_client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "healthy"
    assert data["redis"] == "healthy"


@pytest.mark.asyncio
async def test_metrics_prometheus_endpoint_returns_scraped_format(async_client: AsyncClient) -> None:
    response = await async_client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text or "python_gc_objects_collected_total" in response.text
