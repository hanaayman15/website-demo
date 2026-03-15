"""OpenAPI schema customization for legacy response compatibility."""
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi


_paths_without_422 = {
    "/api/public/success-stories": ["get"],
    "/api/auth/register": ["post"],
    "/api/auth/login": ["post"],
    "/api/auth/change-password": ["post"],
    "/api/admin/clients": ["get", "post"],
    "/api/admin/clients/{client_id}": ["get", "put", "delete"],
    "/api/admin/nutrition-plans": ["post"],
    "/api/admin/diet-templates": ["get", "post"],
    "/api/admin/diet-templates/{template_id}": ["put", "delete"],
    "/api/client/profile": ["put"],
    "/api/client/nutrition-plans": ["get"],
    "/api/client/nutrition-plans/{plan_id}": ["get"],
    "/api/client/workouts": ["post", "get"],
    "/api/client/mood": ["post", "get"],
    "/api/client/weight": ["post", "get"],
    "/api/client/supplements": ["post", "get"],
}


def register_openapi(app: FastAPI) -> None:
    """Attach OpenAPI generation hook preserving current schema behavior."""

    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )

        for path, methods in _paths_without_422.items():
            for method in methods:
                operation = (
                    openapi_schema.get("paths", {})
                    .get(path, {})
                    .get(method, {})
                )
                if isinstance(operation, dict):
                    operation.get("responses", {}).pop("422", None)

        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi
