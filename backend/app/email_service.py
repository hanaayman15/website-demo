"""Email delivery utilities for transactional emails."""
import logging
import smtplib
import ssl
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)


def _smtp_port() -> int:
    try:
        return int(settings.SMTP_PORT)
    except (TypeError, ValueError):
        return 587


def is_email_configured() -> bool:
    """Return True when SMTP settings are present enough to attempt email send."""
    return bool(
        settings.SMTP_HOST
        and settings.SMTP_PORT
        and settings.SMTP_USERNAME
        and settings.SMTP_PASSWORD
        and settings.SMTP_FROM_EMAIL
    )


def send_password_reset_code_email(recipient_email: str, verification_code: str) -> tuple[bool, str]:
    """Send password reset verification code email via SMTP."""
    if not is_email_configured():
        msg = "SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL"
        logger.error(msg)
        return False, msg

    subject = "Your Password Reset Verification Code"
    smtp_username = (settings.SMTP_USERNAME or "").strip()
    # Gmail app passwords are often copied in 4-char groups separated by spaces.
    smtp_password = (settings.SMTP_PASSWORD or "").replace(" ", "").strip()
    body_text = (
        "You requested a password reset for your Nutrition Management account.\n\n"
        f"Verification code: {verification_code}\n\n"
        "This code expires in 15 minutes. If you did not request this, you can ignore this email."
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = recipient_email
    message.set_content(body_text)

    host = settings.SMTP_HOST
    port = _smtp_port()

    try:
        # Port 465 is implicit TLS; all others default to STARTTLS when enabled.
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=15, context=ssl.create_default_context()) as server:
                server.login(smtp_username, smtp_password)
                server.send_message(message)
        else:
            with smtplib.SMTP(host, port, timeout=15) as server:
                server.ehlo()
                if settings.SMTP_USE_TLS:
                    server.starttls(context=ssl.create_default_context())
                    server.ehlo()
                server.login(smtp_username, smtp_password)
                server.send_message(message)

        logger.info("Password reset email sent", extra={"email": recipient_email})
        return True, "Email sent"
    except Exception as exc:
        logger.exception(
            "Failed to send password reset email",
            extra={
                "email": recipient_email,
                "smtp_host": host,
                "smtp_port": port,
                "smtp_tls": settings.SMTP_USE_TLS,
            },
        )
        return False, str(exc)
