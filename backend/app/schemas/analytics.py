from pydantic import BaseModel


class ActivityDay(BaseModel):
    date: str
    journals: int
    chats: int


class TopConcept(BaseModel):
    label: str
    category: str
    weight: float


class WritingStats(BaseModel):
    total_journals: int
    total_chats: int
    total_words: int
    avg_words_per_journal: int
    longest_streak: int
    memories_count: int


class AnalyticsResponse(BaseModel):
    stats: WritingStats
    activity: list[ActivityDay]
    top_concepts: list[TopConcept]
    ai_narrative: str | None
