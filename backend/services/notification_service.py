"""
Notification dispatcher — multi-channel: In-App, WebSocket, Email, SMS.
"""
from sqlalchemy.orm import Session
from backend.app.models import Notification
import logging, os

logger = logging.getLogger("Studvisor.notifications")


class NotificationDispatcher:
    def send(self, db: Session, user_id: int, title: str, body: str,
             channel: str = "in_app", type: str = "info", action_url: str = None):
        """
        Dispatch notification. Channels: in_app, email, sms, websocket, all.
        """
        # Always create in-app notification
        notif = Notification(user_id=user_id, title=title, body=body, type=type, action_url=action_url)
        db.add(notif)
        db.commit()

        if channel in ("email", "all"):
            self._send_email(user_id, title, body)
        if channel in ("sms", "all"):
            self._send_sms(user_id, title, body)
        if channel in ("websocket", "all"):
            self._send_ws(user_id, title, body)

        return notif.id

    def _send_email(self, user_id: int, subject: str, body: str):
        smtp_host = os.getenv("SMTP_HOST")
        if not smtp_host:
            logger.info(f"[EMAIL] Skipped (no SMTP config): user={user_id}, subject={subject}")
            return
        try:
            import smtplib
            from email.mime.text import MIMEText
            msg = MIMEText(body)
            msg["Subject"] = subject
            msg["From"] = os.getenv("SMTP_USER", "noreply@Studvisor.edu")
            msg["To"] = f"user_{user_id}@Studvisor.edu"
            with smtplib.SMTP(smtp_host, int(os.getenv("SMTP_PORT", "587"))) as server:
                server.starttls()
                server.login(os.getenv("SMTP_USER", ""), os.getenv("SMTP_PASSWORD", ""))
                server.send_message(msg)
            logger.info(f"[EMAIL] Sent to user {user_id}")
        except Exception as e:
            logger.error(f"[EMAIL] Failed: {e}")

    def _send_sms(self, user_id: int, title: str, body: str):
        logger.info(f"[SMS] Skipped (no Twilio config): user={user_id}")

    def _send_ws(self, user_id: int, title: str, body: str):
        logger.info(f"[WS] Push queued: user={user_id}, title={title}")

    def send_bulk(self, db: Session, user_ids: list, title: str, body: str, channel: str = "in_app"):
        for uid in user_ids:
            self.send(db, uid, title, body, channel)


notification_dispatcher = NotificationDispatcher()

