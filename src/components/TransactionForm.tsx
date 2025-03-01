import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Transaction } from '../types';
import { formatCurrency } from './CurrencySelect';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CategorySuggestion } from './CategorySuggestion';

const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.string().min(1, 'Amount is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.date(),
});

interface Props {
  onTransactionAdded: () => void;
  currency: string;
}

export function TransactionForm({ onTransactionAdded, currency }: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date(),
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{message: string, isError: boolean} | null>(null);
  const watchedDescription = form.watch('description');
  const watchedAmount = form.watch('amount');

  const handleCategorySelect = (category: string) => {
    form.setValue('category', category);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('Form values:', values);
    setIsLoading(true);
    setSubmitStatus(null);
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not found');

      console.log('Adding transaction:', values);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          amount: parseFloat(values.amount),
          category: values.category,
          description: values.description,
          type: values.type,
          date: values.date.toISOString(),
          user_id: user.data.user.id,
        }])
        .select();

      if (error) throw error;

      console.log('Transaction added successfully:', data);
      setSubmitStatus({
        message: 'Transaction added successfully',
        isError: false
      });

      form.reset();
      
      // Call the callback to refresh the transaction list
      onTransactionAdded();
      
      // Reset status message after 3 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      setSubmitStatus({
        message: `Error: ${error.message}`,
        isError: true
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <PlusCircle className="w-5 h-5" />
        Add Transaction
      </h2>
      
      {submitStatus && (
        <div className={`mb-4 p-3 rounded-md ${submitStatus.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {submitStatus.message}
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ({currency})</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    {...field}
                  />
                </FormControl>
                {field.value && (
                  <p className="mt-1 text-sm text-gray-500">
                    {formatCurrency(parseFloat(field.value), currency)}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Groceries, Rent, Salary" {...field} />
                </FormControl>
                <FormMessage />
                {form.getValues('type') === 'expense' && watchedDescription && (
                  <CategorySuggestion 
                    description={watchedDescription}
                    amount={watchedAmount ? parseFloat(watchedAmount) : undefined}
                    onSelectCategory={handleCategorySelect}
                  />
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Enter a description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Transaction'}
          </Button>
        </form>
      </Form>
    </div>
  );
}