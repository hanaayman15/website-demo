"""Diet plan selection utilities for client and team player workflows."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Optional, Sequence


SCHOOL_WAKEUP_CUTOFF_MINUTES = 8 * 60 + 30


def parse_time_to_minutes(time_value: Optional[str]) -> Optional[int]:
    """Parse HH:MM or HH:MM AM/PM into minutes since midnight."""
    if not time_value:
        return None

    raw = str(time_value).strip().lower()
    if not raw:
        return None

    ampm = None
    if raw.endswith("am") or raw.endswith("pm"):
        ampm = raw[-2:]
        raw = raw[:-2].strip()

    if ":" not in raw:
        return None

    try:
        hour_text, minute_text = raw.split(":", 1)
        hour = int(hour_text)
        minute = int(minute_text)
    except (TypeError, ValueError):
        return None

    if minute < 0 or minute > 59:
        return None

    if ampm:
        if hour < 1 or hour > 12:
            return None
        if hour == 12:
            hour = 0
        if ampm == "pm":
            hour += 12
    elif hour < 0 or hour > 23:
        return None

    return hour * 60 + minute


def classify_schedule_type(wake_up_time: Optional[str]) -> str:
    """Classify wake-up schedule as school or summer."""
    minutes = parse_time_to_minutes(wake_up_time)
    if minutes is None:
        return "summer"
    return "school" if minutes <= SCHOOL_WAKEUP_CUTOFF_MINUTES else "summer"


def infer_schedule_from_text(text_value: Optional[str]) -> Optional[str]:
    normalized = str(text_value or "").strip().lower()
    if not normalized:
        return None
    if "school" in normalized:
        return "school"
    if "summer" in normalized:
        return "summer"
    return None


@dataclass
class TemplateCandidate:
    template_id: int
    template_name: str
    min_kcal: Optional[float]
    max_kcal: Optional[float]
    schedule_type: Optional[str]
    plan_type: Optional[str]

    @property
    def normalized_schedule(self) -> Optional[str]:
        return infer_schedule_from_text(self.schedule_type) or infer_schedule_from_text(self.plan_type) or infer_schedule_from_text(self.template_name)

    @property
    def midpoint(self) -> Optional[float]:
        if self.min_kcal is None and self.max_kcal is None:
            return None
        if self.min_kcal is None:
            return float(self.max_kcal)
        if self.max_kcal is None:
            return float(self.min_kcal)
        return (float(self.min_kcal) + float(self.max_kcal)) / 2.0

    def matches_tdee(self, tdee: float) -> bool:
        lower_ok = self.min_kcal is None or tdee >= float(self.min_kcal)
        upper_ok = self.max_kcal is None or tdee <= float(self.max_kcal)
        return lower_ok and upper_ok


def _normalize_templates(templates: Iterable[object]) -> list[TemplateCandidate]:
    candidates: list[TemplateCandidate] = []
    for template in templates:
        if template is None:
            continue
        candidates.append(
            TemplateCandidate(
                template_id=getattr(template, "id", 0),
                template_name=str(getattr(template, "template_name", "") or ""),
                min_kcal=getattr(template, "min_kcal", None),
                max_kcal=getattr(template, "max_kcal", None),
                schedule_type=getattr(template, "schedule_type", None),
                plan_type=getattr(template, "plan_type", None),
            )
        )
    return candidates


def select_diet_template(templates: Sequence[object], tdee: Optional[float], wake_up_time: Optional[str]) -> tuple[Optional[object], dict]:
    """Select best-matching template using TDEE bracket and wake-up schedule."""
    if tdee is None:
        return None, {
            "reason": "missing_tdee",
            "schedule_type": classify_schedule_type(wake_up_time),
            "calorie_bracket": None,
        }

    schedule_type = classify_schedule_type(wake_up_time)
    candidates = _normalize_templates(templates)

    if not candidates:
        return None, {
            "reason": "no_templates",
            "schedule_type": schedule_type,
            "calorie_bracket": None,
        }

    by_id = {int(getattr(template, "id", 0)): template for template in templates}
    in_bracket = [candidate for candidate in candidates if candidate.matches_tdee(float(tdee))]

    filtered = [candidate for candidate in in_bracket if candidate.normalized_schedule == schedule_type]
    if not filtered:
        filtered = in_bracket

    if not filtered:
        with_midpoints = [candidate for candidate in candidates if candidate.midpoint is not None]
        if with_midpoints:
            with_midpoints.sort(key=lambda candidate: abs(float(tdee) - float(candidate.midpoint)))
            nearest_midpoint = with_midpoints[0].midpoint
            filtered = [candidate for candidate in with_midpoints if candidate.midpoint == nearest_midpoint]
        else:
            filtered = list(candidates)

    if schedule_type:
        schedule_pref = [candidate for candidate in filtered if candidate.normalized_schedule == schedule_type]
        if schedule_pref:
            filtered = schedule_pref

    filtered.sort(key=lambda candidate: candidate.template_id)
    selected_candidate = filtered[0] if filtered else None

    if not selected_candidate:
        return None, {
            "reason": "no_match",
            "schedule_type": schedule_type,
            "calorie_bracket": None,
        }

    selected_template = by_id.get(selected_candidate.template_id)
    return selected_template, {
        "reason": "matched",
        "schedule_type": schedule_type,
        "calorie_bracket": {
            "min_kcal": selected_candidate.min_kcal,
            "max_kcal": selected_candidate.max_kcal,
        },
    }