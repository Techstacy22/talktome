from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


async def create_task(db: AsyncSession, user_id: UUID, data: TaskCreate) -> Task:
    task = Task(user_id=user_id, **data.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def list_tasks(db: AsyncSession, user_id: UUID) -> list[Task]:
    result = await db.execute(
        select(Task)
        .where(Task.user_id == user_id)
        .order_by(Task.created_at.desc())
    )
    return list(result.scalars().all())


async def get_task(db: AsyncSession, user_id: UUID, task_id: UUID) -> Task | None:
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def update_task(
    db: AsyncSession, user_id: UUID, task_id: UUID, data: TaskUpdate
) -> Task | None:
    task = await get_task(db, user_id, task_id)
    if not task:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


async def delete_task(db: AsyncSession, user_id: UUID, task_id: UUID) -> bool:
    task = await get_task(db, user_id, task_id)
    if not task:
        return False
    await db.delete(task)
    await db.commit()
    return True
