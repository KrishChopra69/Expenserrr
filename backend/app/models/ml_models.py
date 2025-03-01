from pydantic import BaseModel
from typing import List, Optional, Dict

class SavingGoalRequest(BaseModel):
    user_id: str
    income: float
    expenses: List[float]
    spending_patterns: List[str] = []

class SavingGoalResponse(BaseModel):
    short_term_goal: float
    medium_term_goal: float
    long_term_goal: float
    advice: List[str]

class ExpensePredictionRequest(BaseModel):
    user_id: str
    months_to_predict: int = 1
    include_categories: bool = False

class ExpensePredictionResponse(BaseModel):
    predicted_amount: float
    trend: str
    confidence: float
    category_breakdown: Optional[Dict[str, float]] = None

class CategoryPredictionRequest(BaseModel):
    description: str
    amount: Optional[float] = None
    date: Optional[str] = None

class CategoryPredictionResponse(BaseModel):
    predicted_category: str
    confidence: float