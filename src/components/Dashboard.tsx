import React, { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Wallet, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import type { Transaction } from '../types';
import { formatCurrency } from './CurrencySelect';
import { MLInsights } from './MLInsights';
import { useUser } from '@supabase/auth-helpers-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6'  // violet-500
];

interface Props {
  transactions: Transaction[];
  currency: string;
}

export function Dashboard({ transactions, currency }: Props) {
  const [loading, setLoading] = useState(true);
  const [overBudget, setOverBudget] = useState(false);
  const [budgetInfo, setBudgetInfo] = useState<{
    monthlyIncome: number;
    savingPercentage: number;
    availableBudget: number;
  } | null>(null);
  const user = useUser();
  
  const calculateTotals = () => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expenses };
  };

  const { income, expenses } = calculateTotals();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkBudget = async () => {
      try {
        // First check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          return;
        }

        if (!session?.user) {
          console.log('No active session found');
          return;
        }

        console.log('Session found:', session.user);

        // Fetch saving goals
        const { data: goals, error } = await supabase
          .from('saving_goals')
          .select('monthly_income, saving_percentage')
          .eq('user_id', session.user.id)
          .maybeSingle();

        console.log('Supabase response:', { goals, error });

        if (error) {
          console.error('Error fetching goals:', error);
          return;
        }

        if (!goals) {
          console.log('No saving goals found');
          return;
        }

        console.log('Found saving goals:', goals);

        // Calculate available budget
        const monthlyIncome = goals.monthly_income;
        const savingPercentage = goals.saving_percentage;
        const savingAmount = (monthlyIncome * savingPercentage) / 100;
        const availableBudget = monthlyIncome - savingAmount;

        console.log('Budget calculations:', {
          monthlyIncome,
          savingPercentage,
          savingAmount,
          availableBudget
        });

        setBudgetInfo({
          monthlyIncome,
          savingPercentage,
          availableBudget
        });

        // Calculate current month's expenses
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        console.log('Filtering transactions:', {
          totalTransactions: transactions.length,
          firstDayOfMonth: firstDayOfMonth.toISOString()
        });

        const currentMonthExpenses = transactions
          .filter(t => {
            const transactionDate = new Date(t.date);
            const isExpense = t.type === 'expense';
            const isThisMonth = transactionDate >= firstDayOfMonth;
            console.log('Transaction:', {
              date: t.date,
              amount: t.amount,
              type: t.type,
              isExpense,
              isThisMonth
            });
            return isExpense && isThisMonth;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        console.log('Budget comparison:', {
          currentMonthExpenses,
          availableBudget,
          isOverBudget: currentMonthExpenses > availableBudget,
          difference: currentMonthExpenses - availableBudget
        });

        setOverBudget(currentMonthExpenses > availableBudget);
      } catch (error) {
        console.error('Error checking budget:', error);
      }
    };

    // Only run checkBudget if we have transactions
    if (transactions.length > 0) {
      checkBudget();
    }
  }, [transactions]); // Remove user from dependencies since we're getting session directly

  const getCategoryData = () => {
    const categoryMap = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getDailyData = () => {
    // Create a map to store daily expenses
    const dailyMap = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const date = new Date(t.date);
        const formattedDate = format(date, 'MMM dd'); // Format date as "Jan 01"
        acc[formattedDate] = (acc[formattedDate] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Convert to array and sort by date
    return Object.entries(dailyMap)
      .map(([date, amount]) => ({
        date,
        amount
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const getMonthlyData = () => {
    const monthlyMap = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const date = new Date(t.date);
        const month = format(date, 'MMM'); // Format as "Jan"
        acc[month] = (acc[month] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Get all months in order
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Get last 6 months
    const relevantMonths = months
      .slice(0, currentMonth + 1)
      .slice(-6);

    return relevantMonths.map(month => ({
      month,
      amount: monthlyMap[month] || 0
    }));
  };

  return (
    <div className="space-y-6">
      {/* Budget Alert */}
      {overBudget && budgetInfo && (
        <Alert variant="destructive" className="animate-pulse">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Budget Alert!</AlertTitle>
          <AlertDescription className="mt-2">
            Your current month's expenses ({formatCurrency(transactions
              .filter(t => t.type === 'expense' && new Date(t.date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
              .reduce((sum, t) => sum + t.amount, 0), currency)}) 
            have exceeded your monthly budget of {formatCurrency(budgetInfo.availableBudget, currency)}! 
            <br />
            Consider reducing expenses to stay within your saving goals.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(income, currency)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
        )}

        {loading ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(expenses, currency)}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-red-500" />
            </div>
          </div>
        )}

        {loading ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Balance</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(income - expenses, currency)}
                </p>
              </div>
              <PieChartIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        )}
      </div>

      {/* ML Insights */}
      {user && transactions.length > 0 && (
        <MLInsights 
          userId={user.id} 
          transactions={transactions} 
          currency={currency} 
        />
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Monthly Expenses</h3>
          <div className="h-[400px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getMonthlyData()} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="month"
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number, currency)}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
          <div className="h-[400px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCategoryData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    fill="#8884d8"
                    dataKey="value"
                    minAngle={15}
                    labelLine={{ 
                      strokeWidth: 1, 
                      stroke: '#8884d8', 
                      strokeDasharray: "2 2"
                    }}
                    label={({ name, percent, x, y, cx, cy, midAngle }) => {
                      // Shorten common category names
                      const categoryShortForms: Record<string, string> = {
                        'Transportation': 'Transport',
                        'Entertainment': 'Entertain',
                        'Restaurant': 'Food',
                        'Groceries': 'Grocery',
                        'Shopping': 'Shop',
                        'Utilities': 'Utils',
                        'Insurance': 'Insur',
                      };
                      
                      // Split name into words and shorten if needed
                      const words = name.split(' ').map((word: string) => 
                        categoryShortForms[word] || (word.length > 6 ? word.slice(0, 6) + '.' : word)
                      );

                      // Calculate label position with offset
                      const RADIAN = Math.PI / 180;
                      const radius = 100; // Outer radius for labels
                      const xOffset = x > cx ? 10 : -10;
                      const newX = cx + radius * Math.cos(-midAngle * RADIAN) + xOffset;
                      const newY = cy + radius * Math.sin(-midAngle * RADIAN);
                      
                      return (
                        <text 
                          x={newX} 
                          y={newY} 
                          fill="#374151" 
                          textAnchor={x > cx ? "start" : "end"}
                          fontSize={11}
                        >
                          {words.map((word: string, i: number) => (
                            <tspan
                              key={i}
                              x={newX}
                              dy={i === 0 ? -words.length * 6 : 12}
                            >
                              {i === words.length - 1 ? `${word} (${(percent * 100).toFixed(0)}%)` : word}
                            </tspan>
                          ))}
                        </text>
                      );
                    }}
                  >
                    {getCategoryData().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number, currency)}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}