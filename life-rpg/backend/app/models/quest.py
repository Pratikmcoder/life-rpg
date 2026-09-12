from pydantic import BaseModel
from typing import Optional
from enum import Enum


class QuestDifficulty(str, Enum):
    trivial = "trivial"
    common = "common"
    challenging = "challenging"
    legendary = "legendary"


class CreateQuestRequest(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: QuestDifficulty
    due_date: Optional[str] = None   # ISO date string YYYY-MM-DD
    is_daily: bool = False

    class Config:
        use_enum_values = True

    def model_post_init(self, __context):
        if not self.title or not self.title.strip():
            raise ValueError("Title is required")
        self.title = self.title.strip()[:100]
        if self.description:
            self.description = self.description.strip()[:500]


class UpdateQuestRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[QuestDifficulty] = None
    due_date: Optional[str] = None

    class Config:
        use_enum_values = True
