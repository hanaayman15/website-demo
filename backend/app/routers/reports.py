"""Reports router for server-side PDF generation."""
from datetime import datetime
from io import BytesIO
from typing import Any, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_admin
from app.models import ClientProfile, Player, Team, User


router = APIRouter(prefix="/api/reports", tags=["Reports"])
options_router = APIRouter(prefix="/api", tags=["Reports"])


class PdfClientItem(BaseModel):
    """Single client row sent by frontend for report rendering."""
    key: Optional[str] = None
    type: Optional[str] = None
    id: Optional[int] = None
    displayId: Optional[str] = None
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    teamName: Optional[str] = None


class MultiClientPdfRequest(BaseModel):
    """Request payload for multi-client PDF export."""
    language: Literal["english", "arabic"] = "english"
    clients: List[PdfClientItem]


class PdfOptionsResponse(BaseModel):
    """Unified options payload for PDF generator page."""
    teams: list[dict]
    clients: list[dict]


def _safe_text(value: object, default: str = "-") -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


def _normalize_created_source(value: Optional[str]) -> str:
    normalized = (value or "").strip().lower()
    if normalized == "profile_setup":
        return "profile_setup"
    return "add_client"


def _load_reportlab():
    """Load reportlab lazily so startup doesn't fail if dependency is missing."""
    try:
        from reportlab.lib.pagesizes import A4 as rl_a4  # pyright: ignore[reportMissingImports, reportMissingModuleSource]
        from reportlab.pdfgen import canvas as rl_canvas  # pyright: ignore[reportMissingImports, reportMissingModuleSource]
        return rl_a4, rl_canvas
    except Exception:  # pragma: no cover
        return None, None


def _wrap_text(c: Any, text: str, max_width: float, font: str = "Helvetica", size: int = 12) -> list[str]:
    words = text.split()
    if not words:
        return [""]

    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if c.stringWidth(candidate, font, size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


@router.post("/clients-pdf")
async def export_clients_pdf(
    payload: MultiClientPdfRequest,
    current_user: User = Depends(get_current_admin),
):
    """Generate a downloadable PDF for selected clients (admin only)."""
    _ = current_user

    a4_size, canvas_module = _load_reportlab()
    if canvas_module is None or a4_size is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF engine unavailable. Install reportlab and restart backend.",
        )

    if not payload.clients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one client must be selected",
        )

    buffer = BytesIO()
    pdf = canvas_module.Canvas(buffer, pagesize=a4_size)
    page_width, page_height = a4_size
    margin_x = 50
    max_text_width = page_width - (margin_x * 2)

    is_ar = payload.language == "arabic"
    title = "Client Report" if not is_ar else "Client Report (AR)"
    labels = {
        "name": "Name",
        "id": "ID",
        "age": "Age",
        "gender": "Gender",
        "phone": "Phone",
        "source": "Source",
        "team": "Team",
    }

    for index, client in enumerate(payload.clients):
        if index > 0:
            pdf.showPage()

        y = page_height - 60
        pdf.setFont("Helvetica-Bold", 18)
        pdf.drawString(margin_x, y, title)

        y -= 20
        pdf.setLineWidth(1)
        pdf.line(margin_x, y, page_width - margin_x, y)

        rows = [
            f"{labels['name']}: {_safe_text(client.name, 'Unknown')}",
            f"{labels['id']}: {_safe_text(client.displayId or client.id)}",
            f"{labels['age']}: {_safe_text(client.age, 'N/A')}",
            f"{labels['gender']}: {_safe_text(client.gender, 'N/A')}",
            f"{labels['phone']}: {_safe_text(client.phone, 'N/A')}",
            f"{labels['source']}: {_safe_text(client.source)}",
            f"{labels['team']}: {_safe_text(client.teamName)}",
        ]

        y -= 28
        pdf.setFont("Helvetica", 12)

        for row in rows:
            wrapped = _wrap_text(pdf, row, max_text_width, "Helvetica", 12)
            for line in wrapped:
                pdf.drawString(margin_x, y, line)
                y -= 16
                if y < 50:
                    pdf.showPage()
                    y = page_height - 60
                    pdf.setFont("Helvetica", 12)

    pdf.save()
    buffer.seek(0)

    timestamp = datetime.utcnow().strftime("%Y%m%d")
    language_code = "ar" if is_ar else "en"
    filename = f"clients-report-{language_code}-{timestamp}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/teams/{team_id}/csv")
async def export_team_csv(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Export a team roster CSV (admin only)."""
    _ = current_user
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    players = (
        db.query(Player)
        .filter(Player.team_id == team_id)
        .order_by(Player.player_number.asc(), Player.id.asc())
        .all()
    )

    headers = [
        "Player #",
        "Client ID",
        "Full Name",
        "Email",
        "Phone",
        "Gender",
        "Sport",
        "Position",
        "Activity Level",
        "Priority",
    ]
    csv_rows = [",".join(headers)]
    for p in players:
        row = [
            p.player_number,
            p.client_id,
            p.full_name,
            p.email,
            p.phone,
            p.gender,
            p.sport,
            p.position,
            p.activity_level,
            p.priority,
        ]
        escaped = [f'"{str(v or "").replace("\"", "\"\"")}"' for v in row]
        csv_rows.append(",".join(escaped))

    content = "\n".join(csv_rows)
    filename = f"{(team.team_name or 'team').replace(' ', '_')}_roster.csv"
    return StreamingResponse(
        iter([content.encode("utf-8")]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/clients/{client_id}/csv")
async def export_client_csv(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Export single client profile CSV (admin only)."""
    _ = current_user
    profile = db.query(ClientProfile).filter(ClientProfile.id == client_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Client not found")

    user = db.query(User).filter(User.id == profile.user_id).first()
    headers = ["Client ID", "Display ID", "Full Name", "Email", "Phone", "Gender", "Sport", "Source"]
    values = [
        str(profile.id or ""),
        str(profile.display_id or ""),
        str(user.full_name if user else ""),
        str(user.email if user else ""),
        str(profile.phone or ""),
        str(profile.gender or ""),
        str(profile.sport or ""),
        _normalize_created_source(profile.created_source),
    ]
    csv_content = ",".join(headers) + "\n" + ",".join([f'"{v.replace("\"", "\"\"")}"' for v in values])
    filename = f"client_{profile.display_id or profile.id}.csv"

    return StreamingResponse(
        iter([csv_content.encode("utf-8")]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@options_router.get("/pdf-options", response_model=PdfOptionsResponse)
async def get_pdf_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Return teams and clients in one response for PDF options (admin only)."""
    _ = current_user

    team_rows = (
        db.query(
            Team.id,
            Team.team_name,
            Team.coach_name,
            Team.sport_type,
            Team.package_size,
            func.count(Player.id).label("players_count"),
        )
        .outerjoin(Player, Player.team_id == Team.id)
        .group_by(Team.id)
        .order_by(Team.created_at.desc())
        .all()
    )

    teams = []
    for row in team_rows:
        players = (
            db.query(Player)
            .filter(Player.team_id == row.id)
            .order_by(Player.player_number.asc(), Player.id.asc())
            .all()
        )
        teams.append({
            "id": row.id,
            "team_name": row.team_name,
            "coach_name": row.coach_name,
            "sport_type": row.sport_type,
            "package_size": row.package_size,
            "players_count": int(row.players_count or 0),
            "players": [
                {
                    "id": p.id,
                    "display_id": p.client_id or p.player_number,
                    "full_name": p.full_name,
                    "age": p.age,
                    "gender": p.gender,
                    "phone": p.phone,
                    "source": "team",
                    "team_name": row.team_name,
                }
                for p in players
            ],
        })

    profile_rows = (
        db.query(ClientProfile, User)
        .join(User, User.id == ClientProfile.user_id)
        .filter(User.role == "client")
        .order_by(ClientProfile.created_at.desc())
        .all()
    )
    clients = [
        {
            "id": profile.id,
            "display_id": profile.display_id,
            "full_name": user.full_name,
            "email": user.email,
            "age": None,
            "gender": profile.gender,
            "phone": profile.phone,
            "sport": profile.sport,
            "created_source": _normalize_created_source(profile.created_source),
        }
        for profile, user in profile_rows
    ]

    return PdfOptionsResponse(teams=teams, clients=clients)
