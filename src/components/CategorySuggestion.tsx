import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface CategorySuggestionProps {
  description: string;
  amount?: number;
  onSelectCategory: (category: string) => void;
}

// Simple local mapping function that doesn't rely on the backend
function getLocalCategorySuggestion(description: string): { category: string, confidence: number } | null {
  if (!description || description.length < 3) return null;
  
  const text = description.toLowerCase().trim();
  
  // Direct mappings for common terms
  const mappings: Record<string, string> = {
    // Entertainment
    'netflix': 'Entertainment',
    'spotify': 'Entertainment',
    'apple music': 'Entertainment',
    'apple tv': 'Entertainment',
    'movie': 'Entertainment',
    'cinema': 'Entertainment',
    'theater': 'Entertainment',
    'youtube': 'Entertainment',
    'tiktok': 'Entertainment',
    'instagram': 'Entertainment',
    'facebook': 'Entertainment',
    'twitter': 'Entertainment',
    'snapchat': 'Entertainment',
    'concert': 'Entertainment',
    'game': 'Entertainment',
    'gaming': 'Entertainment',
    'playstation': 'Entertainment',
    'ps5': 'Entertainment',
    'xbox': 'Entertainment',
    'nintendo': 'Entertainment',
    'hulu': 'Entertainment',
    'hotstar': 'Entertainment',
    'amazon prime': 'Entertainment',
    'hbo': 'Entertainment',
    'ticket': 'Entertainment',
    'tickets': 'Entertainment',
    
    // Daily Essentials
    'grocery': 'Daily Essentials',
    'groceries': 'Daily Essentials',
    'food': 'Daily Essentials',
    'supermarket': 'Daily Essentials',
    'market': 'Daily Essentials',
    'walmart': 'Daily Essentials',
    'target': 'Daily Essentials',
    'costco': 'Daily Essentials',
    'kroger': 'Daily Essentials',
    'safeway': 'Daily Essentials',
    'whole foods': 'Daily Essentials',
    'aldi': 'Daily Essentials',
    'lidl': 'Daily Essentials',
    'trader': 'Daily Essentials',
    'blinkit': 'Daily Essentials',
    'zepto': 'Daily Essentials',
    'instamart': 'Daily Essentials',
    
    // Food
    'restaurant': 'Food',
    'dining': 'Food',
    'coffee': 'Food',
    'cafe': 'Food',
    'starbucks': 'Food',
    'mcdonalds': 'Food',
    'burger': 'Food',
    'pizza': 'Food',
    'taco': 'Food',
    'sushi': 'Food',
    'lunch': 'Food',
    'dinner': 'Food',
    'breakfast': 'Food',
    'takeout': 'Food',
    'delivery': 'Food',
    'dominos': 'Food',
    'ubereats': 'Food',
    'zomato': 'Food',
    'swiggy': 'Food',
    'foodpanda': 'Food',
    'grubhub': 'Food',
    'doordash': 'Food',
    'pizza hut': 'Food',
    'burger king': 'Food',
    'kfc': 'Food',
    'subway': 'Food',
    
    // Living Cost
    'rent': 'Living Cost',
    'mortgage': 'Living Cost',
    'housing': 'Living Cost',
    'apartment': 'Living Cost',
    'lease': 'Living Cost',
    'landlord': 'Living Cost',
    'property': 'Living Cost',
    'home': 'Living Cost',
    
    // Transportation
    'uber': 'Transportation',
    'ola': 'Transportation',
    'rapido': 'Transportation',
    'indrive': 'Transportation',
    'lyft': 'Transportation',
    'taxi': 'Transportation',
    'cab': 'Transportation',
    'gas': 'Transportation',
    'fuel': 'Transportation',
    'petrol': 'Transportation',
    'diesel': 'Transportation',
    'car': 'Transportation',
    'auto': 'Transportation',
    'vehicle': 'Transportation',
    'bus': 'Transportation',
    'train': 'Transportation',
    'metro': 'Transportation',
    'flight': 'Transportation',
    'airline': 'Transportation',
    'parking': 'Transportation',
    'toll': 'Transportation',
    'maintenance': 'Transportation',
    'repair': 'Transportation',
    'service': 'Transportation',
    'insurance': 'Transportation',
    
    // Healthcare
    'doctor': 'Healthcare',
    'medical': 'Healthcare',
    'health': 'Healthcare',
    'hospital': 'Healthcare',
    'clinic': 'Healthcare',
    'pharmacy': 'Healthcare',
    'medicine': 'Healthcare',
    'prescription': 'Healthcare',
    'dental': 'Healthcare',
    'dentist': 'Healthcare',
    'vision': 'Healthcare',
    'optometrist': 'Healthcare',
    'therapy': 'Healthcare',
    
    // Utilities
    'utility': 'Utilities',
    'electric': 'Utilities',
    'electricity': 'Utilities',
    'water': 'Utilities',
    'gas bill': 'Utilities',
    'heating': 'Utilities',
    'cooling': 'Utilities',
    'internet': 'Utilities',
    'wifi': 'Utilities',
    'broadband': 'Utilities',
    'phone': 'Utilities',
    'mobile': 'Utilities',
    'cell': 'Utilities',
    'cable': 'Utilities',
    'tv': 'Utilities',
    'garbage': 'Utilities',
    'trash': 'Utilities',
    'sewage': 'Utilities',
    
    // Shopping
    'amazon': 'Shopping',
    'flipkart': 'Shopping',
    'myntra': 'Shopping',
    'ajio': 'Shopping',
    'ebay': 'Shopping',
   'shopping': 'Shopping',
    'store': 'Shopping',
    'mall': 'Shopping',
    'retail': 'Shopping',
    'clothing': 'Shopping',
    'clothes': 'Shopping',
    'shoes': 'Shopping',
    'electronics': 'Shopping',
    'furniture': 'Shopping',
    'appliance': 'Shopping',
    'decor': 'Shopping',
    'gift': 'Shopping',
    
    // Education
    'school': 'Education',
    'education': 'Education',
    'college': 'Education',
    'university': 'Education',
    'tuition': 'Education',
    'course': 'Education',
    'class': 'Education',
    'book': 'Education',
    'textbook': 'Education',
    'supplies': 'Education',
    'student': 'Education',
    'loan': 'Education'
  };
  
  // Check for exact matches in our mapping
  for (const [key, category] of Object.entries(mappings)) {
    if (text.includes(key)) {
      return { category, confidence: 0.9 };
    }
  }
  
  return null;
}

export function CategorySuggestion({ 
  description, 
  amount, 
  onSelectCategory 
}: CategorySuggestionProps) {
  const [suggestion, setSuggestion] = useState<{ category: string, confidence: number } | null>(null);
  
  useEffect(() => {
    // Use our local prediction function instead of the API
    const result = getLocalCategorySuggestion(description);
    setSuggestion(result);
  }, [description]);
  
  if (!suggestion) {
    return null;
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => onSelectCategory(suggestion.category)}
        className="inline-flex items-center text-sm px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
      >
        <span>Suggested: {suggestion.category}</span>
        <Check className="w-3 h-3 ml-1" />
      </button>
      <div className="text-xs text-gray-500 mt-1">
        Confidence: {Math.round(suggestion.confidence * 100)}%
      </div>
    </div>
  );
} 