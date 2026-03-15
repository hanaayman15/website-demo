"""Top-level API router registration."""
from fastapi import FastAPI

from app.routers import admin, auth, clients, public, reports, teams


def include_routers(app: FastAPI) -> None:
    """Register all existing API routers without changing route paths."""
    app.include_router(public.router)
    app.include_router(auth.router)
    app.include_router(auth.role_router)
    app.include_router(admin.router)
    app.include_router(clients.router)
    app.include_router(reports.router)
    app.include_router(reports.options_router)
    app.include_router(teams.router)
    app.include_router(teams.player_router)
