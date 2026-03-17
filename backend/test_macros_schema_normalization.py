"""Regression tests for macros schema normalization.

These tests protect the payload compatibility layer so dashboard sync
requests do not fail with 422 when frontend payload shapes vary.
"""

from app.schemas import TodayMacrosSyncRequest


def test_macros_schema_accepts_strict_payload_shape():
    payload = {
        "date": "2026-03-17",
        "target_calories": 2200,
        "target_protein": 160,
        "target_carbs": 250,
        "target_fats": 70,
        "consumed_calories": 435,
        "consumed_protein": 30,
        "consumed_carbs": 45,
        "consumed_fats": 15,
        "meals": [
            {
                "meal_id": "meal-1",
                "meal_key": "breakfast",
                "meal_label": "Breakfast",
                "scheduled_time": "08:00",
                "status": "completed",
                "calories": 435,
                "protein": 30,
                "carbs": 45,
                "fats": 15,
            }
        ],
    }

    parsed = TodayMacrosSyncRequest.model_validate(payload)

    assert parsed.target_calories == 2200
    assert parsed.target_protein == 160
    assert parsed.meals[0].meal_id == "meal-1"
    assert parsed.meals[0].status == "completed"


def test_macros_schema_accepts_legacy_payload_shape_with_aliases():
    payload = {
        "date": "2026-03-17",
        "target": {"calories": 2200, "protein": 160, "carbs": 250, "fats": 70},
        "consumed": {"calories": 435, "protein": 30, "carbs": 45, "fats": 15},
        "meal_statuses": {"meal-legacy-1": "completed"},
        "meals": [
            {
                "mealId": "meal-legacy-1",
                "mealKey": "breakfast",
                "mealLabel": "Breakfast",
                "scheduledTime": "08:00",
                "calories": 435,
                "protein": 30,
                "carbs": 45,
                "fats": 15,
            }
        ],
    }

    parsed = TodayMacrosSyncRequest.model_validate(payload)

    assert parsed.target_calories == 2200
    assert parsed.target_protein == 160
    assert parsed.target_carbs == 250
    assert parsed.target_fats == 70
    assert parsed.consumed_calories == 435

    meal = parsed.meals[0]
    assert meal.meal_id == "meal-legacy-1"
    assert meal.meal_key == "breakfast"
    assert meal.meal_label == "Breakfast"
    assert meal.scheduled_time == "08:00"
    assert meal.status == "completed"


def test_macros_schema_accepts_camelcase_top_level_fallbacks():
    payload = {
        "date": "2026-03-17",
        "targetCalories": 2200,
        "targetProtein": 160,
        "targetCarbs": 250,
        "targetFats": 70,
        "consumedCalories": 435,
        "consumedProtein": 30,
        "consumedCarbs": 45,
        "consumedFats": 15,
        "meals": [
            {
                "mealId": "meal-2",
                "mealKey": "lunch",
                "mealLabel": "Lunch",
                "scheduledTime": "13:00",
                "status": "not-completed",
            }
        ],
    }

    parsed = TodayMacrosSyncRequest.model_validate(payload)

    assert parsed.target_calories == 2200
    assert parsed.target_protein == 160
    assert parsed.target_carbs == 250
    assert parsed.target_fats == 70
    assert parsed.consumed_calories == 435
    assert parsed.consumed_protein == 30
    assert parsed.consumed_carbs == 45
    assert parsed.consumed_fats == 15
