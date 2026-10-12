import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CURRENCY_CONFIGS } from '../data/seedData';
import { CurrencyCode } from '../types';
import {
  Compass,
  Sparkles,
  MapPin,
  Hotel,
  Calendar,
  Ticket,
  Bot,
  Globe,
  Bell,
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  LogIn,
  Wallet,
  Users,
  FolderLock,
  BarChart3,
  Shield,
  ShieldCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currency,
    setCurrency,
    setIsAiConciergeOpen,
    bookings,
    userProfile,
    isAuthenticated,
    openAuthModal,
    requestSignOut,
    showToast,
    loginUser,
    unreadNotificationCount
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(target)) {
        setCurrencyDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeBookingsCount = bookings.filter((b) => b.status === 'Confirmed').length;

  const isAdmin = Boolean(
    userProfile?.role === 'admin' ||
    userProfile?.email?.toLowerCase() === 'admin@tripnest.luxury' ||
    userProfile?.email?.toLowerCase() === 'tripnestoneofficial@gmail.com'
  );

  const [isTogglingRole, setIsTogglingRole] = useState(false);

  const toggleUserRole = async () => {
    if (!userProfile?.email) return;
    setIsTogglingRole(true);
    const newRole = userProfile.role === 'admin' ? 'traveler' : 'admin';
    try {
      const res = await fetch('/api/admin/toggle-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userProfile.email, role: newRole })
      });
      const data = await res.json();
      if (data.success && data.user) {
        loginUser(data.user);
        showToast(`Role updated to ${newRole.toUpperCase()}!`, 'success');
        if (newRole === 'admin') setActiveTab('admin');
        else setActiveTab('analytics');
      } else {
        throw new Error(data.error || 'Failed to switch role');
      }
    } catch (err: any) {
      showToast(err.message || 'Error changing role', 'error');
    } finally {
      setIsTogglingRole(false);
    }
  };

  interface NavItem {
    id: 'explore' | 'destinations' | 'hotels' | 'planner' | 'mytrips' | 'analytics' | 'budget-expenses' | 'groups-split' | 'vault-alerts' | 'admin';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    count?: number;
  }

  const navItems: NavItem[] = [
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'destinations', label: 'Destinations', icon: MapPin },
    { id: 'hotels', label: 'Stays', icon: Hotel },
    { id: 'planner', label: 'Itinerary', icon: Calendar },
    { id: 'mytrips', label: 'Trips', icon: Ticket, count: activeBookingsCount },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'budget-expenses', label: 'Budget', icon: Wallet },
    { id: 'groups-split', label: 'Groups', icon: Users },
    { id: 'vault-alerts', label: 'Vault', icon: FolderLock, count: unreadNotificationCount },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Admin', icon: Shield, badge: 'PRO' }] : [])
  ];

  const handleNavClick = (id: NavItem['id']) => {
    // If on explore, smoothly scroll to corresponding section if available
    if (activeTab === 'explore') {
      let targetElId = '';
      if (id === 'destinations') targetElId = 'destinations-section';
      else if (id === 'hotels') targetElId = 'hotels-section';

      if (targetElId) {
        const targetEl = document.getElementById(targetElId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
    }

    // Tab change with smooth scroll to top
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full border-b border-[#E2C076]/15 bg-[#070B14]/90 backdrop-blur-2xl transition-all shadow-lg shadow-black/40"
    >
      <div className="w-full flex h-16 items-center justify-between pl-2 sm:pl-3 lg:pl-4 pr-2 sm:pr-4 lg:pr-5 gap-2 sm:gap-3">
        {/* Brand Logo - Moved slightly left, clean styling without compass icon */}
        <div
          id="brand-logo"
          onClick={() => {
            setActiveTab('explore');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex cursor-pointer items-center space-x-1.5 group shrink-0 mr-1 sm:mr-2"
        >
          <span className="text-xl font-extrabold tracking-tight text-white transition-colors group-hover:text-amber-300">
            Trip<span className="text-[#E2C076]">Nest</span>
          </span>
        </div>

        {/* Desktop Navigation Links - Non-overlapping, fully visible headings */}
        <nav
          id="desktop-nav"
          className="hidden lg:flex items-center space-x-1 xl:space-x-1.5 rounded-full p-1 bg-[#0E1726]/85 border border-white/10 backdrop-blur-md shrink-0"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'destinations' && activeTab === 'destination-detail') ||
              (item.id === 'mytrips' && activeTab === 'trip-detail');
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`relative flex items-center space-x-1.5 px-2 xl:px-2.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                    : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-[#070B14]' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${isActive ? 'bg-[#070B14]/15 text-[#070B14]' : 'bg-[#E2C076]/20 text-[#E2C076]'}`}>
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${isActive ? 'bg-[#070B14] text-[#E2C076]' : 'bg-[#E2C076] text-[#070B14]'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls - Sign In Button in place of former AI Concierge button */}
        <div id="navbar-actions" className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* User Profile and Direct Sign Out Button / Traveler Sign In Button in place of former AI button */}
          {isAuthenticated && userProfile ? (
            <div className="flex items-center space-x-2">
              <div ref={profileDropdownRef} className="relative">
                <button
                  id="profile-dropdown-btn"
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setCurrencyDropdownOpen(false);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center space-x-2 rounded-full border border-[#E2C076]/40 bg-[#E2C076]/10 p-1 pr-2.5 transition-all hover:border-[#E2C076]"
                >
                  <img
                    src={userProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                    alt={userProfile.name}
                    className="h-6 w-6 rounded-full object-cover border border-[#E2C076]/30"
                  />
                  <span className="hidden xl:inline text-xs font-medium text-neutral-200 max-w-[90px] truncate">
                    {userProfile.name}
                  </span>
                  <ChevronDown className="h-3 w-3 text-neutral-400" />
                </button>

                {profileDropdownOpen && (
                  <div
                    id="profile-dropdown-menu"
                    className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#E2C076]/25 bg-[#0E1726]/95 p-3 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center space-x-3 border-b border-white/[0.08] pb-3">
                      <img
                        src={userProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                        alt={userProfile.name}
                        className="h-9 w-9 rounded-full object-cover border border-[#E2C076]/30"
                      />
                      <div className="overflow-hidden">
                        <div className="flex items-center space-x-1">
                          <p className="text-xs font-semibold text-white truncate">{userProfile.name}</p>
                          {userProfile.role === 'admin' ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              Admin
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-[#E2C076] font-semibold truncate">
                          {userProfile.membershipTier} Member
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate">{userProfile.email}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-xs">
                      <div className="flex justify-between items-center px-2.5 py-1.5 rounded-xl bg-white/[0.03] text-neutral-300 border border-white/[0.06]">
                        <span className="text-[11px] text-neutral-400">Travel Reward Miles</span>
                        <span className="font-semibold text-[#E2C076]">{(userProfile.points || 0).toLocaleString()} pts</span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('analytics');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/5 text-neutral-300 hover:text-white transition-colors flex items-center justify-between"
                      >
                        <span>Traveler Analytics</span>
                        <BarChart3 className="h-3.5 w-3.5 text-[#E2C076]" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('admin');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/5 text-neutral-300 hover:text-white transition-colors flex items-center justify-between"
                      >
                        <span>Admin Platform Analytics</span>
                        <Shield className="h-3.5 w-3.5 text-sky-400" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('mytrips');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/5 text-neutral-300 hover:text-white transition-colors"
                      >
                        My Itineraries & Vouchers
                      </button>
                      <button
                        onClick={toggleUserRole}
                        disabled={isTogglingRole}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-amber-400/10 text-amber-300 hover:text-amber-200 transition-colors flex items-center justify-between font-mono text-[11px]"
                      >
                        <span>Switch Role to: {userProfile.role === 'admin' ? 'Traveler' : 'Admin'}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-400/20">Toggle</span>
                      </button>
                      <button
                        id="navbar-signout-btn"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          requestSignOut();
                        }}
                        className="w-full flex items-center justify-between text-left px-2.5 py-2 rounded-xl hover:bg-rose-500/10 text-rose-300 hover:text-rose-200 transition-colors"
                      >
                        <span>Sign Out</span>
                        <LogOut className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Quick Sign Out Button right on navbar */}
              <button
                id="quick-navbar-signout-btn"
                onClick={requestSignOut}
                title="Sign Out of TripNest"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              id="navbar-sign-in-btn"
              onClick={() => openAuthModal('login')}
              className="flex shrink-0 items-center space-x-2 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] px-4 py-2 text-xs font-bold tracking-wide transition-all shadow-md shadow-[#D4A853]/25 active:scale-95 whitespace-nowrap"
            >
              <LogIn className="h-3.5 w-3.5 shrink-0" />
              <span>Traveler Sign In</span>
            </button>
          )}

          {/* Currency Switcher */}
          <div ref={currencyDropdownRef} className="relative">
            <button
              id="currency-switcher-btn"
              onClick={() => {
                setCurrencyDropdownOpen(!currencyDropdownOpen);
                setNotificationsOpen(false);
                setProfileDropdownOpen(false);
              }}
              className="flex items-center space-x-1 px-2.5 py-1.5 border border-white/10 rounded-full text-xs font-medium text-neutral-300 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <span className="text-[#E2C076] font-semibold">{CURRENCY_CONFIGS[currency]?.symbol}</span>
              <span>{currency}</span>
              <ChevronDown className="h-3 w-3 text-neutral-400" />
            </button>

            {currencyDropdownOpen && (
              <div
                id="currency-dropdown-menu"
                className="absolute right-0 mt-2 w-44 rounded-2xl border border-[#E2C076]/20 bg-[#0E1726]/95 p-1.5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#E2C076]">
                  Select Currency
                </div>
                {(Object.keys(CURRENCY_CONFIGS) as CurrencyCode[]).map((cCode) => (
                  <button
                    key={cCode}
                    onClick={() => {
                      setCurrency(cCode);
                      setCurrencyDropdownOpen(false);
                      showToast(`Currency set to ${cCode}`, 'info');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      currency === cCode
                        ? 'bg-[#E2C076]/15 text-[#E2C076] font-semibold'
                        : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{CURRENCY_CONFIGS[cCode].label}</span>
                    <span className="font-semibold text-neutral-300">{CURRENCY_CONFIGS[cCode].symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-neutral-300 lg:hidden hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          id="mobile-drawer-nav"
          className="border-b border-white/10 bg-[#08080c]/95 px-4 py-4 lg:hidden backdrop-blur-2xl animate-in slide-in-from-top-2"
        >
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'destinations' && activeTab === 'destination-detail') ||
                (item.id === 'mytrips' && activeTab === 'trip-detail');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleNavClick(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-2 rounded-xl p-3 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="ml-auto rounded-full bg-sky-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isAuthenticated && userProfile ? (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center space-x-3 px-1 py-1">
                <img
                  src={userProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt={userProfile.name}
                  className="h-9 w-9 rounded-full object-cover border border-[#E2C076]/40"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{userProfile.name}</p>
                  <p className="text-[10px] text-[#E2C076] font-semibold truncate">{userProfile.membershipTier} Member</p>
                </div>
              </div>
              <button
                id="mobile-drawer-signout-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  requestSignOut();
                }}
                className="w-full py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 font-bold text-xs text-center flex items-center justify-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  openAuthModal('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] text-[#070B14] font-bold text-xs text-center flex items-center justify-center space-x-2 shadow-md shadow-[#D4A853]/25 active:scale-95"
              >
                <LogIn className="h-4 w-4" />
                <span>Traveler Sign In</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

