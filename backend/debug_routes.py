"""Debug script to check auth router routes."""
from app.routers import auth

print(f"Auth router has {len(auth.router.routes)} routes:")
for route in auth.router.routes:
    print(f"  {route.methods} {route.path}")
