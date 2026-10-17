import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  QrCode,
  Printer,
  XCircle,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Building,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Compass,
  DollarSign,
  Users,
  X,
  Edit3,
  FileText,
  Eye,
  Lock
} from 'lucide-react';
import { CustomTrip, TripDayItinerary } from '../types';
import { EditTripModal } from './EditTripModal';
import { ConfirmActionModal } from './ConfirmActionModal';
import { SimpleTripCreator } from './SimpleTripCreator';
import { normalizeDayActivities, generateItineraryForDestination, generateItineraryFromTitle } from '../utils/itineraryGenerator';

// Helper to calculate days between two dates (inclusive)
const calculateDaysDifference = (start: string, end: string): number => {
  if (!start || !end) return 3;
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
};

// Helper to add days to an ISO date string (YYYY-MM-DD)
const addDaysToIsoDate = (dateStr: string, days: number): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// Helper to format date preview for day badges
const formatDayLabelDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  } catch {
    return dateStr;
  }
};

interface MyTripsProps {
  initialSubTab?: 'reservations' | 'custom_trips';
}

export const MyTrips: React.FC<MyTripsProps> = ({ initialSubTab = 'reservations' }) => {
  const {
    bookings,
    cancelBooking,
    deleteBooking,
    trips,
    createTrip,
    updateTrip,
    cancelTrip,
    deleteTrip,
    updateTripDatesAndGuests,
    bookingsLedger,
    fetchBookingsLedger,
    formatPrice,
    currency,
    setActiveTab,
    showToast,
    userProfile,
    isAuthenticated,
    openAuthModal,
    openTripDetailPage
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'reservations' | 'custom_trips'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<CustomTrip | null>(null);
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [expandedTripDays, setExpandedTripDays] = useState<Record<string, boolean>>({});

  const toggleTripDayExpand = (dayKey: string) => {
    setExpandedTripDays((prev) => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  // In-App Action Confirmation Modal State (replaces Chrome/browser native alerts)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    targetId: string;
    targetType: 'trip' | 'booking';
    actionType: 'delete' | 'cancel';
    title: string;
    message: string;
    confirmButtonText: string;
  }>({
    isOpen: false,
    targetId: '',
    targetType: 'trip',
    actionType: 'cancel',
    title: '',
    message: '',
    confirmButtonText: ''
  });



  const handlePrint = (bookingCode: string) => {
    showToast(`Generating high-resolution VIP Voucher PDF for [${bookingCode}]...`, 'success');
    window.print();
  };



  const handlePromptDeleteTrip = (trip: CustomTrip) => {
    setConfirmModal({
      isOpen: true,
      targetId: trip.id,
      targetType: 'trip',
      actionType: 'delete',
      title: 'Permanently Delete Trip',
      message: `Are you sure you want to permanently delete trip "${trip.title}" (${trip.destination})? This will remove it from your trips.`,
      confirmButtonText: 'Yes, Delete Trip'
    });
  };

  const handlePromptCancelTrip = (trip: CustomTrip) => {
    setConfirmModal({
      isOpen: true,
      targetId: trip.id,
      targetType: 'trip',
      actionType: 'cancel',
      title: 'Cancel Planned Trip',
      message: `Are you sure you want to cancel trip "${trip.title}" (${trip.destination})? The status will be marked as "Cancelled".`,
      confirmButtonText: 'Yes, Cancel Trip'
    });
  };

  const handlePromptCancelBooking = (booking: any) => {
    setConfirmModal({
      isOpen: true,
      targetId: booking.id,
      targetType: 'booking',
      actionType: 'cancel',
      title: 'Cancel Luxury Reservation',
      message: `Are you sure you wish to cancel your reservation for "${booking.itemName}" (${booking.bookingCode})? This will update the status to "Cancelled".`,
      confirmButtonText: 'Yes, Cancel Stay'
    });
  };

  const handlePromptDeleteBooking = (booking: any) => {
    setConfirmModal({
      isOpen: true,
      targetId: booking.id,
      targetType: 'booking',
      actionType: 'delete',
      title: 'Permanently Delete Record',
      message: `Are you sure you want to permanently delete the reservation record for "${booking.itemName}" (${booking.bookingCode})? This will remove the reservation.`,
      confirmButtonText: 'Yes, Delete Record'
    });
  };

  const handleConfirmAction = async () => {
    const { targetId, targetType, actionType } = confirmModal;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

    if (targetType === 'trip') {
      if (actionType === 'delete') {
        await deleteTrip(targetId);
      } else if (actionType === 'cancel') {
        await cancelTrip(targetId);
      }
    } else if (targetType === 'booking') {
      if (actionType === 'delete') {
        await deleteBooking(targetId);
      } else if (actionType === 'cancel') {
        cancelBooking(targetId);
      }
    }
  };

  if (!isAuthenticated || !userProfile?.email) {
    return (
      <div id="my-trips-module" className="w-full bg-[#0B0F19] py-16 border-t border-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-b border-slate-800 pb-6 mb-10 text-left">
            <h2 className="text-2xl sm:text-4xl font-bold text-white font-serif tracking-tight text-left">
              My Trips & Reservations
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl font-light text-left">
              Manage your verified luxury hotel vouchers, custom planned travel itineraries, and delete or create trips.
            </p>
          </div>

          <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 rounded-3xl bg-[#0E1726]/90 border border-[#E2C076]/30 backdrop-blur-2xl text-center shadow-2xl">
            <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-[#E2C076]/15 border border-[#E2C076]/30 flex items-center justify-center text-[#E2C076]">
              <Lock className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">Sign In Required</h3>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
              Your booked reservations, luxury hotel vouchers, and custom travel itineraries are private and tied to your registered account. Please sign in to view and manage your trips.
            </p>
            <button
              onClick={() => openAuthModal()}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-[#E2C076] to-[#D4A853] text-[#070B14] font-extrabold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#E2C076]/20 inline-flex items-center justify-center space-x-2"
            >
              <Ticket className="h-4 w-4" />
              <span>Sign In to Access Trips</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="my-trips-module" className="w-full bg-[#0B0F19] py-12 border-t border-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white font-serif tracking-tight">
              My Trips & Reservations
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl font-light">
              Manage your verified luxury hotel vouchers, custom planned travel itineraries, and delete or create trips.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreateTripModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#B38936] px-4 py-2.5 text-xs font-bold text-[#0B0F19] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#D4A853]/20"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Trip</span>
            </button>
            <button
              onClick={() => setActiveTab('hotels')}
              className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-[#111827] px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:border-[#D4A853] transition-all"
            >
              <span>Explore Stays</span>
              <ChevronRight className="h-4 w-4 text-[#D4A853]" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
          <button
            id="subtab-reservations-btn"
            onClick={() => setActiveSubTab('reservations')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeSubTab === 'reservations'
                ? 'bg-[#1E293B] text-[#D4A853] border border-[#D4A853]/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ticket className="h-4 w-4" />
            <span>Hotel & Villa Stays ({bookings.length})</span>
          </button>

          <button
            id="subtab-custom-trips-btn"
            onClick={() => setActiveSubTab('custom_trips')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeSubTab === 'custom_trips'
                ? 'bg-[#1E293B] text-[#D4A853] border border-[#D4A853]/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Custom Planned Trips ({trips.length})</span>
          </button>
        </div>

        {/* Tab 1: Reservations List */}
        {activeSubTab === 'reservations' && (
          <div className="mt-8 space-y-6">
            {bookings.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-[#111827] p-12 text-center text-slate-400">
                <Ticket className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                <h3 className="text-lg font-bold text-white font-serif">No Active Reservations</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  You haven't reserved any 5-star suites or VIP experiences yet. Explore our curated collections.
                </p>
                <button
                  onClick={() => setActiveTab('hotels')}
                  className="mt-4 rounded-xl bg-[#D4A853] px-5 py-2.5 text-xs font-bold text-[#0B0F19]"
                >
                  Browse 5-Star Catalog
                </button>
              </div>
            ) : (
              bookings.map((booking) => {
                const isConfirmed = booking.status === 'Confirmed';
                const isCancelled = booking.status === 'Cancelled';

                return (
                  <div
                    key={booking.id}
                    id={`booking-card-${booking.id}`}
                    className={`overflow-hidden rounded-3xl border transition-all ${
                      isCancelled
                        ? 'border-slate-800 bg-[#111827]/40 opacity-70'
                        : 'border-slate-800 bg-[#111827] hover:border-[#D4A853]/50 shadow-xl'
                    }`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12">
                      {/* Left Details Section */}
                      <div className="p-6 sm:p-8 lg:col-span-8 flex flex-col justify-between">
                        <div>
                          {/* Top Meta Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                            <div className="flex items-center space-x-2">
                              <span className="rounded-md bg-[#1E293B] px-2.5 py-1 text-xs font-mono font-bold text-[#D4A853] border border-slate-700">
                                {booking.bookingCode}
                              </span>
                              <span className="text-xs text-slate-400 font-light">
                                Reserved: {new Date(booking.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              {isConfirmed && (
                                <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>Confirmed Stay</span>
                                </span>
                              )}
                              {isCancelled && (
                                <span className="inline-flex items-center space-x-1 rounded-full bg-rose-950/60 border border-rose-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Cancelled</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hotel Name & Destination */}
                          <div className="mt-4">
                            <div className="flex items-center space-x-1.5 text-xs text-[#D4A853]">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{booking.destinationName}</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white font-serif mt-1">
                              {booking.itemName}
                            </h3>
                            {booking.roomTierName && (
                              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                                Tier: <span className="text-amber-200">{booking.roomTierName}</span>
                              </p>
                            )}
                          </div>

                          {/* Check-in / Check-out Grid */}
                          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-2xl bg-[#0B0F19] p-4 border border-slate-800/80">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                                Check-In Date
                              </span>
                              <span className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5 block">
                                {booking.checkInDate}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                                Check-Out Date
                              </span>
                              <span className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5 block">
                                {booking.checkOutDate || 'Single Day'}
                              </span>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                              <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                                Guests & Suites
                              </span>
                              <span className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5 block">
                                {booking.guestsCount} Guest(s)
                              </span>
                            </div>
                          </div>

                          {booking.specialRequests && (
                            <div className="mt-3 text-xs text-slate-400 italic">
                              <span className="text-slate-300 font-semibold not-italic">VIP Note:</span>{' '}
                              "{booking.specialRequests}"
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions Bar */}
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                              Total Paid ({booking.paidCurrency})
                            </span>
                            <span className="text-lg font-bold text-white">
                              {booking.paidCurrency} {booking.paidAmount.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handlePrint(booking.bookingCode)}
                              className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-[#1E293B] px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:border-[#D4A853] transition-colors"
                            >
                              <Printer className="h-3.5 w-3.5 text-[#D4A853]" />
                              <span>Print Voucher</span>
                            </button>

                            {isConfirmed && (
                              <button
                                id={`cancel-reservation-btn-${booking.id}`}
                                onClick={() => handlePromptCancelBooking(booking)}
                                className="flex items-center space-x-1.5 rounded-xl border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-900/40 transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Cancel Stay</span>
                              </button>
                            )}

                            <button
                              id={`delete-reservation-btn-${booking.id}`}
                              onClick={() => handlePromptDeleteBooking(booking)}
                              className="flex items-center space-x-1.5 rounded-xl border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 transition-colors"
                              title="Delete reservation permanently"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                              <span>Delete Record</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Voucher Pass Stub (QR Code) */}
                      <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-dashed border-slate-800 bg-[#0B0F19]/90 p-6 flex flex-col items-center justify-center text-center">
                        <div className="rounded-2xl border-2 border-[#D4A853]/40 bg-white p-3 shadow-xl">
                          <div className="h-32 w-32 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-center p-2 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#D4A853]/20 to-transparent" />
                            <QrCode className="h-16 w-16 text-[#D4A853] mb-1" />
                            <span className="text-[9px] font-mono text-slate-300">
                              {booking.bookingCode}
                            </span>
                          </div>
                        </div>

                        <span className="mt-3 text-xs font-bold text-white font-mono uppercase tracking-wider">
                          VIP Concierge Scan
                        </span>
                        <p className="text-[11px] text-slate-400 max-w-[200px] mt-1">
                          Present this digital pass at the reception desk for priority suite check-in.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Custom Planned Trips List */}
        {activeSubTab === 'custom_trips' && (
          <div className="mt-8 space-y-6">
            {trips.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-[#111827] p-12 text-center text-slate-400">
                <Compass className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                <h3 className="text-lg font-bold text-white font-serif">No Custom Trips Created Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Create custom itineraries, set budgets, and plan your luxury getaways with our trip builder.
                </p>
                <button
                  onClick={() => setIsCreateTripModalOpen(true)}
                  className="mt-4 rounded-xl bg-[#D4A853] px-5 py-2.5 text-xs font-bold text-[#0B0F19]"
                >
                  + Create Your First Trip
                </button>
              </div>
            ) : (
              trips.map((trip) => {
                const calculatedDays = calculateDaysDifference(trip.startDate, trip.endDate);
                const daysToDisplay = (trip.itinerary && trip.itinerary.length > 0)
                  ? trip.itinerary
                  : generateItineraryFromTitle(trip.title, trip.destination, calculatedDays, trip.startDate).itinerary;

                return (
                  <div
                    key={trip.id}
                    id={`trip-card-${trip.id}`}
                    className="overflow-hidden rounded-3xl border border-slate-800 bg-[#111827] hover:border-[#D4A853]/50 transition-all shadow-xl p-6 sm:p-7 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header Row: Destination & Trip ID & Status */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="inline-flex items-center space-x-1.5 rounded-full bg-orange-950/40 px-3 py-1 text-xs font-semibold text-orange-400 border border-orange-500/30">
                            <MapPin className="h-3.5 w-3.5 text-orange-400" />
                            <span>{trip.destination}</span>
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            Trip ID: <span className="text-slate-300">{trip.id}</span>
                          </span>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                            trip.status === 'Cancelled'
                              ? 'bg-rose-950/60 border-rose-800/60 text-rose-400'
                              : 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                          }`}
                        >
                          {trip.status || 'Active'}
                        </span>
                      </div>

                      {/* Title & Notes */}
                      <h3 className="text-xl sm:text-2xl font-bold text-white font-serif mt-3">
                        {trip.title}
                      </h3>

                      {trip.notes && (
                        <p className="text-xs text-slate-300 mt-2 font-light">
                          {trip.notes}
                        </p>
                      )}

                      {/* Metadata Cards: Dates, Budget, Travelers */}
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl bg-[#0B0F19] p-4 border border-slate-800">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                              Dates
                            </span>
                            <button
                              onClick={() => {
                                setTripToEdit(trip);
                                setIsEditTripModalOpen(true);
                              }}
                              className="text-[10px] text-[#D4A853] hover:underline flex items-center space-x-0.5 font-semibold"
                              title="Edit Dates"
                            >
                              <Edit3 className="h-2.5 w-2.5" />
                              <span>Edit</span>
                            </button>
                          </div>
                          <span className="text-xs font-semibold text-slate-200 mt-0.5 block">
                            {trip.startDate ? `${trip.startDate} to ${trip.endDate || 'TBD'}` : 'Flexible dates'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                            Estimated Budget
                          </span>
                          <span className="text-xs font-semibold text-[#D4A853] mt-0.5 block">
                            {trip.budgetCurrency || 'INR'} {(trip.budgetAmount || 0).toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                              Travelers
                            </span>
                            <button
                              onClick={() => {
                                setTripToEdit(trip);
                                setIsEditTripModalOpen(true);
                              }}
                              className="text-[10px] text-[#D4A853] hover:underline flex items-center space-x-0.5 font-semibold"
                              title="Edit Guests"
                            >
                              <Edit3 className="h-2.5 w-2.5" />
                              <span>Edit</span>
                            </button>
                          </div>
                          <span className="text-xs font-semibold text-slate-200 mt-0.5 block">
                            {trip.travelersCount || 1} Guest(s)
                          </span>
                        </div>
                      </div>

                      {/* Day-by-Day Itinerary Schedule with Timings & Activities */}
                      <div className="mt-5 rounded-2xl border border-orange-900/40 bg-[#0B0F19] p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-800">
                          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center space-x-1.5">
                            <Calendar className="h-4 w-4 text-orange-400" />
                            <span>Planned Itinerary ({daysToDisplay.length} Days)</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Destination: <span className="text-slate-200 font-semibold">{trip.destination}</span>
                          </span>
                        </div>

                        <div className="space-y-3">
                          {daysToDisplay.map((dayPlan, dayIdx) => {
                            const { theme, activities } = normalizeDayActivities(dayPlan, dayIdx, trip.destination, trip.title);
                            const dayNumber = dayPlan.day || dayIdx + 1;
                            const dayKey = `${trip.id}-day-${dayNumber}`;
                            const isExpanded = expandedTripDays[dayKey] || false;
                            const activitiesToShow = isExpanded ? activities : activities.slice(0, 3);

                            return (
                              <div
                                key={dayKey}
                                className="flex items-stretch rounded-xl bg-[#111827] border border-slate-800 text-xs overflow-hidden shadow-xs hover:border-orange-500/30 transition-colors"
                              >
                                {/* Left Orange Vertical Badge */}
                                <div className="w-12 sm:w-14 shrink-0 bg-[#EA580C] flex items-center justify-center py-3 select-none">
                                  <span className="text-white font-extrabold text-[11px] tracking-widest uppercase -rotate-90 whitespace-nowrap">
                                    DAY {dayNumber}
                                  </span>
                                </div>

                                {/* Right Schedule Content */}
                                <div className="flex-1 p-3 sm:p-4">
                                  {/* Header: Time | Activity - Theme */}
                                  <div className="flex items-center pb-2 border-b border-dotted border-orange-500/30 text-xs font-bold text-white">
                                    <span className="w-24 sm:w-28 shrink-0 text-slate-400">Time</span>
                                    <span className="flex-1 text-orange-300">
                                      Activity - {theme}
                                    </span>
                                  </div>

                                  {/* Activity Slots with Exact Timings */}
                                  <div className="divide-y divide-dotted divide-slate-800/80 mt-1">
                                    {activitiesToShow.map((act, actIdx) => (
                                      <div
                                        key={act.id || `act-${actIdx}`}
                                        className="flex items-start py-1.5 text-xs text-slate-300 leading-snug"
                                      >
                                        <span className="w-24 sm:w-28 shrink-0 font-semibold text-slate-400 font-mono text-[11px]">
                                          {act.time}
                                        </span>
                                        <span className="flex-1 font-normal text-slate-200">
                                          {act.activity}
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Expand / Collapse More Activities Toggle */}
                                  {activities.length > 3 && (
                                    <div className="pt-2 border-t border-slate-800/50 mt-1 flex items-center justify-between">
                                      <button
                                        type="button"
                                        onClick={() => toggleTripDayExpand(dayKey)}
                                        className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold underline transition-colors"
                                      >
                                        {isExpanded
                                          ? 'Show fewer activities'
                                          : `+ View all ${activities.length} scheduled activities`}
                                      </button>
                                      <span className="text-[10px] text-slate-500">
                                        {activities.length} items total
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                      <button
                        onClick={() => setActiveTab('planner')}
                        className="text-xs font-semibold text-[#D4A853] hover:underline flex items-center space-x-1"
                      >
                        <span>Open Itinerary Schedule</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          id={`view-trip-page-btn-${trip.id}`}
                          onClick={() => openTripDetailPage(trip)}
                          className="flex items-center space-x-1.5 rounded-xl border border-[#D4A853]/40 bg-[#D4A853]/15 px-3 py-1.5 text-xs font-bold text-[#D4A853] hover:bg-[#D4A853] hover:text-[#0B0F19] transition-all shadow-sm"
                          title="Open dedicated trip page"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Open Full Page</span>
                        </button>

                        <button
                          id={`edit-trip-btn-${trip.id}`}
                          onClick={() => {
                            setTripToEdit(trip);
                            setIsEditTripModalOpen(true);
                          }}
                          className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:border-[#D4A853] transition-colors"
                          title="Update dates and guests"
                        >
                          <Calendar className="h-3.5 w-3.5 text-[#D4A853]" />
                          <span>Edit Dates / Guests</span>
                        </button>

                        {trip.status !== 'Cancelled' ? (
                          <button
                            id={`cancel-trip-btn-${trip.id}`}
                            onClick={() => handlePromptCancelTrip(trip)}
                            className="flex items-center space-x-1.5 rounded-xl border border-amber-900/50 bg-amber-950/30 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 transition-colors"
                            title="Cancel this trip"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Cancel Trip</span>
                          </button>
                        ) : (
                          <button
                            id={`reactivate-trip-btn-${trip.id}`}
                            onClick={async () => {
                              await updateTrip(trip.id, { status: 'Active' });
                            }}
                            className="flex items-center space-x-1.5 rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 transition-colors"
                            title="Reactivate this trip"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Reactivate Trip</span>
                          </button>
                        )}

                        <button
                          id={`delete-trip-btn-${trip.id}`}
                          onClick={() => handlePromptDeleteTrip(trip)}
                          className="flex items-center space-x-1.5 rounded-xl border border-rose-900/50 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/50 transition-colors"
                          title="Permanently delete this trip"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                          <span>Delete Trip</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* EDIT TRIP MODAL (Dates & Guests) */}
      <EditTripModal
        trip={tripToEdit}
        isOpen={isEditTripModalOpen}
        onClose={() => {
          setIsEditTripModalOpen(false);
          setTripToEdit(null);
        }}
        onSave={async (tripId, startDate, endDate, travelersCount, notes) => {
          return await updateTripDatesAndGuests(tripId, startDate, endDate, travelersCount, notes);
        }}
      />

      {/* CUSTOM IN-APP CONFIRMATION MODAL (No Chrome/Browser Dialogs) */}
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        actionType={confirmModal.actionType}
        confirmButtonText={confirmModal.confirmButtonText}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* SIMPLE TRIP CREATOR MODAL */}
      <SimpleTripCreator
        isOpen={isCreateTripModalOpen}
        onClose={() => setIsCreateTripModalOpen(false)}
        onSubmit={async (tripData) => {
          const created = await createTrip(tripData);
          if (created) {
            openTripDetailPage(created);
            return true;
          }
          return false;
        }}
        currency={currency}
        defaultDestination="Kashmir Valley"
      />

      {/* End of Modals */}
    </div>
  );
};
