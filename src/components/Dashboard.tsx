import React, { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Wallet, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import type { Transaction } from '../types';
import { formatCurrency } from './CurrencySelect';
import SavingGoals from './SavingGoals';
import { MLInsights } from './MLInsights';
import { useUser } from '@supabase/auth-helpers-react';

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

  const getMonthlyData = () => {
    const monthlyMap = transactions.reduce((acc, t) => {
      const month = new Date(t.date).toLocaleString('default', { month: 'short' });
      if (t.type === 'expense') {
        acc[month] = (acc[month] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyMap).map(([month, amount]) => ({
      month,
      amount
    }));
  };

  return (
    <div className="space-y-6">
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
          <div className="h-64">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number, currency)} />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
          <div className="h-64">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCategoryData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {getCategoryData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number, currency)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Saving Goals */}
      <SavingGoals 
        income={income}
        expenses={transactions
          .filter(t => t.type === 'expense')
          .map(t => t.amount)
        }
      />
    </div>
  );
}