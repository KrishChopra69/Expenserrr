import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { getSavingGoals } from '../lib/api';
import { useUser } from '@supabase/auth-helpers-react';
import { Lightbulb } from 'lucide-react';
import type { Transaction } from '../types';

interface SavingGoalsProps {
  income: number;
  expenses: number[];
}

interface GoalData {
  short_term_goal: number;
  medium_term_goal: number;
  long_term_goal: number;
  advice: string[];
}

const SavingGoals: React.FC<SavingGoalsProps> = ({ income, expenses }) => {
  const [goals, setGoals] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(false);
  const user = useUser();

  useEffect(() => {
    const fetchGoals = async () => {
      if (user && income && expenses) {
        setLoading(true);
        try {
          // Create dummy transactions from expense amounts to match the API expectation
          const dummyTransactions: Transaction[] = expenses.map(amount => ({
            id: '',
            user_id: user.id,
            amount,
            description: '',
            category: '',
            date: new Date().toISOString(),
            type: 'expense',
            created_at: new Date().toISOString()
          }));
          
          const data = await getSavingGoals(user.id, income, dummyTransactions);
          setGoals(data);
        } catch (error) {
          console.error('Error fetching saving goals:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchGoals();
  }, [user, income, expenses]);

  if (loading) return <div>Loading saving goals...</div>;
  if (!goals) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Personalized Saving Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Short Term Goal</h3>
            <p className="text-green-600">${goals.short_term_goal.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="font-medium">Medium Term Goal</h3>
            <p className="text-blue-600">${goals.medium_term_goal.toFixed(2)}</p>
          </div>
          <div>
            <h3 className="font-medium">Long Term Goal</h3>
            <p className="text-purple-600">${goals.long_term_goal.toFixed(2)}</p>
          </div>
          
          {goals.advice && goals.advice.length > 0 && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <h3 className="font-medium flex items-center gap-2 text-amber-700">
                <Lightbulb className="w-4 h-4" />
                Financial Advice
              </h3>
              <ul className="mt-2 space-y-1 list-disc list-inside text-amber-800">
                {goals.advice.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingGoals;