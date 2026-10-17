import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CurrencyCode,
  Destination,
  Hotel,
  Experience,
  BookingVoucher,
  CustomTripPlan,
  UserProfile,
  AuthPortalMode,
  CustomTrip,
  DetailedBookingRecord
} from '../types';
import {
  CURRENCY_CONFIGS,
  INITIAL_DESTINATIONS,
  INITIAL_HOTELS,
  INITIAL_EXPERIENCES
} from '../data/seedData';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface AppContextType {
  currency: CurrencyCode;
  setCurrency: (curr: CurrencyCode) => void;
  formatPrice: (amountUsd: number) => string;
  convertPrice: (amountUsd: number) => number;

  destinations: Destination[];
  hotels: Hotel[];
  experiences: Experience[];
  addDestination: (dest: Destination) => void;

  bookings: BookingVoucher[];
  addBooking: (booking: Omit<BookingVoucher, 'id' | 'bookingCode' | 'createdAt' | 'status'>) => BookingVoucher;
  cancelBooking: (id: string) => void;
  deleteBooking: (id: string) => Promise<boolean>;
  updateBookingStatus: (id: string, status: 'Confirmed' | 'Pending' | 'Cancelled') => void;

  trips: CustomTrip[];
  createTrip: (tripData: Partial<CustomTrip>) => Promise<CustomTrip | null>;
  updateTrip: (id: string, updates: Partial<CustomTrip>) => Promise<CustomTrip | null>;
  cancelTrip: (id: string) => Promise<boolean>;
  deleteTrip: (id: string) => Promise<boolean>;
  updateTripDatesAndGuests: (id: string, startDate: string, endDate: string, travelersCount: number, notes?: string) => Promise<boolean>;

  bookingsLedger: DetailedBookingRecord[];
  fetchBookingsLedger: () => Promise<DetailedBookingRecord[]>;
  isFetchingLedger: boolean;

  userLocation: { lat: number; lng: number; name?: string; isLiveGps?: boolean } | null;
  setUserLocation: (loc: { lat: number; lng: number; name?: string; isLiveGps?: boolean } | null) => void;
  requestGpsLocation: (silent?: boolean) => Promise<{ lat: number; lng: number; name?: string; isLiveGps?: boolean } | null>;

  activeTab: 'explore' | 'destinations' | 'destination-detail' | 'trip-detail' | 'hotels' | 'experiences' | 'radar' | 'planner' | 'mytrips' | 'ledger' | 'budget-expenses' | 'groups-split' | 'vault-alerts' | 'analytics' | 'admin';
  setActiveTab: (tab: 'explore' | 'destinations' | 'destination-detail' | 'trip-detail' | 'hotels' | 'experiences' | 'radar' | 'planner' | 'mytrips' | 'ledger' | 'budget-expenses' | 'groups-split' | 'vault-alerts' | 'analytics' | 'admin') => void;

  unreadNotificationCount: number;
  setUnreadNotificationCount: React.Dispatch<React.SetStateAction<number>>;

  viewedTrip: CustomTrip | null;
  setViewedTrip: (trip: CustomTrip | null) => void;
  openTripDetailPage: (trip: CustomTrip) => void;
  backToMyTrips: () => void;

  selectedDestinationDetail: Destination | null;
  setSelectedDestinationDetail: (dest: Destination | null) => void;
  viewDestinationDetails: (dest: Destination) => void;
  backToDestinations: () => void;
  fetchAiDestinationGuide: (destinationName: string, categoryHint?: string) => Promise<Destination | null>;
  isGeneratingAiDestination: boolean;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  isAiConciergeOpen: boolean;
  setIsAiConciergeOpen: (open: boolean) => void;
  aiInitialPrompt: string;
  openAiWithPrompt: (prompt: string) => void;

  selectedDestinationModal: Destination | null;
  setSelectedDestinationModal: (dest: Destination | null) => void;

  selectedHotelBooking: Hotel | null;
  setSelectedHotelBooking: (hotel: Hotel | null) => void;

  selectedExperienceBooking: Experience | null;
  setSelectedExperienceBooking: (exp: Experience | null) => void;

  customPlan: CustomTripPlan;
  setCustomPlan: React.Dispatch<React.SetStateAction<CustomTripPlan>>;

  // Auth State
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: AuthPortalMode;
  setAuthModalMode: (mode: AuthPortalMode) => void;
  openAuthModal: (mode?: AuthPortalMode) => void;
  loginUser: (user: UserProfile) => void;
  logoutUser: () => void;
  updateUserPoints: (newPoints: number) => void;
  isSignOutConfirmOpen: boolean;
  requestSignOut: () => void;
  confirmSignOut: () => void;
  cancelSignOut: () => void;
  continueAsGuest: () => void;

  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_BOOKINGS_KEY = 'tripnest_luxury_bookings_v1';
const LOCAL_STORAGE_PLAN_KEY = 'tripnest_custom_plan_v1';
const LOCAL_STORAGE_TRIPS_KEY = 'tripnest_custom_trips_v1';
const LOCAL_STORAGE_USER_KEY = 'tripnest_auth_user_v2';
const LOCAL_STORAGE_GUEST_KEY = 'tripnest_guest_session_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem('tripnest_preferred_currency');
      if (saved && CURRENCY_CONFIGS[saved]) return saved as CurrencyCode;
    } catch {}
    return 'INR';
  });

  const handleSetCurrency = (curr: CurrencyCode) => {
    setCurrency(curr);
    try {
      localStorage.setItem('tripnest_preferred_currency', curr);
    } catch {}
  };
  const [destinations, setDestinations] = useState<Destination[]>(INITIAL_DESTINATIONS);
  const [hotels] = useState<Hotel[]>(INITIAL_HOTELS);
  const [experiences] = useState<Experience[]>(INITIAL_EXPERIENCES);

  const [activeTab, setActiveTab] = useState<'explore' | 'destinations' | 'destination-detail' | 'trip-detail' | 'hotels' | 'experiences' | 'radar' | 'planner' | 'mytrips' | 'ledger' | 'budget-expenses' | 'groups-split' | 'vault-alerts' | 'analytics' | 'admin'>('explore');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(3);
  const [viewedTrip, setViewedTrip] = useState<CustomTrip | null>(null);

  const openTripDetailPage = (trip: CustomTrip) => {
    setViewedTrip(trip);
    setActiveTab('trip-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToMyTrips = () => {
    setActiveTab('mytrips');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [selectedDestinationDetail, setSelectedDestinationDetail] = useState<Destination | null>(null);
  const [isGeneratingAiDestination, setIsGeneratingAiDestination] = useState(false);

  const viewDestinationDetails = (dest: Destination) => {
    setSelectedDestinationDetail(dest);
    setActiveTab('destination-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToDestinations = () => {
    setActiveTab('destinations');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchAiDestinationGuide = async (destinationName: string, categoryHint?: string): Promise<Destination | null> => {
    setIsGeneratingAiDestination(true);
    try {
      showToast(`Connecting with Destination AI Engine for "${destinationName}"...`, 'info');
      const res = await fetch('/api/destinations/ai-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationName, categoryHint })
      });
      const data = await res.json();
      if (data.success && data.destination) {
        const newDest: Destination = data.destination;
        setDestinations(prev => {
          const exists = prev.some(d => d.id === newDest.id || d.name.toLowerCase() === newDest.name.toLowerCase());
          if (exists) {
            return prev.map(d => (d.id === newDest.id || d.name.toLowerCase() === newDest.name.toLowerCase()) ? newDest : d);
          }
          return [newDest, ...prev];
        });
        showToast(`Travel guide & attractions ready for ${newDest.name}!`, 'success');
        return newDest;
      } else {
        throw new Error(data.error || 'Failed to generate travel guide');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not fetch destination guide.', 'error');
      return null;
    } finally {
      setIsGeneratingAiDestination(false);
    }
  };

  useEffect(() => {
    fetch('/api/destinations')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.destinations) && data.destinations.length > 0) {
          setDestinations(prev => {
            const map = new Map(prev.map(d => [d.id, d]));
            for (const d of data.destinations) {
              const existing = map.get(d.id);
              map.set(d.id, existing ? { ...existing, ...d } : d);
            }
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
  }, []);

  // GPS User Location (Defaults to stored location or auto-detected live coordinates)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name?: string; isLiveGps?: boolean } | null>(() => {
    try {
      const saved = localStorage.getItem('tripnest_user_gps');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return {
      lat: 12.9716,
      lng: 77.5946,
      name: 'Bengaluru Live Hub',
      isLiveGps: false
    };
  });

  // Auth State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return null;
  });

  // Poll unread notifications count (only when logged in)
  useEffect(() => {
    if (!userProfile?.email) {
      setUnreadNotificationCount(0);
      return;
    }
    const fetchNotifCount = async () => {
      try {
        const res = await fetch(`/api/notifications?userEmail=${encodeURIComponent(userProfile.email)}`);
        const data = await res.json();
        if (data.success && typeof data.unreadCount === 'number') {
          setUnreadNotificationCount(data.unreadCount);
        }
      } catch {}
    };
    fetchNotifCount();
    const interval = setInterval(fetchNotifCount, 30000);
    return () => clearInterval(interval);
  }, [userProfile?.email]);

  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_GUEST_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthPortalMode>('login');

  // Modals & Drawers
  const [isAiConciergeOpenState, setIsAiConciergeOpenState] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [selectedDestinationModal, setSelectedDestinationModal] = useState<Destination | null>(null);
  const [selectedHotelBookingState, setSelectedHotelBookingState] = useState<Hotel | null>(null);
  const [selectedExperienceBookingState, setSelectedExperienceBookingState] = useState<Experience | null>(null);

  const setSelectedHotelBooking = (hotel: Hotel | null) => {
    if (hotel && !userProfile) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('Please sign in or create an account to book your luxury stay.', 'info');
      return;
    }
    setSelectedHotelBookingState(hotel);
  };

  const setSelectedExperienceBooking = (exp: Experience | null) => {
    if (exp && !userProfile) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('Please sign in or create an account to reserve VIP experiences.', 'info');
      return;
    }
    setSelectedExperienceBookingState(exp);
  };

  const setIsAiConciergeOpen = (open: boolean) => {
    if (open && !userProfile) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('Please sign in or create an account to consult the AI Tourism Concierge.', 'info');
      return;
    }
    setIsAiConciergeOpenState(open);
  };

  const openAiWithPrompt = (prompt: string) => {
    if (!userProfile) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('Please sign in or create an account to consult the AI Tourism Concierge.', 'info');
      return;
    }
    setAiInitialPrompt(prompt);
    setIsAiConciergeOpenState(true);
  };

  // Toasts
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loginUser = (user: UserProfile) => {
    setUserProfile(user);
    setIsGuest(false);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      localStorage.removeItem(LOCAL_STORAGE_GUEST_KEY);
    } catch {
      // Ignore
    }
    setIsAuthModalOpen(false);
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('analytics');
    }
    showToast(`Welcome back, ${user.name}! Authenticated to TripNest.`, 'success');
  };

  const updateUserPoints = (newPoints: number) => {
    setUserProfile((prev) => {
      if (!prev) return null;
      const updated = { ...prev, points: newPoints };
      try {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

  const requestSignOut = () => {
    setIsSignOutConfirmOpen(true);
  };

  const cancelSignOut = () => {
    setIsSignOutConfirmOpen(false);
  };

  const confirmSignOut = () => {
    const formerTier = userProfile?.membershipTier || 'Champagne Gold VIP';
    setUserProfile(null);
    setIsGuest(false);
    setBookings([]);
    setTrips([]);
    setUnreadNotificationCount(0);
    try {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_GUEST_KEY);
      localStorage.removeItem(LOCAL_STORAGE_BOOKINGS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_TRIPS_KEY);
    } catch {
      // Ignore
    }
    setIsSignOutConfirmOpen(false);
    showToast(`Signed out successfully. Your ${formerTier} status and VIP privileges have been removed from this device.`, 'info');
  };

  const logoutUser = () => {
    // Prompt confirmation modal before revoking VIP session
    requestSignOut();
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    try {
      localStorage.setItem(LOCAL_STORAGE_GUEST_KEY, 'true');
    } catch {
      // Ignore
    }
    setIsAuthModalOpen(false);
    showToast('Continuing as Guest Profile with read-only exploration.', 'info');
  };

  const openAuthModal = (mode: AuthPortalMode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Auto-request GPS Geolocation on initial app load with IP fallback
  useEffect(() => {
    let isMounted = true;

    const detectLocation = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!isMounted) return;
            const loc = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              name: 'Your Current Live Location',
              isLiveGps: true
            };
            setUserLocation(loc);
            try {
              localStorage.setItem('tripnest_user_gps', JSON.stringify(loc));
            } catch {
              // Ignore
            }
          },
          async (err) => {
            console.log('GPS browser prompt denied or pending, attempting IP geolocation fallback:', err.message);
            // Attempt IP Geolocation as fallback
            try {
              const res = await fetch('https://ipapi.co/json/');
              if (res.ok && isMounted) {
                const data = await res.json();
                if (data.latitude && data.longitude) {
                  const loc = {
                    lat: data.latitude,
                    lng: data.longitude,
                    name: `${data.city || 'Your City'}, ${data.region || data.country_name || 'Live Area'}`,
                    isLiveGps: true
                  };
                  setUserLocation(loc);
                  try {
                    localStorage.setItem('tripnest_user_gps', JSON.stringify(loc));
                  } catch {
                    // Ignore
                  }
                }
              }
            } catch (e) {
              console.log('IP fallback check complete:', e);
            }
          },
          { enableHighAccuracy: true, timeout: 7000 }
        );
      }
    };

    detectLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // Bookings with local storage
  const [bookings, setBookings] = useState<BookingVoucher[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
    } catch {
      // Ignore
    }
  }, [bookings]);

  // Sync bookings from database for the active user with retry & graceful offline resilience
  useEffect(() => {
    if (!userProfile?.email) return;
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 2;

    const fetchUserBookings = async () => {
      try {
        const res = await fetch(`/api/bookings?userEmail=${encodeURIComponent(userProfile.email)}`, {
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (isMounted && data.bookings && Array.isArray(data.bookings) && data.bookings.length > 0) {
          setBookings((prev) => {
            const map = new Map<string, BookingVoucher>();
            data.bookings.forEach((b: BookingVoucher) => map.set(b.id, b));
            prev.forEach((b) => {
              if (!map.has(b.id)) map.set(b.id, b);
            });
            return Array.from(map.values());
          });
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchUserBookings, 1500 * retryCount);
        } else {
          console.warn('Using local bookings cache (background sync paused):', err?.message || err);
        }
      }
    };

    fetchUserBookings();

    return () => {
      isMounted = false;
    };
  }, [userProfile?.email]);

  // Trips collection (compatible with Java backend, Express endpoints, & local cache)
  const [trips, setTrips] = useState<CustomTrip[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TRIPS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return [];
  });

  // Save trips to local storage backup whenever trips state changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(trips));
    } catch {
      // Ignore
    }
  }, [trips]);

  // Keep viewedTrip reactive with live trips updates
  useEffect(() => {
    if (viewedTrip) {
      const live = trips.find((t) => t.id === viewedTrip.id);
      if (live && JSON.stringify(live) !== JSON.stringify(viewedTrip)) {
        setViewedTrip(live);
      }
    }
  }, [trips, viewedTrip]);

  // Sync trips from database for active user with retry & resilient fallback
  useEffect(() => {
    if (!userProfile?.email) return;
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 2;

    const fetchUserTrips = async () => {
      try {
        const res = await fetch(`/api/trips?userEmail=${encodeURIComponent(userProfile.email)}`, {
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (isMounted && data.trips && Array.isArray(data.trips) && data.trips.length > 0) {
          setTrips(data.trips);
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchUserTrips, 1500 * retryCount);
        } else {
          console.warn('Using local trips cache (background sync paused):', err?.message || err);
        }
      }
    };

    fetchUserTrips();

    return () => {
      isMounted = false;
    };
  }, [userProfile?.email]);

  // Custom Trip Plan with local storage
  const [customPlan, setCustomPlan] = useState<CustomTripPlan>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PLAN_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return {
      id: 'plan-kashmir-luxury',
      title: 'Grand Kashmir Alpine & Lake Escape',
      destination: 'Kashmir Valley',
      startDate: '2026-09-15',
      endDate: '2026-09-19',
      totalBudgetUsd: 4800,
      notes: 'Ensure camera lenses are packed for golden hour at Dal Lake and Gulmarg Apharwat summit.',
      items: [
        {
          id: 'item-1',
          dayNumber: 1,
          timeSlot: 'Morning',
          title: 'VIP Chauffeur Airport Welcome & Suite Check-In',
          location: 'The Lalit Grand Palace Srinagar',
          estimatedCostUsd: 850,
          notes: 'Welcome Saffron Kehwa on arrival.',
          category: 'Stay'
        },
        {
          id: 'item-2',
          dayNumber: 1,
          timeSlot: 'Evening',
          title: 'Sunset Private Shikara Lotus Cruise',
          location: 'Dal Lake Ghat 7',
          estimatedCostUsd: 65,
          notes: 'Golden hour photography and floating flower market.',
          category: 'Activity'
        },
        {
          id: 'item-3',
          dayNumber: 2,
          timeSlot: 'Morning',
          title: 'Gulmarg Heli-Transit & Gondola Phase 2 Ascent',
          location: 'Mount Apharwat, Gulmarg',
          estimatedCostUsd: 350,
          notes: 'High-altitude snow safari and hot chocolate at peak.',
          category: 'Activity'
        },
        {
          id: 'item-4',
          dayNumber: 2,
          timeSlot: 'Evening',
          title: '36-Course Royal Wazwan Candlelit Banquet',
          location: 'The Chinar Fine Dining',
          estimatedCostUsd: 220,
          notes: 'Gushtaba, Rista, and Tabak Maaz pairings.',
          category: 'Dining'
        }
      ]
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PLAN_KEY, JSON.stringify(customPlan));
    } catch {
      // Ignore
    }
  }, [customPlan]);

  const convertPrice = (amountUsd: number): number => {
    const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.INR;
    return Math.round(amountUsd * config.rate);
  };

  const formatPrice = (amountUsd: number): string => {
    const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.INR;
    const converted = Math.round(amountUsd * config.rate);
    const formatted = currency === 'INR'
      ? converted.toLocaleString('en-IN')
      : converted.toLocaleString();
    return `${config.symbol}${formatted}`;
  };

  const addBooking = (
    bookingData: Omit<BookingVoucher, 'id' | 'bookingCode' | 'createdAt' | 'status'>
  ): BookingVoucher => {
    if (!userProfile) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('Please sign in or create an account to book your reservation.', 'info');
      throw new Error('Authentication required for booking');
    }

    const newBooking: BookingVoucher = {
      ...bookingData,
      id: `bk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingCode: `TN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      status: 'Confirmed',
      guestEmail: bookingData.guestEmail || userProfile.email,
      guestName: bookingData.guestName || userProfile.name
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Persist to server database
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking)
    }).catch((err) => console.error('Error saving booking to DB:', err));

    showToast(`Reservation confirmed! Voucher #${newBooking.bookingCode} generated.`, 'success');
    return newBooking;
  };

  const cancelBooking = (id: string) => {
    const target = bookings.find((b) => b.id === id || b.bookingCode === id);
    const itemName = target?.itemName || 'Reservation';
    setBookings((prev) =>
      prev.map((b) => (b.id === id || b.bookingCode === id ? { ...b, status: 'Cancelled' } : b))
    );
    fetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Cancelled' })
    }).catch((err) => console.warn('Error cancelling booking in DB:', err));
    showToast(`Reservation Cancelled: "${itemName}" marked as Cancelled.`, 'info');
  };

  const deleteBooking = async (id: string): Promise<boolean> => {
    const target = bookings.find((b) => b.id === id || b.bookingCode === id);
    const itemName = target?.itemName || 'Reservation';
    setBookings((prev) => prev.filter((b) => b.id !== id && b.bookingCode !== id));
    try {
      const url = `/api/bookings/${encodeURIComponent(id)}${userProfile?.email ? `?userEmail=${encodeURIComponent(userProfile.email)}` : ''}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Reservation Deleted: "${itemName}" permanently removed.`, 'info');
        return true;
      }
    } catch (err) {
      console.warn('Error deleting booking:', err);
    }
    showToast(`Reservation Deleted: "${itemName}" removed from your list.`, 'info');
    return true;
  };

  const createTrip = async (tripData: Partial<CustomTrip>): Promise<CustomTrip | null> => {
    const effectiveEmail = userProfile?.email || 'traveler@tripnest.luxury';
    const localTrip: CustomTrip = {
      id: `trip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userEmail: effectiveEmail,
      title: tripData.title || 'Bespoke Travel Expedition',
      destination: tripData.destination || 'Global Haven',
      startDate: tripData.startDate || new Date().toISOString().split('T')[0],
      endDate: tripData.endDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      budgetAmount: tripData.budgetAmount || 0,
      budgetCurrency: tripData.budgetCurrency || currency,
      travelersCount: tripData.travelersCount || 1,
      status: tripData.status || 'Active',
      notes: tripData.notes || '',
      coverImage: tripData.coverImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      itinerary: tripData.itinerary || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (userProfile?.email) {
      try {
        const payload = {
          ...localTrip,
          ...tripData,
          userEmail: userProfile.email,
          budgetCurrency: tripData.budgetCurrency || currency
        };

        const res = await fetch('/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        // Also persist directly to dedicated /api/iternary endpoint
        if (payload.itinerary && payload.itinerary.length > 0) {
          fetch('/api/iternary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tripId: data.trip?.id || localTrip.id,
              userEmail: payload.userEmail,
              title: payload.title,
              destination: payload.destination,
              startDate: payload.startDate,
              endDate: payload.endDate,
              days: payload.itinerary
            })
          }).catch((err) => console.warn('Failed to sync to /api/iternary:', err));
        }

        if (data.success && data.trip) {
          setTrips((prev) => [data.trip, ...prev]);
          showToast(`Trip "${data.trip.title}" created successfully!`, 'success');
          return data.trip;
        }
      } catch (err) {
        console.error('Error creating trip via API:', err);
      }
    }

    // Also persist directly to dedicated /api/iternary endpoint for guest / fallback
    if (localTrip.itinerary && localTrip.itinerary.length > 0) {
      fetch('/api/iternary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: localTrip.id,
          userEmail: effectiveEmail,
          title: localTrip.title,
          destination: localTrip.destination,
          startDate: localTrip.startDate,
          endDate: localTrip.endDate,
          days: localTrip.itinerary
        })
      }).catch((err) => console.warn('Failed to sync guest to /api/iternary:', err));
    }

    // Fallback: add locally so trip page opens seamlessly without blocking
    setTrips((prev) => [localTrip, ...prev]);
    showToast(`Trip "${localTrip.title}" created successfully!`, 'success');
    return localTrip;
  };

  const updateTrip = async (tripId: string, updates: Partial<CustomTrip>): Promise<CustomTrip | null> => {
    let targetTitle = 'Custom Trip';
    setTrips((prev) => {
      const idx = prev.findIndex((t) => t.id === tripId);
      if (idx >= 0) {
        targetTitle = prev[idx].title || targetTitle;
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updates, updatedAt: new Date().toISOString() };
        return copy;
      }
      return prev;
    });

    // If itinerary is being updated, sync to /api/iternary
    if (updates.itinerary) {
      fetch(`/api/iternary/${encodeURIComponent(tripId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          days: updates.itinerary,
          userEmail: userProfile?.email
        })
      }).catch((err) => console.warn('Failed to sync update to /api/iternary:', err));
    }

    try {
      const url = `/api/trips/${encodeURIComponent(tripId)}${userProfile?.email ? `?userEmail=${encodeURIComponent(userProfile.email)}` : ''}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          userEmail: userProfile?.email
        })
      });
      const data = await res.json();
      if (data.success && data.trip) {
        setTrips((prev) => prev.map((t) => (t.id === tripId ? data.trip : t)));
        if (updates.status === 'Cancelled') {
          showToast(`Trip Cancelled: "${data.trip.title || targetTitle}" marked as Cancelled.`, 'info');
        } else if (updates.startDate || updates.endDate || updates.travelersCount !== undefined) {
          showToast(`Trip Updated: Dates (${updates.startDate || data.trip.startDate} - ${updates.endDate || data.trip.endDate}) & ${updates.travelersCount ?? data.trip.travelersCount} guest(s) saved.`, 'success');
        } else {
          showToast(`Trip "${data.trip.title}" updated successfully.`, 'success');
        }
        return data.trip;
      } else {
        showToast(data.error || 'Failed to update trip', 'error');
      }
    } catch (err) {
      console.warn('Error updating trip in DB:', err);
      if (updates.status === 'Cancelled') {
        showToast(`Trip Cancelled: "${targetTitle}" marked as Cancelled.`, 'info');
      } else {
        showToast(`Trip "${targetTitle}" updated in local session.`, 'info');
      }
    }
    return null;
  };

  const cancelTrip = async (tripId: string): Promise<boolean> => {
    const updated = await updateTrip(tripId, { status: 'Cancelled' });
    return !!updated;
  };

  const updateTripDatesAndGuests = async (
    tripId: string,
    startDate: string,
    endDate: string,
    travelersCount: number,
    notes?: string
  ): Promise<boolean> => {
    const updated = await updateTrip(tripId, {
      startDate,
      endDate,
      travelersCount,
      notes: notes !== undefined ? notes : undefined
    });
    return !!updated;
  };

  const deleteTrip = async (tripId: string): Promise<boolean> => {
    const target = trips.find((t) => t.id === tripId);
    const tripTitle = target?.title || 'Custom Trip';
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    try {
      const url = `/api/trips/${encodeURIComponent(tripId)}${userProfile?.email ? `?userEmail=${encodeURIComponent(userProfile.email)}` : ''}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Trip Deleted: "${tripTitle}" has been permanently removed.`, 'info');
        return true;
      }
    } catch (err) {
      console.warn('Error deleting trip:', err);
    }
    showToast(`Trip Deleted: "${tripTitle}" removed from your planner.`, 'info');
    return true;
  };

  // Database Bookings Ledger State & Query
  const [bookingsLedger, setBookingsLedger] = useState<DetailedBookingRecord[]>([]);
  const [isFetchingLedger, setIsFetchingLedger] = useState(false);

  const fetchBookingsLedger = async (): Promise<DetailedBookingRecord[]> => {
    setIsFetchingLedger(true);
    try {
      const url = `/api/db/bookings-ledger${userProfile?.email ? `?userEmail=${encodeURIComponent(userProfile.email)}` : ''}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data.bookings && Array.isArray(data.bookings)) {
          setBookingsLedger(data.bookings);
          setIsFetchingLedger(false);
          return data.bookings;
        }
      }
    } catch (err) {
      console.warn('Could not query database bookings ledger:', err);
    }
    setIsFetchingLedger(false);
    return [];
  };

  const updateBookingStatus = (id: string, status: 'Confirmed' | 'Pending' | 'Cancelled') => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
    fetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch((err) => console.error('Error updating booking status in DB:', err));
    showToast(`Booking status updated to ${status}.`, 'info');
  };

  const addDestination = (newDest: Destination) => {
    setDestinations((prev) => [newDest, ...prev]);
    showToast(`Destination "${newDest.name}" added to live catalog!`, 'success');
  };

  const requestGpsLocation = async (silent: boolean = false): Promise<{ lat: number; lng: number; name?: string; isLiveGps?: boolean } | null> => {
    if (!navigator.geolocation) {
      if (!silent) showToast('Geolocation is not supported by your browser.', 'error');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: 'Your Current Live Location',
            isLiveGps: true
          };
          setUserLocation(loc);
          try {
            localStorage.setItem('tripnest_user_gps', JSON.stringify(loc));
          } catch {
            // Ignore
          }
          if (!silent) showToast('GPS position locked! Pointing map directly to your live coordinates.', 'success');
          resolve(loc);
        },
        async (err) => {
          console.warn('Geolocation error:', err);
          // Try IP fallback
          try {
            const res = await fetch('https://ipapi.co/json/');
            if (res.ok) {
              const data = await res.json();
              if (data.latitude && data.longitude) {
                const loc = {
                  lat: data.latitude,
                  lng: data.longitude,
                  name: `${data.city || 'Your Area'}, ${data.region || data.country_name || 'Live Area'}`,
                  isLiveGps: true
                };
                setUserLocation(loc);
                try {
                  localStorage.setItem('tripnest_user_gps', JSON.stringify(loc));
                } catch {
                  // Ignore
                }
                if (!silent) showToast(`Located your approximate area: ${loc.name}`, 'success');
                resolve(loc);
                return;
              }
            }
          } catch {
            // Ignore
          }

          if (!silent) showToast('Unable to lock GPS. Using active scenic coordinates.', 'info');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  return (
    <AppContext.Provider
      value={{
        currency,
        setCurrency: handleSetCurrency,
        formatPrice,
        convertPrice,
        destinations,
        hotels,
        experiences,
        addDestination,
        bookings,
        addBooking,
        cancelBooking,
        deleteBooking,
        updateBookingStatus,
        trips,
        createTrip,
        updateTrip,
        cancelTrip,
        deleteTrip,
        updateTripDatesAndGuests,
        bookingsLedger,
        fetchBookingsLedger,
        isFetchingLedger,
        userLocation,
        setUserLocation,
        requestGpsLocation,
        activeTab,
        setActiveTab,
        unreadNotificationCount,
        setUnreadNotificationCount,
        viewedTrip,
        setViewedTrip,
        openTripDetailPage,
        backToMyTrips,
        selectedDestinationDetail,
        setSelectedDestinationDetail,
        viewDestinationDetails,
        backToDestinations,
        fetchAiDestinationGuide,
        isGeneratingAiDestination,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        isAiConciergeOpen: isAiConciergeOpenState,
        setIsAiConciergeOpen,
        aiInitialPrompt,
        openAiWithPrompt,
        selectedDestinationModal,
        setSelectedDestinationModal,
        selectedHotelBooking: selectedHotelBookingState,
        setSelectedHotelBooking,
        selectedExperienceBooking: selectedExperienceBookingState,
        setSelectedExperienceBooking,
        customPlan,
        setCustomPlan,
        userProfile,
        isAuthenticated: !!userProfile,
        isGuest,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        loginUser,
        logoutUser,
        updateUserPoints,
        isSignOutConfirmOpen,
        requestSignOut,
        confirmSignOut,
        cancelSignOut,
        continueAsGuest,
        toasts,
        showToast,
        dismissToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

