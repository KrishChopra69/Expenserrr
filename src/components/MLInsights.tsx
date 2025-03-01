import React, { useEffect, useState } from 'react';
import { getSavingGoals, predictNextMonthExpenses } from '../lib/api';
import { ArrowDown, ArrowUp, Minus, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import type { Transaction } from '../types';

interface MLInsightsProps {
  userId: string;
  transactions: Transaction[];
  currency: string;
}

export function MLInsights({ userId, transactions, currency }: MLInsightsProps) {
  const [savingGoals, setSavingGoals] = useState<{
    short_term_goal: number;
    medium_term_goal: number;
    long_term_goal: number;
    advice: string[];
  } | null>(null);
  
  const [expensePrediction, setExpensePrediction] = useState<{
    predicted_amount: number;
    trend: string;
    confidence: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMLInsights() {
      if (!userId || transactions.length === 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Calculate monthly income from income transactions
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
        const monthlyIncome = totalIncome / (incomeTransactions.length || 1);
        
        // Fetch saving goals
        const goals = await getSavingGoals(userId, monthlyIncome, transactions);
        setSavingGoals(goals);
        
        // Fetch expense prediction
        const prediction = await predictNextMonthExpenses(userId);
        setExpensePrediction(prediction);
      } catch (err) {
        console.error('Error fetching ML insights:', err);
        setError('Failed to load insights. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchMLInsights();
  }, [userId, transactions]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center text-red-500 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <h3 className="text-lg font-semibold">Error</h3>
        </div>
        <p className="text-gray-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Insights</h3>
      
      {savingGoals && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-800 mb-3">Recommended Saving Goals</h4>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Short Term</p>
              <p className="text-lg font-semibold">{currency} {savingGoals.short_term_goal.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600">Medium Term</p>
              <p className="text-lg font-semibold">{currency} {savingGoals.medium_term_goal.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Long Term</p>
              <p className="text-lg font-semibold">{currency} {savingGoals.long_term_goal.toLocaleString()}</p>
            </div>
          </div>
          
          {savingGoals.advice.length > 0 && (
            <div className="mt-3">
              <h5 className="text-md font-medium text-gray-700 mb-2">Personalized Advice</h5>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {savingGoals.advice.map((advice, index) => (
                  <li key={index}>{advice}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {expensePrediction && (
        <div>
          <h4 className="text-lg font-medium text-gray-800 mb-3">Next Month's Expense Prediction</h4>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Predicted Amount</p>
                <p className="text-xl font-semibold">{currency} {expensePrediction.predicted_amount.toLocaleString()}</p>
              </div>
              <div className="flex items-center">
                {expensePrediction.trend === 'increasing' ? (
                  <div className="flex items-center text-red-500">
                    <TrendingUp className="w-5 h-5 mr-1" />
                    <span>Increasing</span>
                  </div>
                ) : expensePrediction.trend === 'decreasing' ? (
                  <div className="flex items-center text-green-500">
                    <TrendingDown className="w-5 h-5 mr-1" />
                    <span>Decreasing</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <Minus className="w-5 h-5 mr-1" />
                    <span>Stable</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Confidence: {Math.round(expensePrediction.confidence * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 