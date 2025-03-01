import requests
import json
import sys
import os

# Add the parent directory to the path so Python can find the app module
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Base URL for the API
BASE_URL = "http://localhost:8000/api/v1"

def test_root():
    """Test the root endpoint"""
    response = requests.get("http://localhost:8000/")
    print(f"Root endpoint: {response.status_code}")
    print(response.json())
    print()

def test_ml_endpoints():
    """Test the ML endpoints"""
    # Test saving goals endpoint
    saving_goals_data = {
        "user_id": "test-user-id",
        "income": 5000,
        "expenses": [1000, 500, 300, 200],
        "spending_patterns": ["food", "entertainment", "housing"]
    }
    
    response = requests.post(f"{BASE_URL}/ml/saving-goals", json=saving_goals_data)
    print(f"Saving goals endpoint: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print()
    
    # Test expense prediction endpoint
    expense_prediction_data = {
        "user_id": "test-user-id",
        "months_to_predict": 1,
        "include_categories": True
    }
    
    response = requests.post(f"{BASE_URL}/ml/predict-expenses", json=expense_prediction_data)
    print(f"Expense prediction endpoint: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print()
    
    # Test category prediction endpoint
    category_prediction_data = {
        "description": "Grocery shopping at Walmart",
        "amount": 120.50
    }
    
    response = requests.post(f"{BASE_URL}/ml/predict-category", json=category_prediction_data)
    print(f"Category prediction endpoint: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print()

if __name__ == "__main__":
    print("Testing API endpoints...\n")
    
    try:
        test_root()
    except Exception as e:
        print(f"Error testing root endpoint: {e}")
    
    try:
        test_ml_endpoints()
    except Exception as e:
        print(f"Error testing ML endpoints: {e}")
    
    print("Testing complete!") 