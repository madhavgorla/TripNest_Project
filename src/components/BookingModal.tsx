import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CURRENCY_CONFIGS } from '../data/seedData';
import { RoomTier } from '../types';
import {
  X,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Building,
  ArrowRight,
  Info
} from 'lucide-react';

export const BookingModal: React.FC = () => {
  const {
    selectedHotelBooking,
    setSelectedHotelBooking,
    selectedExperienceBooking,
    setSelectedExperienceBooking,
    currency,
    formatPrice,
    convertPrice,
    addBooking,
    setActiveTab,
    userProfile,
    openAuthModal,
    showToast
  } = useApp();

  const isHotel = !!selectedHotelBooking;
  const isExp = !!selectedExperienceBooking;

  if (!isHotel && !isExp) return null;

  const item = selectedHotelBooking || selectedExperienceBooking!;

  // Hotel state
  const hotel = selectedHotelBooking;
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
  const activeRoomTier: RoomTier | undefined = hotel?.roomTiers?.[selectedTierIndex];

  // Experience state
  const exp = selectedExperienceBooking;
  const [selectedSlot, setSelectedSlot] = useState<string>(exp?.availableSlots?.[0] || '10:00 AM');

  // Common booking state
  const [checkInDate, setCheckInDate] = useState('2026-09-15');
  const [checkOutDate, setCheckOutDate] = useState('2026-09-18');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculations
  const calculateNights = (): number => {
    try {
      const d1 = new Date(checkInDate);
      const d2 = new Date(checkOutDate);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 3;
    }
  };

  const nights = isHotel ? calculateNights() : 1;
  const baseRatePerUnit = isHotel
    ? activeRoomTier?.pricePerNightUsd || hotel!.pricePerNightUsd
    : exp!.priceUsd;

  const subtotalUsd = isHotel ? baseRatePerUnit * nights : baseRatePerUnit * guestCount;
  const taxesAndServiceUsd = Math.round(subtotalUsd * 0.12);
  const grandTotalUsd = subtotalUsd + taxesAndServiceUsd;

  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      openAuthModal('login');
      showToast('Please sign in or create an account to book your reservation.', 'info');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      if (isHotel) {
        addBooking({
          type: 'hotel',
          itemId: hotel!.id,
          itemName: hotel!.name,
          destinationName: hotel!.destinationName,
          roomTierName: activeRoomTier?.name || 'Deluxe Suite',
          checkInDate,
          checkOutDate,
          guestsCount: guestCount,
          totalPriceUsd: grandTotalUsd,
          paidCurrency: currency,
          paidAmount: convertPrice(grandTotalUsd),
          guestName: userProfile.name,
          guestEmail: userProfile.email,
          specialRequests,
          image: activeRoomTier?.image || hotel!.image,
          address: hotel!.address
        });
        setSelectedHotelBooking(null);
      } else {
        addBooking({
          type: 'experience',
          itemId: exp!.id,
          itemName: exp!.title,
          destinationName: exp!.destinationName,
          slotTime: selectedSlot,
          checkInDate,
          guestsCount: guestCount,
          totalPriceUsd: grandTotalUsd,
          paidCurrency: currency,
          paidAmount: convertPrice(grandTotalUsd),
          guestName: userProfile.name,
          guestEmail: userProfile.email,
          specialRequests,
          image: exp!.image,
          address: exp!.meetingPoint
        });
        setSelectedExperienceBooking(null);
      }

      setIsProcessing(false);
      setActiveTab('mytrips');
    }, 900);
  };

  return (
    <div
      id="booking-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={() => {
        setSelectedHotelBooking(null);
        setSelectedExperienceBooking(null);
      }}
    >
      <div
        id="booking-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative my-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-[#D4A853]/40 bg-[#111827] shadow-2xl shadow-black animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            setSelectedHotelBooking(null);
            setSelectedExperienceBooking(null);
          }}
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-slate-300 hover:bg-[#D4A853] hover:text-[#0B0F19] transition-all border border-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-slate-800 bg-[#0B0F19] p-6 sm:p-8">
          <div className="inline-flex items-center space-x-2 rounded-full border border-[#D4A853]/40 bg-[#111827] px-3 py-1 text-xs font-semibold text-[#E2C076] mb-2">
            <Sparkles className="h-3.5 w-3.5 text-[#D4A853]" />
            <span>Instant VIP Luxury Reservation</span>
          </div>

          <h2 className="text-2xl font-bold text-white font-serif">
            {isHotel ? hotel!.name : exp!.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isHotel ? hotel!.address : `Meeting Point: ${exp!.meetingPoint}`}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmReservation} className="p-6 sm:p-8 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Hotel Room Tier Selection */}
          {isHotel && hotel!.roomTiers && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Select Suite / Room Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hotel!.roomTiers.map((tier, idx) => (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTierIndex(idx)}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition-all flex flex-col justify-between ${
                      selectedTierIndex === idx
                        ? 'border-[#D4A853] bg-[#1E293B] shadow-lg shadow-[#D4A853]/15'
                        : 'border-slate-800 bg-[#0B0F19]/60 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white font-serif">{tier.name}</h4>
                        <span className="text-xs font-bold text-[#D4A853]">
                          {formatPrice(tier.pricePerNightUsd)}/nt
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {tier.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="rounded bg-[#111827] px-2 py-0.5 text-[10px] text-slate-300">
                          {tier.capacity}
                        </span>
                        <span className="rounded bg-[#111827] px-2 py-0.5 text-[10px] text-slate-300">
                          {tier.bedType}
                        </span>
                        <span className="rounded bg-[#111827] px-2 py-0.5 text-[10px] text-slate-300">
                          {tier.sizeSqFt} sq ft
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience Time Slot */}
          {isExp && exp!.availableSlots && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Select Available Departure Slot
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {exp!.availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl border p-3 text-xs font-semibold transition-all text-left ${
                      selectedSlot === slot
                        ? 'border-[#38BDF8] bg-[#1E293B] text-[#38BDF8] shadow-md'
                        : 'border-slate-800 bg-[#0B0F19] text-slate-300 hover:bg-[#1E293B]'
                    }`}
                  >
                    ⏱ {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dates & Guest Count Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {isHotel ? 'Check-In Date' : 'Experience Date'}
              </label>
              <div className="flex items-center rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-white">
                <Calendar className="h-4 w-4 text-[#D4A853] mr-2 shrink-0" />
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {isHotel && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Check-Out Date
                </label>
                <div className="flex items-center rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-white">
                  <Calendar className="h-4 w-4 text-[#D4A853] mr-2 shrink-0" />
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full bg-transparent text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Total Guests
              </label>
              <div className="flex items-center rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-white">
                <Users className="h-4 w-4 text-[#D4A853] mr-2 shrink-0" />
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value={1} className="bg-[#111827]">1 Guest</option>
                  <option value={2} className="bg-[#111827]">2 Guests (VIP Couple)</option>
                  <option value={3} className="bg-[#111827]">3 Guests</option>
                  <option value={4} className="bg-[#111827]">4 Guests</option>
                </select>
              </div>
            </div>
          </div>

          {/* Guest Information Prefill */}
          <div className="rounded-2xl border border-slate-800 bg-[#1E293B]/40 p-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Primary VIP Guest Details
            </h4>
            {userProfile ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Guest Name</span>
                  <span className="font-semibold text-white">{userProfile.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Contact Email</span>
                  <span className="font-semibold text-white">{userProfile.email}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                <span>Sign in required to link this booking voucher to your account.</span>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="rounded-lg bg-[#D4A853] px-3.5 py-1.5 font-bold text-[#0B0F19] hover:brightness-110"
                >
                  Sign In Now
                </button>
              </div>
            )}

            <div className="mt-3">
              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                Special Concierge Requests (Optional)
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="E.g., Champagne on arrival, airport limousine pickup, dietary preferences..."
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] p-2.5 text-xs text-white placeholder-slate-500 focus:border-[#D4A853] focus:outline-none"
              />
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="rounded-2xl border border-[#D4A853]/30 bg-[#0B0F19] p-4 text-xs space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>
                {isHotel
                  ? `${formatPrice(baseRatePerUnit)} × ${nights} Nights`
                  : `${formatPrice(baseRatePerUnit)} × ${guestCount} Guests`}
              </span>
              <span className="font-semibold text-white">{formatPrice(subtotalUsd)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Luxury Resort Tax & Concierge Surcharge (12%)</span>
              <span>{formatPrice(taxesAndServiceUsd)}</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-bold">
              <span className="text-white">Total Amount ({currency})</span>
              <span className="text-base text-[#D4A853]">{formatPrice(grandTotalUsd)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="confirm-reservation-btn"
            disabled={isProcessing}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#B38936] py-3.5 text-sm font-bold text-[#0B0F19] shadow-xl shadow-[#D4A853]/25 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4 text-[#0B0F19]" />
            <span>{isProcessing ? 'Generating VIP Voucher...' : 'Confirm Instant Reservation'}</span>
            <ArrowRight className="h-4 w-4 text-[#0B0F19]" />
          </button>
        </form>
      </div>
    </div>
  );
};
