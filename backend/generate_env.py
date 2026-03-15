"""
Generate environment variables for production deployment.
Run this to generate SECRET_KEY and other random values.
"""
import secrets
import string

def generate_secret_key(length=32):
    """Generate URL-safe random string for SECRET_KEY."""
    return secrets.token_urlsafe(length)

def generate_password(length=16):
    """Generate secure random password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

if __name__ == "__main__":
    print("="*70)
    print("PRODUCTION ENVIRONMENT VARIABLES GENERATOR")
    print("="*70)
    print("\nCopy these values to Render Environment Variables:\n")
    
    print(f"SECRET_KEY={generate_secret_key(32)}")
    print(f"\nADMIN_PASSWORD={generate_password(16)}")
    
    print("\n" + "="*70)
    print("IMPORTANT: These are randomly generated - use them once!")
    print("="*70)
    print("\nOther required variables (set manually):")
    print("  DATABASE_URL=<get from Neon Console>")
    print("  ADMIN_EMAIL=<your admin email>")
    print("  FRONTEND_URL=<your Vercel URL>")
    print("\nSee .env.production for complete list")
    print("="*70)
