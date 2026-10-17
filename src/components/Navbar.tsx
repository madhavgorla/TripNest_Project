import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  ShieldCheck,
  Search,
  Star,
  Luggage
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
    unreadNotificationCount,
    destinations,
    hotels,
    experiences,
    viewDestinationDetails,
    setSelectedHotelBooking,
    setSearchQuery,
    formatPrice,
    trips,
    openTripDetailPage,
    setCustomPlan
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Search Bar State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<'all' | 'destinations' | 'hotels' | 'trips'>('all');

  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K / / to search, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setIsMobileSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns and search when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(target)) {
        setCurrencyDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtered live search results across destinations, hotels/stays, and trips
  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return { destinations: [], hotels: [], trips: [], experiences: [], totalCount: 0 };

    const matchedDestinations = destinations
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.region.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          (d.tagline && d.tagline.toLowerCase().includes(q))
      )
      .slice(0, 4);

    const matchedHotels = hotels
      .filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.city.toLowerCase().includes(q) ||
          h.country.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedTrips = (trips || [])
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.status && t.status.toLowerCase().includes(q))
      )
      .slice(0, 4);

    const matchedExperiences = experiences
      .filter(
        (exp) =>
          exp.title.toLowerCase().includes(q) ||
          exp.location.toLowerCase().includes(q) ||
          exp.category.toLowerCase().includes(q)
      )
      .slice(0, 2);

    return {
      destinations: matchedDestinations,
      hotels: matchedHotels,
      trips: matchedTrips,
      experiences: matchedExperiences,
      totalCount:
        matchedDestinations.length +
        matchedHotels.length +
        matchedTrips.length +
        matchedExperiences.length
    };
  }, [searchTerm, destinations, hotels, trips, experiences]);

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearchQuery(searchTerm.trim());
    setActiveTab('destinations');
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDestination = (dest: any) => {
    viewDestinationDetails(dest);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    setSearchTerm('');
  };

  const handleSelectHotel = (hotel: any) => {
    setSelectedHotelBooking(hotel);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    setSearchTerm('');
  };

  const handleSelectTrip = (trip: any) => {
    openTripDetailPage(trip);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    setSearchTerm('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateTripForSearch = () => {
    setCustomPlan((prev) => ({
      ...prev,
      destinationName: searchTerm.trim()
    }));
    setActiveTab('planner');
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

        {/* Global Quick Search Bar */}
        <div ref={searchContainerRef} className="relative hidden md:flex items-center flex-1 max-w-[220px] lg:max-w-xs xl:max-w-sm mx-2 z-50">
          <form onSubmit={handleGlobalSearchSubmit} className="w-full relative">
            <div className={`flex items-center w-full rounded-full transition-all duration-200 border ${
              isSearchFocused
                ? 'border-[#E2C076] bg-[#0E1726] shadow-lg shadow-[#E2C076]/20 ring-1 ring-[#E2C076]/50'
                : 'border-white/15 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.08]'
            }`}>
              <Search className={`h-3.5 w-3.5 ml-3 shrink-0 transition-colors ${isSearchFocused ? 'text-[#E2C076]' : 'text-neutral-400'}`} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search destinations, hotels, or trips..."
                className="w-full bg-transparent py-1.5 pl-2 pr-7 text-xs text-white placeholder-neutral-400 focus:outline-none"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 p-0.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="hidden xl:flex items-center space-x-0.5 absolute right-2 px-1 py-0.5 rounded border border-white/15 bg-white/[0.05] text-[9px] font-mono text-neutral-400 pointer-events-none">
                  <span>⌘K</span>
                </div>
              )}
            </div>
          </form>

          {/* Search Dropdown Overlay */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 w-[360px] xl:w-[440px] rounded-2xl border border-[#E2C076]/30 bg-[#0E1726]/98 backdrop-blur-2xl shadow-2xl p-3 max-h-[500px] overflow-y-auto z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              {/* Header / query status */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                <span>{searchTerm.trim() ? `Search Results (${searchResults.totalCount})` : 'Quick Search'}</span>
                <span className="text-neutral-500 font-mono">ESC to close</span>
              </div>

              {/* Category Filter Tabs when search query is entered */}
              {searchTerm.trim() && (
                <div className="flex items-center space-x-1.5 pb-2 mb-2 border-b border-white/10 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSearchCategoryFilter('all')}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                      searchCategoryFilter === 'all'
                        ? 'bg-[#E2C076] text-[#070B14]'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    All ({searchResults.totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchCategoryFilter('destinations')}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                      searchCategoryFilter === 'destinations'
                        ? 'bg-[#E2C076] text-[#070B14]'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Destinations ({searchResults.destinations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchCategoryFilter('hotels')}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                      searchCategoryFilter === 'hotels'
                        ? 'bg-[#E2C076] text-[#070B14]'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Hotels ({searchResults.hotels.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchCategoryFilter('trips')}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                      searchCategoryFilter === 'trips'
                        ? 'bg-[#E2C076] text-[#070B14]'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Trips ({searchResults.trips.length})
                  </button>
                </div>
              )}

              {!searchTerm.trim() ? (
                <div className="space-y-2 py-1">
                  <p className="text-[11px] text-neutral-400">Search destinations, hotels, or personal trips by keyword:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Kashmir', 'Bali', 'Zermatt', 'Maldives', 'Kyoto', 'Santorini', 'Serengeti'].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setSearchTerm(term);
                          searchInputRef.current?.focus();
                        }}
                        className="px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-[#E2C076]/15 hover:text-[#E2C076] text-neutral-300 text-[11px] border border-white/10 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.totalCount === 0 ? (
                <div className="py-6 text-center text-neutral-400 space-y-2">
                  <p className="font-semibold text-neutral-300">No direct matches for "{searchTerm}"</p>
                  <p className="text-[11px]">You can plan a customized trip or explore all global destinations with AI recommendations.</p>
                  <div className="flex items-center justify-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCreateTripForSearch}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-[11px] hover:bg-purple-500/30 transition-all"
                    >
                      <Luggage className="h-3 w-3 mr-1" />
                      <span>Plan Trip to "{searchTerm}"</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGlobalSearchSubmit}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-[#E2C076] text-[#070B14] font-bold text-[11px] hover:bg-[#F6E05E] transition-all"
                    >
                      <span>Search All</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Destinations section */}
                  {(searchCategoryFilter === 'all' || searchCategoryFilter === 'destinations') && searchResults.destinations.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#E2C076] mb-1.5 flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>Destinations ({searchResults.destinations.length})</span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.destinations.map((dest) => (
                          <div
                            key={dest.id}
                            onClick={() => handleSelectDestination(dest)}
                            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-white/[0.08] cursor-pointer transition-colors group"
                          >
                            <img
                              src={dest.imageUrl}
                              alt={dest.name}
                              className="h-9 w-9 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-white group-hover:text-[#E2C076] truncate text-[12px]">
                                  {dest.name}
                                </h4>
                                <span className="text-[10px] text-neutral-400 shrink-0 ml-1">
                                  From {formatPrice(dest.startingPriceUsd)}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-400 truncate">
                                {dest.country} • {dest.category}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hotels / Stays section */}
                  {(searchCategoryFilter === 'all' || searchCategoryFilter === 'hotels') && searchResults.hotels.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-1.5 flex items-center space-x-1">
                        <Hotel className="h-3 w-3" />
                        <span>Hotels & Stays ({searchResults.hotels.length})</span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.hotels.map((hotel) => (
                          <div
                            key={hotel.id}
                            onClick={() => handleSelectHotel(hotel)}
                            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-white/[0.08] cursor-pointer transition-colors group"
                          >
                            <img
                              src={hotel.imageUrl}
                              alt={hotel.name}
                              className="h-9 w-9 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-white group-hover:text-sky-300 truncate text-[12px]">
                                  {hotel.name}
                                </h4>
                                <span className="text-[10px] text-neutral-400 shrink-0 ml-1">
                                  {formatPrice(hotel.pricePerNightUsd)}/night
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-[10px] text-neutral-400">
                                <span>{hotel.city}, {hotel.country}</span>
                                <span>•</span>
                                <span className="flex items-center text-amber-300">
                                  <Star className="h-2.5 w-2.5 fill-amber-300 inline mr-0.5" />
                                  {hotel.rating}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trips / Itineraries section */}
                  {(searchCategoryFilter === 'all' || searchCategoryFilter === 'trips') && searchResults.trips.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1.5 flex items-center space-x-1">
                        <Luggage className="h-3 w-3" />
                        <span>My Trips & Itineraries ({searchResults.trips.length})</span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.trips.map((trip) => (
                          <div
                            key={trip.id}
                            onClick={() => handleSelectTrip(trip)}
                            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-white/[0.08] cursor-pointer transition-colors group"
                          >
                            {trip.coverImage ? (
                              <img
                                src={trip.coverImage}
                                alt={trip.title}
                                className="h-9 w-9 rounded-lg object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                                <Ticket className="h-4 w-4 text-purple-300" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-white group-hover:text-purple-300 truncate text-[12px]">
                                  {trip.title}
                                </h4>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 ml-1 font-medium">
                                  {trip.status || 'Active'}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-400 truncate">
                                {trip.destination} {trip.startDate ? `• ${trip.startDate}` : ''} {trip.travelersCount ? `• ${trip.travelersCount} Travelers` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experiences section */}
                  {searchCategoryFilter === 'all' && searchResults.experiences.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center space-x-1">
                        <Compass className="h-3 w-3" />
                        <span>Excursions & Experiences</span>
                      </div>
                      <div className="space-y-1">
                        {searchResults.experiences.map((exp) => (
                          <div
                            key={exp.id}
                            onClick={() => {
                              setActiveTab('explore');
                              setIsSearchFocused(false);
                              const el = document.getElementById('destinations-section');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-white/[0.08] cursor-pointer transition-colors group"
                          >
                            <img
                              src={exp.imageUrl}
                              alt={exp.title}
                              className="h-9 w-9 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white group-hover:text-emerald-300 truncate text-[12px]">
                                {exp.title}
                              </h4>
                              <p className="text-[10px] text-neutral-400 truncate">
                                {exp.location} • {formatPrice(exp.priceUsd)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleCreateTripForSearch}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-semibold text-center transition-all border border-purple-500/30 text-[11px] truncate"
                    >
                      + Plan Trip to "{searchTerm}"
                    </button>
                    <button
                      type="button"
                      onClick={handleGlobalSearchSubmit}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#D4A853]/20 to-[#E2C076]/30 hover:from-[#D4A853]/30 hover:to-[#E2C076]/40 text-[#E2C076] hover:text-white font-semibold text-center transition-all border border-[#E2C076]/30 text-[11px] truncate"
                    >
                      View in Destinations →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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

          {/* Mobile Search Toggle */}
          <button
            id="mobile-search-toggle-btn"
            onClick={() => {
              setIsMobileSearchOpen(!isMobileSearchOpen);
              if (!isMobileSearchOpen) {
                setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
              }
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full border md:hidden transition-all ${
              isMobileSearchOpen
                ? 'border-[#E2C076] bg-[#E2C076]/20 text-[#E2C076]'
                : 'border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white'
            }`}
            title="Search destinations and stays"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              if (!mobileMenuOpen) setIsMobileSearchOpen(false);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-neutral-300 lg:hidden hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Expandable Drawer */}
      {isMobileSearchOpen && (
        <div className="border-b border-white/10 bg-[#0E1726]/98 px-4 py-3 md:hidden backdrop-blur-2xl animate-in slide-in-from-top-2">
          <form onSubmit={handleGlobalSearchSubmit} className="relative">
            <div className="flex items-center rounded-full border border-[#E2C076]/50 bg-black/40 px-3 py-1.5 ring-1 ring-[#E2C076]/30">
              <Search className="h-4 w-4 text-[#E2C076] mr-2 shrink-0" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search destinations, hotels, or trips..."
                className="w-full bg-transparent text-xs text-white placeholder-neutral-400 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Quick results if typing on mobile */}
          {searchTerm.trim() && (
            <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
              {/* Destinations */}
              {searchResults.destinations.slice(0, 3).map((dest) => (
                <div
                  key={dest.id}
                  onClick={() => handleSelectDestination(dest)}
                  className="flex items-center space-x-2.5 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08]"
                >
                  <img src={dest.imageUrl} alt={dest.name} className="h-8 w-8 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{dest.name}</p>
                    <p className="text-[10px] text-neutral-400">{dest.country} • From {formatPrice(dest.startingPriceUsd)}</p>
                  </div>
                </div>
              ))}
              {/* Hotels */}
              {searchResults.hotels.slice(0, 2).map((hotel) => (
                <div
                  key={hotel.id}
                  onClick={() => handleSelectHotel(hotel)}
                  className="flex items-center space-x-2.5 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08]"
                >
                  <img src={hotel.imageUrl} alt={hotel.name} className="h-8 w-8 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-sky-300 truncate">{hotel.name}</p>
                    <p className="text-[10px] text-neutral-400">{hotel.city} • {formatPrice(hotel.pricePerNightUsd)}/night</p>
                  </div>
                </div>
              ))}
              {/* Trips */}
              {searchResults.trips.slice(0, 2).map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => handleSelectTrip(trip)}
                  className="flex items-center space-x-2.5 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08]"
                >
                  <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Luggage className="h-4 w-4 text-purple-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-purple-300 truncate">{trip.title}</p>
                    <p className="text-[10px] text-neutral-400">{trip.destination}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleCreateTripForSearch}
                  className="flex-1 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold text-center"
                >
                  + Plan Trip
                </button>
                <button
                  type="button"
                  onClick={handleGlobalSearchSubmit}
                  className="flex-1 py-1.5 rounded-xl bg-[#E2C076] text-[#070B14] font-bold text-[11px] text-center"
                >
                  Explore All →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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

// Aliased export so Header component is directly accessible
export const Header = Navbar;


