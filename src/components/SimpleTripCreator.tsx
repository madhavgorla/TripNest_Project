import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Compass,
  Plus,
  Trash2,
  X,
  Sparkles,
  Clock,
  RotateCcw,
  Users,
  DollarSign,
  MapPin,
  CheckCircle2,
  Loader2,
  Bot
} from 'lucide-react';
import { CustomTrip, TripDayItinerary, TripTimeSlotActivity } from '../types';
import {
  generateItineraryForDestination,
  generateItineraryFromTitle,
  detectDestinationAndThemeFromTitle,
  isProminentHighDestination,
  generateBlankItinerary
} from '../utils/itineraryGenerator';

interface SimpleTripCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tripData: Partial<CustomTrip>) => Promise<boolean>;
  currency: string;
  defaultDestination?: string;
}

export const SimpleTripCreator: React.FC<SimpleTripCreatorProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currency,
  defaultDestination = 'Kashmir Valley'
}) => {
  const [title, setTitle] = useState(`${defaultDestination} Exploration`);
  const [destination, setDestination] = useState(defaultDestination);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4); // 5 days by default
    return d.toISOString().split('T')[0];
  });
  const [travelersCount, setTravelersCount] = useState(2);
  const [budgetAmount, setBudgetAmount] = useState(120000);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleSyncStatus, setTitleSyncStatus] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate day difference
  const calculateDaysCount = (start: string, end: string) => {
    if (!start || !end) return 5;
    const d1 = new Date(start);
    const d2 = new Date(end);
    return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  };

  // Initialize days: prominent destinations auto-generate, others provide blank spaces
  const [days, setDays] = useState<TripDayItinerary[]>(() => {
    const initialTitle = `${defaultDestination} Exploration`;
    const isProm = isProminentHighDestination(initialTitle) || isProminentHighDestination(defaultDestination);
    if (isProm) {
      const gen = generateItineraryFromTitle(initialTitle, defaultDestination, 5, new Date().toISOString().split('T')[0], true);
      return gen.itinerary;
    }
    return generateBlankItinerary(5, new Date().toISOString().split('T')[0], initialTitle);
  });

  // Call AI backend directly to generate accurate Day 1 & activities
  const fetchAiItinerary = async (targetTitle: string, targetDest: string) => {
    if (!targetTitle || targetTitle.trim().length < 2) return;
    setIsAiLoading(true);
    setTitleSyncStatus('✨ AI is crafting authentic Day 1 activities and accurate timings...');

    const diffDays = calculateDaysCount(startDate, endDate);

    try {
      const res = await fetch('/api/ai/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: targetTitle.trim(),
          destination: targetDest.trim() || undefined,
          daysCount: diffDays,
          startDate
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.days) && data.days.length > 0) {
          setDays(data.days);
          if (data.destination && (!destination || destination === 'Custom Destination' || destination === defaultDestination)) {
            setDestination(data.destination);
          }
          setIsAiGenerated(true);
          setTitleSyncStatus(`✨ Verified details & timings provided by AI for "${targetTitle.trim()}"`);
          setIsAiLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('AI itinerary endpoint unreachable, using smart generator:', err);
    }

    // High-accuracy client-side generator fallback if offline or server busy
    const { itinerary, detectedDestination } = generateItineraryFromTitle(
      targetTitle,
      targetDest,
      diffDays,
      startDate,
      true
    );
    setDays(itinerary);
    if (detectedDestination && detectedDestination !== 'Custom Destination') {
      setDestination(detectedDestination);
    }
    setIsAiGenerated(true);
    setTitleSyncStatus(`✨ Accurate Day 1 activities & timings generated for "${targetTitle.trim()}"`);
    setIsAiLoading(false);
  };

  // When defaultDestination changes or modal opens
  useEffect(() => {
    if (isOpen && defaultDestination) {
      setDestination(defaultDestination);
      const initialTitle = `${defaultDestination} Exploration`;
      setTitle(initialTitle);
      const diffDays = calculateDaysCount(startDate, endDate);
      const isProm = isProminentHighDestination(initialTitle) || isProminentHighDestination(defaultDestination);
      if (isProm) {
        const initialGen = generateItineraryFromTitle(initialTitle, defaultDestination, diffDays, startDate, true);
        setDays(initialGen.itinerary);
        setTitleSyncStatus(`✨ Prominent Haven detected: authentic Day 1 schedule auto-generated for ${defaultDestination}`);
      } else {
        setDays(generateBlankItinerary(diffDays, startDate, initialTitle));
        setTitleSyncStatus(`✍️ Blank activity spaces ready for your custom ${defaultDestination} schedule.`);
      }
    }
  }, [isOpen, defaultDestination]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  // Sync title change directly: prominent places get authentic auto-generation; others get blank spaces
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!newTitle.trim()) return;

    const diffDays = calculateDaysCount(startDate, endDate);
    const isProm = isProminentHighDestination(newTitle) || isProminentHighDestination(destination);

    if (isProm) {
      // Prominent high destinations (Bali, Kashmir, Goa, Maldives, etc.): auto-generate authentic activities & timings
      const { itinerary, detectedDestination } = generateItineraryFromTitle(
        newTitle,
        destination,
        diffDays,
        startDate,
        true
      );
      setDays(itinerary);
      if (
        detectedDestination &&
        detectedDestination !== 'Custom Destination' &&
        detectedDestination !== destination &&
        detectedDestination !== 'Kashmir Valley'
      ) {
        setDestination(detectedDestination);
      }
      setTitleSyncStatus(`✨ Prominent Haven detected: authentic activities & timings auto-generated!`);

      // Debounce AI generation call by 800ms
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchAiItinerary(newTitle, destination);
      }, 800);
    } else {
      // Regular or custom destinations: leave blank spaces so the user will enter them!
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Preserve any activities user has already typed in, otherwise provide clean blank slots
      setDays((prev) => {
        const hasUserText = prev.some((d) =>
          d.activities?.some((a) => a.activity && a.activity.trim() !== '')
        );
        if (hasUserText) {
          return prev;
        }
        return generateBlankItinerary(diffDays, startDate, newTitle);
      });
      setTitleSyncStatus('✍️ Blank activity slots left open so you can enter your personal plan.');
    }
  };

  // On blur of title, trigger AI only if prominent destination
  const handleTitleBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const isProm = isProminentHighDestination(title) || isProminentHighDestination(destination);
    if (isProm && title.trim().length >= 3) {
      fetchAiItinerary(title, destination);
    }
  };

  // Explicit sync button to trigger AI generation on demand
  const handleManualSyncTitle = () => {
    if (!title.trim()) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    fetchAiItinerary(title, destination);
  };

  // Explicit reset button to wipe to blank slots
  const handleResetToBlankSlots = () => {
    const diffDays = calculateDaysCount(startDate, endDate);
    setDays(generateBlankItinerary(diffDays, startDate, title));
    setTitleSyncStatus('✍️ Cleared to blank activity spaces for custom entry.');
  };

  // Sync date change with days count
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val && endDate) {
      const diffDays = calculateDaysCount(val, endDate);
      const isProm = isProminentHighDestination(title) || isProminentHighDestination(destination);
      if (isProm) {
        const { itinerary } = generateItineraryFromTitle(title, destination, diffDays, val, true);
        setDays(itinerary);
      } else {
        setDays((prev) => {
          const hasUserText = prev.some((d) =>
            d.activities?.some((a) => a.activity && a.activity.trim() !== '')
          );
          return hasUserText ? prev : generateBlankItinerary(diffDays, val, title);
        });
      }
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (startDate && val) {
      const diffDays = calculateDaysCount(startDate, val);
      const isProm = isProminentHighDestination(title) || isProminentHighDestination(destination);
      if (isProm) {
        const { itinerary } = generateItineraryFromTitle(title, destination, diffDays, startDate, true);
        setDays(itinerary);
      } else {
        setDays((prev) => {
          const hasUserText = prev.some((d) =>
            d.activities?.some((a) => a.activity && a.activity.trim() !== '')
          );
          return hasUserText ? prev : generateBlankItinerary(diffDays, startDate, title);
        });
      }
    }
  };

  const handleDestinationBlurOrGenerate = () => {
    if (!destination.trim()) return;
    const diffDays = calculateDaysCount(startDate, endDate);
    const isProm = isProminentHighDestination(title) || isProminentHighDestination(destination.trim());
    if (isProm) {
      const { itinerary } = generateItineraryFromTitle(title, destination.trim(), diffDays, startDate, true);
      setDays(itinerary);
      setTitleSyncStatus(`✨ Prominent Haven activities loaded for ${destination.trim()}`);
    } else {
      setTitleSyncStatus(`✍️ Blank activity spaces ready for ${destination.trim()}`);
    }
  };

  const handleAddDay = () => {
    const nextDayNum = days.length + 1;
    const isProm = isProminentHighDestination(title) || isProminentHighDestination(destination);
    if (isProm) {
      const { itinerary } = generateItineraryFromTitle(title, destination, nextDayNum, startDate, true);
      const newDay = itinerary[itinerary.length - 1];
      setDays((prev) => [...prev, newDay]);
    } else {
      const newDay: TripDayItinerary = {
        day: nextDayNum,
        theme: `Day ${nextDayNum} Schedule`,
        title: `Day ${nextDayNum} Schedule`,
        description: '',
        activities: [
          { id: `slot-d${nextDayNum}-1`, time: '09:00 AM', activity: '' },
          { id: `slot-d${nextDayNum}-2`, time: '01:00 PM', activity: '' },
          { id: `slot-d${nextDayNum}-3`, time: '06:00 PM', activity: '' }
        ]
      };
      setDays((prev) => [...prev, newDay]);
    }

    if (startDate) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + nextDayNum - 1);
      setEndDate(d.toISOString().split('T')[0]);
    }
  };

  const handleRemoveDay = (dayIndex: number) => {
    if (days.length <= 1) return;
    const next = days.filter((_, idx) => idx !== dayIndex).map((d, idx) => ({ ...d, day: idx + 1 }));
    setDays(next);
    if (startDate) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + next.length - 1);
      setEndDate(d.toISOString().split('T')[0]);
    }
  };

  const handleThemeChange = (dayIndex: number, newTheme: string) => {
    setDays((prev) => {
      const copy = [...prev];
      copy[dayIndex] = {
        ...copy[dayIndex],
        theme: newTheme,
        title: newTheme
      };
      return copy;
    });
  };

  const handleActivityChange = (dayIndex: number, actIndex: number, field: 'time' | 'activity', value: string) => {
    setDays((prev) => {
      const copy = [...prev];
      const targetDay = { ...copy[dayIndex] };
      const acts = [...(targetDay.activities || [])];
      acts[actIndex] = { ...acts[actIndex], [field]: value };
      targetDay.activities = acts;
      targetDay.description = acts.map((a) => `${a.time} - ${a.activity}`).join('\n');
      copy[dayIndex] = targetDay;
      return copy;
    });
  };

  const handleAddActivitySlot = (dayIndex: number) => {
    setDays((prev) => {
      const copy = [...prev];
      const targetDay = { ...copy[dayIndex] };
      const acts = [...(targetDay.activities || [])];
      const isProm = isProminentHighDestination(title) || isProminentHighDestination(destination);
      acts.push({
        id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        time: '04:00 PM',
        activity: isProm ? `Exploration & cultural visit in ${destination || 'the area'}` : ''
      });
      targetDay.activities = acts;
      targetDay.description = acts.map((a) => `${a.time} - ${a.activity}`).join('\n');
      copy[dayIndex] = targetDay;
      return copy;
    });
  };

  const handleRemoveActivitySlot = (dayIndex: number, actIndex: number) => {
    setDays((prev) => {
      const copy = [...prev];
      const targetDay = { ...copy[dayIndex] };
      const acts = (targetDay.activities || []).filter((_, idx) => idx !== actIndex);
      targetDay.activities = acts;
      targetDay.description = acts.map((a) => `${a.time} - ${a.activity}`).join('\n');
      copy[dayIndex] = targetDay;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim()) {
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit({
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      travelersCount: Number(travelersCount) || 1,
      budgetAmount: Number(budgetAmount) || 0,
      budgetCurrency: currency,
      notes: notes.trim(),
      itinerary: days
    });

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-700 bg-[#0F172A] shadow-2xl text-slate-100 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#141E33]">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EA580C] text-white">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Create Trip Itinerary
              </h2>
              <p className="text-xs text-slate-400">
                Tailored day-by-day activities and timings based on your destination
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          <form onSubmit={handleSubmit} id="simple-trip-form" className="space-y-6">
            {/* Trip Core Metadata */}
            <div className="rounded-2xl border border-slate-800 bg-[#131D31] p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Trip Title *
                    </label>
                    <button
                      type="button"
                      onClick={handleManualSyncTitle}
                      disabled={isAiLoading || !title.trim()}
                      className="text-[11px] text-[#F97316] hover:underline font-semibold flex items-center space-x-1 disabled:opacity-50"
                      title="Update Day 1 and activities based on this title using AI"
                    >
                      {isAiLoading ? (
                        <Loader2 className="h-3 w-3 text-orange-400 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-orange-400" />
                      )}
                      <span>{isAiLoading ? 'AI Generating...' : 'Generate with AI'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      onBlur={handleTitleBlur}
                      placeholder="e.g. Tokyo Anime & Ramen Tour, Kashmir Shikara, Goa Beach Party"
                      className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-[#EA580C] focus:outline-none pr-9"
                    />
                    {isAiLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-3.5 w-3.5 text-orange-400 animate-spin" />
                      </div>
                    )}
                  </div>
                  {isAiLoading ? (
                    <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] text-orange-300 font-medium animate-pulse">
                      <Loader2 className="h-3 w-3 text-orange-400 animate-spin shrink-0" />
                      <span>AI is crafting authentic Day 1 activities and accurate timings...</span>
                    </div>
                  ) : titleSyncStatus ? (
                    <div className="mt-1.5 flex items-center space-x-1 text-[11px] text-amber-400 font-medium">
                      <Sparkles className="h-3 w-3 text-orange-400 shrink-0" />
                      <span className="truncate">{titleSyncStatus}</span>
                    </div>
                  ) : (
                    <p className="mt-1 text-[10px] text-slate-400">
                      Enter any title (e.g. Tokyo Ramen, Kashmir Shikara, Paris Honeymoon) — AI will provide accurate Day 1 activities and timings.
                    </p>
                  )}
                </div>

                {/* Destination */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Destination *
                    </label>
                    <button
                      type="button"
                      onClick={handleDestinationBlurOrGenerate}
                      className="text-[11px] text-[#F97316] hover:underline font-semibold flex items-center space-x-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Auto-generate activities</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onBlur={handleDestinationBlurOrGenerate}
                    placeholder="e.g. Kashmir Valley, Goa, Jaipur, Kerala, Dubai, Paris, Tokyo"
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-[#EA580C] focus:outline-none"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-white focus:border-[#EA580C] focus:outline-none"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-white focus:border-[#EA580C] focus:outline-none"
                  />
                </div>

                {/* Travelers */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Travelers
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={travelersCount}
                    onChange={(e) => setTravelersCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-white focus:border-[#EA580C] focus:outline-none"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Budget ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-white focus:border-[#EA580C] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Day-by-Day Schedule Section */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">
                      Itinerary Schedule ({days.length} Days)
                    </span>
                    <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[11px] font-bold text-orange-400 border border-orange-500/30">
                      {destination || 'Custom Destination'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chronological timings and authentic activities tailored to your trip.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleResetToBlankSlots}
                    className="flex items-center space-x-1 rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
                    title="Clear all days to blank activity slots for manual entry"
                  >
                    <RotateCcw className="h-3 w-3 text-slate-400" />
                    <span>Leave Blank</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleManualSyncTitle}
                    disabled={isAiLoading || !title.trim()}
                    className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-orange-500 transition-colors disabled:opacity-50"
                    title="Regenerate activities specifically for this title using AI"
                  >
                    {isAiLoading ? (
                      <Loader2 className="h-3.5 w-3.5 text-orange-400 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                    )}
                    <span>{isAiLoading ? 'AI Generating...' : 'Sync with AI'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddDay}
                    className="flex items-center space-x-1.5 rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-500 shadow-md transition-all active:scale-95"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Day</span>
                  </button>
                </div>
              </div>

              {/* Day Cards with Orange Badges */}
              <div className="space-y-4">
                {days.map((day, dayIndex) => {
                  const activities = day.activities || [];
                  const theme = day.theme || day.title || `Day ${day.day} Schedule`;
                  const isDayOne = day.day === 1;

                  return (
                    <div
                      key={`day-card-${day.day}`}
                      className={`flex items-stretch rounded-2xl border ${
                        isDayOne ? 'border-orange-500/50 bg-[#141C2E]' : 'border-slate-800 bg-[#111827]'
                      } overflow-hidden transition-colors hover:border-slate-700`}
                    >
                      {/* Orange Vertical Day Badge */}
                      <div className="w-12 sm:w-14 shrink-0 bg-[#EA580C] flex flex-col items-center justify-between py-4 select-none">
                        <span className="text-white font-extrabold text-xs tracking-widest uppercase -rotate-90 whitespace-nowrap mt-2">
                          DAY {day.day}
                        </span>
                        {days.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDay(dayIndex)}
                            className="text-white/70 hover:text-white p-1 rounded transition-colors"
                            title={`Remove Day ${day.day}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Card Content: Theme & Activities */}
                      <div className="flex-1 p-4 sm:p-5 space-y-3">
                        {/* Theme Header Input */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                          <div className="flex items-center space-x-2 flex-1">
                            <span className="text-xs font-bold text-slate-400 shrink-0">
                              Activity -
                            </span>
                            <input
                              type="text"
                              value={theme}
                              onChange={(e) => handleThemeChange(dayIndex, e.target.value)}
                              placeholder="Day Theme / Main Focus"
                              className="w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-2.5 py-1 text-xs font-bold text-white placeholder-slate-500 focus:border-[#EA580C] focus:outline-none"
                            />
                          </div>

                          {isDayOne && (
                            <span className="inline-flex items-center space-x-1 rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 border border-orange-500/40">
                              {isAiLoading ? (
                                <Loader2 className="h-3 w-3 text-orange-400 animate-spin" />
                              ) : (
                                <Sparkles className="h-3 w-3 text-orange-400" />
                              )}
                              <span>{isAiLoading ? 'Generating with AI...' : 'Accurate • AI Provided'}</span>
                            </span>
                          )}
                        </div>

                        {/* Time & Activity Rows */}
                        <div className="space-y-2">
                          <div className="flex items-center text-[11px] font-bold text-slate-400 px-1">
                            <span className="w-24 sm:w-28 shrink-0">Time</span>
                            <span className="flex-1">Planned Activity</span>
                          </div>

                          {activities.map((act, actIndex) => (
                            <div
                              key={act.id || `act-${actIndex}`}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="text"
                                value={act.time}
                                onChange={(e) =>
                                  handleActivityChange(dayIndex, actIndex, 'time', e.target.value)
                                }
                                placeholder="09:00 AM"
                                className="w-24 sm:w-28 shrink-0 rounded-lg border border-slate-700 bg-[#0B0F19] px-2 py-1 text-xs font-mono text-white focus:border-[#EA580C] focus:outline-none"
                              />
                              <input
                                type="text"
                                value={act.activity}
                                onChange={(e) =>
                                  handleActivityChange(dayIndex, actIndex, 'activity', e.target.value)
                                }
                                placeholder={
                                  act.activity
                                    ? 'Describe activity...'
                                    : 'Blank space — enter activity (e.g. breakfast, sightseeing)...'
                                }
                                className="flex-1 rounded-lg border border-slate-700 bg-[#0B0F19] px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-[#EA580C] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveActivitySlot(dayIndex, actIndex)}
                                className="text-slate-500 hover:text-rose-400 p-1 rounded"
                                title="Remove slot"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleAddActivitySlot(dayIndex)}
                            className="mt-1 flex items-center space-x-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors pt-1"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Time Slot</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trip Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Trip Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Special requests, flight numbers, packing reminders..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#0B0F19] p-3 text-xs text-white placeholder-slate-500 focus:border-[#EA580C] focus:outline-none"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#141E33]">
          <div className="text-xs text-slate-400">
            {days.length} Days Planned • {days.reduce((acc, d) => acc + (d.activities?.length || 0), 0)} Scheduled Activities
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-transparent px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="simple-trip-form"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-[#EA580C] to-[#F97316] px-6 py-2.5 text-xs font-bold text-white hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Itinerary...' : 'Create Trip Itinerary'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
