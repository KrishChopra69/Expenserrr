import React, { useEffect, useState } from 'react';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { CurrencySelect } from './components/CurrencySelect';
import { supabase } from './lib/supabase';
import type { Transaction } from './types';
import { Settings } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState('INR');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    console.log('App useEffect: Initializing session and subscriptions');

    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session fetched:', session);
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session);
      setSession(session);
    });

    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    console.log('Setting up real-time subscription for user:', session.user.id);

    const channel = supabase
      .channel('transactions-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('Real-time INSERT detected:', payload.new);
          setTransactions((prev) => [payload.new as Transaction, ...prev]);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    fetchTransactions();

    return () => {
      console.log('Cleaning up real-time channel');
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const fetchTransactions = async () => {
    if (!session?.user?.id) return;

    console.log('Fetching transactions for user:', session.user.id);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else if (data) {
      console.log('Transactions fetched:', data);
      setTransactions(data);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    console.log('Deleting transaction:', id);
    const { error } = await supabase
      .from('transactions')
      .delete()
      .match({ id, user_id: session?.user?.id });

    if (error) {
      console.error('Error deleting transaction:', error);
    } else {
      console.log('Transaction deleted successfully');
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  if (!session) {
    console.log('No session, rendering Auth component');
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              Smart Expense Tracker
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Sign Out
              </button>
            </div>
          </div>
          {showSettings && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
              <CurrencySelect value={currency} onChange={setCurrency} />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <TransactionForm onTransactionAdded={fetchTransactions} currency={currency} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Dashboard transactions={transactions} currency={currency} />
              <TransactionList
                transactions={transactions}
                currency={currency}
                onDelete={handleDeleteTransaction}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;