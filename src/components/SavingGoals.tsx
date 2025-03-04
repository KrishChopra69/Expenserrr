import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from './CurrencySelect';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle } from 'lucide-react';

const savingGoalsSchema = z.object({
  monthlyIncome: z.string().min(1, 'Monthly income is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: 'Monthly income must be a positive number' }
  ),
  savingPercentage: z.string().min(1, 'Saving percentage is required').refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 100;
    },
    { message: 'Percentage must be between 1 and 100' }
  ),
});

interface Props {
  currency: string;
}

export function SavingGoals({ currency }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentExpenses, setCurrentExpenses] = useState(0);
  const [overBudget, setOverBudget] = useState(false);

  const form = useForm<z.infer<typeof savingGoalsSchema>>({
    resolver: zodResolver(savingGoalsSchema),
    defaultValues: {
      monthlyIncome: '',
      savingPercentage: '',
    },
  });

  // Fetch existing saving goals when component mounts
  useEffect(() => {
    fetchSavingGoals();
    calculateCurrentExpenses();
  }, []);

  const fetchSavingGoals = async () => {
    console.log('Starting to fetch saving goals');
    try {
      const user = await supabase.auth.getUser();
      console.log('Current user:', user.data.user);

      if (!user.data.user) {
        console.log('No user found');
        return;
      }

      console.log('Fetching saving goals for user:', user.data.user.id);
      const { data, error } = await supabase
        .from('saving_goals')
        .select('monthly_income, saving_percentage')
        .eq('user_id', user.data.user.id)
        .maybeSingle();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Error fetching saving goals:', error);
        return;
      }

      if (data) {
        console.log('Setting form values:', {
          monthlyIncome: data.monthly_income,
          savingPercentage: data.saving_percentage
        });
        form.setValue('monthlyIncome', data.monthly_income.toString());
        form.setValue('savingPercentage', data.saving_percentage.toString());
        checkBudget(data.monthly_income, data.saving_percentage);
      } else {
        console.log('No saving goals found for user');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const calculateCurrentExpenses = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.data.user.id)
        .eq('type', 'expense')
        .gte('date', firstDayOfMonth)
        .lte('date', lastDayOfMonth);

      if (error) {
        console.error('Error calculating expenses:', error);
        return;
      }

      const total = data.reduce((sum, transaction) => sum + transaction.amount, 0);
      setCurrentExpenses(total);
      
      // Check budget after getting current expenses
      const goals = await supabase
        .from('saving_goals')
        .select('*')
        .eq('user_id', user.data.user.id)
        .single();

      if (goals.data) {
        checkBudget(goals.data.monthly_income, goals.data.saving_percentage);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkBudget = (monthlyIncome: number, savingPercentage: number) => {
    const savingAmount = (monthlyIncome * savingPercentage) / 100;
    const maxExpenses = monthlyIncome - savingAmount;
    setOverBudget(currentExpenses > maxExpenses);
  };

  const onSubmit = async (values: z.infer<typeof savingGoalsSchema>) => {
    setIsLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not found');

      const monthlyIncome = parseFloat(values.monthlyIncome);
      const savingPercentage = parseFloat(values.savingPercentage);

      const { error } = await supabase
        .from('saving_goals')
        .upsert({
          user_id: user.data.user.id,
          monthly_income: monthlyIncome,
          saving_percentage: savingPercentage,
        });

      if (error) throw error;

      checkBudget(monthlyIncome, savingPercentage);
    } catch (error: any) {
      console.error('Error saving goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savingAmount = form.watch('monthlyIncome') && form.watch('savingPercentage')
    ? (parseFloat(form.watch('monthlyIncome')) * parseFloat(form.watch('savingPercentage'))) / 100
    : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Saving Goals</h3>
      
      {overBudget && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Budget Alert</AlertTitle>
          <AlertDescription>
            Your current expenses ({formatCurrency(currentExpenses, currency)}) exceed your budget! 
            Consider reducing expenses to meet your saving goals.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="monthlyIncome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Income ({currency})</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="savingPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saving Goal (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="20"
                    min="1"
                    max="100"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {savingAmount > 0 && (
            <div className="text-sm text-gray-600">
              <p>Monthly Saving Target: {formatCurrency(savingAmount, currency)}</p>
              <p>Available for Expenses: {formatCurrency(parseFloat(form.watch('monthlyIncome')) - savingAmount, currency)}</p>
              <p>Current Monthly Expenses: {formatCurrency(currentExpenses, currency)}</p>
            </div>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Goals'}
          </Button>
        </form>
      </Form>
    </div>
  );
}