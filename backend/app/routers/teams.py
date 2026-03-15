"""Teams router for grouped player creation and retrieval."""

import json
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_admin, get_current_admin_or_doctor
from app.diet_plan_selector import select_diet_template
from app.models import Player, PlayerSupplement, Team, TrainingSession, User
from app.models import DietTemplate
from app.schemas import (
    DietTemplateRecommendationResponse,
    DietTemplateResponse,
    TeamCreateRequest,
    TeamCreateResponse,
    TeamDeleteResponse,
    TeamDetailResponse,
    TeamListItem,
    TeamPlayerCreate,
    TeamPlayerResponse,
)
from app.security import hash_password

router = APIRouter(prefix="/api/teams", tags=["Teams"])
player_router = APIRouter(prefix="/api/player", tags=["Player"])


def _serialize_json_value(value):
    if value is None:
        return None
    if isinstance(value, str):
        return value
    try:
        return json.dumps(value)
    except (TypeError, ValueError):
        return None


def _parse_json_list(value):
    if not value:
        return None
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else None
    except (TypeError, ValueError):
        return None


def _parse_json_dict(value):
    if not value:
        return None
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, dict) else None
    except (TypeError, ValueError):
        return None


def _build_player_entity(team_id: int, payload_player, index: int) -> Player:
    data = payload_player.model_dump()
    data["training_details"] = _serialize_json_value(data.get("training_details"))
    data["meal_swaps"] = _serialize_json_value(data.get("meal_swaps"))

    country_code = (data.get("phone_country_code") or "+20").strip()
    phone_number = (data.get("phone_number") or "").strip()
    full_phone = data.get("phone")
    if not full_phone:
        if phone_number:
            full_phone = f"{country_code}{phone_number}"
        else:
            full_phone = None

    return Player(
        team_id=team_id,
        player_number=data.get("player_number") or index,
        client_id=data.get("client_id"),
        full_name=data.get("full_name", "").strip(),
        email=data.get("email"),
        password_hash=hash_password(data["password"]) if data.get("password") else None,
        phone_country_code=country_code,
        phone_number=phone_number or None,
        phone=full_phone,
        birthday=data.get("birthday"),
        age=data.get("age"),
        gender=data.get("gender"),
        country=data.get("country"),
        religion=data.get("religion"),
        club=data.get("club"),
        sport=data.get("sport"),
        position=data.get("position"),
        activity_level=data.get("activity_level"),
        priority=data.get("priority"),
        competition_date=data.get("competition_date"),
        goal_weight=data.get("goal_weight"),
        training_details=data.get("training_details"),
        injuries=data.get("injuries"),
        medical=data.get("medical"),
        allergies=data.get("allergies"),
        medical_allergies=data.get("medical_allergies"),
        medical_notes=data.get("medical_notes"),
        food_allergies=data.get("food_allergies"),
        food_likes=data.get("food_likes"),
        food_dislikes=data.get("food_dislikes"),
        test_record_notes=data.get("test_record_notes"),
        test_and_record=data.get("test_and_record"),
        additional_notes=data.get("additional_notes"),
        client_notes=data.get("client_notes"),
        mental_notes=data.get("mental_notes"),
        mental_observation=data.get("mental_observation"),
        supplements=data.get("supplements"),
        competition_enabled=data.get("competition_enabled") or False,
        competition_status=data.get("competition_status"),
        progression_type=data.get("progression_type"),
        calories=data.get("calories"),
        protein_target=data.get("protein_target"),
        carbs_target=data.get("carbs_target"),
        fats_target=data.get("fats_target"),
        water_intake=data.get("water_intake"),
        water_in_body=data.get("water_in_body"),
        days_left=data.get("days_left"),
        mental_obs_date=data.get("mental_obs_date"),
        wake_up_time=data.get("wake_up_time"),
        sleep_time=data.get("sleep_time"),
        injury_status=data.get("injury_status") or False,
        injury_description=data.get("injury_description"),
        original_protein=data.get("original_protein"),
        original_carbs=data.get("original_carbs"),
        original_fats=data.get("original_fats"),
        training_time=data.get("training_time"),
        training_end_time=data.get("training_end_time"),
        consultation_type=data.get("consultation_type"),
        consultation_selected_at=data.get("consultation_selected_at"),
        subscription_plan=data.get("subscription_plan"),
        anti_doping_focus=data.get("anti_doping_focus"),
        meal_swaps=data.get("meal_swaps"),
        created_source="team_add",
        height=data.get("height"),
        weight=data.get("weight"),
        bmi=data.get("bmi"),
        body_fat_percentage=data.get("body_fat_percentage"),
        skeletal_muscle=data.get("skeletal_muscle"),
        muscle_mass=data.get("muscle_mass"),
        water_percentage=data.get("water_percentage"),
        minerals=data.get("minerals"),
        bmr=data.get("bmr"),
        tdee=data.get("tdee"),
        body_fat_mass=data.get("body_fat_mass"),
        muscle_percentage=data.get("muscle_percentage"),
    )


def _create_nested_rows(db: Session, player_id: int, payload_player) -> None:
    for item in (payload_player.training_sessions or []):
        db.add(TrainingSession(player_id=player_id, session_info=item.session_info))

    for item in (payload_player.supplements_list or []):
        db.add(PlayerSupplement(player_id=player_id, supplement_info=item.supplement_info))


def _replace_team_players(db: Session, team_id: int, payload: TeamCreateRequest) -> None:
    db.query(Player).filter(Player.team_id == team_id).delete()
    db.flush()

    for index, payload_player in enumerate(payload.players, start=1):
        player = _build_player_entity(team_id=team_id, payload_player=payload_player, index=index)
        db.add(player)
        db.flush()
        _create_nested_rows(db=db, player_id=player.id, payload_player=payload_player)


def _replace_player_nested_rows(db: Session, player_id: int, payload_player) -> None:
    db.query(TrainingSession).filter(TrainingSession.player_id == player_id).delete()
    db.query(PlayerSupplement).filter(PlayerSupplement.player_id == player_id).delete()
    db.flush()
    _create_nested_rows(db=db, player_id=player_id, payload_player=payload_player)


def _player_to_response(player: Player, db: Session) -> TeamPlayerResponse:
    sessions = db.query(TrainingSession).filter(TrainingSession.player_id == player.id).order_by(TrainingSession.id.asc()).all()
    supplements = db.query(PlayerSupplement).filter(PlayerSupplement.player_id == player.id).order_by(PlayerSupplement.id.asc()).all()

    return TeamPlayerResponse(
        id=player.id,
        team_id=player.team_id,
        player_number=player.player_number,
        client_id=player.client_id,
        full_name=player.full_name,
        email=player.email,
        phone_country_code=player.phone_country_code,
        phone_number=player.phone_number,
        phone=player.phone,
        birthday=player.birthday,
        age=player.age,
        gender=player.gender,
        country=player.country,
        religion=player.religion,
        club=player.club,
        sport=player.sport,
        position=player.position,
        activity_level=player.activity_level,
        priority=player.priority,
        competition_date=player.competition_date,
        goal_weight=player.goal_weight,
        training_details=_parse_json_list(player.training_details),
        injuries=player.injuries,
        medical=player.medical,
        allergies=player.allergies,
        medical_allergies=player.medical_allergies,
        medical_notes=player.medical_notes,
        food_allergies=player.food_allergies,
        food_likes=player.food_likes,
        food_dislikes=player.food_dislikes,
        test_record_notes=player.test_record_notes,
        test_and_record=player.test_and_record,
        additional_notes=player.additional_notes,
        client_notes=player.client_notes,
        mental_notes=player.mental_notes,
        mental_observation=player.mental_observation,
        supplements=player.supplements,
        competition_enabled=player.competition_enabled,
        competition_status=player.competition_status,
        progression_type=player.progression_type,
        protein_target=player.protein_target,
        carbs_target=player.carbs_target,
        fats_target=player.fats_target,
        water_intake=player.water_intake,
        water_in_body=player.water_in_body,
        days_left=player.days_left,
        mental_obs_date=player.mental_obs_date,
        wake_up_time=player.wake_up_time,
        sleep_time=player.sleep_time,
        injury_status=player.injury_status,
        injury_description=player.injury_description,
        original_protein=player.original_protein,
        original_carbs=player.original_carbs,
        original_fats=player.original_fats,
        training_time=player.training_time,
        training_end_time=player.training_end_time,
        consultation_type=player.consultation_type,
        subscription_plan=player.subscription_plan,
        anti_doping_focus=player.anti_doping_focus,
        meal_swaps=_parse_json_dict(player.meal_swaps),
        height=player.height,
        weight=player.weight,
        bmi=player.bmi,
        body_fat_percentage=player.body_fat_percentage,
        skeletal_muscle=player.skeletal_muscle,
        muscle_mass=player.muscle_mass,
        water_percentage=player.water_percentage,
        minerals=player.minerals,
        bmr=player.bmr,
        tdee=player.tdee,
        calories=player.calories,
        body_fat_mass=player.body_fat_mass,
        muscle_percentage=player.muscle_percentage,
        training_sessions=[{"session_info": s.session_info} for s in sessions],
        supplements_list=[{"supplement_info": s.supplement_info} for s in supplements],
        created_source=player.created_source,
        created_at=player.created_at,
        updated_at=player.updated_at,
    )


def _create_team_with_players(db: Session, payload: TeamCreateRequest, current_user: User) -> TeamCreateResponse:
    if not payload.players:
        raise HTTPException(status_code=400, detail="At least one player is required")

    if len(payload.players) != payload.package_size:
        raise HTTPException(
            status_code=400,
            detail=f"Player count ({len(payload.players)}) must match package size ({payload.package_size})",
        )

    if current_user.role == "doctor":
        doctor_id = current_user.id
    else:
        doctor_id = payload.doctor_id or None
        if doctor_id is not None:
            assigned_doctor = db.query(User).filter(User.id == doctor_id, User.role == "doctor").first()
            if not assigned_doctor:
                raise HTTPException(status_code=400, detail="doctor_id must reference an existing doctor user")

    team = Team(
        team_name=payload.team_name.strip(),
        sport_type=(payload.sport_type or "").strip() or None,
        coach_name=(payload.coach_name or "").strip() or None,
        start_date=payload.start_date,
        package_size=payload.package_size,
        doctor_id=doctor_id,
    )
    db.add(team)
    db.flush()

    _replace_team_players(db=db, team_id=team.id, payload=payload)
    db.commit()

    return TeamCreateResponse(message="Team created successfully", team_id=team.id, players_count=payload.package_size)


@player_router.put("/{player_id}", response_model=TeamPlayerResponse)
async def update_player(
    player_id: int,
    payload: TeamPlayerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Update a single player (admin only)."""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    team = db.query(Team).filter(Team.id == player.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    source = _build_player_entity(team_id=player.team_id, payload_player=payload, index=payload.player_number or player.player_number)
    for col in Player.__table__.columns.keys():
        if col in {"id", "team_id", "created_at"}:
            continue
        setattr(player, col, getattr(source, col))

    _replace_player_nested_rows(db=db, player_id=player.id, payload_player=payload)
    db.commit()
    db.refresh(player)

    return _player_to_response(player=player, db=db)


@player_router.delete("/{player_id}")
async def delete_player(
    player_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Delete player (admin only)."""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    db.delete(player)
    db.commit()
    return {"message": "Player deleted successfully", "player_id": player_id}


@player_router.get("/{player_id}/recommended-diet-template", response_model=DietTemplateRecommendationResponse)
async def recommend_player_diet_template(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_doctor),
):
    """Recommend a diet template for a specific team player."""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    team = db.query(Team).filter(Team.id == player.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if current_user.role == "doctor" and team.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view your own team players")

    if player.tdee is None:
        raise HTTPException(status_code=400, detail="Player TDEE is required for automatic diet selection")

    templates = db.query(DietTemplate).all()
    selected, meta = select_diet_template(templates=templates, tdee=player.tdee, wake_up_time=player.wake_up_time)

    return DietTemplateRecommendationResponse(
        tdee=float(player.tdee),
        wake_up_time=player.wake_up_time,
        schedule_type=meta.get("schedule_type") or "summer",
        reason=meta.get("reason") or "no_match",
        calorie_bracket=meta.get("calorie_bracket"),
        recommended_template=(DietTemplateResponse.model_validate(selected, from_attributes=True) if selected else None),
    )


@router.post("/create", response_model=TeamCreateResponse)
async def create_team(
    payload: TeamCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_doctor),
):
    """Create team row first, then insert each player linked by team_id."""
    return _create_team_with_players(db=db, payload=payload, current_user=current_user)


@player_router.post("/create", response_model=TeamCreateResponse)
async def create_player_group(
    payload: TeamCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_doctor),
):
    """Compatibility endpoint used by the add team player workflow."""
    try:
        return _create_team_with_players(db=db, payload=payload, current_user=current_user)
    except HTTPException:
        raise
    except IntegrityError as exc:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={"error": f"Database integrity error: {str(exc.orig) if getattr(exc, 'orig', None) else str(exc)}"},
        )
    except Exception as exc:
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={"error": str(exc)},
        )


@router.put("/{team_id}", response_model=TeamCreateResponse)
async def update_team(
    team_id: int,
    payload: TeamCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Update team info and replace all players for that team (admin only)."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if not payload.players:
        raise HTTPException(status_code=400, detail="At least one player is required")

    if len(payload.players) != payload.package_size:
        raise HTTPException(
            status_code=400,
            detail=f"Player count ({len(payload.players)}) must match package size ({payload.package_size})",
        )

    team.team_name = payload.team_name.strip()
    team.sport_type = (payload.sport_type or "").strip() or None
    team.coach_name = (payload.coach_name or "").strip() or None
    team.start_date = payload.start_date
    team.package_size = payload.package_size
    if payload.doctor_id:
        team.doctor_id = payload.doctor_id

    _replace_team_players(db=db, team_id=team_id, payload=payload)
    db.commit()

    return TeamCreateResponse(message="Team updated successfully", team_id=team_id, players_count=payload.package_size)


@router.delete("/{team_id}", response_model=TeamDeleteResponse)
async def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Delete team and all linked players."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    db.delete(team)
    db.commit()

    return TeamDeleteResponse(message="Team deleted successfully", team_id=team_id)


@router.get("", response_model=list[TeamListItem])
async def list_teams(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_admin_or_doctor),
    db: Session = Depends(get_db),
):
    """List teams for clients page table with player counts."""
    query = (
        db.query(
            Team.id,
            Team.team_name,
            Team.package_size,
            Team.coach_name,
            Team.doctor_id,
            func.count(Player.id).label("players_count"),
        )
        .outerjoin(Player, Player.team_id == Team.id)
    )

    if current_user.role == "doctor":
        query = query.filter(Team.doctor_id == current_user.id)

    rows = (
        query.group_by(Team.id)
        .order_by(Team.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        TeamListItem(
            id=row.id,
            team_name=row.team_name,
            package_size=row.package_size,
            players_count=int(row.players_count or 0),
            coach_name=row.coach_name,
            doctor_id=row.doctor_id,
        )
        for row in rows
    ]


@router.get("/{team_id}", response_model=TeamDetailResponse)
async def get_team_detail(
    team_id: int,
    current_user: User = Depends(get_current_admin_or_doctor),
    db: Session = Depends(get_db),
):
    """Get full team detail and all linked players."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if current_user.role == "doctor" and team.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view your own teams")

    players = (
        db.query(Player)
        .filter(Player.team_id == team_id)
        .order_by(Player.player_number.asc(), Player.id.asc())
        .all()
    )

    player_rows = [_player_to_response(player=p, db=db) for p in players]

    return TeamDetailResponse(
        id=team.id,
        team_name=team.team_name,
        sport_type=team.sport_type,
        coach_name=team.coach_name,
        start_date=team.start_date,
        package_size=team.package_size,
        doctor_id=team.doctor_id,
        players_count=len(player_rows),
        players=player_rows,
        created_at=team.created_at,
        updated_at=team.updated_at,
    )
