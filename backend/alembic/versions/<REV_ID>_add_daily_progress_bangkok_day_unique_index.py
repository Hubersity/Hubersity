"""add daily_progress bangkok day unique index

Revision ID: add_daily_progress_bkk_uq
Revises: None
Create Date: 2025-11-22
"""
from alembic import op

revision = "add_daily_progress_bkk_uq"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
    DO $$
    BEGIN
        -- เช็คว่าตารางมีจริงไหม (public.daily_progress)
        IF to_regclass('public.daily_progress') IS NOT NULL THEN
            DROP INDEX IF EXISTS daily_progress_user_day_bkk_uq;

            CREATE UNIQUE INDEX daily_progress_user_day_bkk_uq
            ON daily_progress (
                user_id,
                CAST(timezone('Asia/Bangkok', "date") AS date)
            );
        END IF;
    END$$;
    """)


def downgrade():
    op.execute("DROP INDEX IF EXISTS daily_progress_user_day_bkk_uq;")