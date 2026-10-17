import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Printer,
  Share2,
  Bot,
  ExternalLink,
  Sun,
  Luggage,
  Check,
  X,
  AlertCircle,
  Eye,
  FileText,
  Wallet,
  FolderLock
} from 'lucide-react';
import { CustomTrip, TripDayItinerary, TripTimeSlotActivity } from '../types';
import { EditTripModal } from './EditTripModal';
import { ConfirmActionModal } from './ConfirmActionModal';
import { isProminentHighDestination, generateItineraryFromTitle, normalizeDayActivities } from '../utils/itineraryGenerator';

export const TripDetailPage: React.FC = () => {
  const {
    viewedTrip,
    trips,
    backToMyTrips,
    setActiveTab,
    formatPrice,
    updateTrip,
    cancelTrip,
    deleteTrip,
    openAiWithPrompt,
    updateTripDatesAndGuests,
    showToast,
    hotels,
    experiences
  } = useApp();

  // Fallback to first trip if viewedTrip not set
  const currentTrip: CustomTrip | null = viewedTrip || (trips.length > 0 ? trips[0] : null);

  const [selectedDayTab, setSelectedDayTab] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Helper for period tagging
  const getTimePeriodBadge = (timeStr: string) => {
    const lower = (timeStr || '').toLowerCase();
    if (lower.includes('am') || lower.includes('06:') || lower.includes('07:') || lower.includes('08:') || lower.includes('09:') || lower.includes('10:') || lower.includes('11:')) {
      return { label: 'Morning Slot', period: 'Morning', color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' };
    }
    if (lower.includes('12:') || lower.includes('01:') || lower.includes('02:') || lower.includes('03:') || lower.includes('04:') || lower.includes('05:')) {
      return { label: 'Afternoon Slot', period: 'Afternoon', color: 'text-sky-300 border-sky-500/30 bg-sky-500/10' };
    }
    return { label: 'Evening Slot', period: 'Evening', color: 'text-purple-300 border-purple-500/30 bg-purple-500/10' };
  };

  // Completed activity tracker state (keyed by activity id)
  const [completedSlots, setCompletedSlots] = useState<Record<string, boolean>>({});

  // Inline activity editor state
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<string>('');
  const [editingText, setEditingText] = useState<string>('');

  // Inline new activity slot state
  const [isAddingSlotDay, setIsAddingSlotDay] = useState<number | null>(null);
  const [newSlotTime, setNewSlotTime] = useState<string>('03:00 PM');
  const [newSlotText, setNewSlotText] = useState<string>('');

  // Inline day theme editor state
  const [editingThemeDay, setEditingThemeDay] = useState<number | null>(null);
  const [editingThemeText, setEditingThemeText] = useState<string>('');

  // Packing list state
  const isAlpine = currentTrip?.destination.toLowerCase().includes('kashmir') ||
    currentTrip?.destination.toLowerCase().includes('swiss') ||
    currentTrip?.destination.toLowerCase().includes('manali') ||
    currentTrip?.destination.toLowerCase().includes('ladakh');

  const isBeach = currentTrip?.destination.toLowerCase().includes('goa') ||
    currentTrip?.destination.toLowerCase().includes('bali') ||
    currentTrip?.destination.toLowerCase().includes('maldives') ||
    currentTrip?.destination.toLowerCase().includes('phuket');

  const defaultPackingItems = isAlpine
    ? [
        { id: 'p1', label: 'Thermal inners & fleece jackets' },
        { id: 'p2', label: 'Waterproof snow / trekking boots' },
        { id: 'p3', label: 'UV Polarized sunglasses' },
        { id: 'p4', label: 'Lip balm & high-altitude moisturizer' },
        { id: 'p5', label: 'Camera wide-angle lens for valleys & lakes' }
      ]
    : isBeach
    ? [
        { id: 'p1', label: 'UV Sunscreen SPF 50+ & Aloe Vera' },
        { id: 'p2', label: 'Bespoke swimwear & linen shirts' },
        { id: 'p3', label: 'Snorkel gear / waterproof dry bag' },
        { id: 'p4', label: 'Polarized sunglasses & straw sunhat' },
        { id: 'p5', label: 'Evening resort-casual dress / loafers' }
      ]
    : [
        { id: 'p1', label: 'Universal power adapter & power bank' },
        { id: 'p2', label: 'Comfortable luxury walking shoes' },
        { id: 'p3', label: 'Light jacket for conditioned museums & evenings' },
        { id: 'p4', label: 'Government ID & travel insurance vouchers' },
        { id: 'p5', label: 'Noise-cancelling headphones for transit' }
      ];

  const [checkedPacking, setCheckedPacking] = useState<Record<string, boolean>>({});

  if (!currentTrip) {
    return (
      <div className="min-h-screen bg-[#070B14] text-white px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-[#E2C076]/10 border border-[#E2C076]/30 flex items-center justify-center text-[#E2C076] mb-4">
          <Calendar className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-white mb-2">No Active Trip Selected</h2>
        <p className="text-sm text-neutral-400 max-w-md mb-6">
          Select an existing journey from your trips dashboard or create a new bespoke itinerary.
        </p>
        <button
          onClick={backToMyTrips}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E2C076] to-[#D4AF37] text-[#070B14] font-bold text-sm hover:brightness-110 transition shadow-lg shadow-[#E2C076]/20"
        >
          ← Return to My Trips
        </button>
      </div>
    );
  }

  const isProminent = isProminentHighDestination(currentTrip.destination) || isProminentHighDestination(currentTrip.title);

  // Normalize days
  const days: TripDayItinerary[] = (currentTrip.itinerary && currentTrip.itinerary.length > 0)
    ? currentTrip.itinerary
    : [
        {
          day: 1,
          date: currentTrip.startDate,
          theme: `${currentTrip.destination} Arrival & Discovery`,
          title: `${currentTrip.destination} Arrival & Discovery`,
          description: '',
          activities: [
            { id: 'slot-1', time: '09:30 AM', activity: '' },
            { id: 'slot-2', time: '01:00 PM', activity: '' },
            { id: 'slot-3', time: '06:00 PM', activity: '' }
          ]
        }
      ];

  // Helper to persist updated days
  const saveUpdatedDays = async (newDays: TripDayItinerary[]) => {
    await updateTrip(currentTrip.id, { itinerary: newDays });
    try {
      await fetch(`/api/iternary/${encodeURIComponent(currentTrip.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: currentTrip.id,
          userEmail: currentTrip.userEmail,
          title: currentTrip.title,
          destination: currentTrip.destination,
          days: newDays
        })
      });
    } catch (e) {
      console.warn('Sync itinerary to /api/iternary:', e);
    }
  };

  // Activity checkbox toggle
  const toggleSlotCompleted = (slotId: string) => {
    setCompletedSlots((prev) => ({ ...prev, [slotId]: !prev[slotId] }));
  };

  // Start editing a slot
  const handleStartEditSlot = (act: TripTimeSlotActivity) => {
    setEditingSlotId(act.id || null);
    setEditingTime(act.time);
    setEditingText(act.activity);
  };

  // Save edited slot
  const handleSaveEditSlot = async (dayIndex: number, actIndex: number) => {
    const copy = [...days];
    const targetDay = { ...copy[dayIndex] };
    const acts = [...(targetDay.activities || [])];
    acts[actIndex] = {
      ...acts[actIndex],
      time: editingTime.trim() || acts[actIndex].time,
      activity: editingText.trim()
    };
    targetDay.activities = acts;
    targetDay.description = acts.map((a) => `${a.time} - ${a.activity}`).filter(Boolean).join('\n');
    copy[dayIndex] = targetDay;
    await saveUpdatedDays(copy);
    setEditingSlotId(null);
    showToast('Activity slot updated!', 'success');
  };

  // Delete slot
  const handleDeleteSlot = async (dayIndex: number, actIndex: number) => {
    const copy = [...days];
    const targetDay = { ...copy[dayIndex] };
    const acts = (targetDay.activities || []).filter((_, idx) => idx !== actIndex);
    targetDay.activities = acts;
    targetDay.description = acts.map((a) => `${a.time} - ${a.activity}`).filter(Boolean).join('\n');
    copy[dayIndex] = targetDay;
    await saveUpdatedDays(copy);
    showToast('Activity slot removed.', 'info');
  };

  // Add new activity slot
  const handleAddNewSlot = async (dayIndex: number) => {
    if (!newSlotText.trim()) {
      showToast('Please enter an activity description', 'error');
      return;
    }
    const copy = [...days];
    const targetDay = { ...copy[dayIndex] };
    const acts = [...(targetDay.activities || [])];
    acts.push({
      id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: newSlotTime.trim() || '03:00 PM',
      activity: newSlotText.trim()
    });
    targetDay.activities = acts;
    targetDay.description = acts.map((a) => `${a.time} - ${a.activity}`).filter(Boolean).join('\n');
    copy[dayIndex] = targetDay;
    await saveUpdatedDays(copy);
    setIsAddingSlotDay(null);
    setNewSlotText('');
    showToast('New activity slot added to itinerary!', 'success');
  };

  // Edit theme
  const handleSaveTheme = async (dayIndex: number) => {
    const copy = [...days];
    copy[dayIndex] = {
      ...copy[dayIndex],
      theme: editingThemeText.trim() || copy[dayIndex].theme,
      title: editingThemeText.trim() || copy[dayIndex].title
    };
    await saveUpdatedDays(copy);
    setEditingThemeDay(null);
    showToast('Day theme updated!', 'success');
  };

  // Add extra day
  const handleAddExtraDay = async () => {
    const nextDayNum = days.length + 1;
    const { itinerary } = generateItineraryFromTitle(
      currentTrip.title,
      currentTrip.destination,
      nextDayNum,
      currentTrip.startDate
    );
    const newDay = itinerary[itinerary.length - 1] || {
      day: nextDayNum,
      theme: `Day ${nextDayNum} Exploration`,
      title: `Day ${nextDayNum} Schedule`,
      description: '',
      activities: [
        { id: `slot-d${nextDayNum}-1`, time: '09:00 AM', activity: '' },
        { id: `slot-d${nextDayNum}-2`, time: '02:00 PM', activity: '' },
        { id: `slot-d${nextDayNum}-3`, time: '07:30 PM', activity: '' }
      ]
    };
    const updatedDays = [...days, newDay];
    await saveUpdatedDays(updatedDays);
    setSelectedDayTab(nextDayNum);
    showToast(`Day ${nextDayNum} added to itinerary!`, 'success');
  };

  // Quick fill blank slots with authentic suggestions
  const handleFillBlanksWithAi = async (dayIndex: number) => {
    const targetDay = days[dayIndex];
    const generated = generateItineraryFromTitle(currentTrip.title, currentTrip.destination, days.length, currentTrip.startDate, true);
    const matchingGen = generated.itinerary[dayIndex];
    if (matchingGen && matchingGen.activities) {
      const copy = [...days];
      copy[dayIndex] = {
        ...targetDay,
        theme: targetDay.theme || matchingGen.theme,
        title: targetDay.title || matchingGen.title,
        activities: matchingGen.activities
      };
      await saveUpdatedDays(copy);
      showToast(`Activities filled with verified recommendations for ${currentTrip.destination}!`, 'success');
    }
  };

  // Share itinerary
  const handleShareItinerary = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Check out my trip to ${currentTrip.destination}: "${currentTrip.title}" planned on TripNest!`
      );
      showToast('Trip link & summary copied to clipboard!', 'success');
    }
  };

  // Print itinerary
  const handlePrint = () => {
    window.print();
  };

  // Destination linked recommendations
  const nearbyHotels = hotels.filter((h) =>
    h.destinationName.toLowerCase().includes(currentTrip.destination.toLowerCase()) ||
    currentTrip.destination.toLowerCase().includes(h.destinationName.toLowerCase())
  ).slice(0, 2);

  const nearbyExperiences = experiences.filter((e) =>
    e.destinationName.toLowerCase().includes(currentTrip.destination.toLowerCase()) ||
    currentTrip.destination.toLowerCase().includes(e.destinationName.toLowerCase())
  ).slice(0, 2);

  const totalActivitiesCount = days.reduce((acc, d) => acc + (d.activities?.length || 0), 0);
  const totalCompletedCount = Object.values(completedSlots).filter(Boolean).length;

  return (
    <div id="trip-detail-page" className="min-h-screen bg-[#070B14] text-white pb-28 selection:bg-[#E2C076]/30">
      {/* Top Breadcrumb & Actions Bar */}
      <nav className="sticky top-16 z-30 border-b border-[#E2C076]/20 bg-[#070B14]/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3.5 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              id="back-to-mytrips-btn"
              onClick={backToMyTrips}
              className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-neutral-300 hover:text-[#E2C076] transition"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-[#E2C076]/50">
                <ChevronLeft className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline">My Trips</span>
            </button>
            <span className="text-neutral-600 text-xs">/</span>
            <span className="text-xs sm:text-sm font-bold text-[#E2C076] truncate max-w-[180px] sm:max-w-xs">
              {currentTrip.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                openAiWithPrompt(
                  `Provide personalized travel advice, top restaurants, and hidden gems for my trip to ${currentTrip.destination}: "${currentTrip.title}".`
                )
              }
              className="flex items-center gap-1.5 rounded-lg border border-[#E2C076]/40 bg-[#E2C076]/10 px-3 py-1.5 text-xs font-semibold text-[#E2C076] hover:bg-[#E2C076] hover:text-[#070B14] transition shadow-sm"
              title="Ask AI Concierge about this trip"
            >
              <Bot className="h-3.5 w-3.5" />
              <span className="hidden md:inline">AI Concierge</span>
            </button>

            <button
              onClick={handleShareItinerary}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-300 hover:border-[#E2C076]/40 hover:text-white transition"
              title="Share Trip Link"
            >
              <Share2 className="h-3.5 w-3.5 text-[#E2C076]" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-300 hover:border-[#E2C076]/40 hover:text-white transition"
              title="Print Itinerary"
            >
              <Printer className="h-3.5 w-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#E2C076] to-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-[#070B14] hover:brightness-110 transition shadow-sm shadow-[#E2C076]/20"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Trip</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Cover Banner */}
      <div className="relative w-full overflow-hidden bg-[#0B1322] border-b border-white/10">
        <div className="relative h-72 sm:h-96 lg:h-[420px] w-full">
          <img
            src={
              currentTrip.coverImage ||
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80'
            }
            alt={currentTrip.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center filter brightness-[0.65]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-[#070B14]/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070B14]/80 via-transparent to-transparent" />

          {/* Hero Content Overlay */}
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center space-x-1.5 rounded-full bg-[#E2C076]/20 border border-[#E2C076]/40 px-3 py-1 text-xs font-bold text-[#E2C076] backdrop-blur-md">
                    <MapPin className="h-3.5 w-3.5 text-[#E2C076]" />
                    <span>{currentTrip.destination}</span>
                  </div>

                  <span
                    className={`inline-flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-bold ${
                      currentTrip.status === 'Cancelled'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${currentTrip.status === 'Cancelled' ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
                    <span>{currentTrip.status || 'Active'}</span>
                  </span>

                  {isProminent && (
                    <span className="inline-flex items-center space-x-1 rounded-full bg-gradient-to-r from-[#E2C076]/25 to-amber-500/25 border border-[#E2C076]/40 px-3 py-1 text-xs font-bold text-[#E2C076] backdrop-blur-md">
                      <Sparkles className="h-3.5 w-3.5 text-[#E2C076]" />
                      <span>Curated Global Haven</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif text-white tracking-tight leading-tight max-w-4xl drop-shadow-md">
                  {currentTrip.title}
                </h1>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs sm:text-sm text-neutral-300">
                  {currentTrip.startDate && (
                    <div className="flex items-center space-x-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                      <Calendar className="h-4 w-4 text-[#E2C076]" />
                      <span>
                        {currentTrip.startDate} {currentTrip.endDate ? `to ${currentTrip.endDate}` : ''}
                      </span>
                      <span className="text-[#E2C076] font-bold">({days.length} Days)</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                    <Users className="h-4 w-4 text-[#E2C076]" />
                    <span>{currentTrip.travelersCount || 1} Travelers (VIP)</span>
                  </div>

                  {currentTrip.budgetAmount !== undefined && currentTrip.budgetAmount > 0 && (
                    <div className="flex items-center space-x-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                      <DollarSign className="h-4 w-4 text-[#E2C076]" />
                      <span>Allocated Budget:</span>
                      <span className="font-bold text-[#E2C076]">
                        {formatPrice(currentTrip.budgetAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                    <Sun className="h-4 w-4 text-[#E2C076]" />
                    <span>Live Climate: {isAlpine ? '16°C Fresh Alpine' : isBeach ? '28°C Tropical Breeze' : '22°C Clear Skies'}</span>
                  </div>
                </div>

                {/* Optional Notes */}
                {currentTrip.notes && (
                  <div className="mt-3 max-w-2xl rounded-xl border border-[#E2C076]/20 bg-[#0B1322]/80 p-3 backdrop-blur-md text-xs text-neutral-300 flex items-start space-x-2">
                    <FileText className="h-4 w-4 text-[#E2C076] shrink-0 mt-0.5" />
                    <p className="italic">{currentTrip.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0B1322] p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Total Duration</span>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-serif">
              {days.length} <span className="text-sm font-normal text-[#E2C076]">Days</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Full bespoke itinerary</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B1322] p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Time Slots</span>
            <div className="text-xl sm:text-2xl font-extrabold text-[#E2C076] mt-1 font-serif">
              {totalActivitiesCount} <span className="text-sm font-normal text-white">Activities</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              {totalCompletedCount} marked completed
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B1322] p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Daily Allocation</span>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-serif">
              {currentTrip.budgetAmount && days.length > 0
                ? formatPrice(Math.round(currentTrip.budgetAmount / days.length))
                : 'Custom'}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Estimated spend per day</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B1322] p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Destination Class</span>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-1 font-serif truncate">
              {isProminent ? 'World-Class Haven' : 'Bespoke Haven'}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Verified local guide</p>
          </div>
        </div>

        {/* Quick Access Modules Navigation Bar */}
        <div className="rounded-2xl border border-[#E2C076]/20 bg-[#0E1726]/80 p-3.5 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <span className="text-xs font-bold text-[#E2C076] uppercase tracking-wider flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Trip Management Suite</span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('budget-expenses')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#E2C076]/50 text-neutral-200 hover:text-white text-xs font-semibold transition-all"
            >
              <Wallet className="h-3.5 w-3.5 text-[#E2C076]" />
              <span>Budget & Expenses</span>
            </button>

            <button
              onClick={() => setActiveTab('groups-split')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#E2C076]/50 text-neutral-200 hover:text-white text-xs font-semibold transition-all"
            >
              <Users className="h-3.5 w-3.5 text-sky-400" />
              <span>Travel Group & Split</span>
            </button>

            <button
              onClick={() => setActiveTab('vault-alerts')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-[#E2C076]/50 text-neutral-200 hover:text-white text-xs font-semibold transition-all"
            >
              <FolderLock className="h-3.5 w-3.5 text-purple-400" />
              <span>Document Vault & Alerts</span>
            </button>
          </div>
        </div>

        {/* Day-by-Day Schedule Header & Switcher */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
                  Itinerary Schedule
                </h2>
                <span className="rounded-full bg-[#E2C076]/15 border border-[#E2C076]/30 px-2.5 py-0.5 text-xs font-bold text-[#E2C076]">
                  {days.length} Days Total
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {isProminent
                  ? 'Accurate timings and activities automatically tailored for this prominent destination.'
                  : 'Blank slots provided so you can craft your personal day-by-day timetable.'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="inline-flex rounded-xl bg-white/5 p-1 border border-white/10">
                <button
                  onClick={() => setViewMode('single')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    viewMode === 'single' ? 'bg-[#E2C076] text-[#070B14]' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Day by Day
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    viewMode === 'all' ? 'bg-[#E2C076] text-[#070B14]' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  View All Days
                </button>
              </div>

              <button
                onClick={handleAddExtraDay}
                className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#E2C076] to-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-[#070B14] hover:brightness-110 transition shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Day</span>
              </button>
            </div>
          </div>

          {/* Day Tabs (for single view) */}
          {viewMode === 'single' && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              {days.map((d) => {
                const isSelected = selectedDayTab === d.day;
                const actCount = d.activities?.length || 0;
                return (
                  <button
                    key={`day-tab-${d.day}`}
                    onClick={() => setSelectedDayTab(d.day)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                      isSelected
                        ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                        : 'bg-[#0B1322] border border-white/10 text-neutral-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>Day {d.day}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        isSelected ? 'bg-[#070B14]/20 text-[#070B14]' : 'bg-white/10 text-neutral-400'
                      }`}
                    >
                      {actCount}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Render Days */}
          <div className="space-y-8" id="trip-itinerary-days-container">
            {days
              .filter((d) => viewMode === 'all' || d.day === selectedDayTab)
              .map((day) => {
                const dayIndex = days.findIndex((item) => item.day === day.day);
                const activities = day.activities || [];
                const theme = day.theme || day.title || `Day ${day.day} Itinerary`;
                const completedCount = activities.filter((act, idx) => {
                  const sId = act.id || `slot-${day.day}-${idx}`;
                  return !!completedSlots[sId];
                }).length;
                const totalSlots = activities.length;
                const dayPercent = totalSlots > 0 ? Math.round((completedCount / totalSlots) * 100) : 0;
                const blankCount = activities.filter((a) => !a.activity || a.activity.trim() === '').length;

                return (
                  <div
                    key={`day-panel-${day.day}`}
                    id={`day-panel-${day.day}`}
                    className="rounded-3xl border border-white/10 bg-[#0B1322] overflow-hidden shadow-2xl transition-all duration-300 hover:border-[#E2C076]/40"
                  >
                    {/* Day Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-white/10 bg-gradient-to-r from-[#0E1726] via-[#101B2E] to-[#0E1726]">
                      <div className="flex items-center space-x-3.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E2C076] to-[#B38936] text-[#070B14] font-black text-sm shadow-md shadow-[#E2C076]/20 shrink-0">
                          <span>D{day.day}</span>
                        </div>

                        <div>
                          {editingThemeDay === day.day ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editingThemeText}
                                onChange={(e) => setEditingThemeText(e.target.value)}
                                className="rounded-lg border border-[#E2C076] bg-[#070B14] px-3 py-1 text-sm font-bold text-white focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveTheme(dayIndex)}
                                className="px-2.5 py-1 rounded-lg bg-[#E2C076] text-[#070B14] text-xs font-bold"
                              >
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => setEditingThemeDay(null)}
                                className="px-2 py-1 text-xs text-neutral-400 hover:text-white"
                              >
                                <span>Cancel</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <h3 className="text-base sm:text-lg font-bold text-white font-serif tracking-tight">
                                {theme}
                              </h3>
                              <button
                                onClick={() => {
                                  setEditingThemeDay(day.day);
                                  setEditingThemeText(theme);
                                }}
                                className="text-neutral-500 hover:text-[#E2C076] transition p-1"
                                title="Rename theme"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {day.date && (
                              <span className="text-xs text-neutral-400 flex items-center space-x-1">
                                <Calendar className="h-3 w-3 text-[#E2C076]" />
                                <span>{day.date}</span>
                              </span>
                            )}
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E2C076]/10 text-[#E2C076] border border-[#E2C076]/25">
                              <Clock className="h-3 w-3 text-[#E2C076]" />
                              <span>{activities.length} Scheduled Slots</span>
                            </span>
                            {blankCount > 0 && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
                                <span>{blankCount} Blank {blankCount === 1 ? 'Slot' : 'Slots'}</span>
                              </span>
                            )}
                            {completedCount > 0 && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                                <Check className="h-3 w-3" />
                                <span>{completedCount}/{activities.length} Done</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right controls for this day */}
                      <div className="flex items-center space-x-2">
                        {activities.some((a) => !a.activity) && (
                          <button
                            onClick={() => handleFillBlanksWithAi(dayIndex)}
                            className="flex items-center space-x-1.5 rounded-xl border border-[#E2C076]/30 bg-[#E2C076]/10 px-3 py-1.5 text-xs font-semibold text-[#E2C076] hover:bg-[#E2C076] hover:text-[#070B14] transition shadow-sm"
                            title="Auto-fill blank slots with authentic suggestions"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Auto-Fill Blanks</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setIsAddingSlotDay(day.day);
                            setNewSlotTime('04:00 PM');
                            setNewSlotText('');
                          }}
                          className="flex items-center space-x-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:border-[#E2C076]/40 transition"
                        >
                          <Plus className="h-3.5 w-3.5 text-[#E2C076]" />
                          <span>Add Slot</span>
                        </button>
                      </div>
                    </div>

                    {/* Day Highlights Breakdown Strip */}
                    <div className="px-6 py-2 bg-[#080E1A] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Day Schedule:</span>
                        <span className="inline-flex items-center space-x-1 text-neutral-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                          <span>Morning ({activities.filter(a => (a.time || '').toLowerCase().includes('am') || a.time.startsWith('09') || a.time.startsWith('10') || a.time.startsWith('11')).length})</span>
                        </span>
                        <span className="inline-flex items-center space-x-1 text-neutral-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
                          <span>Afternoon ({activities.filter(a => a.time.startsWith('12') || a.time.startsWith('01') || a.time.startsWith('02') || a.time.startsWith('03') || a.time.startsWith('04')).length})</span>
                        </span>
                        <span className="inline-flex items-center space-x-1 text-neutral-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
                          <span>Evening ({activities.filter(a => a.time.startsWith('05') || a.time.startsWith('06') || a.time.startsWith('07') || a.time.startsWith('08') || a.time.startsWith('09')).length})</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-neutral-400">Progress:</span>
                        <span className="font-mono text-xs font-bold text-[#E2C076]">{dayPercent}%</span>
                      </div>
                    </div>

                    {/* Activities List */}
                    <div className="p-6 space-y-3">
                      {activities.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                          <p className="text-sm text-neutral-400">No activities scheduled for this day yet.</p>
                          <button
                            onClick={() => setIsAddingSlotDay(day.day)}
                            className="mt-3 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#E2C076] text-[#070B14] text-xs font-bold"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add First Activity</span>
                          </button>
                        </div>
                      ) : (
                        activities.map((act, actIndex) => {
                          const slotId = act.id || `slot-${day.day}-${actIndex}`;
                          const isCompleted = !!completedSlots[slotId];
                          const isEditing = editingSlotId === slotId;
                          const isBlank = !act.activity || act.activity.trim() === '';
                          const periodInfo = getTimePeriodBadge(act.time);

                          if (isEditing) {
                            return (
                              <div
                                key={slotId}
                                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3.5 rounded-2xl border border-[#E2C076]/50 bg-[#070B14]"
                              >
                                <input
                                  type="text"
                                  value={editingTime}
                                  onChange={(e) => setEditingTime(e.target.value)}
                                  placeholder="09:00 AM"
                                  className="w-28 rounded-lg border border-white/20 bg-[#0B1322] px-2.5 py-1.5 text-xs font-mono text-[#E2C076] focus:outline-none focus:border-[#E2C076]"
                                />
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  placeholder="Enter activity description..."
                                  className="flex-1 rounded-lg border border-white/20 bg-[#0B1322] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                                />
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleSaveEditSlot(dayIndex, actIndex)}
                                    className="px-3 py-1.5 rounded-lg bg-[#E2C076] text-[#070B14] text-xs font-bold"
                                  >
                                    <span>Save</span>
                                  </button>
                                  <button
                                    onClick={() => setEditingSlotId(null)}
                                    className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white"
                                  >
                                    <span>Cancel</span>
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={slotId}
                              id={`slot-${day.day}-${actIndex}`}
                              className={`group flex items-start justify-between gap-3.5 p-4 rounded-2xl border transition-all duration-200 ${
                                isBlank
                                  ? 'border-dashed border-[#E2C076]/40 bg-[#E2C076]/5 hover:bg-[#E2C076]/10'
                                  : isCompleted
                                  ? 'border-emerald-500/20 bg-emerald-500/5 opacity-80'
                                  : 'border-white/10 bg-[#0E1726]/70 hover:border-[#E2C076]/30 hover:bg-[#0E1726]'
                              }`}
                            >
                              <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                                {/* Completion Checkbox */}
                                <button
                                  type="button"
                                  onClick={() => toggleSlotCompleted(slotId)}
                                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                                    isCompleted
                                      ? 'border-emerald-500 bg-emerald-500 text-[#070B14]'
                                      : 'border-white/20 hover:border-[#E2C076]'
                                  }`}
                                  title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                                >
                                  {isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                                </button>

                                {/* Time Slot Badge with span */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 shrink-0">
                                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-xs font-mono font-bold text-[#E2C076]">
                                    <Clock className="h-3 w-3 text-[#E2C076]" />
                                    <span>{act.time}</span>
                                  </span>
                                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${periodInfo.color}`}>
                                    <span>{periodInfo.period}</span>
                                  </span>
                                </div>

                                {/* Activity Content */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                  {isBlank ? (
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditSlot(act)}
                                      className="w-full text-left group/btn"
                                    >
                                      <div className="flex items-center space-x-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-[#E2C076]" />
                                        <span className="text-xs sm:text-sm font-semibold text-[#E2C076] group-hover/btn:underline">
                                          [Blank Slot] Click here to enter your activity for {act.time}...
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-neutral-400 block mt-0.5 font-light">
                                        Free space left blank for your custom attraction, gourmet meal, or leisure time.
                                      </span>
                                    </button>
                                  ) : (
                                    <p
                                      className={`text-xs sm:text-sm font-medium leading-relaxed ${
                                        isCompleted ? 'text-neutral-400 line-through' : 'text-neutral-200'
                                      }`}
                                    >
                                      <span>{act.activity}</span>
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Slot Actions */}
                              <div className="flex items-center space-x-1 opacity-70 group-hover:opacity-100 transition">
                                <button
                                  onClick={() => handleStartEditSlot(act)}
                                  className="p-1.5 text-neutral-400 hover:text-[#E2C076] hover:bg-white/5 rounded-lg transition"
                                  title="Edit this activity"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSlot(dayIndex, actIndex)}
                                  className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition"
                                  title="Delete slot"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Add Slot Inline Form */}
                      {isAddingSlotDay === day.day && (
                        <div className="mt-4 p-4 rounded-2xl border border-[#E2C076]/40 bg-[#070B14] space-y-3">
                          <span className="text-xs font-bold text-[#E2C076]">Add New Activity Slot</span>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              value={newSlotTime}
                              onChange={(e) => setNewSlotTime(e.target.value)}
                              placeholder="03:00 PM"
                              className="w-28 rounded-lg border border-white/20 bg-[#0B1322] px-2.5 py-1.5 text-xs font-mono text-[#E2C076] focus:outline-none"
                            />
                            <input
                              type="text"
                              value={newSlotText}
                              onChange={(e) => setNewSlotText(e.target.value)}
                              placeholder="Describe your activity (e.g. Visit sunset cliff viewpoint)..."
                              className="flex-1 rounded-lg border border-white/20 bg-[#0B1322] px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center space-x-2 justify-end">
                            <button
                              onClick={() => setIsAddingSlotDay(null)}
                              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                            >
                              <span>Cancel</span>
                            </button>
                            <button
                              onClick={() => handleAddNewSlot(dayIndex)}
                              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#E2C076] to-[#D4AF37] text-[#070B14] text-xs font-bold"
                            >
                              <span>Add to Day {day.day}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Day Card Footer */}
                    <div className="px-6 py-3.5 bg-black/40 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() => {
                          setIsAddingSlotDay(day.day);
                          setNewSlotTime('04:00 PM');
                          setNewSlotText('');
                        }}
                        className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#E2C076] hover:text-[#f2d89b] transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Another Time Slot to Day {day.day}</span>
                      </button>

                      <div className="flex items-center space-x-2 text-xs text-neutral-400">
                        <span>Day {day.day} of {days.length}</span>
                        <span className="h-1 w-1 rounded-full bg-neutral-600"></span>
                        <span>{activities.filter((a) => !!a.activity).length} confirmed activities</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Destination Guide & Packing Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Packing Checklist */}
          <div className="lg:col-span-1 rounded-3xl border border-white/10 bg-[#0B1322] p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Luggage className="h-5 w-5 text-[#E2C076]" />
              <h3 className="text-lg font-serif font-bold text-white">
                Bespoke Packing List
              </h3>
            </div>
            <p className="text-xs text-neutral-400">
              Essential gear curated for {currentTrip.destination}’s seasonal climate.
            </p>

            <div className="space-y-2.5 pt-2">
              {defaultPackingItems.map((item) => {
                const isChecked = !!checkedPacking[item.id];
                return (
                  <label
                    key={item.id}
                    className="flex items-center space-x-3 p-2.5 rounded-xl border border-white/5 bg-[#0E1726]/60 hover:bg-[#0E1726] transition cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        setCheckedPacking((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                      className="h-4 w-4 rounded border-white/20 text-[#E2C076] focus:ring-0 focus:outline-none"
                    />
                    <span
                      className={`text-xs font-medium ${
                        isChecked ? 'line-through text-neutral-400' : 'text-neutral-200'
                      }`}
                    >
                      {item.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Recommended Stays & Experiences */}
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#0B1322] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-[#E2C076]" />
                <h3 className="text-lg font-serif font-bold text-white">
                  Curated Stays & Experiences for {currentTrip.destination}
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('hotels')}
                className="text-xs text-[#E2C076] hover:underline font-semibold"
              >
                Browse All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {nearbyHotels.map((h) => (
                <div
                  key={h.id}
                  className="rounded-2xl border border-white/10 bg-[#0E1726] overflow-hidden group"
                >
                  <div className="h-32 w-full overflow-hidden relative">
                    <img
                      src={h.image}
                      alt={h.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-bold text-[#E2C076] backdrop-blur-md">
                      {formatPrice(h.pricePerNightUsd)}/night
                    </div>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h4 className="text-sm font-bold text-white truncate">{h.name}</h4>
                    <p className="text-xs text-neutral-400 flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-[#E2C076]" />
                      <span className="truncate">{h.destinationName}</span>
                    </p>
                  </div>
                </div>
              ))}

              {nearbyExperiences.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-2xl border border-white/10 bg-[#0E1726] overflow-hidden group"
                >
                  <div className="h-32 w-full overflow-hidden relative">
                    <img
                      src={exp.image}
                      alt={exp.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-bold text-[#E2C076] backdrop-blur-md">
                      {formatPrice(exp.priceUsd)}
                    </div>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h4 className="text-sm font-bold text-white truncate">{exp.title}</h4>
                    <p className="text-xs text-neutral-400 flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-[#E2C076]" />
                      <span className="truncate">{exp.duration || 'Guided Tour'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Danger Zone: Trip Status Management */}
        <div className="rounded-3xl border border-white/10 bg-[#0B1322] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white">Manage Trip Reservation Status</h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              You can modify travelers count, adjust travel dates, or cancel this booking.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {currentTrip.status !== 'Cancelled' && (
              <button
                onClick={() => setIsCancelConfirmOpen(true)}
                className="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-bold hover:bg-rose-500 hover:text-white transition"
              >
                Cancel Trip
              </button>
            )}

            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-neutral-400 text-xs font-bold hover:text-white hover:border-white/20 transition"
            >
              Delete Trip
            </button>
          </div>
        </div>
      </div>

      {/* Edit Trip Modal */}
      {isEditModalOpen && (
        <EditTripModal
          trip={currentTrip}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (tripId, startDate, endDate, travelersCount, notes) => {
            const ok = await updateTripDatesAndGuests(tripId, startDate, endDate, travelersCount, notes);
            if (ok) setIsEditModalOpen(false);
            return ok;
          }}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {isCancelConfirmOpen && (
        <ConfirmActionModal
          isOpen={isCancelConfirmOpen}
          title="Cancel Trip"
          message={`Are you sure you want to mark "${currentTrip.title}" as Cancelled? All scheduled dates and itinerary items will remain accessible in your history.`}
          actionType="cancel"
          confirmButtonText="Yes, Cancel Trip"
          onClose={() => setIsCancelConfirmOpen(false)}
          onConfirm={async () => {
            await cancelTrip(currentTrip.id);
            setIsCancelConfirmOpen(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <ConfirmActionModal
          isOpen={isDeleteConfirmOpen}
          title="Delete Trip Permanently"
          message={`Are you sure you want to permanently delete "${currentTrip.title}"? This action cannot be undone.`}
          actionType="delete"
          confirmButtonText="Delete Permanently"
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={async () => {
            await deleteTrip(currentTrip.id);
            setIsDeleteConfirmOpen(false);
            backToMyTrips();
          }}
        />
      )}
    </div>
  );
};
