import { supabase } from './supabase';
import type { Transaction } from '../types';

const API_URL = 'http://localhost:8000/api/v1';

// Types for ML API requests and responses
interface SavingGoalRequest {
  user_id: string;
  income: number;
  expenses: number[];
  spending_patterns: string[];
}

interface SavingGoalResponse {
  short_term_goal: number;
  medium_term_goal: number;
  long_term_goal: number;
  advice: string[];
}

interface ExpensePredictionRequest {
  user_id: string;
  months_to_predict?: number;
  include_categories?: boolean;
}

interface ExpensePredictionResponse {
  predicted_amount: number;
  trend: string;
  confidence: number;
  category_breakdown?: Record<string, number>;
}

interface CategoryPredictionRequest {
  description: string;
  amount?: number;
  date?: string;
}

interface CategoryPredictionResponse {
  predicted_category: string;
  confidence: number;
}

// ML API functions
export async function getSavingGoals(
  userId: string,
  income: number,
  expenses: Transaction[]
): Promise<SavingGoalResponse> {
  try {
    // Extract expense amounts
    const expenseAmounts = expenses
      .filter(t => t.type === 'expense')
      .map(t => t.amount);

    // Extract spending patterns (categories)
    const spendingPatterns = [...new Set(expenses
      .filter(t => t.type === 'expense')
      .map(t => t.category)
      .filter(Boolean) as string[])];

    const response = await fetch(`${API_URL}/ml/saving-goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        income,
        expenses: expenseAmounts,
        spending_patterns: spendingPatterns,
      } as SavingGoalRequest),
    });

    if (!response.ok) {
      throw new Error('Failed to get saving goals');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting saving goals:', error);
    // Return default values if API call fails
    return {
      short_term_goal: income * 0.1,
      medium_term_goal: income * 0.2,
      long_term_goal: income * 0.3,
      advice: ['Could not connect to ML service. Using default recommendations.'],
    };
  }
}

export async function predictNextMonthExpenses(
  userId: string
): Promise<ExpensePredictionResponse> {
  try {
    const response = await fetch(`${API_URL}/ml/predict-expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        months_to_predict: 1,
        include_categories: true,
      } as ExpensePredictionRequest),
    });

    if (!response.ok) {
      throw new Error('Failed to predict expenses');
    }

    return await response.json();
  } catch (error) {
    console.error('Error predicting expenses:', error);
    // Return default values if API call fails
    return {
      predicted_amount: 0,
      trend: 'unknown',
      confidence: 0,
    };
  }
}

export async function predictCategory(
  description: string,
  amount?: number
): Promise<CategoryPredictionResponse> {
  try {
    console.log(`Sending category prediction request for: "${description}"`);
    
    // Create request data
    const requestData = {
      description,
      amount,
      date: new Date().toISOString(),
    };
    
    // Set a very short timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch(`${API_URL}/ml/predict-category`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to predict category: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || typeof data.predicted_category === 'undefined') {
      throw new Error('Invalid response format from prediction API');
    }

    return {
      predicted_category: data.predicted_category,
      confidence: data.confidence || 0.5,
    };
  } catch (error) {
    console.error('Error predicting category:', error);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error; // Re-throw to allow component to handle the error
  }
}

// Function to get monthly income (can be enhanced with ML predictions later)
export async function getMonthlyIncome(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'income')
      .order('date', { ascending: false })
      .limit(3);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    // Calculate average monthly income from recent transactions
    const totalIncome = data.reduce((sum, transaction) => sum + transaction.amount, 0);
    return totalIncome / data.length;
  } catch (error) {
    console.error('Error getting monthly income:', error);
    return 0;
  }
}