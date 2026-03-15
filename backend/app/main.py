"""Main FastAPI application."""

from fastapi import FastAPI

from app.api.router import include_routers
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.middleware import register_middleware
from app.core.openapi import register_openapi
from app.db.session import init_db
from app.logging_config import setup_logging

settings = get_settings()
logger = setup_logging()

# Keep startup behavior unchanged in Phase A
init_db()


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        description="Production-ready backend for Client Nutrition Management System",
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    register_exception_handlers(app, settings=settings, logger=logger)
    register_middleware(app, settings=settings, logger=logger)

    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "app_name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "health": "/health",
        }

    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "app_name": settings.APP_NAME,
        }

    include_routers(app)
    register_openapi(app)
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
