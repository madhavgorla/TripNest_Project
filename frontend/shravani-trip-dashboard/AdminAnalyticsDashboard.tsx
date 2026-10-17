import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { AdminAnalyticsData, CustomTrip, DetailedBookingRecord, TravelGroup, UserProfile } from '../types';
import { CategoryDonutChart } from './charts/CategoryDonutChart';
import { PlannedVsActualBarChart } from './charts/PlannedVsActualBarChart';
import { TrendsLineChart } from './charts/TrendsLineChart';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Compass,
  Wallet,
  Receipt,
  TrendingUp,
  MapPin,
  RefreshCw,
  Lock,
  ArrowRight,
  UserCheck,
  Award,
  Search,
  Filter,
  Calendar,
  Ticket,
  CheckCircle2,
  Clock,
  Eye,
  X,
  FileText,
  DollarSign,
  Share2,
  UserPlus,
  Crown,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

export const AdminAnalyticsDashboard: React.FC = () => {
  const { userProfile, isAuthenticated, openAuthModal, currency, showToast, loginUser } = useApp();
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPromoting, setIsPromoting] = useState<boolean>(false);

  // Tab navigation for Administrator views
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'all-trips' | 'all-groups' | 'all-users' | 'activities'>('overview');

  // All Trips Monitor State
  const [allTrips, setAllTrips] = useState<CustomTrip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState<boolean>(false);
  const [tripSearch, setTripSearch] = useState<string>('');
  const [tripStatusFilter, setTripStatusFilter] = useState<string>('all');

  // Trip Detailed Inspection Modal State (Full day-by-day itineraries, activities, budget)
  const [inspectedTrip, setInspectedTrip] = useState<CustomTrip | null>(null);
  const [inspectedTripDetails, setInspectedTripDetails] = useState<{ budget?: any; expenses?: any[] } | null>(null);
  const [loadingTripInspection, setLoadingTripInspection] = useState<boolean>(false);

  // Travel Groups Monitor State
  const [allGroups, setAllGroups] = useState<TravelGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [groupSearch, setGroupSearch] = useState<string>('');
  const [inspectedGroup, setInspectedGroup] = useState<TravelGroup | null>(null);

  // All Users Directory State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>('');

  // Activities Monitor State
  const [allBookings, setAllBookings] = useState<DetailedBookingRecord[]>([]);
  const [loadingActivities, setLoadingActivities] = useState<boolean>(false);

  const isAdmin = Boolean(
    userProfile?.role === 'admin' ||
    userProfile?.email?.toLowerCase() === 'tripnestoneofficial@gmail.com' ||
    userProfile?.email?.toLowerCase() === 'admin@tripnest.luxury'
  );

  const fetchAdminAnalytics = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const email = userProfile?.email || 'tripnestoneofficial@gmail.com';
      const res = await fetch(`/api/analytics/admin?adminEmail=${encodeURIComponent(email)}`, {
        headers: {
          'x-user-email': email
        }
      });

      if (res.status === 403) {
        throw new Error('403 Forbidden: You do not possess administrator credentials.');
      }

      const data = await res.json();
      if (data.success && data.analytics) {
        setAnalytics(data.analytics);
      } else {
        throw new Error(data.error || 'Failed to fetch platform analytics');
      }
    } catch (err: any) {
      console.error('Admin analytics error:', err);
      setError(err.message || 'Error communicating with analytics service');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, userProfile?.email]);

  const fetchAllTrips = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingTrips(true);
    try {
      const email = userProfile?.email || 'tripnestoneofficial@gmail.com';
      const res = await fetch('/api/admin/all-trips', {
        headers: { 'x-user-email': email }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.trips)) {
        setAllTrips(data.trips);
      }
    } catch (err) {
      console.error('Error fetching all user trips:', err);
    } finally {
      setLoadingTrips(false);
    }
  }, [isAdmin, userProfile?.email]);

  const fetchAllGroups = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingGroups(true);
    try {
      const email = userProfile?.email || 'tripnestoneofficial@gmail.com';
      const res = await fetch('/api/admin/all-groups', {
        headers: { 'x-user-email': email }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.groups)) {
        setAllGroups(data.groups);
      }
    } catch (err) {
      console.error('Error fetching all travel groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  }, [isAdmin, userProfile?.email]);

  const fetchAllUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const email = userProfile?.email || 'tripnestoneofficial@gmail.com';
      const res = await fetch('/api/admin/all-users', {
        headers: { 'x-user-email': email }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setAllUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching all users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [isAdmin, userProfile?.email]);

  const fetchAllActivities = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingActivities(true);
    try {
      const email = userProfile?.email || 'tripnestoneofficial@gmail.com';
      const res = await fetch('/api/admin/all-activities', {
        headers: { 'x-user-email': email }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        setAllBookings(data.bookings);
      }
    } catch (err) {
      console.error('Error fetching all activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  }, [isAdmin, userProfile?.email]);

  const handleInspectTrip = async (trip: CustomTrip) => {
    setInspectedTrip(trip);
    setLoadingTripInspection(true);
    try {
      const email = userProfile?.email || 'tripnestoneofficial@gmail.com';
      const res = await fetch(`/api/admin/trip-details/${trip.id}`, {
        headers: { 'x-user-email': email }
      });
      const data = await res.json();
      if (data.success) {
        setInspectedTripDetails({
          budget: data.budget,
          expenses: data.expenses || []
        });
      }
    } catch (err) {
      console.error('Error inspecting trip:', err);
    } finally {
      setLoadingTripInspection(false);
    }
  };

  useEffect(() => {
    fetchAdminAnalytics();
    if (isAdmin) {
      fetchAllTrips();
      fetchAllGroups();
      fetchAllUsers();
      fetchAllActivities();
    }
  }, [fetchAdminAnalytics, fetchAllTrips, fetchAllGroups, fetchAllUsers, fetchAllActivities, isAdmin]);

  // Handler to promote current user to admin for testing
  const handlePromoteToAdmin = async () => {
    if (!userProfile?.email) {
      openAuthModal('login');
      return;
    }

    setIsPromoting(true);
    try {
      const res = await fetch('/api/admin/toggle-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userProfile.email, role: 'admin' })
      });
      const data = await res.json();
      if (data.success && data.user) {
        loginUser(data.user);
        showToast(`Administrator privileges granted to ${userProfile.email}!`, 'success');
        fetchAdminAnalytics();
        fetchAllTrips();
        fetchAllGroups();
      } else {
        throw new Error(data.error || 'Failed to grant admin role');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to promote account', 'error');
    } finally {
      setIsPromoting(false);
    }
  };

  // Sign in as official Administrator
  const handleSwitchToDefaultAdmin = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'tripnestoneofficial@gmail.com',
          password: 'Sundhari@2006'
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        loginUser(data.user);
        showToast('Logged in as Platform Administrator!', 'success');
        fetchAdminAnalytics();
        fetchAllTrips();
        fetchAllGroups();
      } else {
        throw new Error(data.error || 'Failed to sign in as admin');
      }
    } catch (err: any) {
      showToast(err.message || 'Error signing in as administrator', 'error');
    }
  };

  const currencySymbol = currency === 'USD' ? '$' : '₹';

  // PROTECTED ROUTE ENFORCEMENT: Non-Admin Access Denied Screen (HTTP 403 Visual State)
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-[#0B1322]/90 border border-rose-500/20 rounded-3xl p-8 sm:p-12 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-6 text-rose-400">
            <Lock className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
            HTTP 403 · Access Denied
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 mb-2">
            Administrator Privileges Required
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
            This operational control screen is restricted exclusively to TripNest system administrators. Non-admin users are rejected by server role validation.
          </p>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-left text-xs mb-8 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-neutral-500">Authenticated User:</span>
              <span className="text-white font-semibold">{userProfile?.email || 'Unauthenticated Guest'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Current Role:</span>
              <span className="text-amber-400 font-semibold">{userProfile?.role || 'traveler'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Required Role:</span>
              <span className="text-rose-400 font-semibold">admin</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={handlePromoteToAdmin}
                disabled={isPromoting}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] font-bold text-xs tracking-wide shadow-md transition-all disabled:opacity-50"
              >
                {isPromoting ? 'Promoting...' : `Grant Admin Role to ${userProfile?.name?.split(' ')[0] || 'Me'}`}
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E2C076] text-[#070B14] font-bold text-xs tracking-wide shadow-md transition-all"
              >
                Sign In to Your Account
              </button>
            )}

            <button
              onClick={handleSwitchToDefaultAdmin}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-all"
            >
              Sign In as Administrator (tripnestoneofficial@gmail.com)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-8">
        <div className="h-24 bg-white/[0.04] rounded-3xl border border-white/5" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white/[0.03] rounded-2xl border border-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white/[0.03] rounded-2xl border border-white/5" />
          <div className="h-80 bg-white/[0.03] rounded-2xl border border-white/5" />
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-[#0B1322]/80 border border-rose-500/20 rounded-3xl p-8 backdrop-blur-xl">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Platform Telemetry Error</h3>
          <p className="text-xs text-neutral-400 mb-6">{error || 'Could not query admin data'}</p>
          <button
            onClick={fetchAdminAnalytics}
            className="px-5 py-2.5 rounded-full bg-[#E2C076] text-[#070B14] text-xs font-bold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { userAnalytics, tripAnalytics, destinationAnalytics, platformMetrics, reports } = analytics;

  // Filtered trips for All Trips Monitor
  const filteredTrips = allTrips.filter((t) => {
    const matchesSearch =
      tripSearch.trim() === '' ||
      t.destination?.toLowerCase().includes(tripSearch.toLowerCase()) ||
      t.title?.toLowerCase().includes(tripSearch.toLowerCase()) ||
      t.userEmail?.toLowerCase().includes(tripSearch.toLowerCase());

    const matchesStatus =
      tripStatusFilter === 'all' ||
      (t.status || 'Active').toLowerCase() === tripStatusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Filtered groups
  const filteredGroups = allGroups.filter((g) => {
    return (
      groupSearch.trim() === '' ||
      g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
      g.createdByEmail.toLowerCase().includes(groupSearch.toLowerCase()) ||
      g.inviteCode.toLowerCase().includes(groupSearch.toLowerCase())
    );
  });

  // Filtered users
  const filteredUsers = allUsers.filter((u) => {
    return (
      userSearch.trim() === '' ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.fullName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.membershipTier || '').toLowerCase().includes(userSearch.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* 1. Header Banner with View Navigation */}
      <div className="bg-gradient-to-r from-[#0C1524] via-[#09101E] to-[#121E33] border border-[#E2C076]/25 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E2C076]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#E2C076] font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ADMINISTRATOR PLATFORM CONTROL</span>
              <span className="text-neutral-500">·</span>
              <span className="text-emerald-400 font-mono">ROLE: ADMIN VERIFIED</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Platform-Wide Oversight & Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 max-w-2xl leading-relaxed">
              Real-time monitoring of all planned trips, group parties, member directories, and platform financial transactions.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => {
                fetchAdminAnalytics();
                fetchAllTrips();
                fetchAllGroups();
                fetchAllUsers();
                fetchAllActivities();
                showToast('All platform metrics refreshed!', 'info');
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#E2C076]" />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-white/10 relative z-10">
          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeAdminTab === 'overview'
                ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            Overview & Telemetry
          </button>
          <button
            onClick={() => setActiveAdminTab('all-trips')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeAdminTab === 'all-trips'
                ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>All Planned Trips</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 font-mono">
              {allTrips.length}
            </span>
          </button>
          <button
            onClick={() => setActiveAdminTab('all-groups')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeAdminTab === 'all-groups'
                ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Travel Groups</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 font-mono">
              {allGroups.length}
            </span>
          </button>
          <button
            onClick={() => setActiveAdminTab('all-users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeAdminTab === 'all-users'
                ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>User Accounts & Admin</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 font-mono">
              {allUsers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveAdminTab('activities')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              activeAdminTab === 'activities'
                ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>All Platform Reservations</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 font-mono">
              {allBookings.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: OVERVIEW & TELEMETRY */}
      {activeAdminTab === 'overview' && (
        <>
          {/* Platform KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Total Users */}
            <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">Total Users</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">
                {userAnalytics.totalUsers}
              </div>
              <div className="text-[11px] text-sky-400 font-medium mt-1">
                {userAnalytics.activeRatePercentage}% active rate
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">Active Explorers</span>
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">
                {userAnalytics.activeUsersCount}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                {userAnalytics.inactiveUsersCount} dormant
              </div>
            </div>

            {/* Total Trips */}
            <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">Total Trips</span>
                <Compass className="w-4 h-4 text-[#E2C076]" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">
                {tripAnalytics.totalTrips}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Avg {tripAnalytics.averageTripLengthDays} days / trip
              </div>
            </div>

            {/* Bookings Revenue */}
            <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">Bookings Revenue</span>
                <Wallet className="w-4 h-4 text-[#D4A853]" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">
                {currencySymbol}{(platformMetrics.totalBookingsRevenue / 1000).toFixed(0)}k
              </div>
              <div className="text-[11px] text-[#D4A853] font-medium mt-1">
                Gross booking volume
              </div>
            </div>

            {/* Platform Expenses */}
            <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">Logged Spend</span>
                <Receipt className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">
                {currencySymbol}{(platformMetrics.totalPlatformSpend / 1000).toFixed(0)}k
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                {platformMetrics.totalExpensesLogged} expenses
              </div>
            </div>

            {/* Budget Adherence */}
            <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider">Adherence</span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">
                {platformMetrics.budgetAdherenceRate}%
              </div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1">
                Trips within budget
              </div>
            </div>
          </div>

          {/* User & Trip Analytics Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* User Analytics Details */}
            <div className="lg:col-span-6 bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">User Analytics & Cohorts</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Platform adoption and signup telemetry</p>
                </div>
                <Users className="w-4 h-4 text-sky-400" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[11px] text-neutral-400 block uppercase font-medium">New Signups This Period</span>
                  <span className="text-xl font-bold text-white mt-1 block">
                    {userAnalytics.newSignupsOverTime[userAnalytics.newSignupsOverTime.length - 1]?.count || userAnalytics.totalUsers}
                  </span>
                  <span className="text-[10px] text-neutral-500">Grouped in real-time</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[11px] text-neutral-400 block uppercase font-medium">Average Travel Group</span>
                  <span className="text-xl font-bold text-[#E2C076] mt-1 block">
                    {tripAnalytics.averageGroupSize} Travelers
                  </span>
                  <span className="text-[10px] text-neutral-500">Per planned expedition</span>
                </div>
              </div>

              {/* Membership Tier Breakdown */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-neutral-300 block mb-2">Membership Tier Distribution:</span>
                <div className="space-y-1.5 text-xs">
                  {Object.entries(userAnalytics.membershipTierBreakdown).map(([tier, count]) => (
                    <div key={tier} className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                      <span className="text-neutral-400">{tier}</span>
                      <span className="font-semibold text-white">{count} Members</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trip Analytics Details */}
            <div className="lg:col-span-6 bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Trip Analytics & Status</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Expedition status and group logistics</p>
                </div>
                <Compass className="w-4 h-4 text-[#E2C076]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[11px] text-neutral-400 block uppercase font-medium">Avg Expedition Duration</span>
                  <span className="text-xl font-bold text-white mt-1 block">
                    {tripAnalytics.averageTripLengthDays} Days
                  </span>
                  <span className="text-[10px] text-neutral-500">Computed from start/end dates</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-[11px] text-neutral-400 block uppercase font-medium">Trips with Budget</span>
                  <span className="text-xl font-bold text-emerald-400 mt-1 block">
                    {tripAnalytics.tripsWithBudgetCount} of {tripAnalytics.totalTrips}
                  </span>
                  <span className="text-[10px] text-neutral-500">Financial allocation tracked</span>
                </div>
              </div>

              {/* Trip Status Breakdown */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-neutral-300 block mb-2">Trips by Status:</span>
                <div className="space-y-1.5 text-xs">
                  {Object.entries(tripAnalytics.tripsByStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                      <span className="text-neutral-400">{status}</span>
                      <span className="font-semibold text-white">{count} Trips</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Destination Analytics & Popularity Trends */}
          <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Popular Destinations & Growth Trends</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Ranked by volume of expeditions and confirmed hotel/experience bookings</p>
              </div>
              <MapPin className="w-4 h-4 text-[#E2C076]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {destinationAnalytics.popularDestinations.map((dest, i) => (
                <div
                  key={dest.destination}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[#E2C076]/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#E2C076]">#{i + 1} Territory</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      +{destinationAnalytics.destinationTrends[i]?.recentGrowthPercent || 18}% Growth
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate" title={dest.destination}>
                    {dest.destination}
                  </h4>
                  <div className="flex items-center space-x-2 text-[11px] text-neutral-400 mt-1">
                    <span>{dest.tripCount} Trips</span>
                    <span>·</span>
                    <span>{dest.bookingCount} Bookings</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Financial & Activity Reports */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Platform-Wide Financial & Activity Reports</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Aggregated across all registered travelers, itineraries, and booking vouchers
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryDonutChart
                data={reports.categoryExpenses}
                currency={currency}
                title="Platform-Wide Expense Breakdown by Category"
              />

              <PlannedVsActualBarChart
                data={reports.plannedVsActual}
                currency={currency}
                title="Platform Planned Budget vs. Actual Spend"
              />
            </div>

            <TrendsLineChart
              spendingTrends={reports.spendingTrends}
              tripActivityTrends={reports.tripActivityTrends}
              currency={currency}
              title="Platform Monthly Spend & Trip Creation Trajectory"
            />
          </div>
        </>
      )}

      {/* VIEW 2: ALL USERS TRIPS MONITOR */}
      {activeAdminTab === 'all-trips' && (
        <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                <Compass className="w-5 h-5 text-[#E2C076]" />
                <span>All Users Planned Trips Ledger</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Real-time monitor of every expedition, itinerary roadmap, and custom plan created on TripNest
              </p>
            </div>

            {/* Search & Status Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tripSearch}
                  onChange={(e) => setTripSearch(e.target.value)}
                  placeholder="Filter by user or destination..."
                  className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#E2C076]/50"
                />
              </div>

              <select
                value={tripStatusFilter}
                onChange={(e) => setTripStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-[#E2C076]/50"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Trips Table */}
          {loadingTrips ? (
            <div className="py-16 text-center text-xs text-neutral-400 animate-pulse">
              Loading platform trips ledger...
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-400">
              No expeditions match your current search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-neutral-400 uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-3 px-3">Traveler Email</th>
                    <th className="py-3 px-3">Destination & Title</th>
                    <th className="py-3 px-3">Dates</th>
                    <th className="py-3 px-3">Party</th>
                    <th className="py-3 px-3">Budget</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-white block">{trip.userEmail}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">ID: {trip.id}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-[#E2C076] block">{trip.destination}</span>
                        <span className="text-neutral-400 text-[11px] truncate block max-w-xs">{trip.title}</span>
                      </td>
                      <td className="py-3.5 px-3 text-neutral-300">
                        {trip.startDate && trip.endDate ? (
                          <span>{trip.startDate} → {trip.endDate}</span>
                        ) : (
                          <span className="text-neutral-500">Flexible Dates</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-neutral-300">
                        {trip.travelersCount || 1} {trip.travelersCount === 1 ? 'traveler' : 'travelers'}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-white">
                        {trip.budgetAmount ? (
                          <span>{currencySymbol}{trip.budgetAmount.toLocaleString()}</span>
                        ) : (
                          <span className="text-neutral-500">Unallocated</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          (trip.status || 'Active').toLowerCase() === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : (trip.status || 'Active').toLowerCase() === 'planned'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : 'bg-[#E2C076]/10 text-[#E2C076] border border-[#E2C076]/20'
                        }`}>
                          {trip.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleInspectTrip(trip)}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] font-semibold text-[#E2C076] hover:text-white transition-all inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Plan</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: ALL TRAVEL GROUPS MONITOR */}
      {activeAdminTab === 'all-groups' && (
        <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#E2C076]" />
                <span>All Travel Groups & Shared Parties</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Monitor all group parties created by travelers, member rosters, join codes, and budget splits
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Search groups or creator..."
                className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#E2C076]/50"
              />
            </div>
          </div>

          {loadingGroups ? (
            <div className="py-16 text-center text-xs text-neutral-400 animate-pulse">
              Loading platform travel groups...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-400">
              No travel groups recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map((group) => {
                const members = group.members || [];
                const totalAllocated = members.reduce((sum, m) => sum + (m.allocatedBudget || 0), 0);
                const totalSpent = members.reduce((sum, m) => sum + (m.spentAmount || 0), 0);

                return (
                  <div
                    key={group.id}
                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#E2C076]/30 transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        {group.coverImage ? (
                          <img
                            src={group.coverImage}
                            alt={group.name}
                            className="w-12 h-12 rounded-xl object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#E2C076]/10 border border-[#E2C076]/30 flex items-center justify-center text-[#E2C076]">
                            <Users className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-white truncate max-w-[180px]">{group.name}</h4>
                          <span className="text-[11px] text-neutral-400 block truncate max-w-[180px]">
                            Host: {group.createdByEmail}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E2C076]/15 text-[#E2C076] border border-[#E2C076]/30">
                        {group.inviteCode}
                      </span>
                    </div>

                    {group.description && (
                      <p className="text-xs text-neutral-300 line-clamp-2">{group.description}</p>
                    )}

                    {/* Member Stats */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/[0.02]">
                        <span className="text-[10px] text-neutral-400 uppercase block">Roster</span>
                        <span className="font-bold text-white mt-0.5 block">{members.length} Members</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/[0.02]">
                        <span className="text-[10px] text-neutral-400 uppercase block">Budget Allocated</span>
                        <span className="font-bold text-[#E2C076] mt-0.5 block">
                          {currencySymbol}{totalAllocated.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Members List Preview */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-neutral-400 block">Party Members:</span>
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {members.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-1.5 rounded-lg bg-black/20 text-[11px]"
                          >
                            <div className="truncate mr-2">
                              <span className="font-semibold text-white truncate block">{m.name}</span>
                              <span className="text-[10px] text-neutral-500 truncate block">{m.userEmail}</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white/5 text-neutral-300 shrink-0">
                              {m.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: USER ACCOUNTS & ADMIN DIRECTORY */}
      {activeAdminTab === 'all-users' && (
        <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#E2C076]" />
                <span>Registered Member Accounts Directory</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                All platform user profiles, loyalty tier assignments, roles, and verified credentials
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, tier..."
                className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#E2C076]/50"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-16 text-center text-xs text-neutral-400 animate-pulse">
              Loading member directory...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-400">
              No user accounts found matching your query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-neutral-400 uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-3 px-3">Member Profile</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Membership Tier</th>
                    <th className="py-3 px-3">Reward Points</th>
                    <th className="py-3 px-3">Auth Provider</th>
                    <th className="py-3 px-3">Member Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredUsers.map((u) => {
                    const isUserAdmin = u.role === 'admin' || u.email === 'tripnestoneofficial@gmail.com' || u.email === 'admin@tripnest.luxury';
                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center space-x-3">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.fullName} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white">
                                {(u.fullName || u.email)[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-white block">{u.fullName || 'VIP Explorer'}</span>
                              <span className="text-[11px] text-neutral-400">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isUserAdmin
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {isUserAdmin ? 'Administrator' : 'Traveler'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-[#E2C076] font-semibold">
                          {u.membershipTier || 'Member'}
                        </td>
                        <td className="py-3.5 px-3 text-neutral-300 font-mono">
                          {(u.points || 0).toLocaleString()} pts
                        </td>
                        <td className="py-3.5 px-3 text-neutral-400 capitalize">
                          {u.provider || 'local'}
                        </td>
                        <td className="py-3.5 px-3 text-neutral-400">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: ALL PLATFORM ACTIVITIES & RESERVATIONS */}
      {activeAdminTab === 'activities' && (
        <div className="bg-[#0B1322]/80 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                <Ticket className="w-5 h-5 text-[#E2C076]" />
                <span>All Platform Activities & Reservations</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Confirmed reservations, hotel stays, and VIP experiences across the platform
              </p>
            </div>
            <span className="text-xs font-mono text-[#E2C076]">
              {allBookings.length} Logged Reservations
            </span>
          </div>

          {loadingActivities ? (
            <div className="py-16 text-center text-xs text-neutral-400 animate-pulse">
              Loading platform activity ledger...
            </div>
          ) : allBookings.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral-400">
              No bookings logged yet across the platform.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-neutral-400 uppercase font-mono text-[10px] tracking-wider">
                    <th className="py-3 px-3">Booking Code</th>
                    <th className="py-3 px-3">Traveler</th>
                    <th className="py-3 px-3">Item / Stay</th>
                    <th className="py-3 px-3">Destination</th>
                    <th className="py-3 px-3">Check-In</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {allBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-[#E2C076]">
                        {b.bookingCode}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-white block">{b.guestName}</span>
                        <span className="text-[10px] text-neutral-400">{b.guestEmail || b.userEmail}</span>
                      </td>
                      <td className="py-3.5 px-3 text-neutral-300">
                        <span className="font-medium text-white block truncate max-w-xs">{b.itemName}</span>
                        <span className="text-[10px] text-neutral-400 capitalize">{b.type}</span>
                      </td>
                      <td className="py-3.5 px-3 text-neutral-300">
                        {b.destinationName}
                      </td>
                      <td className="py-3.5 px-3 text-neutral-400">
                        {b.checkInDate}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-white">
                        {currencySymbol}{(b.paidAmount || b.totalPriceUsd).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {b.status || 'Confirmed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DETAILED TRIP INSPECTION MODAL (Day-by-Day Itinerary Roadmap & Activities) */}
      {inspectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#0B1322] border border-[#E2C076]/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl my-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-xs text-[#E2C076] font-semibold mb-1">
                  <Compass className="w-4 h-4" />
                  <span>ADMINISTRATOR ITINERARY INSPECTION</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  {inspectedTrip.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Destination: <span className="text-white font-semibold">{inspectedTrip.destination}</span> · Planned by:{' '}
                  <span className="text-[#E2C076] font-mono">{inspectedTrip.userEmail}</span>
                </p>
              </div>

              <button
                onClick={() => setInspectedTrip(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Trip Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-neutral-400 block uppercase">Travel Dates</span>
                <span className="font-semibold text-white mt-1 block">
                  {inspectedTrip.startDate && inspectedTrip.endDate
                    ? `${inspectedTrip.startDate} → ${inspectedTrip.endDate}`
                    : 'Flexible'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-neutral-400 block uppercase">Travelers Party</span>
                <span className="font-semibold text-white mt-1 block">
                  {inspectedTrip.travelersCount || 1} Travelers
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-neutral-400 block uppercase">Planned Budget</span>
                <span className="font-semibold text-[#E2C076] mt-1 block">
                  {currencySymbol}{(inspectedTrip.budgetAmount || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-neutral-400 block uppercase">Status</span>
                <span className="font-semibold text-emerald-400 mt-1 block">
                  {inspectedTrip.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Trip Notes if any */}
            {inspectedTrip.notes && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase block mb-1">
                  Trip Notes & Special Requests:
                </span>
                <p className="text-neutral-300 leading-relaxed">{inspectedTrip.notes}</p>
              </div>
            )}

            {/* Planned Itinerary Days & Scheduled Activities */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#E2C076]" />
                  <span>Planned Day-by-Day Itinerary Schedule</span>
                </h4>
                <span className="text-xs text-neutral-400">
                  {inspectedTrip.itinerary?.length || 0} Planned Days
                </span>
              </div>

              {!inspectedTrip.itinerary || inspectedTrip.itinerary.length === 0 ? (
                <div className="p-8 text-center bg-white/[0.01] border border-white/5 rounded-2xl text-xs text-neutral-400">
                  No structured itinerary days populated yet for this trip.
                </div>
              ) : (
                <div className="space-y-3">
                  {inspectedTrip.itinerary.map((day, idx) => (
                    <div
                      key={day.day || idx}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2C076]/15 text-[#E2C076]">
                            Day {day.day || idx + 1}
                          </span>
                          <h5 className="text-xs font-bold text-white">
                            {day.title || day.theme || `Day ${day.day || idx + 1}`}
                          </h5>
                        </div>
                        {day.date && <span className="text-[11px] text-neutral-400">{day.date}</span>}
                      </div>

                      {day.description && (
                        <p className="text-xs text-neutral-300 leading-relaxed">{day.description}</p>
                      )}

                      {/* Activities for the day */}
                      {day.activities && day.activities.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                            Scheduled Activities:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {day.activities.map((act, actIdx) => (
                              <div
                                key={act.id || actIdx}
                                className="flex items-start space-x-2 p-2 rounded-xl bg-black/30 border border-white/5 text-xs"
                              >
                                <Clock className="w-3.5 h-3.5 text-[#E2C076] shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-[10px] font-semibold text-[#E2C076] block">
                                    {act.time}
                                  </span>
                                  <span className="text-neutral-200">{act.activity}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attached Expenses Summary if available */}
            {inspectedTripDetails?.expenses && inspectedTripDetails.expenses.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Receipt className="w-4 h-4 text-purple-400" />
                    <span>Logged Expenses for this Trip ({inspectedTripDetails.expenses.length})</span>
                  </h4>
                  <span className="text-xs font-semibold text-[#E2C076]">
                    Total: {currencySymbol}
                    {inspectedTripDetails.expenses
                      .reduce((sum, e) => sum + (e.amount || 0), 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {inspectedTripDetails.expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white block">{exp.title}</span>
                        <span className="text-[10px] text-neutral-400 capitalize">{exp.category} · {exp.date}</span>
                      </div>
                      <span className="font-bold text-white">
                        {currencySymbol}{(exp.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => setInspectedTrip(null)}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
