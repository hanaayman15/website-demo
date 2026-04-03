#!/usr/bin/env python
from app.database import SessionLocal
from app.models import User, ClientProfile

session = SessionLocal()
profiles = session.query(ClientProfile).all()

print("All ClientProfiles:")
for p in profiles:
    u = session.query(User).filter(User.id == p.user_id).first()
    print(f"  Email: {u.email if u else 'NO USER'}, Source: {p.created_source}, ID: {p.id}")
