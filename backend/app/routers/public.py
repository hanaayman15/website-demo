"""Public router for public website pages."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import SuccessStoriesResponse

router = APIRouter(prefix="/api/public", tags=["Public"])


def _get_dashboard_config(dashboard_key: str):
    dashboards = {
        "main": {
            "key": "main",
            "title": "Client Nutrition Management Dashboard",
            "quick_actions_title": "Quick Actions.",
            "quick_actions_description": "Manage your client and track their progress",
            "navigation": [
                {"label": "Home", "href": "index.html"},
                {"label": "Clients", "href": "clients.html"},
                {"label": "Add Client", "href": "add-client.html"},
                {"label": "Add Team", "href": "doctor-auth.html?next=add_team.html"},
                {"label": "PDF Generator", "href": "pdf-generator.html"},
                {"label": "Diet Management", "href": "diet-management.html"},
            ],
            "modules": [
                {
                    "label": "Clients",
                    "href": "clients.html",
                    "image": "images/pexels-yaroslav-shuraev-8844379.jpg",
                    "description": "View and manage clients.",
                },
                {
                    "label": "Add Client",
                    "href": "add-client.html",
                    "image": "images/pexels-beyzahzah-89810429-15319038.jpg",
                    "description": "Create new client.",
                },
                {
                    "label": "Add Team",
                    "href": "doctor-auth.html?next=add_team.html",
                    "image": "images/football-team.jpg",
                    "description": "Doctor sign up or login to create teams.",
                },
                {
                    "label": "PDF Generator",
                    "href": "pdf-generator.html",
                    "image": "images/pexels-olly-3760067.jpg",
                    "description": "Multi-client PDF generation.",
                },
                {
                    "label": "Diet Management",
                    "href": "diet-management.html",
                    "image": "images/pexels-janetrangdoan-1099680.jpg",
                    "description": "Edit default meal plans.",
                },
            ],
        },
        "doctor": {
            "key": "doctor",
            "title": "Doctor Team Dashboard",
            "quick_actions_title": "Quick Actions.",
            "quick_actions_description": "Manage teams and doctor-access pages.",
            "navigation": [
                {"label": "Home", "href": "doctor_dashboard.html"},
                {"label": "Clients", "href": "clients.html"},
                {"label": "Add Team", "href": "add_team.html"},
                {"label": "Team View", "href": "clients.html"},
            ],
            "modules": [
                {
                    "label": "Home",
                    "href": "doctor_dashboard.html",
                    "image": "images/Gemini_Generated_Image_5sg9au5sg9au5sg9.png",
                    "description": "Doctor dashboard overview and quick access.",
                },
                {
                    "label": "Clients",
                    "href": "clients.html",
                    "image": "images/pexels-yaroslav-shuraev-8844379.jpg",
                    "description": "Open teams and client lists with doctor-safe actions.",
                },
                {
                    "label": "Add Team",
                    "href": "add_team.html",
                    "image": "images/football-team.jpg",
                    "description": "Create and manage team rosters.",
                },
                {
                    "label": "Team View",
                    "href": "clients.html",
                    "image": "images/pexels-pavel-danilyuk-7653093.jpg",
                    "description": "Open any saved team from the Teams page to view full roster details.",
                },
            ],
        },
    }
    return dashboards.get(dashboard_key)


@router.get("/")
async def get_home():
    """
    Get home page information.
    
    Returns:
        Home page data
    """
    return {
        "title": "Client Nutrition Management System",
        "description": "Professional nutrition management system for athletes and fitness enthusiasts",
        "pages": ["home", "about", "features", "clinic", "success-stories", "contact"]
    }


@router.get("/about")
async def get_about():
    """Get about page information."""
    return {
        "title": "About Us",
        "description": "Learn about our professional nutrition management team",
        "team_size": "Professional team of nutritionists and coaches",
        "experience": "15+ years in sports nutrition"
    }


@router.get("/features")
async def get_features():
    """Get features information."""
    return {
        "title": "Features",
        "features": [
            "Advanced nutrition planning",
            "Client progress tracking",
            "Workout logging",
            "Mood and sleep tracking",
            "Supplement management",
            "Mental coaching integration",
            "PDF report generation",
            "Role-based access control"
        ]
    }


@router.get("/clinic")
async def get_clinic():
    """Get clinic information."""
    return {
        "title": "Our Clinic",
        "description": "State-of-the-art nutrition clinic with professional staff",
        "location": "Available online and on-site",
        "services": [
            "One-on-one nutrition coaching",
            "Custom meal planning",
            "Progress assessment",
            "Mental coaching"
        ]
    }


@router.get("/success-stories", response_model=SuccessStoriesResponse)
async def get_success_stories(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=100, description="Number of stories to return")
):
    """Return public success stories."""
    # Placeholder - can be extended with database queries
    stories = [
        {
            "id": 1,
            "client_name": "Anonymous",
            "transformation": "Lost 15kg in 3 months",
            "duration": "12 weeks",
            "achievement": "Achieved competition weight goal"
        }
    ]

    return {
        "success_stories": stories[:limit],
        "total": len(stories)
    }


@router.get("/contact")
async def get_contact():
    """Get contact information."""
    return {
        "title": "Contact Us",
        "email": "contact@nutrition.com",
        "phone": "+1 (555) 123-4567",
        "address": "123 Nutrition Street, Fitness City, FC 12345",
        "business_hours": "Mon-Sun: 9:00 AM - 6:00 PM"
    }


@router.get("/system-info")
async def get_system_info():
    """Get system information (public API version, etc.)."""
    return {
        "app_name": "Client Nutrition Management System",
        "version": "1.0.0",
        "api_version": "1.0",
        "status": "operational",
        "documentation": "/docs"
    }


@router.get("/dashboards/{dashboard_key}")
async def get_dashboard_config(dashboard_key: str):
    """Return dashboard configuration for frontend dashboard variants."""
    config = _get_dashboard_config(dashboard_key.lower().strip())
    if not config:
        return {
            "status": "error",
            "detail": "Dashboard configuration not found",
            "available_dashboards": ["main", "doctor"],
        }
    return config
