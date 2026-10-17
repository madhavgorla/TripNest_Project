import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { TravelerAnalyticsData } from '../types';
import { CategoryDonutChart } from './charts/CategoryDonutChart';
import { PlannedVsActualBarChart } from './charts/PlannedVsActualBarChart';
import { TrendsLineChart } from './charts/TrendsLineChart';
import {
  Compass,
  Calendar,
  Wallet,
  Receipt,
  MapPin,
  TrendingUp,
  RefreshCw,
  Plus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  Lock
} from 'lucide-react';

export const TravelerAnalyticsDashboard: React.FC = () => {
  const { userProfile, isAuthenticated, isGuest, setActiveTab, openAuthModal, currency } = useApp();
  const [analytics, setAnalytics] = useState<TravelerAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!isAuthenticated || isGuest || !userProfile?.email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const email = userProfile.email;
      const res = await fetch(`/api/analytics/traveler?userEmail=${encodeURIComponent(email)}`, {
        headers: {
          'x-user-email': email
        }
      });
      const data = await res.json();
      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
      } else {
        throw new Error(data.error || 'Failed to fetch traveler analytics');
      }
    } catch (err: any) {
      console.error('Error fetching traveler analytics:', err);
      setError(err.message || 'Unable to connect to analytics services');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isGuest, userProfile?.email]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const currencySymbol = currency === 'USD' ? '$' : '₹';

  // 1. Guest Mode / Unauthenticated Gate: No analytics for guest mode
  if (!isAuthenticated || isGuest || !userProfile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-[#0B1322]/90 border border-white/10 rounded-3xl p-8 sm:p-12 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-[#E2C076]/10 border border-[#E2C076]/30 flex items-center justify-center mx-auto mb-6 text-[#E2C076]">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Sign In Required for Analytics
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto mb-8 leading-relaxed">
            Personalized traveler analytics, category spending telemetry, and expedition statistics are available exclusively for registered members. Guest mode does not track private analytics.
          </p>

          <button
            onClick={() => openAuthModal('login')}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] font-bold text-sm tracking-wide shadow-lg shadow-[#D4A853]/25 transition-all"
          >
            Sign In to TripNest
          </button>
        </div>
      </div>
    );
  }

  // Skeleton Loading Placeholders
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-8">
        {/* Header Skeleton */}
        <div className="h-24 bg-white/[0.04] rounded-3xl border border-white/5" />

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white/[0.03] rounded-2xl border border-white/5" />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white/[0.03] rounded-2xl border border-white/5" />
          <div className="h-80 bg-white/[0.03] rounded-2xl border border-white/5" />
        </div>
      </div>
    );
  }

  // Friendly Empty State for user with no trips yet
  const hasNoTrips = !analytics || analytics.travelStatistics.totalTrips === 0;

  if (hasNoTrips && !error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-[#0B1322]/80 border border-white/10 rounded-3xl p-8 sm:p-12 backdrop-blur-2xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#E2C076]/10 border border-[#E2C076]/30 flex items-center justify-center mx-auto mb-6 text-[#E2C076]">
            <Compass className="w-8 h-8 animate-spin-slow" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Welcome to Your Luxury Traveler Hub, {userProfile?.name?.split(' ')[0] || 'Explorer'}!
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
            You don't have any trips created yet. Once you plan an itinerary or book a luxury stay, your complete financial telemetry, destination radar, and trip statistics will automatically compute here.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setActiveTab('planner')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] font-bold text-sm tracking-wide shadow-lg shadow-[#D4A853]/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Plan Your First Trip</span>
            </button>
            <button
              onClick={() => setActiveTab('destinations')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all"
            >
              Explore Curated Destinations
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { upcomingTrips, budgetOverview, expenseSummary, travelStatistics, favoriteDestinations, reports } = analytics!;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* 1. Header Banner with Live Timestamp & Refresh */}
      <div className="bg-gradient-to-r from-[#0E1726]/90 via-[#0B1322]/95 to-[#162136]/90 border border-[#E2C076]/20 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E2C076]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 text-xs text-[#E2C076] font-semibold mb-2">
              <Sparkles className="w-4 h-4" />
              <span>TRAVELER INTELLIGENCE & TELEMETRY</span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-400 font-normal">Real-Time Insights</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome Back, {userProfile?.name || 'VIP Explorer'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 max-w-2xl leading-relaxed">
              Consolidated real-time telemetry across your expeditions, planned budgets, and destination favorites.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={fetchAnalytics}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition-all"
              title="Refresh Analytics Telemetry"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#E2C076]" />
              <span>Refresh Telemetry</span>
            </button>

            <button
              onClick={() => setActiveTab('planner')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] text-xs font-bold transition-all shadow-md shadow-[#D4A853]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Expedition</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Travel Statistics Cards (Reusable Metrics Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Trips */}
        <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Trips</span>
            <Compass className="w-4 h-4 text-[#E2C076]" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white">
            {travelStatistics.totalTrips}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {travelStatistics.completedTripsCount} completed
          </div>
        </div>

        {/* Upcoming Trips */}
        <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Upcoming</span>
            <Calendar className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white">
            {travelStatistics.upcomingTripsCount}
          </div>
          <div className="text-[11px] text-sky-400 font-medium mt-1">
            Active itinerary
          </div>
        </div>

        {/* Total Budget */}
        <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Budget</span>
            <Wallet className="w-4 h-4 text-[#D4A853]" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white">
            {currencySymbol}{(budgetOverview.totalBudget / 1000).toFixed(0)}k
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Across all trips
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Spent</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white">
            {currencySymbol}{(budgetOverview.totalSpent / 1000).toFixed(0)}k
          </div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">
            {budgetOverview.spentPercentage}% of budget
          </div>
        </div>

        {/* Days Traveled */}
        <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Days Traveled</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white">
            {travelStatistics.totalDaysTraveled}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Expedition days
          </div>
        </div>

        {/* Top Destination */}
        <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Top Spot</span>
            <MapPin className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-base sm:text-lg font-bold text-white truncate" title={favoriteDestinations[0]?.destination || 'Kashmir'}>
            {favoriteDestinations[0]?.destination || 'Kashmir'}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {favoriteDestinations[0]?.visitCount || 1} visits logged
          </div>
        </div>
      </div>

      {/* 3. Upcoming Trips Short List & Quick Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Trips Card (7 cols) */}
        <div className="lg:col-span-7 bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Upcoming Expeditions</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Your confirmed future itinerary journeys</p>
            </div>
            <button
              onClick={() => setActiveTab('mytrips')}
              className="text-xs font-semibold text-[#E2C076] hover:text-white flex items-center space-x-1 transition-colors"
            >
              <span>View All Trips</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingTrips.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-xs">
              No upcoming trips scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTrips.slice(0, 3).map((trip) => (
                <div
                  key={trip.id}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-[#E2C076]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={trip.coverImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80'}
                      alt={trip.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10 group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#E2C076] transition-colors">
                        {trip.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-[11px] text-neutral-400 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-[#E2C076]" />
                          <span>{trip.destination}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{trip.startDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>{trip.daysCount || 4} Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-neutral-500 font-medium block">Budget</span>
                      <span className="text-xs font-bold text-white">
                        {currencySymbol}{trip.budgetAmount.toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab('mytrips')}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#E2C076] hover:text-[#070B14] text-xs font-semibold text-neutral-300 transition-all"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget Overview Gauge & Expense Summary (5 cols) */}
        <div className="lg:col-span-5 bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Budget Telemetry</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Financial adherence across itineraries</p>
              </div>
              <span className="text-xs font-mono text-[#E2C076] font-semibold">
                {budgetOverview.spentPercentage}% Utilized
              </span>
            </div>

            {/* Visual Budget Progress Bar */}
            <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/10 mb-4 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  budgetOverview.spentPercentage > 90
                    ? 'bg-rose-500'
                    : budgetOverview.spentPercentage > 75
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-[#D4A853] to-sky-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(2, budgetOverview.spentPercentage))}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] text-neutral-400 block uppercase font-medium">Spent to Date</span>
                <span className="text-base font-bold text-white">
                  {currencySymbol}{budgetOverview.totalSpent.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] text-neutral-400 block uppercase font-medium">Remaining Surplus</span>
                <span className="text-base font-bold text-emerald-400">
                  {currencySymbol}{budgetOverview.remainingBudget.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Expense Snapshot */}
          <div className="pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-neutral-400">Top Spend Category:</span>
              <span className="font-semibold text-white">{expenseSummary.topCategory}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Average Expense:</span>
              <span className="font-semibold text-[#E2C076]">
                {currencySymbol}{expenseSummary.averageExpenseAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Task 3 Reports & Charts Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Interactive Financial & Activity Charts</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live financial telemetry and expenditure distributions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category-Wise Donut Chart */}
          <CategoryDonutChart
            data={reports.categoryExpenses}
            currency={currency}
            title="Category-Wise Expense Breakdown"
          />

          {/* Planned vs Actual Bar Chart */}
          <PlannedVsActualBarChart
            data={reports.plannedVsActual}
            currency={currency}
            title="Planned Budget vs. Actual Spending (By Category)"
          />
        </div>

        {/* Timeline Trends Line Chart */}
        <TrendsLineChart
          spendingTrends={reports.spendingTrends}
          tripActivityTrends={reports.tripActivityTrends}
          currency={currency}
          title="Expenditure & Trip Activity Trajectory Over Time"
        />
      </div>

      {/* 5. Favorite Destinations & Recent Expenses Snippet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Most Visited / Favorite Destinations (6 cols) */}
        <div className="lg:col-span-6 bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Most Visited Destinations</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Your most frequented luxury territories</p>
            </div>
            <MapPin className="w-4 h-4 text-[#E2C076]" />
          </div>

          <div className="space-y-2.5">
            {favoriteDestinations.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">No destination visits recorded yet.</p>
            ) : (
              favoriteDestinations.slice(0, 4).map((fav, i) => (
                <div
                  key={fav.destination}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-[#E2C076]/10 text-[#E2C076] font-bold text-[11px] flex items-center justify-center">
                      #{i + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-white block">{fav.destination}</span>
                      <span className="text-[11px] text-neutral-400">{fav.visitCount} expeditions</span>
                    </div>
                  </div>
                  {fav.totalSpent ? (
                    <span className="font-semibold text-[#E2C076]">
                      {currencySymbol}{fav.totalSpent.toLocaleString()}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Expenses List (6 cols) */}
        <div className="lg:col-span-6 bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Recent Expenses Ledger</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Last recorded transactions</p>
            </div>
            <button
              onClick={() => setActiveTab('budget-expenses')}
              className="text-xs font-semibold text-[#E2C076] hover:text-white flex items-center space-x-1 transition-colors"
            >
              <span>Manage Expenses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {expenseSummary.recentExpenses.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">No recent expenses logged.</p>
            ) : (
              expenseSummary.recentExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <Receipt className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-white block truncate max-w-[200px] sm:max-w-xs">{exp.title}</span>
                      <div className="flex items-center space-x-1.5 text-[11px] text-neutral-500">
                        <span>{exp.category}</span>
                        <span>·</span>
                        <span>{exp.date}</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-white shrink-0">
                    {currencySymbol}{exp.amount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
