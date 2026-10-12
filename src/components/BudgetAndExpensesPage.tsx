import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  TripBudget,
  TripExpense,
  ExpenseCategory,
  EXPENSE_CATEGORIES,
  BudgetOverview,
  ExpenseReportSummary,
  CustomTrip
} from '../types';
import {
  Wallet,
  TrendingUp,
  PieChart,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  CreditCard,
  Tag,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  Car,
  Hotel,
  UtensilsCrossed,
  ShoppingBag,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowUpRight,
  Layers,
  ChevronDown,
  Lock
} from 'lucide-react';

const CATEGORY_ICONS: Record<ExpenseCategory, React.ComponentType<{ className?: string }>> = {
  Transportation: Car,
  Hotel: Hotel,
  Food: UtensilsCrossed,
  Shopping: ShoppingBag,
  Entertainment: Sparkles,
  Miscellaneous: HelpCircle
};

const CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; text: string; border: string; bar: string }> = {
  Transportation: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', bar: 'bg-blue-500' },
  Hotel: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', bar: 'bg-amber-500' },
  Food: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', bar: 'bg-emerald-500' },
  Shopping: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', bar: 'bg-purple-500' },
  Entertainment: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30', bar: 'bg-pink-500' },
  Miscellaneous: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', bar: 'bg-slate-400' }
};

interface BudgetAndExpensesPageProps {
  initialTripId?: string;
}

export const BudgetAndExpensesPage: React.FC<BudgetAndExpensesPageProps> = ({ initialTripId }) => {
  const { trips, userProfile, isAuthenticated, openAuthModal, showToast } = useApp();

  // Selected Trip State
  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    if (initialTripId) return initialTripId;
    if (trips.length > 0) return trips[0].id;
    return 'trip-1789736347651-alzwl';
  });

  const currentTrip = useMemo(() => {
    return trips.find(t => t.id === selectedTripId) || (trips[0] || null);
  }, [trips, selectedTripId]);

  // Main Sub-Tab: 'overview' | 'expenses' | 'categories'
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'expenses' | 'categories'>('overview');

  // Loading & Data States
  const [isLoading, setIsLoading] = useState(true);
  const [budget, setBudget] = useState<TripBudget | null>(null);
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [report, setReport] = useState<ExpenseReportSummary | null>(null);

  // Filters & Search for Expense List
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Modals
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TripExpense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<TripExpense | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);
  const [deletedExpenseNotice, setDeletedExpenseNotice] = useState<string | null>(null);

  // Budget Modal Form State
  const [budgetFormData, setBudgetFormData] = useState({
    totalBudget: 150000,
    currency: 'INR',
    allocations: {
      Transportation: 30000,
      Hotel: 50000,
      Food: 25000,
      Shopping: 15000,
      Entertainment: 15000,
      Miscellaneous: 15000
    } as Record<ExpenseCategory, number>,
    estimatedCosts: {
      Transportation: 28000,
      Hotel: 48000,
      Food: 22000,
      Shopping: 12000,
      Entertainment: 14000,
      Miscellaneous: 10000
    } as Record<ExpenseCategory, number>,
    notes: ''
  });

  // Expense Modal Form State
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    amount: '',
    category: 'Food' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Credit Card',
    notes: '',
    receiptUrl: '',
    isShared: false
  });

  // Load Data from Backend
  const loadData = async (tripId: string) => {
    if (!userProfile?.email) {
      setIsLoading(false);
      setBudget(null);
      setOverview(null);
      setExpenses([]);
      setReport(null);
      return;
    }
    setIsLoading(true);
    const email = userProfile.email;
    try {
      const [budgetRes, overviewRes, expensesRes, reportRes] = await Promise.all([
        fetch(`/api/budgets?tripId=${encodeURIComponent(tripId)}&userEmail=${encodeURIComponent(email)}`),
        fetch(`/api/budgets/overview/${encodeURIComponent(tripId)}?userEmail=${encodeURIComponent(email)}`),
        fetch(`/api/expenses?tripId=${encodeURIComponent(tripId)}&userEmail=${encodeURIComponent(email)}`),
        fetch(`/api/expenses/reports/summary?tripId=${encodeURIComponent(tripId)}&userEmail=${encodeURIComponent(email)}`)
      ]);

      const [bData, oData, eData, rData] = await Promise.all([
        budgetRes.json(),
        overviewRes.json(),
        expensesRes.json(),
        reportRes.json()
      ]);

      if (bData.success && bData.budget) {
        setBudget(bData.budget);
        setBudgetFormData({
          totalBudget: bData.budget.totalBudget || 150000,
          currency: bData.budget.currency || 'INR',
          allocations: {
            Transportation: bData.budget.allocations?.Transportation || 0,
            Hotel: bData.budget.allocations?.Hotel || 0,
            Food: bData.budget.allocations?.Food || 0,
            Shopping: bData.budget.allocations?.Shopping || 0,
            Entertainment: bData.budget.allocations?.Entertainment || 0,
            Miscellaneous: bData.budget.allocations?.Miscellaneous || 0
          },
          estimatedCosts: {
            Transportation: bData.budget.estimatedCosts?.Transportation || 0,
            Hotel: bData.budget.estimatedCosts?.Hotel || 0,
            Food: bData.budget.estimatedCosts?.Food || 0,
            Shopping: bData.budget.estimatedCosts?.Shopping || 0,
            Entertainment: bData.budget.estimatedCosts?.Entertainment || 0,
            Miscellaneous: bData.budget.estimatedCosts?.Miscellaneous || 0
          },
          notes: bData.budget.notes || ''
        });
      }

      if (oData.success && oData.overview) setOverview(oData.overview);
      if (eData.success && Array.isArray(eData.expenses)) setExpenses(eData.expenses);
      if (rData.success && rData.summary) setReport(rData.summary);
    } catch (err) {
      console.error('Error loading budget and expenses:', err);
      showToast('Could not load budget data. Serving local cache.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTripId) {
      loadData(selectedTripId);
    }
  }, [selectedTripId, userProfile?.email]);

  // Handle Save / Update Budget
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.email) {
      showToast('Please sign in to save your budget', 'error');
      return;
    }
    const email = userProfile.email;
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: selectedTripId,
          userEmail: email,
          totalBudget: Number(budgetFormData.totalBudget),
          currency: budgetFormData.currency,
          allocations: budgetFormData.allocations,
          estimatedCosts: budgetFormData.estimatedCosts,
          notes: budgetFormData.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Trip budget & category allocations saved successfully!', 'success');
        setIsBudgetModalOpen(false);
        loadData(selectedTripId);
      } else {
        showToast(data.error || 'Failed to save budget', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving budget', 'error');
    }
  };

  // Open Add Expense Modal
  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpenseFormData({
      title: '',
      amount: '',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Credit Card',
      notes: '',
      receiptUrl: '',
      isShared: false
    });
    setIsExpenseModalOpen(true);
  };

  // Open Edit Expense Modal
  const openEditExpenseModal = (exp: TripExpense) => {
    setEditingExpense(exp);
    setExpenseFormData({
      title: exp.title,
      amount: String(exp.amount),
      category: exp.category,
      date: exp.date,
      paymentMethod: exp.paymentMethod,
      notes: exp.notes || '',
      receiptUrl: exp.receiptUrl || '',
      isShared: Boolean(exp.isShared)
    });
    setIsExpenseModalOpen(true);
  };

  // Submit Add or Edit Expense
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.email) {
      showToast('Please sign in to record expenses', 'error');
      return;
    }
    const email = userProfile.email;
    const amountNum = parseFloat(expenseFormData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid expense amount', 'error');
      return;
    }

    try {
      if (editingExpense) {
        // PUT update
        const res = await fetch(`/api/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: expenseFormData.title,
            amount: amountNum,
            category: expenseFormData.category,
            date: expenseFormData.date,
            paymentMethod: expenseFormData.paymentMethod,
            notes: expenseFormData.notes,
            receiptUrl: expenseFormData.receiptUrl,
            isShared: expenseFormData.isShared
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Expense updated successfully!', 'success');
          setIsExpenseModalOpen(false);
          loadData(selectedTripId);
        } else {
          showToast(data.error || 'Failed to update expense', 'error');
        }
      } else {
        // POST create
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId: selectedTripId,
            userEmail: email,
            title: expenseFormData.title,
            amount: amountNum,
            currency: budget?.currency || 'INR',
            category: expenseFormData.category,
            date: expenseFormData.date,
            paymentMethod: expenseFormData.paymentMethod,
            notes: expenseFormData.notes,
            receiptUrl: expenseFormData.receiptUrl,
            isShared: expenseFormData.isShared
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Added ₹${amountNum.toLocaleString()} under ${expenseFormData.category}!`, 'success');
          setIsExpenseModalOpen(false);
          loadData(selectedTripId);
        } else {
          showToast(data.error || 'Failed to add expense', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing expense', 'error');
    }
  };

  // Delete Expense Confirmation Handler
  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setIsDeletingExpense(true);
    try {
      const res = await fetch(`/api/expenses/${expenseToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Expense "${expenseToDelete.title}" (₹${expenseToDelete.amount.toLocaleString()}) deleted!`, 'info');
        setDeletedExpenseNotice(`Deleted: "${expenseToDelete.title}" (₹${expenseToDelete.amount.toLocaleString()}) was removed.`);
        setTimeout(() => setDeletedExpenseNotice(null), 5000);
        setExpenseToDelete(null);
        loadData(selectedTripId);
      } else {
        showToast(data.error || 'Failed to delete expense', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting expense', 'error');
    } finally {
      setIsDeletingExpense(false);
    }
  };

  // Filtered & Sorted Expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(exp => {
        if (categoryFilter !== 'All' && exp.category.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = exp.title.toLowerCase().includes(q);
          const matchNotes = (exp.notes || '').toLowerCase().includes(q);
          const matchCat = exp.category.toLowerCase().includes(q);
          if (!matchTitle && !matchNotes && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [expenses, categoryFilter, searchQuery, sortBy]);

  // Export CSV
  const handleExportCsv = () => {
    if (expenses.length === 0) {
      showToast('No expenses to export', 'info');
      return;
    }
    const headers = ['ID', 'Date', 'Title', 'Category', 'Amount', 'Currency', 'Payment Method', 'Shared', 'Notes'];
    const rows = expenses.map(e => [
      e.id,
      e.date,
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      e.amount,
      e.currency,
      e.paymentMethod,
      e.isShared ? 'Yes' : 'No',
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TripNest_Expenses_${selectedTripId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Expense ledger exported to CSV successfully', 'success');
  };

  if (!isAuthenticated || !userProfile?.email) {
    return (
      <div id="budget-expenses-page" className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="border-b border-white/10 pb-6 mb-10 text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E2C076]/10 border border-[#E2C076]/30 text-xs font-bold text-[#E2C076] mb-3">
            <Wallet className="h-4 w-4" />
            <span>Financial Intelligence & Spending Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight text-left">
            Budget Management & Expense Tracking
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl text-left">
            Real-time planned budget allocation, multi-category expense monitoring, projected cost overruns, and verified expense reports.
          </p>
        </div>

        <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 rounded-3xl bg-[#0E1726]/90 border border-[#E2C076]/30 backdrop-blur-2xl text-center shadow-2xl">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-[#E2C076]/15 border border-[#E2C076]/30 flex items-center justify-center text-[#E2C076]">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-extrabold text-white mb-2">Sign In Required</h3>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
            Trip budgets, category spending limits, and receipts are private and protected. Please sign in to view and manage your travel finances.
          </p>
          <button
            onClick={() => openAuthModal()}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-[#E2C076] to-[#D4A853] text-[#070B14] font-extrabold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#E2C076]/20 inline-flex items-center justify-center space-x-2"
          >
            <Wallet className="h-4 w-4" />
            <span>Sign In to Access Budgets</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="budget-expenses-page" className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header & Trip Selector */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 border-b border-white/10 pb-6 text-left">
        <div className="text-left">
          <div className="inline-flex items-center space-x-2 text-[#E2C076] text-xs uppercase tracking-widest font-bold mb-1.5">
            <Wallet className="h-4 w-4" />
            <span>Financial Intelligence & Spending Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight text-left">
            Budget Management & Expense Tracking
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl text-left">
            Real-time planned budget allocation, multi-category expense monitoring, projected cost overruns, and verified expense reports.
          </p>
        </div>

        {/* Action Controls & Trip Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Trip Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="bg-[#0E1726] border border-[#E2C076]/40 text-neutral-200 text-xs font-semibold rounded-xl px-3 py-2 pr-8 focus:ring-1 focus:ring-[#E2C076] focus:outline-none appearance-none cursor-pointer"
            >
              {trips.length > 0 ? (
                trips.map(t => (
                  <option key={t.id} value={t.id} className="bg-[#070B14] text-white">
                    {t.title} ({t.destination})
                  </option>
                ))
              ) : (
                <option value="trip-1789736347651-alzwl" className="bg-[#070B14] text-white">
                  Kashmir Valley Exploration
                </option>
              )}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#E2C076] pointer-events-none" />
          </div>

          {/* Quick Refresh */}
          <button
            onClick={() => loadData(selectedTripId)}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-all"
            title="Refresh Ledger"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-[#E2C076]' : ''}`} />
          </button>

          {/* Edit Budget Allocations Button */}
          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#0E1726] border border-[#E2C076]/50 hover:border-[#E2C076] text-[#E2C076] text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Allocate Budget</span>
          </button>

          {/* Record Expense Button */}
          <button
            onClick={openAddExpenseModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] text-xs font-extrabold transition-all shadow-md shadow-[#D4A853]/25 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Top Level Nav Sub-Tabs (Clean names, without numbers) */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-4 mb-8 overflow-x-auto text-left">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'overview'
              ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <PieChart className="h-4 w-4" />
          <span>Budget Overview & Allocations</span>
        </button>

        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'expenses'
              ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Expense Tracking & Ledger</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeSubTab === 'expenses' ? 'bg-[#070B14]/20 text-[#070B14]' : 'bg-white/10 text-neutral-300'}`}>
            {expenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'categories'
              ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Expense Categories & Reports</span>
        </button>
      </div>

      {/* SUB-TAB 7: BUDGET MANAGEMENT & ALLOCATION OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* High Level KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Planned Budget */}
            <div className="bg-[#0E1726]/80 border border-white/10 rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Planned Budget</span>
                <div className="h-8 w-8 rounded-xl bg-[#E2C076]/10 border border-[#E2C076]/30 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-[#E2C076]" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-white">
                ₹{(overview?.totalBudget || budget?.totalBudget || 0).toLocaleString()}
              </div>
              <p className="mt-1 text-[11px] text-neutral-400">
                Allocated across 6 travel verticals
              </p>
            </div>

            {/* Total Spent */}
            <div className="bg-[#0E1726]/80 border border-white/10 rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Total Disbursed</span>
                <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-sky-400" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-extrabold text-white">
                ₹{(overview?.totalSpent || 0).toLocaleString()}
              </div>
              <div className="mt-1 flex items-center space-x-1.5 text-[11px]">
                <span className="text-sky-400 font-bold">
                  {overview?.totalBudget ? Math.round(((overview.totalSpent) / overview.totalBudget) * 100) : 0}%
                </span>
                <span className="text-neutral-400">of total allocated funds</span>
              </div>
            </div>

            {/* Remaining Balance */}
            <div className="bg-[#0E1726]/80 border border-white/10 rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Available Surplus</span>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                  (overview?.remainingBudget || 0) < 0
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                }`}>
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className={`mt-3 text-2xl font-extrabold ${
                (overview?.remainingBudget || 0) < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                ₹{(overview?.remainingBudget || 0).toLocaleString()}
              </div>
              <p className="mt-1 text-[11px] text-neutral-400">
                {(overview?.remainingBudget || 0) < 0 ? 'Over budget by ' + Math.abs(overview?.remainingBudget || 0).toLocaleString() : 'Buffer remaining for extra activities'}
              </p>
            </div>

            {/* Health / Burn Rate Status */}
            <div className="bg-[#0E1726]/80 border border-white/10 rounded-2xl p-5 relative overflow-hidden backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Budget Health</span>
                {overview?.budgetStatus === 'healthy' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : overview?.budgetStatus === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                )}
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  overview?.budgetStatus === 'healthy'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : overview?.budgetStatus === 'warning'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}>
                  {overview?.budgetStatus === 'healthy' ? 'Optimal Pace' : overview?.budgetStatus === 'warning' ? 'Near Limit (85%+)' : 'Budget Deficit'}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-400">
                {overview?.unallocatedBudget ? `₹${overview.unallocatedBudget.toLocaleString()} unassigned reserve` : 'All funds fully earmarked'}
              </p>
            </div>
          </div>

          {/* Category Allocations vs Actual Costs vs Estimated Costs Grid */}
          <div className="bg-[#0E1726]/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Planned Budget vs Actual Spent by Category</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Transportation, Hotel, Food, Shopping, Entertainment, and Miscellaneous budget quotas.
                </p>
              </div>

              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="flex items-center space-x-1.5 text-xs text-[#E2C076] hover:text-white font-semibold transition-colors self-start sm:self-auto"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Adjust Allocations</span>
              </button>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(overview?.categoryBreakdown || []).map((cat) => {
                const Icon = CATEGORY_ICONS[cat.category] || HelpCircle;
                const colors = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.Miscellaneous;

                return (
                  <div
                    key={cat.category}
                    className={`rounded-2xl p-5 border ${colors.border} bg-[#0A101D] hover:border-[#E2C076]/40 transition-all group`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className={`h-8 w-8 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                          <Icon className={`h-4 w-4 ${colors.text}`} />
                        </div>
                        <span className="text-sm font-bold text-white">{cat.category}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        cat.status === 'over'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : cat.status === 'near'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {cat.status === 'over' ? 'Over Budget' : cat.status === 'near' ? 'Near Quota' : 'Healthy'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          cat.percentSpent > 100 ? 'bg-rose-500' : colors.bar
                        }`}
                        style={{ width: `${Math.min(100, cat.percentSpent)}%` }}
                      />
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/[0.06]">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Allocated</span>
                        <p className="text-xs font-bold text-neutral-200 mt-0.5">₹{cat.allocated.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Disbursed</span>
                        <p className={`text-xs font-bold mt-0.5 ${cat.spent > cat.allocated && cat.allocated > 0 ? 'text-rose-400' : 'text-white'}`}>
                          ₹{cat.spent.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">Estimated</span>
                        <p className="text-xs font-bold text-[#E2C076] mt-0.5">₹{cat.estimated.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 8: EXPENSE TRACKING & LISTING UI */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Controls Bar: Search, Category Filter, Sort, Add Button */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#0E1726]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expenses by title, merchant, or notes..."
                className="w-full bg-[#070B14] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#E2C076]"
              />
            </div>

            {/* Filters & Sorting */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-[#070B14] border border-white/10 rounded-xl px-3 py-2 pr-8 text-xs text-neutral-200 focus:outline-none focus:border-[#E2C076] appearance-none"
                >
                  <option value="All">All Categories</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
              </div>

              {/* Sort By */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#070B14] border border-white/10 rounded-xl px-3 py-2 pr-8 text-xs text-neutral-200 focus:outline-none focus:border-[#E2C076] appearance-none"
                >
                  <option value="date-desc">Newest Date First</option>
                  <option value="date-asc">Oldest Date First</option>
                  <option value="amount-desc">Highest Amount</option>
                  <option value="amount-asc">Lowest Amount</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
              </div>

              {/* Export CSV */}
              <button
                onClick={handleExportCsv}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300 hover:text-white text-xs font-semibold hover:bg-white/[0.08] transition-all"
                title="Export Expense Ledger to CSV"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-[#E2C076]" />
                <span>Export CSV</span>
              </button>

              {/* Add Expense Button */}
              <button
                onClick={openAddExpenseModal}
                className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-[#E2C076] hover:bg-[#D4A853] text-[#070B14] text-xs font-bold transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          {/* Deleted Expense Visual Feedback Notice */}
          <AnimatePresence>
            {deletedExpenseNotice && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Trash2 className="h-4 w-4 text-rose-400 flex-shrink-0" />
                  <span>{deletedExpenseNotice}</span>
                </div>
                <button
                  onClick={() => setDeletedExpenseNotice(null)}
                  className="text-rose-400 hover:text-white text-xs px-2 py-1"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expenses Listing Table / Cards */}
          <div className="bg-[#0E1726]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
            {filteredExpenses.length === 0 ? (
              <div className="py-16 text-center">
                <Wallet className="h-12 w-12 text-neutral-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">No expenses recorded yet</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
                  Log your first transportation, hotel, or food expense to track your travel budget automatically.
                </p>
                <button
                  onClick={openAddExpenseModal}
                  className="px-4 py-2 rounded-xl bg-[#E2C076] text-[#070B14] text-xs font-bold hover:bg-[#D4A853] transition-all"
                >
                  Record First Expense
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {filteredExpenses.map((exp) => {
                  const Icon = CATEGORY_ICONS[exp.category] || HelpCircle;
                  const colors = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Miscellaneous;

                  return (
                    <div
                      key={exp.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-start space-x-3.5 min-w-0">
                        <div className={`h-10 w-10 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Icon className={`h-5 w-5 ${colors.text}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-white truncate">{exp.title}</h4>
                            {exp.isShared && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                                Shared Split
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-neutral-400">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-neutral-500" />
                              <span>{exp.date}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Tag className="h-3 w-3 text-neutral-500" />
                              <span className={colors.text}>{exp.category}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <CreditCard className="h-3 w-3 text-neutral-500" />
                              <span>{exp.paymentMethod}</span>
                            </span>
                            {exp.paidByName && (
                              <span className="text-[#E2C076]">Paid by: {exp.paidByName}</span>
                            )}
                          </div>
                          {exp.notes && (
                            <p className="mt-1 text-xs text-neutral-400 line-clamp-1 italic">
                              "{exp.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Amount & Actions */}
                      <div className="flex items-center justify-between sm:justify-end space-x-4 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                        <div className="text-right">
                          <span className="text-base font-extrabold text-white">
                            ₹{exp.amount.toLocaleString()}
                          </span>
                          <span className="block text-[10px] text-neutral-400 uppercase tracking-wider">
                            {exp.currency}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => openEditExpenseModal(exp)}
                            className="p-2 rounded-lg bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                            title="Edit Expense"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setExpenseToDelete(exp)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 9: EXPENSE CATEGORIES & REPORTS UI */}
      {activeSubTab === 'categories' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#0E1726]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Daily Spending Average</span>
              <div className="mt-2 text-3xl font-extrabold text-[#E2C076]">
                ₹{(report?.dailyAverage || 0).toLocaleString()}
                <span className="text-xs font-normal text-neutral-400 ml-1">/ day</span>
              </div>
              <p className="mt-2 text-xs text-neutral-400">
                Calculated across active travel calendar days
              </p>
            </div>

            <div className="bg-[#0E1726]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Projected Trip Total</span>
              <div className="mt-2 text-3xl font-extrabold text-white">
                ₹{(report?.projectedTotal || 0).toLocaleString()}
              </div>
              <p className="mt-2 text-xs text-neutral-400">
                Forecasted total expenditure at current velocity
              </p>
            </div>

            <div className="bg-[#0E1726]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Transactions Processed</span>
              <div className="mt-2 text-3xl font-extrabold text-sky-400">
                {report?.expenseCount || expenses.length}
                <span className="text-xs font-normal text-neutral-400 ml-1">receipts</span>
              </div>
              <p className="mt-2 text-xs text-neutral-400">
                Verified travel expense ledger
              </p>
            </div>
          </div>

          {/* Category-Wise Summaries Breakdown */}
          <div className="bg-[#0E1726]/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              Category-Wise Spending Breakdown & Percentage Share
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Distribution of expenditure across Transportation, Hotel, Food, Shopping, Entertainment, and Miscellaneous.
            </p>

            <div className="space-y-4">
              {(report?.categorySummaries || []).map((cat) => {
                const Icon = CATEGORY_ICONS[cat.category] || HelpCircle;
                const colors = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.Miscellaneous;

                return (
                  <div
                    key={cat.category}
                    className="p-4 rounded-2xl bg-[#0A101D] border border-white/[0.08] hover:border-[#E2C076]/30 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center`}>
                          <Icon className={`h-4 w-4 ${colors.text}`} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white">{cat.category}</span>
                          <span className="ml-2 text-xs text-neutral-400">({cat.count} items)</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-right">
                        <div>
                          <span className="text-xs text-neutral-400">Spent: </span>
                          <span className="text-sm font-extrabold text-white">₹{cat.spent.toLocaleString()}</span>
                        </div>
                        <div className="w-16 text-right">
                          <span className="text-xs font-bold text-[#E2C076]">{cat.percentOfTotalSpent}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Proportional Bar */}
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                        style={{ width: `${Math.min(100, cat.percentOfTotalSpent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top 5 Major Expenses */}
          {report?.topExpenses && report.topExpenses.length > 0 && (
            <div className="bg-[#0E1726]/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
              <h3 className="text-lg font-bold text-white mb-1">
                Highest Single Expenses
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                The top 5 largest financial outlays recorded for this journey.
              </p>

              <div className="divide-y divide-white/[0.06]">
                {report.topExpenses.map((exp, idx) => (
                  <div key={exp.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-extrabold text-[#E2C076] w-4">#{idx + 1}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{exp.title}</p>
                        <p className="text-[10px] text-neutral-400">{exp.category} • {exp.date}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white">
                      ₹{exp.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. BUDGET ALLOCATION MODAL */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {isBudgetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#0E1726] border border-[#E2C076]/30 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-[#E2C076]" />
                    <span>Set Planned Budget & Category Allocations</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Define total available funds and allocate across each travel segment.
                  </p>
                </div>
                <button
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="text-neutral-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveBudget} className="space-y-6">
                {/* Total Planned Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Total Planned Budget (INR ₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      value={budgetFormData.totalBudget}
                      onChange={(e) => setBudgetFormData(prev => ({ ...prev, totalBudget: Number(e.target.value) }))}
                      className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E2C076]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Currency
                    </label>
                    <input
                      type="text"
                      disabled
                      value={budgetFormData.currency}
                      className="w-full bg-[#070B14]/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-neutral-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Category Allocations & Estimated Costs */}
                <div>
                  <h4 className="text-xs font-bold text-[#E2C076] uppercase tracking-wider mb-3">
                    Category Allocations & Estimated Costs (₹)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {EXPENSE_CATEGORIES.map(category => (
                      <div key={category} className="bg-[#070B14] border border-white/10 rounded-2xl p-3.5">
                        <span className="text-xs font-bold text-white block mb-2">{category}</span>
                        <div className="space-y-2">
                          <div>
                            <span className="text-[10px] text-neutral-400 block mb-0.5">Allocated Cap (₹)</span>
                            <input
                              type="number"
                              min={0}
                              value={budgetFormData.allocations[category] || 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setBudgetFormData(prev => ({
                                  ...prev,
                                  allocations: { ...prev.allocations, [category]: val }
                                }));
                              }}
                              className="w-full bg-[#0E1726] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-neutral-400 block mb-0.5">Estimated Cost (₹)</span>
                            <input
                              type="number"
                              min={0}
                              value={budgetFormData.estimatedCosts[category] || 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setBudgetFormData(prev => ({
                                  ...prev,
                                  estimatedCosts: { ...prev.estimatedCosts, [category]: val }
                                }));
                              }}
                              className="w-full bg-[#0E1726] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-[#E2C076]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Budget Strategy Notes
                  </label>
                  <textarea
                    rows={2}
                    value={budgetFormData.notes}
                    onChange={(e) => setBudgetFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="E.g. Includes buffer for VIP dining and private airport transfers..."
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#E2C076]"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsBudgetModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] text-[#070B14] text-xs font-extrabold shadow-md active:scale-95 transition-all"
                  >
                    Save Allocations
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* 8. EXPENSE ADD / EDIT MODAL */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0E1726] border border-[#E2C076]/30 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-[#E2C076]" />
                    <span>{editingExpense ? 'Edit Expense Record' : 'Record New Travel Expense'}</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Records transaction item & updates category reports in real-time.
                  </p>
                </div>
                <button
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="text-neutral-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Expense Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={expenseFormData.title}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="E.g. Traditional Wazwan Dinner at Ahdoos"
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Amount (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      step="any"
                      value={expenseFormData.amount}
                      onChange={(e) => setExpenseFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="E.g. 4800"
                      className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Category *
                    </label>
                    <select
                      value={expenseFormData.category}
                      onChange={(e) => setExpenseFormData(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                      className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                    >
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseFormData.date}
                      onChange={(e) => setExpenseFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Payment Method
                    </label>
                    <select
                      value={expenseFormData.paymentMethod}
                      onChange={(e) => setExpenseFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="UPI">UPI / Digital Wallet</option>
                      <option value="Cash">Cash</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Shared Split Checkbox */}
                <div className="p-3 bg-[#070B14] border border-white/10 rounded-xl flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isSharedExpense"
                    checked={expenseFormData.isShared}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, isShared: e.target.checked }))}
                    className="h-4 w-4 rounded accent-[#E2C076] cursor-pointer"
                  />
                  <label htmlFor="isSharedExpense" className="text-xs text-neutral-200 cursor-pointer">
                    <span className="font-bold text-white">Split with Travel Group</span>
                    <span className="block text-[11px] text-neutral-400">
                      Include in group settlements and automatically divide member contributions.
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Notes / Merchant Details
                  </label>
                  <textarea
                    rows={2}
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="E.g. Invoice #Ahdoos-2026-981..."
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#E2C076]"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] text-[#070B14] text-xs font-extrabold shadow-md active:scale-95 transition-all"
                  >
                    {editingExpense ? 'Update Expense' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE EXPENSE MODAL */}
      <AnimatePresence>
        {expenseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0E1726] border border-rose-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
                <div className="h-10 w-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Expense Record</h3>
                  <p className="text-xs text-neutral-400">Updates category totals immediately</p>
                </div>
              </div>

              <div className="bg-[#070B14] border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Expense Title:</span>
                  <span className="font-bold text-white">{expenseToDelete.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Category:</span>
                  <span className="font-semibold text-amber-400">{expenseToDelete.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Amount:</span>
                  <span className="font-extrabold text-[#E2C076] text-sm">₹{expenseToDelete.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Date Logged:</span>
                  <span className="text-neutral-300">{expenseToDelete.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Payment Method:</span>
                  <span className="text-neutral-300">{expenseToDelete.paymentMethod || 'Credit Card'}</span>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Are you sure you want to permanently delete this expense? This action will remove the record from PostgreSQL (<code className="text-[#E2C076]">tripnest_expenses</code>) and recalculate all remaining budget balances.
              </p>

              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setExpenseToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingExpense}
                  onClick={handleConfirmDeleteExpense}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5 shadow-lg shadow-rose-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isDeletingExpense ? 'Deleting...' : 'Confirm Delete Expense'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
