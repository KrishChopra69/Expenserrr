# Smart Expense Tracker

A modern expense tracking application with ML-powered insights to help you manage your finances better.

## 🚀 Overview

A web-based Personal Finance Tracker that helps users manage expenses, track transactions, and get ML-based expense predictions. Built with TypeScript and React, with real-time updates via Supabase.

## 🎯 Features

- **Transaction Management**: Add, view, and delete income and expense transactions
- **Dashboard**: Visualize your spending patterns with charts and graphs
- **ML Insights**: Get personalized saving goals and expense predictions
- **Category Suggestions**: Automatic category suggestions for transactions
- **Real-time Updates**: Changes are reflected instantly using Supabase real-time subscriptions
- **Cloud-based**: Access anywhere, anytime with persistent storage

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python
- **Database**: Supabase (PostgreSQL)
- **ML**: Simple rule-based and statistical models (can be extended with more advanced ML)

## Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- Supabase account with project set up

## Environment Setup

1. Clone the repository
2. Set up environment variables:

### Frontend (.env file in root)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (.env file in backend directory)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
```

## Database Setup

1. Create the following tables in your Supabase project:

### transactions
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- amount (float)
- description (text)
- category (text)
- date (timestamp)
- type (text) - 'income' or 'expense'
- created_at (timestamp)

2. Set up Row Level Security (RLS) policies to ensure users can only access their own data.

## Running the Application

### Option 1: Using the start script (Windows)

Run the `start.bat` file to start both frontend and backend servers:

```
start.bat
```

### Option 2: Manual startup

#### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # On Windows
source .venv/bin/activate  # On macOS/Linux
pip install -r requirements.txt
cd app
uvicorn main:app --reload --port 8000
```

#### Frontend
```bash
npm install
npm run dev
```

## Accessing the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## ML Features

The application includes several ML-powered features:

1. **Saving Goals**: Personalized saving recommendations based on income and spending patterns
2. **Expense Prediction**: Forecasts your next month's expenses based on historical data
3. **Category Suggestions**: Automatically suggests categories for new transactions

## Extending the ML Capabilities

The current ML implementation uses simple rule-based and statistical models. To enhance it:

1. Implement more sophisticated models using scikit-learn or TensorFlow
2. Add time series forecasting for better expense predictions
3. Implement clustering for spending pattern analysis
4. Add anomaly detection to identify unusual transactions

## Troubleshooting

If you encounter issues with the application:

1. **Backend Module Not Found Error**: If you see `ModuleNotFoundError: No module named 'app'`, try running the application using the alternative start script:
   ```
   start_alt.bat
   ```

2. **ML Features Not Showing**: Make sure both the frontend and backend are running and that they're using the same Supabase project. Check the browser console for any API errors.

3. **Database Connection Issues**: Verify that your Supabase URL and key are correct in both `.env` and `backend/.env` files.

## License

MIT
