"""Check client data in database."""
from app.database import SessionLocal
from app.models import User, ClientProfile, BodyMeasurement

db = SessionLocal()
try:
    client = db.query(User).filter(User.id == 7).first()
    
    if not client:
        print("Client not found")
    else:
        print(f"Client: {client.full_name}")
        print(f"Email: {client.email}")
        
        if client.client_profile:
            profile = client.client_profile
            print(f"\n=== Profile Data ===")
            print(f"Birthday: {profile.birthday}")
            print(f"Club: {profile.club}")
            print(f"Country: {profile.country}")
            print(f"Goal Weight: {profile.goal_weight}")
            print(f"Height: {profile.height}")
            print(f"Position: {profile.position}")
            print(f"Sport: {profile.sport}")
            print(f"Activity Level: {profile.activity_level}")
            
            # Check for injury/medical fields
            if hasattr(profile, 'injuries'):
                print(f"Injuries: {profile.injuries}")
            else:
                print("Injuries field: NOT FOUND")
                
            if hasattr(profile, 'medical_conditions'):
                print(f"Medical: {profile.medical_conditions}")
            else:
                print("Medical field: NOT FOUND")
                
            if hasattr(profile, 'allergies'):
                print(f"Allergies: {profile.allergies}")
            else:
                print("Allergies field: NOT FOUND")
            
            # Check measurements
            measurements = db.query(BodyMeasurement).filter(
                BodyMeasurement.client_id == profile.id
            ).all()
            
            print(f"\n=== Measurements ===")
            print(f"Count: {len(measurements)}")
            
            if measurements:
                latest = measurements[0]
                print(f"Latest measurement:")
                print(f"  Height: {latest.height}")
                print(f"  Weight: {latest.weight}")
                print(f"  BMI: {latest.bmi}")
                print(f"  BMR: {latest.bmr}")
                print(f"  TDEE: {latest.tdee}")
                print(f"  Body Fat %: {latest.body_fat_percentage}")
                print(f"  Skeletal Muscle: {latest.skeletal_muscle}")
        else:
            print("No profile found")
            
finally:
    db.close()
