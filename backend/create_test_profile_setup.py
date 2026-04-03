#!/usr/bin/env python
"""Create a test profile setup client for verification"""
from app.database import SessionLocal
from app.models import User, ClientProfile
from app.security import hash_password
from datetime import date

session = SessionLocal()

# Create a test profile setup user
test_email = "profile_setup_test@example.com"

# Check if already exists
existing = session.query(User).filter(User.email == test_email).first()
if existing:
    print(f"Test client already exists: {existing.email}")
    session.close()
    exit()

# Create user
hashed = hash_password("TestPassword123")
user = User(
    email=test_email,
    full_name="Profile Setup Test User",
    name="Profile Setup Test User",
    password_hash=hashed,
    hashed_password=hashed,
    role="client",
    is_active=True,
)
session.add(user)
session.flush()

# Get the next display id
last_client = session.query(ClientProfile).order_by(ClientProfile.display_id.desc()).first()
next_display_id = (last_client.display_id + 1) if last_client and last_client.display_id else 1

# Create profile with profile_setup source
profile = ClientProfile(
    user_id=user.id,
    display_id=next_display_id,
    phone="+20123456789",
    birthday=date(1995, 5, 15),
    gender="male",
    country="Egypt",
    club="Test Club",
    religion="Other",
    created_source="profile_setup",  # This is the key!
)
session.add(profile)
session.commit()

print(f"SUCCESS: Created profile setup test client:")
print(f"  Email: {test_email}")
print(f"  Display ID: {next_display_id}")
print(f"  Created Source: profile_setup")
print("\nNow profile setup clients should appear in the Clients page!")
