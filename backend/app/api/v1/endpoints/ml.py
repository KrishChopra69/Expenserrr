from fastapi import APIRouter, Depends, HTTPException
from app.services.ml_service import get_saving_goals, predict_next_month_expenses, predict_category
from app.models.ml_models import (
    SavingGoalRequest, 
    ExpensePredictionRequest, 
    CategoryPredictionRequest,
    SavingGoalResponse,
    ExpensePredictionResponse,
    CategoryPredictionResponse
)
import time
import asyncio

router = APIRouter()

@router.post("/saving-goals", response_model=SavingGoalResponse)
async def suggest_saving_goals(data: SavingGoalRequest):
    return await get_saving_goals(data)

@router.post("/predict-expenses", response_model=ExpensePredictionResponse)
async def predict_expenses(data: ExpensePredictionRequest):
    return await predict_next_month_expenses(data)

@router.post("/predict-category", response_model=CategoryPredictionResponse)
async def suggest_category(data: CategoryPredictionRequest):
    print(f"[API] Received category prediction request: {data}")
    start_time = time.time()
    
    try:
        # Add a timeout to prevent hanging
        result = await asyncio.wait_for(predict_category(data), timeout=2.0)
        elapsed = time.time() - start_time
        print(f"[API] Category prediction completed in {elapsed:.2f}s with result: {result}")
        return result
    except asyncio.TimeoutError:
        elapsed = time.time() - start_time
        print(f"[API] Category prediction timed out after {elapsed:.2f}s")
        return {"predicted_category": "other", "confidence": 0.5}
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"[API] Category prediction failed after {elapsed:.2f}s with error: {str(e)}")
        # Return a fallback response instead of raising an exception
        return {"predicted_category": "other", "confidence": 0.5}