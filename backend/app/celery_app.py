from celery import Celery
from app.config import settings

celery_app = Celery(
    "recruitment_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Configure custom task routes or defaults if needed
    task_routes={
        "app.tasks.run_outbound_dialer_queue": {"queue": "dialer"},
        "app.tasks.process_post_call_analysis": {"queue": "analysis"},
    }
)

# Auto-discover tasks from app
celery_app.autodiscover_tasks(["app"])
