"""Compatibility entrypoint for running the backend from backend/."""

from app.main import app


if __name__ == "__main__":
	import uvicorn

	print("[startup] Launching backend on http://0.0.0.0:8001")
	print("[startup] If startup fails, check backend/.env values and port conflicts")
	uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)