from app.models.ml_models import SavingGoalRequest, ExpensePredictionRequest, CategoryPredictionRequest
from typing import Dict, List
import numpy as np
from app.core.supabase import supabase
from datetime import datetime, timedelta
import re

async def get_saving_goals(data: SavingGoalRequest) -> Dict:
    """
    Calculate personalized saving goals based on income and expense patterns
    """
    # Calculate saving goals based on income and expenses
    total_expenses = sum(data.expenses)
    average_expense = total_expenses / len(data.expenses) if data.expenses else 0
    
    # Calculate disposable income
    disposable_income = data.income - average_expense
    
    # Adjust saving goals based on disposable income
    if disposable_income <= 0:
        # If no disposable income, suggest minimal savings
        short_term = data.income * 0.05
        medium_term = data.income * 0.1
        long_term = data.income * 0.15
    else:
        # Normal saving goals
        short_term = disposable_income * 0.3
        medium_term = disposable_income * 0.4
        long_term = disposable_income * 0.5
    
    # Add personalized advice based on spending patterns
    advice = []
    if "food" in data.spending_patterns and total_expenses > data.income * 0.3:
        advice.append("Consider reducing food expenses to increase savings")
    if "entertainment" in data.spending_patterns and total_expenses > data.income * 0.2:
        advice.append("Entertainment expenses are high, consider reducing them")
    
    return {
        "short_term_goal": round(short_term, 2),
        "medium_term_goal": round(medium_term, 2),
        "long_term_goal": round(long_term, 2),
        "advice": advice
    }

async def predict_next_month_expenses(data: ExpensePredictionRequest) -> Dict:
    """
    Predict next month's expenses based on historical data
    """
    # Get user's transaction history from Supabase
    response = supabase.table("transactions").select("*").eq("user_id", data.user_id).execute()
    
    if response.data:
        # Extract amounts and dates
        amounts = [transaction["amount"] for transaction in response.data if transaction["type"] == "expense"]
        dates = [transaction["date"] for transaction in response.data if transaction["type"] == "expense"]
        
        if amounts:
            # Simple time series prediction (average of last 3 months)
            recent_expenses = amounts[-90:] if len(amounts) > 90 else amounts
            predicted_amount = sum(recent_expenses) / len(recent_expenses)
            
            # Calculate monthly totals for trend analysis
            monthly_totals = {}
            for i, date_str in enumerate(dates):
                date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                month_key = f"{date.year}-{date.month}"
                if month_key in monthly_totals:
                    monthly_totals[month_key] += amounts[i]
                else:
                    monthly_totals[month_key] = amounts[i]
            
            # Determine trend
            trend = "stable"
            if len(monthly_totals) >= 3:
                monthly_values = list(monthly_totals.values())
                if monthly_values[-1] > monthly_values[-2] > monthly_values[-3]:
                    trend = "increasing"
                elif monthly_values[-1] < monthly_values[-2] < monthly_values[-3]:
                    trend = "decreasing"
            
            return {
                "predicted_amount": round(predicted_amount, 2),
                "trend": trend,
                "confidence": 0.7  # Placeholder for a real confidence score
            }
    
    # Fallback if no data or error
    return {
        "predicted_amount": 0,
        "trend": "unknown",
        "confidence": 0
    }

async def predict_category(data: CategoryPredictionRequest) -> Dict:
    """
    Predict the category of a transaction based on its description and amount
    """
    try:
        print(f"[ML] Starting category prediction for: {data}")
        
        # Handle empty or invalid descriptions
        if not data.description or len(data.description.strip()) < 2:
            print("[ML] Empty description, returning 'other'")
            return {"predicted_category": "other", "confidence": 0.5}
            
        # Normalize description: lowercase and remove extra spaces
        description = data.description.lower().strip()
        
        print(f"[ML] Processing normalized description: '{description}'")
        
        # Super simple direct mappings for common terms
        # This is a very basic implementation that should respond quickly
        if "netflix" in description:
            return {"predicted_category": "Entertainment", "confidence": 0.9}
        elif "spotify" in description:
            return {"predicted_category": "Entertainment", "confidence": 0.9}
        elif "movie" in description or "cinema" in description:
            return {"predicted_category": "Entertainment", "confidence": 0.9}
        elif "grocery" in description or "groceries" in description:
            return {"predicted_category": "Daily Essentials", "confidence": 0.9}
        elif "food" in description or "supermarket" in description:
            return {"predicted_category": "Daily Essentials", "confidence": 0.9}
        elif "restaurant" in description or "dining" in description:
            return {"predicted_category": "Dining Out", "confidence": 0.9}
        elif "coffee" in description or "cafe" in description:
            return {"predicted_category": "Dining Out", "confidence": 0.9}
        elif "rent" in description or "mortgage" in description:
            return {"predicted_category": "Living Cost", "confidence": 0.9}
        elif "uber" in description or "lyft" in description or "taxi" in description:
            return {"predicted_category": "Transportation", "confidence": 0.9}
        elif "gas" in description or "fuel" in description:
            return {"predicted_category": "Transportation", "confidence": 0.9}
        elif "doctor" in description or "medical" in description or "health" in description:
            return {"predicted_category": "Healthcare", "confidence": 0.9}
        elif "utility" in description or "electric" in description or "water" in description:
            return {"predicted_category": "Utilities", "confidence": 0.9}
        elif "amazon" in description or "shopping" in description:
            return {"predicted_category": "Shopping", "confidence": 0.9}
        elif "school" in description or "education" in description or "college" in description:
            return {"predicted_category": "Education", "confidence": 0.9}
        
        # If no match found, return "other"
        print(f"[ML] No match found for '{description}', returning 'other'")
        return {
            "predicted_category": "other",
            "confidence": 0.5
        }
    except Exception as e:
        print(f"[ML] Error in category prediction: {str(e)}")
        # Return a safe default in case of any error
        return {"predicted_category": "other", "confidence": 0.5}