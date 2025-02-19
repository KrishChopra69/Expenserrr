import React, { useEffect, useState } from 'react';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { CurrencySelect } from './components/CurrencySelect';
import { supabase } from './lib/supabase';
import type { Transaction } from './types';
import { Settings } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session]);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (data) {
      setTransactions(data);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .match({ id });

    if (!error) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  if (!session) {
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
            {/* Left Column - Transaction Form */}
            <div>
              <TransactionForm onTransactionAdded={fetchTransactions} currency={currency} />
            </div>

            {/* Right Column - Dashboard and Transaction List */}
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

export default App