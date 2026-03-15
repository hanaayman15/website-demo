"""Lightweight end-to-end sanity checks for client dashboard core flows.

Usage:
    python client_dashboard_sanity_test.py

Optional environment variables:
    API_BASE_URL=http://127.0.0.1:8001
"""

from __future__ import annotations

import json
import os
import random
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Optional

API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8001").rstrip("/")


class SanityFailure(Exception):
    """Raised when a required sanity step fails."""


def log_step(name: str, ok: bool, details: str) -> None:
    state = "PASS" if ok else "FAIL"
    print(f"[{state}] {name}: {details}")


def api_request(path: str, method: str = "GET", token: Optional[str] = None, payload: Optional[dict] = None) -> dict:
    url = f"{API_BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    data_bytes = None
    if payload is not None:
        data_bytes = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(url=url, method=method, headers=headers, data=data_bytes)

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SanityFailure(f"HTTP {exc.code} for {method} {path}: {body}") from exc
    except urllib.error.URLError as exc:
        raise SanityFailure(f"Connection error for {method} {path}: {exc}") from exc


def main() -> int:
    email = f"sanity_client_{random.randint(100000, 999999)}@example.com"
    password = "TestPass123!"
    full_name = "Sanity Flow Client User"

    try:
        register_payload = {
            "email": email,
            "password": password,
            "full_name": full_name,
        }
        register_data = api_request("/api/auth/register", method="POST", payload=register_payload)
        token = register_data.get("access_token")
        if not token:
            raise SanityFailure("Registration did not return access_token")

        profile_smoke = api_request("/api/client/profile", token=token)
        if "id" not in profile_smoke:
            raise SanityFailure("/api/client/profile did not return a profile id")

        log_step("API Endpoint Checks", True, "register + authenticated profile endpoints are responding")

        # Seed profile values so home-summary can return weight and calorie target.
        profile_update_payload = {
            "weight": 77.5,
            "tdee": 2550,
            "protein_target": 180,
            "carbs_target": 250,
            "fats_target": 70,
        }
        api_request("/api/client/profile", method="PUT", token=token, payload=profile_update_payload)

        profile = api_request("/api/client/profile", token=token)
        client_profile_id = profile.get("id")
        if not client_profile_id:
            raise SanityFailure("Could not resolve client profile id from /api/client/profile")

        # 1) Home Summary
        home_summary = api_request("/api/client/home-summary", token=token)
        required_keys = ["full_name", "current_weight", "calories_target", "subscription_plan"]
        missing_keys = [k for k in required_keys if k not in home_summary]
        if missing_keys:
            raise SanityFailure(f"home-summary missing keys: {missing_keys}")

        if not home_summary.get("full_name"):
            raise SanityFailure("home-summary full_name is empty")
        if home_summary.get("current_weight") is None:
            raise SanityFailure("home-summary current_weight is null")
        if home_summary.get("calories_target") is None:
            raise SanityFailure("home-summary calories_target is null")

        log_step("Home Summary", True, "name/weight/calorie target returned and subscription_plan key exists")

        # 2) Consultation Flow (simulate plan selection)
        selected_plan = "monthly"
        consultation_payload = {
            "client_id": client_profile_id,
            "consultation_type": selected_plan,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        consultation_save = api_request(
            "/api/client/consultation",
            method="POST",
            token=token,
            payload=consultation_payload,
        )

        if consultation_save.get("consultation_type") != selected_plan:
            raise SanityFailure("consultation save response did not return selected consultation_type")

        log_step("Consultation Flow", True, f"saved consultation_type={selected_plan}")

        # 3) Reload Validation
        consultation_reload = api_request("/api/client/consultation", token=token)
        if consultation_reload.get("consultation_type") != selected_plan:
            raise SanityFailure("consultation_type did not persist after reload")

        log_step("Reload Validation", True, f"persisted consultation_type={selected_plan}")
        return 0

    except SanityFailure as exc:
        log_step("Sanity Test", False, str(exc))
        return 1
    except Exception as exc:  # pylint: disable=broad-except
        log_step("Sanity Test", False, f"Unexpected error: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
