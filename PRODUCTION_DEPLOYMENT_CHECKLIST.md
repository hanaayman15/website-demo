# Production Deployment Checklist
## Client Nutrition Management System

**Status:** Ready for Production Deployment  
**Date:** March 3, 2026  
**Security Implementation:** ✓ Complete

---

## Table of Contents

1. [Pre-Deployment Configuration](#pre-deployment-configuration)
2. [Security Hardening](#security-hardening)
3. [Database Migration](#database-migration)
4. [Environment Configuration](#environment-configuration)
5. [Infrastructure Setup](#infrastructure-setup)
6. [Deployment Steps](#deployment-steps)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Rollback Plan](#rollback-plan)

---

## Pre-Deployment Configuration

### 1.1 Generate Production Secrets

**SECRET_KEY** (Critical - Do First!)
```bash
# Generate a secure 64-character secret key
python -c "import secrets; print(secrets.token_urlsafe(48))"

# Or use openssl:
openssl rand -base64 48
```
- **Minimum:** 32 characters
- **Recommended:** 48+ characters
- **NEVER** commit this to version control

**ADMIN_PASSWORD**
- Minimum 16 characters
- Include: uppercase, lowercase, numbers, special characters
- Use a password manager to generate and store
- Example format: `Prod2026!Admin#Secure$Pass`

### 1.2 Configure Environment Variables

Create production `.env` file in `backend/` directory:

```env
# === CRITICAL SECURITY === 
SECRET_KEY=<YOUR_64_CHAR_SECRET_FROM_ABOVE>
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<YOUR_SECURE_PASSWORD>

# === Database ===
DATABASE_URL=postgresql://user:password@db-host:5432/nutrition_db
# For MySQL: mysql+pymysql://user:password@db-host:3306/nutrition_db

# === Application ===
APP_NAME=Client Nutrition Management
APP_VERSION=1.0.0
DEBUG=False
ENVIRONMENT=production

# === Security ===
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
LOGIN_RATE_LIMIT=5 per minute
RATE_LIMIT_ENABLED=True

# === CORS Origins ===
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# === Logging ===
LOG_FORMAT=json
LOG_LEVEL=WARNING

# === Optional: SSL/TLS ===
CERT_FILE=/path/to/fullchain.pem
KEY_FILE=/path/to/privkey.pem
```

**Environment-Specific Files:**
- `backend/.env` → Production secrets (NEVER commit)
- `backend/.env.example` → Template (safe to commit)
- `backend/.env.staging` → Staging environment (if applicable)

---

## Security Hardening

### 2.1 Verify Security Features ✓

All features implemented and tested:

- [x] SECRET_KEY validation (32+ chars, crashes if weak)
- [x] Admin credentials in environment (not in code)
- [x] Refresh token system (15 min access, 7 day refresh)
- [x] Rate limiting (5 attempts/min on login)
- [x] Security headers (X-Frame-Options, CSP, HSTS, etc.)
- [x] Structured JSON logging

Run security test suite before deployment:
```bash
cd "client nutrition management"
powershell -ExecutionPolicy Bypass -File SECURITY_TEST_PLAN.ps1 -BaseUrl "http://127.0.0.1:8001"
```

### 2.2 Update Configuration for Production

**config.py Changes:**
- [x] `DEBUG = False` (set via environment)
- [x] `ENVIRONMENT = "production"`
- [x] `LOG_LEVEL = "WARNING"` (reduce verbosity)
- [x] CORS origins restricted to production domains only

**security.py:**
- [x] Token algorithms: HS256 (secure)
- [x] Password hashing: pbkdf2_sha256 + bcrypt
- [x] Token type validation enabled

### 2.3 HTTPS/SSL Configuration

**Requirements:**
1. SSL certificates (Let's Encrypt recommended)
2. HTTP → HTTPS redirect
3. HSTS header enabled (already in middleware)

**Uvicorn with SSL:**
```bash
uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 443 \
  --ssl-keyfile /etc/letsencrypt/live/yourdomain.com/privkey.pem \
  --ssl-certfile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

**Or use Nginx reverse proxy** (recommended):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers (additional to FastAPI middleware)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Database Migration

### 3.1 Switch from SQLite to PostgreSQL ✅ COMPLETED

**Status:** PostgreSQL migration complete with production-ready connection pooling

**What Changed:**
- ✅ Added `psycopg2-binary>=2.9.9` to requirements.txt
- ✅ Configured PostgreSQL connection pooling in database.py
- ✅ Added connection pool settings to config.py
- ✅ Updated .env and .env.example with PostgreSQL examples
- ✅ All existing models compatible (no changes required)

**Quick Start:**
```bash
# Install PostgreSQL driver
pip install psycopg2-binary

# Or install all dependencies
pip install -r requirements.txt
```

**For detailed migration guide, see:** [POSTGRESQL_MIGRATION_GUIDE.md](POSTGRESQL_MIGRATION_GUIDE.md)

### 3.2 Create Production Database

```sql
-- Create database
CREATE DATABASE nutrition_prod;

-- Create user
CREATE USER nutrition_user WITH PASSWORD 'STRONG_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE nutrition_prod TO nutrition_user;

-- Connect to database
\c nutrition_prod

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO nutrition_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nutrition_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nutrition_user;
```

### 3.3 Run Database Migrations

```bash
cd backend

# Initialize database (creates tables)
python -c "from app.database import init_db; init_db(); print('✓ Database initialized')"

# Verify tables created
python -c "from app.database import engine; from sqlalchemy import inspect; inspector = inspect(engine); print('Tables:', inspector.get_table_names())"
```

**Expected tables:**
- users
- client_profiles
- nutrition_plans
- weights
- workouts
- moods
- supplements

### 3.4 Backup Strategy

**PostgreSQL Backup:**
```bash
# Daily backup cron job (add to crontab -e)
0 2 * * * pg_dump -U nutrition_user nutrition_prod > /backup/nutrition_$(date +\%Y\%m\%d).sql

# Restore from backup
psql -U nutrition_user nutrition_prod < /backup/nutrition_20260303.sql
```

---

## Environment Configuration

### 4.1 System Requirements

**Minimum:**
- **CPU:** 2 cores
- **RAM:** 2 GB
- **Storage:** 20 GB SSD
- **OS:** Ubuntu 22.04 LTS / Debian 11 / RHEL 8+

**Recommended (Production):**
- **CPU:** 4+ cores
- **RAM:** 8+ GB
- **Storage:** 100 GB SSD
- **OS:** Ubuntu 22.04 LTS

### 4.2 Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11+
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx (optional, recommended)
sudo apt install nginx -y

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### 4.3 Application Dependencies

```bash
# Create application directory
sudo mkdir -p /var/www/nutrition
sudo chown $USER:$USER /var/www/nutrition
cd /var/www/nutrition

# Clone repository or copy files
# git clone <your-repo-url> .
# OR
scp -r backend/ frontend/ user@server:/var/www/nutrition/

# Create virtual environment
cd backend
python3.11 -m venv venv
source venv/bin/activate

# Install Python packages
pip install --upgrade pip
pip install -r requirements.txt
```

---

## Infrastructure Setup

### 5.1 Systemd Service (Auto-start on boot)

Create `/etc/systemd/system/nutrition-backend.service`:

```ini
[Unit]
Description=Client Nutrition Management Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/nutrition/backend
Environment="PATH=/var/www/nutrition/backend/venv/bin"
ExecStart=/var/www/nutrition/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 4
Restart=always
RestartSec=10

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/www/nutrition/backend/logs

[Install]
WantedBy=multi-user.target
```

**Enable and start service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable nutrition-backend
sudo systemctl start nutrition-backend
sudo systemctl status nutrition-backend
```

### 5.2 Nginx Configuration

Create `/etc/nginx/sites-available/nutrition`:

```nginx
upstream backend {
    server 127.0.0.1:8001;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    
    # Frontend static files
    location / {
        root /var/www/nutrition/frontend;
        index index.html;
        try_files $uri $uri/ =404;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API docs
    location /docs {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }
    
    # Health check
    location /health {
        proxy_pass http://backend;
        access_log off;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/nutrition /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 Obtain SSL Certificate

```bash
# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (certbot adds cron job automatically)
# Test renewal:
sudo certbot renew --dry-run
```

---

## Deployment Steps

### 6.1 Pre-Deployment Checklist

- [ ] Production `.env` file created with strong secrets
- [ ] PostgreSQL database created and configured
- [ ] SSL certificates obtained
- [ ] Nginx configured
- [ ] Systemd service file created
- [ ] All security tests passing locally
- [ ] Backup of existing data (if upgrading)

### 6.2 Deploy Application

```bash
# 1. Copy files to server
scp -r backend/ frontend/ user@yourserver:/var/www/nutrition/

# 2. SSH into server
ssh user@yourserver

# 3. Install dependencies
cd /var/www/nutrition/backend
source venv/bin/activate
pip install -r requirements.txt

# 4. Create .env file (use secure editor)
nano /var/www/nutrition/backend/.env
# Paste production configuration

# 5. Initialize database
cd /var/www/nutrition/backend
python -c "from app.database import init_db; init_db()"

# 6. Set permissions
sudo chown -R www-data:www-data /var/www/nutrition
sudo chmod 600 /var/www/nutrition/backend/.env

# 7. Start services
sudo systemctl start nutrition-backend
sudo systemctl start nginx

# 8. Verify services running
sudo systemctl status nutrition-backend
sudo systemctl status nginx
```

### 6.3 Update Frontend Configuration

Edit `frontend/assets/js/config.js` (or wherever API_BASE_URL is defined):

```javascript
const API_BASE_URL = 'https://yourdomain.com';  // Production URL
```

Or use environment detection:
```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:8001'
    : 'https://yourdomain.com';
```

---

## Post-Deployment Verification

### 7.1 Smoke Tests

**Backend Health:**
```bash
curl https://yourdomain.com/health
# Expected: {"status": "healthy"}
```

**Admin Login:**
```bash
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"YOUR_ADMIN_PASSWORD"}'
# Expected: JSON with access_token and refresh_token
```

**HTTPS Redirect:**
```bash
curl -I http://yourdomain.com
# Expected: 301 redirect to https://
```

**Security Headers:**
```bash
curl -I https://yourdomain.com
# Check for: Strict-Transport-Security, X-Frame-Options, etc.
```

### 7.2 Functional Tests

1. **User Registration**
   - Open `https://yourdomain.com/client-signup.html`
   - Register new test account
   - Verify email, password validation
   - Check token pair in response

2. **User Login**
   - Login with test account
   - Verify redirect to dashboard
   - Check localStorage has tokens

3. **Protected Routes**
   - Navigate to Profile, Progress, Settings
   - Verify data loads correctly
   - Check no console errors

4. **Rate Limiting**
   - Attempt 6 rapid logins with wrong password
   - 6th attempt should return 429 status
   - Wait 60 seconds, verify access restored

5. **Token Refresh**
   - Login and wait 14+ minutes
   - Make API call
   - Verify token auto-refreshed (check network tab)

### 7.3 Security Audit

Run production security scan:
```bash
# On your local machine, point to production
powershell -ExecutionPolicy Bypass -File SECURITY_TEST_PLAN.ps1 -BaseUrl "https://yourdomain.com"
```

Expected: All tests pass

---

## Monitoring & Maintenance

### 8.1 Log Management

**Backend Logs:**
```bash
# View systemd logs
sudo journalctl -u nutrition-backend -f

# Save logs to file
sudo journalctl -u nutrition-backend --since today > /var/log/nutrition/backend.log
```

**Nginx Access Logs:**
```bash
tail -f /var/log/nginx/access.log
```

**Nginx Error Logs:**
```bash
tail -f /var/log/nginx/error.log
```

### 8.2 Log Rotation

Create `/etc/logrotate.d/nutrition`:

```
/var/log/nutrition/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
}
```

### 8.3 Monitoring Setup

**Option 1: Basic Monitoring (systemd)**
```bash
# Email alerts on service failure
sudo systemctl edit nutrition-backend

# Add:
[Service]
OnFailure=failure-notification@%n.service
```

**Option 2: Advanced Monitoring**
- **Application Performance:** New Relic, Datadog, or Sentry
- **Infrastructure:** Prometheus + Grafana
- **Uptime Monitoring:** UptimeRobot, Pingdom

**Key Metrics to Track:**
- API response times (95th percentile < 200ms)
- Error rate (< 1%)
- Token refresh success rate (> 99%)
- Rate limit triggers per hour
- Database connection pool usage
- Memory usage
- CPU usage

### 8.4 Backup Automation

**Daily Database Backup:**
```bash
# Add to crontab: crontab -e
0 2 * * * /usr/bin/pg_dump -U nutrition_user nutrition_prod | gzip > /backup/nutrition_$(date +\%Y\%m\%d).sql.gz

# Keep only last 30 days
0 3 * * * find /backup/nutrition_*.sql.gz -mtime +30 -delete
```

**Weekly Full System Backup:**
```bash
# Backup entire application directory
0 3 * * 0 tar -czf /backup/full_backup_$(date +\%Y\%m\%d).tar.gz /var/www/nutrition --exclude=venv
```

---

## Rollback Plan

### 9.1 Emergency Rollback Procedure

If deployment fails or critical issues discovered:

**Step 1: Stop new deployment**
```bash
sudo systemctl stop nutrition-backend
```

**Step 2: Restore previous version**
```bash
cd /var/www/nutrition
sudo rm -rf backend/ frontend/
sudo tar -xzf /backup/previous_version.tar.gz
```

**Step 3: Restore database (if schema changed)**
```bash
psql -U nutrition_user nutrition_prod < /backup/nutrition_backup_before_deploy.sql
```

**Step 4: Restart service**
```bash
sudo systemctl start nutrition-backend
sudo nginx -s reload
```

**Step 5: Verify rollback successful**
```bash
curl https://yourdomain.com/health
```

### 9.2 Rollback Checklist

Before ANY deployment:
- [ ] Create full backup of application directory
- [ ] Dump production database
- [ ] Document current version/commit hash
- [ ] Test rollback procedure in staging
- [ ] Have rollback commands ready in terminal

---

## Security Maintenance

### 10.1 Regular Security Tasks

**Weekly:**
- [ ] Review authentication logs for suspicious activity
- [ ] Check rate limit trigger logs
- [ ] Verify SSL certificate status

**Monthly:**
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Review and rotate admin passwords
- [ ] Check for dependency vulnerabilities: `pip list --outdated`
- [ ] Run security test suite

**Quarterly:**
- [ ] Rotate SECRET_KEY (requires all users to re-login)
- [ ] Review and update CORS origins
- [ ] Audit user accounts and remove inactive
- [ ] Penetration testing (if applicable)

### 10.2 Dependency Updates

```bash
# Check outdated packages
cd /var/www/nutrition/backend
source venv/bin/activate
pip list --outdated

# Update specific package
pip install --upgrade <package-name>

# Regenerate requirements.txt
pip freeze > requirements.txt

# Test thoroughly before deploying update
```

---

## Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check logs
sudo journalctl -u nutrition-backend -n 50

# Common causes:
# - Missing .env file → Create /var/www/nutrition/backend/.env
# - Weak SECRET_KEY → Must be 32+ characters
# - Database connection failed → Check DATABASE_URL in .env
# - Port already in use → Check: sudo lsof -i :8001
```

**502 Bad Gateway:**
```bash
# Backend not running
sudo systemctl status nutrition-backend

# Restart backend
sudo systemctl restart nutrition-backend
```

**Token refresh failing:**
```bash
# Check backend logs for refresh endpoint errors
sudo journalctl -u nutrition-backend | grep "refresh"

# Verify refresh token expiration in .env
# REFRESH_TOKEN_EXPIRE_DAYS=7
```

**Rate limiting too aggressive:**
```bash
# Edit .env
nano /var/www/nutrition/backend/.env
# Change: LOGIN_RATE_LIMIT=10 per minute

# Restart
sudo systemctl restart nutrition-backend
```

---

## Contact & Support

**Production Support:**
- Environment: Production
- Deployment Date: [FILL IN]
- Version: 1.0.0
- Security Audit Date: March 3, 2026

**Key Personnel:**
- System Administrator: [FILL IN]
- Database Administrator: [FILL IN]
- Security Contact: [FILL IN]

---

## Appendix: Security Test Results

```
Total Tests: 15
Passed:      15
Failed:      0

Features Verified:
✓ SECRET_KEY environment validation
✓ Admin credentials from environment
✓ Refresh token system (15 min access, 7 day refresh)
✓ Rate limiting (5 attempts/minute)
✓ Security headers (X-Frame-Options, CSP, HSTS, etc.)
✓ Structured JSON logging

Last Test Run: March 3, 2026
Test Report: SECURITY_TEST_RESULTS_20260303_231333.json
```

---

**Document Version:** 1.0  
**Last Updated:** March 3, 2026  
**Status:** ✓ Production Ready
