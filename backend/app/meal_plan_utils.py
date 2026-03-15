"""Helpers for normalizing bilingual meal-plan payloads."""

from __future__ import annotations

import json
import re
from typing import Any, Dict, Iterable, List, Optional


FOOD_GLOSSARY: List[Dict[str, Any]] = [
    {
        "name_en": "milk",
        "name_ar": "لبن",
        "aliases_en": ["milk", "skimmed milk", "semi-skimmed milk", "whole milk"],
        "aliases_ar": ["لبن", "حليب", "لبن خالي الدسم"],
    },
    {
        "name_en": "oats",
        "name_ar": "شوفان",
        "aliases_en": ["oats"],
        "aliases_ar": ["شوفان"],
    },
    {
        "name_en": "cornflakes",
        "name_ar": "كورن فليكس",
        "aliases_en": ["cornflakes"],
        "aliases_ar": ["كورن فليكس"],
    },
    {
        "name_en": "fruit",
        "name_ar": "فاكهة",
        "aliases_en": ["fruit", "banana", "orange"],
        "aliases_ar": ["فاكهة", "موز", "برتقال", "ثمرة فاكهة"],
    },
    {
        "name_en": "bread",
        "name_ar": "خبز",
        "aliases_en": ["bread", "toast", "pita", "loaf"],
        "aliases_ar": ["خبز", "توست", "رغيف", "نصف رغيف"],
    },
    {
        "name_en": "eggs",
        "name_ar": "بيض",
        "aliases_en": ["egg", "eggs", "omelet"],
        "aliases_ar": ["بيض", "بيضة", "اومليت"],
    },
    {
        "name_en": "rice",
        "name_ar": "أرز",
        "aliases_en": ["rice"],
        "aliases_ar": ["ارز", "أرز"],
    },
    {
        "name_en": "pasta",
        "name_ar": "مكرونة",
        "aliases_en": ["pasta"],
        "aliases_ar": ["مكرونة"],
    },
    {
        "name_en": "chicken",
        "name_ar": "فراخ",
        "aliases_en": ["chicken", "chicken breast", "chicken shawarma"],
        "aliases_ar": ["فراخ", "فرخة", "فراخ مشوية", "شاورما فراخ", "صدر فرخة"],
    },
    {
        "name_en": "beef",
        "name_ar": "لحمة",
        "aliases_en": ["beef", "meat", "grilled meat", "meat shawarma"],
        "aliases_ar": ["لحمة", "لحم", "لحمة مشوية", "شاورما لحمة"],
    },
    {
        "name_en": "fish",
        "name_ar": "سمك",
        "aliases_en": ["fish"],
        "aliases_ar": ["سمك", "سمكة"],
    },
    {
        "name_en": "tuna",
        "name_ar": "تونة",
        "aliases_en": ["tuna"],
        "aliases_ar": ["تونة"],
    },
    {
        "name_en": "cottage cheese",
        "name_ar": "جبنة قريش",
        "aliases_en": ["cottage cheese"],
        "aliases_ar": ["جبنة قريش"],
    },
    {
        "name_en": "cheese",
        "name_ar": "جبنة",
        "aliases_en": ["cheese", "light cheese", "mozzarella", "cheddar", "smoked cheese"],
        "aliases_ar": ["جبنة", "جبنة لايت", "موتزريلا", "رومي"],
    },
    {
        "name_en": "yogurt",
        "name_ar": "زبادي",
        "aliases_en": ["yogurt", "greek yogurt"],
        "aliases_ar": ["زبادي", "زبادي يوناني", "رايب"],
    },
    {
        "name_en": "potato",
        "name_ar": "بطاطس",
        "aliases_en": ["potato", "potatoes", "sweet potato", "mashed potatoes"],
        "aliases_ar": ["بطاطس", "بطاطا", "بطاطس مهروسة"],
    },
    {
        "name_en": "orange juice",
        "name_ar": "عصير برتقال",
        "aliases_en": ["orange juice", "juice"],
        "aliases_ar": ["عصير برتقال", "عصير"],
    },
    {
        "name_en": "salad",
        "name_ar": "سلطة",
        "aliases_en": ["salad", "vegetables"],
        "aliases_ar": ["سلطة", "خضار"],
    },
    {
        "name_en": "falafel",
        "name_ar": "فول",
        "aliases_en": ["falafel", "fava beans"],
        "aliases_ar": ["فول", "فلافل"],
    },
    {
        "name_en": "nuts",
        "name_ar": "مكسرات",
        "aliases_en": ["nuts"],
        "aliases_ar": ["مكسرات"],
    },
    {
        "name_en": "honey",
        "name_ar": "عسل",
        "aliases_en": ["honey"],
        "aliases_ar": ["عسل"],
    },
    {
        "name_en": "mushroom",
        "name_ar": "مشروم",
        "aliases_en": ["mushroom"],
        "aliases_ar": ["مشروم"],
    },
    {
        "name_en": "peanut butter",
        "name_ar": "زبدة فول سوداني",
        "aliases_en": ["peanut butter"],
        "aliases_ar": ["زبدة فول سوداني"],
    },
]


def _normalize_text(value: Any) -> str:
    normalized = re.sub(r"[^a-z0-9\u0600-\u06ff\s]+", " ", str(value or "").lower())
    return re.sub(r"\s+", " ", normalized).strip()


def _dedupe_food_items(items: Iterable[Dict[str, str]]) -> List[Dict[str, str]]:
    seen = set()
    normalized_items: List[Dict[str, str]] = []
    for item in items:
        name_en = str(item.get("name_en") or "").strip()
        name_ar = str(item.get("name_ar") or "").strip()
        if not name_en and not name_ar:
            continue
        key = (_normalize_text(name_en), _normalize_text(name_ar))
        if key in seen:
            continue
        seen.add(key)
        normalized_items.append({"name_en": name_en, "name_ar": name_ar})
    return normalized_items


def _normalize_food_items(items: Any) -> List[Dict[str, str]]:
    if not isinstance(items, list):
        return []
    normalized: List[Dict[str, str]] = []
    for item in items:
        if isinstance(item, dict):
            normalized.append({
                "name_en": str(item.get("name_en") or item.get("en") or "").strip(),
                "name_ar": str(item.get("name_ar") or item.get("ar") or "").strip(),
            })
        elif isinstance(item, str):
            normalized.append({"name_en": item.strip(), "name_ar": ""})
    return _dedupe_food_items(normalized)


def _infer_food_items(meal_node: Dict[str, Any]) -> List[Dict[str, str]]:
    text_en = _normalize_text(meal_node.get("en"))
    text_ar = _normalize_text(meal_node.get("ar"))
    matches: List[Dict[str, str]] = []
    for food in FOOD_GLOSSARY:
        aliases = [_normalize_text(food["name_en"]), _normalize_text(food["name_ar"])]
        aliases.extend(_normalize_text(alias) for alias in food.get("aliases_en", []))
        aliases.extend(_normalize_text(alias) for alias in food.get("aliases_ar", []))
        if any(alias and ((alias in text_en) or (alias in text_ar)) for alias in aliases):
            matches.append({"name_en": food["name_en"], "name_ar": food["name_ar"]})
    return _dedupe_food_items(matches)


def _normalize_meal_node(value: Any) -> Any:
    if isinstance(value, list):
        return [_normalize_meal_node(item) for item in value]
    if isinstance(value, dict):
        normalized = {key: _normalize_meal_node(item) for key, item in value.items()}
        if any(key in value for key in ("en", "ar", "food_items")):
            food_items = _normalize_food_items(value.get("food_items"))
            if not food_items:
                food_items = _infer_food_items(value)
            if food_items:
                normalized["food_items"] = food_items
        return normalized
    return value


def normalize_meal_plan_json(raw_meal_plan: Optional[str]) -> Optional[str]:
    """Normalize legacy meal plan JSON to include bilingual food_items where possible."""
    if not raw_meal_plan:
        return raw_meal_plan
    try:
        parsed = json.loads(raw_meal_plan)
    except (TypeError, ValueError, json.JSONDecodeError):
        return raw_meal_plan
    normalized = _normalize_meal_node(parsed)
    return json.dumps(normalized, ensure_ascii=False)