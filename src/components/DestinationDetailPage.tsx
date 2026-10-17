import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Destination, DestinationAttraction, DestinationRoadmap, RoadmapDay } from '../types';
import { generateItineraryFromTitle } from '../utils/itineraryGenerator';
import {
  MapPin,
  Sparkles,
  Star,
  ChevronLeft,
  Calendar,
  CloudSun,
  Clock,
  Compass,
  DollarSign,
  Info,
  ShieldCheck,
  Utensils,
  Car,
  Hotel as HotelIcon,
  Ticket,
  Share2,
  ExternalLink,
  BookOpen,
  CheckCircle,
  HelpCircle,
  PhoneCall,
  Languages,
  Zap,
  Luggage,
  ArrowRight,
  Send,
  Loader2,
  Plus,
  Map,
  Home,
  Bed,
  Edit3,
  Save,
  Check,
  Navigation,
  Eye,
  RefreshCw
} from 'lucide-react';

export const DestinationDetailPage: React.FC = () => {
  const {
    selectedDestinationDetail,
    backToDestinations,
    formatPrice,
    hotels,
    experiences,
    setSelectedHotelBooking,
    setSelectedExperienceBooking,
    openAiWithPrompt,
    setCustomPlan,
    setActiveTab,
    createTrip,
    showToast,
    userProfile,
    trips,
    openTripDetailPage
  } = useApp();

  const dest = selectedDestinationDetail;

  const [activeSubTab, setActiveSubTab] = useState<'roadmap' | 'attractions' | 'guide' | 'stays' | 'ai' | 'itinerary'>('roadmap');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([]);
  const [isAiAnswering, setIsAiAnswering] = useState<boolean>(false);
  const [liveWeather, setLiveWeather] = useState<{ tempC: number; condition: string } | null>(null);

  // Roadmap & Database Sync State
  const [selectedRoadmapDays, setSelectedRoadmapDays] = useState<number>(3);
  const [roadmap, setRoadmap] = useState<DestinationRoadmap | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState<boolean>(false);
  const [isSavingRoadmap, setIsSavingRoadmap] = useState<boolean>(false);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editedDays, setEditedDays] = useState<RoadmapDay[]>([]);

  // If no destination selected, fallback to listing
  if (!dest) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[#070B14] text-white text-center">
        <Compass className="h-16 w-16 text-[#E2C076] mb-4 animate-pulse" />
        <h2 className="text-2xl font-serif font-bold mb-2">No Destination Selected</h2>
        <p className="text-gray-400 mb-6 text-sm">Please select a destination from our world-class curated collection.</p>
        <button
          onClick={backToDestinations}
          className="rounded-xl bg-[#E2C076] px-6 py-3 text-sm font-bold text-[#070B14] hover:opacity-95 transition"
        >
          Return to Destinations Listing
        </button>
      </div>
    );
  }

  const galleryImages = [dest.heroImage, ...(dest.gallery || [])].filter(
    (val, idx, arr) => arr.indexOf(val) === idx
  );

  // Fetch live weather from API if coordinates available
  useEffect(() => {
    if (dest.coordinates) {
      fetch(`/api/destinations/live-weather/${dest.coordinates.lat}/${dest.coordinates.lng}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.weather) {
            setLiveWeather(data.weather);
          }
        })
        .catch(() => {});
    }
  }, [dest.coordinates]);

  // Find linked stays & experiences in this destination
  const connectedHotels = hotels.filter(
    (h) =>
      h.destinationId.toLowerCase() === dest.id.toLowerCase() ||
      h.destinationName.toLowerCase().includes(dest.name.toLowerCase()) ||
      dest.name.toLowerCase().includes(h.destinationName.toLowerCase())
  );

  const connectedExperiences = experiences.filter(
    (e) =>
      e.destinationId.toLowerCase() === dest.id.toLowerCase() ||
      e.destinationName.toLowerCase().includes(dest.name.toLowerCase()) ||
      dest.name.toLowerCase().includes(e.destinationName.toLowerCase())
  );

  // Fetch Day 1...Day N Roadmap from Neon Postgres API
  useEffect(() => {
    if (!dest?.id) return;
    setIsLoadingRoadmap(true);
    const userEmailParam = userProfile?.email ? `&userEmail=${encodeURIComponent(userProfile.email)}` : '';
    fetch(`/api/destinations/${encodeURIComponent(dest.id)}/roadmap?days=${selectedRoadmapDays}${userEmailParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.roadmap) {
          setRoadmap(data.roadmap);
          setEditedDays(data.roadmap.days || []);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch roadmap from database:', err);
      })
      .finally(() => {
        setIsLoadingRoadmap(false);
      });
  }, [dest?.id, selectedRoadmapDays, userProfile?.email]);

  const handleSaveRoadmapToDb = async () => {
    if (!dest?.id) return;
    setIsSavingRoadmap(true);
    try {
      const res = await fetch(`/api/destinations/${encodeURIComponent(dest.id)}/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daysCount: selectedRoadmapDays,
          title: roadmap?.title || `${selectedRoadmapDays}-Day Luxury Roadmap for ${dest.name}`,
          overview: roadmap?.overview || `Custom traveler roadmap across ${selectedRoadmapDays} days.`,
          days: editedDays,
          destinationName: dest.name,
          userEmail: userProfile?.email
        })
      });
      const data = await res.json();
      if (data.success && data.roadmap) {
        setRoadmap(data.roadmap);
        setEditedDays(data.roadmap.days);
        setEditingDayIndex(null);
        showToast(`Roadmap for ${dest.name} (${selectedRoadmapDays} Days) saved successfully!`, 'success');
      } else {
        showToast(data.error || 'Failed to update roadmap', 'error');
      }
    } catch (err) {
      console.error('Save roadmap error:', err);
      showToast('Error saving roadmap', 'error');
    } finally {
      setIsSavingRoadmap(false);
    }
  };

  const handleCreateTripFromRoadmap = async () => {
    if (!dest) return;
    const newTrip = await createTrip({
      title: `${selectedRoadmapDays}-Day Luxury ${dest.name} Journey`,
      destination: dest.name,
      travelersCount: 2,
      budgetAmount: (dest.startingPriceUsd || 400) * selectedRoadmapDays,
      coverImage: dest.heroImage,
      notes: `${selectedRoadmapDays}-day tailored journey with verified where-to-stay and where-to-live roadmap in ${dest.name}.`,
      itinerary: editedDays.map((d) => ({
        day: d.day,
        title: d.title,
        theme: d.theme || d.title,
        description: `${d.theme} — Staying at ${d.whereToStay?.hotelName || 'Luxury Resort'} in ${d.whereToLive?.neighborhood || 'City Quarter'}`,
        morning: d.whereToLive?.morningActivity || 'Morning cultural immersion',
        afternoon: d.whereToLive?.afternoonActivity || 'Afternoon exploration',
        evening: d.whereToLive?.eveningDining || 'Evening gourmet dining',
        transit: d.transit,
        includedMeals: d.includedMeals,
        activities: [
          { id: `slot-rm-${d.day}-1`, time: '09:00 AM', activity: d.whereToLive?.morningActivity || 'Morning cultural immersion & local exploration' },
          { id: `slot-rm-${d.day}-2`, time: '01:30 PM', activity: d.whereToLive?.afternoonActivity || 'Afternoon scenic highlights & heritage sights' },
          { id: `slot-rm-${d.day}-3`, time: '07:00 PM', activity: d.whereToLive?.eveningDining || 'Fine dining & sunset lounge relaxation' }
        ]
      }))
    });
    if (newTrip) {
      showToast(`Trip created and linked to your ${dest.name} roadmap!`, 'success');
      openTripDetailPage(newTrip);
    }
  };

  const userDestTrips = trips.filter(
    (t) =>
      t.destination.toLowerCase().includes(dest.name.toLowerCase()) ||
      dest.name.toLowerCase().includes(t.destination.toLowerCase())
  );

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast(`Travel guide link for ${dest.name} copied to clipboard!`, 'success');
  };

  const handleImportToTripPlanner = () => {
    setCustomPlan((prev) => ({
      ...prev,
      destination: dest.name,
      totalBudgetUsd: dest.startingPriceUsd * 4
    }));
    setActiveTab('planner');
    showToast(`Loaded ${dest.name} itinerary into Bespoke Trip Planner!`, 'success');
  };

  const handleAddToMyTrips = async () => {
    const genResult = generateItineraryFromTitle(
      `VIP Expedition to ${dest.name}`,
      dest.name,
      4,
      new Date().toISOString().split('T')[0],
      true
    );

    const created = await createTrip({
      title: `VIP Expedition to ${dest.name}`,
      destination: `${dest.name}, ${dest.country}`,
      budgetAmount: dest.startingPriceUsd * 5,
      budgetCurrency: 'USD',
      travelersCount: 2,
      coverImage: dest.heroImage,
      notes: `Curated VIP itinerary and attractions for ${dest.name}. Best season to visit: ${dest.bestTimeToVisit}.`,
      itinerary: genResult.itinerary
    });
    if (created) {
      showToast(`Added ${dest.name} to My Trips!`, 'success');
      openTripDetailPage(created);
    }
  };

  const handleSendAiQuestion = async (promptToSend?: string) => {
    const query = promptToSend || aiQuestion;
    if (!query.trim() || isAiAnswering) return;

    const userMsg = query.trim();
    setAiChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setAiQuestion('');
    setIsAiAnswering(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `User is viewing the luxury travel guide for ${dest.name}, ${dest.country}. Question: ${userMsg}. Provide authentic, highly practical, luxury travel advice specific to ${dest.name}.`,
          userEmail: userProfile?.email
        })
      });
      const data = await res.json();
      if (data.reply) {
        setAiChatMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        throw new Error('No reply from concierge');
      }
    } catch (err) {
      setAiChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Here is local insight for ${dest.name}: Always carry both cash and card, check temple or museum opening times in advance, and make dinner reservations at least 48 hours ahead during peak season.` }
      ]);
    } finally {
      setIsAiAnswering(false);
    }
  };

  const currentTemp = liveWeather?.tempC ?? dest.temperatureC;
  const currentWeather = liveWeather?.condition ?? dest.weatherCondition;

  return (
    <div id="destination-detail-page" className="min-h-screen bg-[#070B14] text-white pb-24">
      {/* Sticky Top Bar & Breadcrumb Navigation */}
      <nav className="sticky top-16 z-30 border-b border-[#E2C076]/20 bg-[#070B14]/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3.5 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            id="back-to-destinations-btn"
            onClick={backToDestinations}
            className="group flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-300 hover:text-[#E2C076] transition"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-[#E2C076]/50">
              <ChevronLeft className="h-4 w-4" />
            </div>
            <span>Back to All Destinations</span>
          </button>

          {/* Quick Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyShareLink}
              title="Share Guide"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:border-[#E2C076]/40 hover:text-white transition"
            >
              <Share2 className="h-3.5 w-3.5 text-[#E2C076]" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={handleAddToMyTrips}
              className="flex items-center gap-1.5 rounded-lg border border-[#E2C076]/30 bg-[#0F172A] px-3.5 py-1.5 text-xs font-semibold text-[#E2C076] hover:bg-[#E2C076] hover:text-[#070B14] transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Save to My Trips</span>
            </button>

            <button
              onClick={handleImportToTripPlanner}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#E2C076] to-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-[#070B14] hover:opacity-95 transition shadow-sm"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Plan Itinerary</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Header & Panoramic Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visual Carousel (Left 8 cols) */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[#E2C076]/25 bg-gray-900 shadow-2xl">
              <img
                src={galleryImages[activeImageIndex] || dest.heroImage}
                alt={dest.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-transparent to-black/30" />

              {/* Badges on Hero */}
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/70 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-[#E2C076] border border-[#E2C076]/30">
                  {dest.category} Destination
                </span>
                {dest.isAiGenerated && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-950/80 backdrop-blur-md px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                    <Sparkles className="h-3 w-3 text-indigo-400" />
                    AI Verified Synthesis
                  </span>
                )}
              </div>

              {/* Coordinates Pill */}
              <div className="absolute top-4 right-4 hidden sm:flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs text-gray-300 border border-white/10">
                <MapPin className="h-3.5 w-3.5 text-[#E2C076]" />
                <span>
                  {dest.coordinates.lat.toFixed(4)}°N, {dest.coordinates.lng.toFixed(4)}°E
                </span>
              </div>

              {/* Bottom Title on Image */}
              <div className="absolute bottom-4 left-4 right-4 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#E2C076]">
                  <span>{dest.country}</span>
                  <span>•</span>
                  <span>{dest.region}</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold font-serif text-white tracking-tight drop-shadow-md">
                  {dest.name}
                </h1>
              </div>
            </div>

            {/* Thumbnail Selectors */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative aspect-video w-20 sm:w-24 flex-shrink-0 overflow-hidden rounded-xl border transition ${
                      activeImageIndex === idx
                        ? 'border-[#E2C076] ring-2 ring-[#E2C076]/40 scale-105'
                        : 'border-white/15 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumb ${idx}`}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Key Facts & Quick Booking Card (Right 4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-[#E2C076]/25 bg-[#0B132B]/90 p-5 sm:p-6 shadow-xl space-y-6">
            <div>
              {/* Rating & Review Header */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-bold text-sm sm:text-base">{dest.rating.toFixed(2)}</span>
                  </div>
                  <span className="text-xs text-gray-400">({dest.reviewCount} verified travelers)</span>
                </div>
                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  Exceptional
                </span>
              </div>

              {/* Pricing Callout */}
              <div className="py-4">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Starting Tariff</span>
                <div className="text-3xl font-extrabold text-[#E2C076] mt-0.5">
                  {formatPrice(dest.startingPriceUsd)}
                  <span className="text-xs font-normal text-gray-400"> / day baseline</span>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <span className="text-gray-400 flex items-center gap-1 mb-1">
                    <CloudSun className="h-3.5 w-3.5 text-amber-400" /> Live Climate
                  </span>
                  <span className="font-bold text-white text-sm">{currentTemp}°C</span>
                  <p className="text-[11px] text-gray-300 truncate">{currentWeather}</p>
                </div>

                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <span className="text-gray-400 flex items-center gap-1 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-[#E2C076]" /> Best Season
                  </span>
                  <span className="font-bold text-white text-xs block truncate" title={dest.bestTimeToVisit}>
                    {dest.bestTimeToVisit.split('(')[0]}
                  </span>
                </div>

                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <span className="text-gray-400 flex items-center gap-1 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Currency
                  </span>
                  <span className="font-semibold text-white truncate block">
                    {dest.localCurrency || 'Local Currency / USD'}
                  </span>
                </div>

                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <span className="text-gray-400 flex items-center gap-1 mb-1">
                    <Zap className="h-3.5 w-3.5 text-sky-400" /> Timezone
                  </span>
                  <span className="font-semibold text-white truncate block">
                    {dest.timezone || 'Local Standard'}
                  </span>
                </div>
              </div>

              {/* Historical Fact / Local Trivia */}
              {dest.historicalFact && (
                <div className="mt-4 rounded-xl border border-[#E2C076]/20 bg-[#E2C076]/5 p-3 text-xs text-gray-300 italic leading-relaxed">
                  <span className="font-semibold text-[#E2C076] not-italic block mb-0.5">Historical Insight:</span>
                  "{dest.historicalFact}"
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-gray-800">
              <button
                onClick={handleImportToTripPlanner}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E2C076] to-[#D4AF37] px-4 py-3 text-sm font-bold text-[#070B14] hover:opacity-95 transition shadow-lg shadow-[#E2C076]/20"
              >
                <Calendar className="h-4 w-4" />
                <span>Plan Bespoke Trip to {dest.name}</span>
              </button>

              <button
                onClick={() => setActiveSubTab('ai')}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#E2C076]/30 bg-[#0F172A] px-4 py-2.5 text-xs font-semibold text-white hover:border-[#E2C076] hover:bg-[#1E293B] transition"
              >
                <Sparkles className="h-4 w-4 text-[#E2C076]" />
                <span>Ask AI Concierge About {dest.name}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Destination Overview Paragraph */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0B132B]/60 p-5 sm:p-6 backdrop-blur-md">
          <h2 className="text-lg font-serif font-bold text-white mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-[#E2C076]" />
            About {dest.name}
          </h2>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            {dest.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {dest.highlights.map((hl, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2C076]/20 bg-[#E2C076]/5 px-3 py-1 text-xs text-gray-200"
              >
                <CheckCircle className="h-3.5 w-3.5 text-[#E2C076]" />
                <span>{hl}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Sub-Navigation Tabs Bar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex border-b border-gray-800 overflow-x-auto scrollbar-none gap-2 sm:gap-6">
          <button
            id="tab-btn-roadmap"
            onClick={() => setActiveSubTab('roadmap')}
            className={`flex items-center gap-2 pb-3.5 px-2 text-sm font-semibold transition border-b-2 whitespace-nowrap ${
              activeSubTab === 'roadmap'
                ? 'border-[#E2C076] text-[#E2C076]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Map className="h-4 w-4 text-[#E2C076]" />
            <span>Day 1...Day N Roadmap</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2C076]/20 text-[#E2C076] border border-[#E2C076]/40">
              Where to Stay & Live
            </span>
          </button>

          <button
            id="tab-btn-attractions"
            onClick={() => setActiveSubTab('attractions')}
            className={`flex items-center gap-2 pb-3.5 px-2 text-sm font-semibold transition border-b-2 whitespace-nowrap ${
              activeSubTab === 'attractions'
                ? 'border-[#E2C076] text-[#E2C076]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Top Attractions ({dest.attractions?.length || 4})</span>
          </button>

          <button
            id="tab-btn-guide"
            onClick={() => setActiveSubTab('guide')}
            className={`flex items-center gap-2 pb-3.5 px-2 text-sm font-semibold transition border-b-2 whitespace-nowrap ${
              activeSubTab === 'guide'
                ? 'border-[#E2C076] text-[#E2C076]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Comprehensive Travel Guide</span>
          </button>

          <button
            id="tab-btn-itinerary"
            onClick={() => setActiveSubTab('itinerary')}
            className={`flex items-center gap-2 pb-3.5 px-2 text-sm font-semibold transition border-b-2 whitespace-nowrap ${
              activeSubTab === 'itinerary'
                ? 'border-[#E2C076] text-[#E2C076]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Curated Itinerary</span>
          </button>

          <button
            id="tab-btn-stays"
            onClick={() => setActiveSubTab('stays')}
            className={`flex items-center gap-2 pb-3.5 px-2 text-sm font-semibold transition border-b-2 whitespace-nowrap ${
              activeSubTab === 'stays'
                ? 'border-[#E2C076] text-[#E2C076]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <HotelIcon className="h-4 w-4" />
            <span>Connected Stays & Tours ({connectedHotels.length + connectedExperiences.length})</span>
          </button>

          <button
            id="tab-btn-ai"
            onClick={() => setActiveSubTab('ai')}
            className={`flex items-center gap-2 pb-3.5 px-2 text-sm font-semibold transition border-b-2 whitespace-nowrap ${
              activeSubTab === 'ai'
                ? 'border-[#E2C076] text-[#E2C076]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="h-4 w-4 text-[#E2C076]" />
            <span>AI Travel Assistant</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="mt-8">
          {/* ========================================== */}
          {/* 1. ATTRACTIONS & SIGHTS TAB */}
          {/* ========================================== */}
          {activeSubTab === 'attractions' && (
            <div id="tab-pane-attractions" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-800/80 pb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-white">
                    Verified Sights & Iconic Landmarks in {dest.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Curated with authentic GPS coordinates, admission rates, opening hours, and insider recommendations.
                  </p>
                </div>
              </div>

              {dest.attractions && dest.attractions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dest.attractions.map((attr) => (
                    <div
                      key={attr.id}
                      id={`attraction-item-${attr.id}`}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B132B]/80 transition-all hover:border-[#E2C076]/50 hover:shadow-xl"
                    >
                      {/* Attraction Image */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-900">
                        <img
                          src={attr.image}
                          alt={attr.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-transparent to-black/20" />
                        <span className="absolute top-3 left-3 rounded-full bg-black/70 backdrop-blur-md px-3 py-0.5 text-xs font-semibold text-[#E2C076] border border-[#E2C076]/30">
                          {attr.category}
                        </span>
                        <div className="absolute bottom-3 right-3">
                          <a
                            href={attr.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-black/70 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-white hover:text-[#E2C076] border border-white/20 transition"
                          >
                            <MapPin className="h-3 w-3 text-[#E2C076]" />
                            <span>Navigate (Google Maps)</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      </div>

                      {/* Attraction Body */}
                      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-lg font-bold text-white font-serif">{attr.name}</h4>
                          </div>
                          <p className="text-xs text-[#E2C076] font-medium flex items-center gap-1 mb-2.5">
                            <MapPin className="h-3 w-3" />
                            {attr.location}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                            {attr.description}
                          </p>

                          {/* Admission & Hours Badges */}
                          <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                              <span className="text-gray-400 block text-[11px]">Admission Fee</span>
                              <span className="font-semibold text-emerald-400">{attr.admissionFee}</span>
                            </div>
                            <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                              <span className="text-gray-400 block text-[11px]">Opening Hours</span>
                              <span className="font-semibold text-gray-200 truncate block">{attr.openingHours}</span>
                            </div>
                          </div>

                          {/* Golden Insider Tip */}
                          {attr.insiderTip && (
                            <div className="mt-3.5 rounded-xl border border-[#E2C076]/25 bg-[#E2C076]/5 p-3 text-xs leading-relaxed text-gray-200">
                              <div className="flex items-center gap-1 font-bold text-[#E2C076] mb-1">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Insider Recommendation:</span>
                              </div>
                              <p className="italic">"{attr.insiderTip}"</p>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            Suggested: {attr.recommendedDuration}
                          </span>
                          <button
                            onClick={() => openAiWithPrompt(`Provide a VIP visitor plan for ${attr.name} in ${dest.name}, including best photo spots and queue bypass tips.`)}
                            className="text-[#E2C076] hover:underline font-medium flex items-center gap-1"
                          >
                            <span>Ask AI details</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0B132B]/50 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-sm">No specific attractions listed. You can generate them with AI.</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* 2. COMPREHENSIVE TRAVEL GUIDE TAB */}
          {/* ========================================== */}
          {activeSubTab === 'guide' && (
            <div id="tab-pane-guide" className="space-y-10">
              {dest.travelGuide ? (
                <>
                  {/* Guide Overview Banner */}
                  <div className="rounded-2xl border border-[#E2C076]/25 bg-gradient-to-r from-[#0F172A] to-[#0B132B] p-6">
                    <h3 className="text-xl font-serif font-bold text-white mb-2 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-[#E2C076]" />
                      Travel Intelligence Overview
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                      {dest.travelGuide.overview}
                    </p>
                  </div>

                  {/* Section 1: Best Time to Visit & Seasonal Guide */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#E2C076]" />
                      <h4 className="text-lg font-serif font-bold text-white">
                        Best Time to Visit & Seasonal Climate
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      {dest.travelGuide.bestTimeToVisit.summary}
                    </p>

                    {/* Season Seasons Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                        <span className="font-bold text-amber-400 block mb-1">Peak Season</span>
                        <p className="text-gray-300">{dest.travelGuide.bestTimeToVisit.peakSeason}</p>
                      </div>
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                        <span className="font-bold text-emerald-400 block mb-1">Shoulder Season (Best Value)</span>
                        <p className="text-gray-300">{dest.travelGuide.bestTimeToVisit.shoulderSeason}</p>
                      </div>
                      <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5">
                        <span className="font-bold text-sky-400 block mb-1">Off-Peak Season</span>
                        <p className="text-gray-300">{dest.travelGuide.bestTimeToVisit.offPeakSeason}</p>
                      </div>
                    </div>

                    {/* Seasonal Breakdown Table */}
                    {dest.travelGuide.bestTimeToVisit.weatherBySeason && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {dest.travelGuide.bestTimeToVisit.weatherBySeason.map((season, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-white/10 bg-[#0B132B]/90 p-4 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-sm">{season.season}</span>
                              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-[#E2C076] font-medium">
                                {season.temp}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 font-medium">{season.months}</div>
                            <p className="text-xs text-gray-300">{season.weather}</p>
                            <div className="pt-2 border-t border-gray-800 text-[11px] text-[#E2C076]">
                              <span className="font-semibold text-gray-300">What to pack: </span>
                              {season.recommendation}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Culture, Etiquette & Language */}
                  <div className="space-y-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2">
                      <Languages className="h-5 w-5 text-[#E2C076]" />
                      <h4 className="text-lg font-serif font-bold text-white">
                        Local Culture, Etiquette & Customs
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="rounded-xl border border-white/10 bg-[#0B132B]/80 p-4">
                          <span className="font-bold text-sm text-[#E2C076] block mb-1.5">
                            Dress Code & Modesty
                          </span>
                          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                            {dest.travelGuide.cultureAndEtiquette.dressCode}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-[#0B132B]/80 p-4">
                          <span className="font-bold text-sm text-emerald-400 block mb-1.5">
                            Tipping Customs & Service
                          </span>
                          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                            {dest.travelGuide.cultureAndEtiquette.tippingNorms}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-[#0B132B]/80 p-4 space-y-3">
                        <span className="font-bold text-sm text-white block">
                          Essential Customs to Respect
                        </span>
                        <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
                          {dest.travelGuide.cultureAndEtiquette.customs.map((c, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-[#E2C076] flex-shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Language Cheat Sheet */}
                        {dest.travelGuide.cultureAndEtiquette.languageTips && (
                          <div className="pt-3 border-t border-gray-800">
                            <span className="font-bold text-xs text-[#E2C076] uppercase tracking-wider block mb-2">
                              Helpful Local Phrases
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {dest.travelGuide.cultureAndEtiquette.languageTips.map((phrase, i) => (
                                <div key={i} className="rounded-lg bg-white/5 p-2">
                                  <span className="font-bold text-white block">{phrase.phrase}</span>
                                  <span className="text-gray-400 text-[11px]">{phrase.meaning}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Getting Around & Transit */}
                  <div className="space-y-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-[#E2C076]" />
                      <h4 className="text-lg font-serif font-bold text-white">
                        Getting Around & Transportation
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                      <div className="rounded-xl border border-white/10 bg-[#0B132B]/80 p-4">
                        <span className="font-bold text-[#E2C076] block mb-1">Airport Transit</span>
                        <p className="text-gray-300 text-xs leading-relaxed">
                          {dest.travelGuide.gettingAround.airportTransit}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-[#0B132B]/80 p-4">
                        <span className="font-bold text-emerald-400 block mb-1">Private Chauffeur & Cabs</span>
                        <p className="text-gray-300 text-xs leading-relaxed">
                          {dest.travelGuide.gettingAround.privateChauffeur}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-[#0B132B]/80 p-4">
                        <span className="font-bold text-sky-400 block mb-1">Public Transit & Apps</span>
                        <p className="text-gray-300 text-xs leading-relaxed mb-2">
                          {dest.travelGuide.gettingAround.publicTransit}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {dest.travelGuide.gettingAround.recommendedApps.map((app, i) => (
                            <span key={i} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-gray-300">
                              {app}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Culinary & Must-Try Food */}
                  <div className="space-y-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-[#E2C076]" />
                      <h4 className="text-lg font-serif font-bold text-white">
                        Gastronomy & Must-Try Authentic Delicacies
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      {dest.travelGuide.gastronomy.culinaryDescription}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {dest.travelGuide.gastronomy.mustTryDishes.map((dish, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-white/10 bg-[#0B132B]/80 p-4 space-y-1.5 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-sm">{dish.name}</span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                  dish.isVegetarian
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {dish.isVegetarian ? 'Vegetarian' : dish.type}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 mt-1 leading-relaxed">{dish.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-gray-300">
                      <span className="font-bold text-[#E2C076] mr-2">Top Dining Institutions & Quarters:</span>
                      {dest.travelGuide.gastronomy.iconicDiningAreas.join(' • ')}
                    </div>
                  </div>

                  {/* Section 5: Practical Info, Safety & Visa */}
                  <div className="space-y-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-[#E2C076]" />
                      <h4 className="text-lg font-serif font-bold text-white">
                        Practical Travel Tips, Safety & Visa
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="rounded-xl border border-white/10 bg-[#0B132B]/80 p-4">
                          <span className="font-bold text-xs uppercase tracking-wider text-[#E2C076] block mb-1">
                            Currency & Card Acceptance
                          </span>
                          <p className="text-xs sm:text-sm text-gray-300 mb-2">
                            {dest.travelGuide.practicalInfo.currency}
                          </p>
                          <p className="text-xs text-gray-400">
                            Cards: {dest.travelGuide.practicalInfo.cardAcceptance}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-[#0B132B]/80 p-4">
                          <span className="font-bold text-xs uppercase tracking-wider text-sky-400 block mb-1">
                            Mobile Connectivity & eSIM
                          </span>
                          <p className="text-xs sm:text-sm text-gray-300">
                            {dest.travelGuide.practicalInfo.connectivitySim}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-[#0B132B]/80 p-4">
                          <span className="font-bold text-xs uppercase tracking-wider text-amber-400 block mb-1">
                            Visa & Entry Requirements
                          </span>
                          <p className="text-xs sm:text-sm text-gray-300">
                            {dest.travelGuide.practicalInfo.visaInfo}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                          <span className="font-bold text-xs uppercase tracking-wider text-emerald-400 block mb-1">
                            Safety Rating & Essential Tips
                          </span>
                          <p className="text-xs font-semibold text-emerald-300 mb-2">
                            Rating: {dest.travelGuide.practicalInfo.safetyRating}
                          </p>
                          <ul className="space-y-1.5 text-xs text-gray-300">
                            {dest.travelGuide.practicalInfo.safetyTips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-[#E2C076]">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-[#0B132B]/80 p-4">
                          <span className="font-bold text-xs uppercase tracking-wider text-rose-400 block mb-2 flex items-center gap-1">
                            <PhoneCall className="h-3.5 w-3.5" /> Emergency Contacts
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded bg-white/5 p-2">
                              <span className="text-gray-400 block text-[11px]">Police</span>
                              <span className="font-bold text-white">{dest.travelGuide.practicalInfo.emergencyNumbers.police}</span>
                            </div>
                            <div className="rounded bg-white/5 p-2">
                              <span className="text-gray-400 block text-[11px]">Ambulance</span>
                              <span className="font-bold text-white">{dest.travelGuide.practicalInfo.emergencyNumbers.ambulance}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center bg-[#0B132B]/50 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-sm">Travel guide not available yet for this destination. Click "Ask AI Concierge" to generate full intelligence.</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* 3. DAY 1...DAY N ROADMAP (WHERE TO STAY & LIVE) */}
          {/* ========================================== */}
          {(activeSubTab === 'roadmap' || activeSubTab === 'itinerary') && (
            <div id="tab-pane-roadmap" className="space-y-8">
              {/* Duration Selector & Itinerary Controls Bar */}
              <div className="rounded-2xl border border-[#E2C076]/30 bg-[#0B132B]/90 p-6 backdrop-blur-md shadow-xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E2C076]/15 text-[#E2C076] border border-[#E2C076]/30">
                        <Map className="h-3.5 w-3.5" />
                        Interactive Itinerary Roadmap
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Verified Luxury Itinerary
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                      {selectedRoadmapDays}-Day Luxury Travel Roadmap for {dest.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
                      Select your travel duration below. For every day, see a verified roadmap of <strong>Where to Stay</strong> (5-star hotels & suites) and <strong>Where to Live & Explore</strong> (neighborhood quarters, morning, afternoon, and evening).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      id="btn-create-trip-from-roadmap"
                      onClick={handleCreateTripFromRoadmap}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#E2C076] px-5 py-2.5 text-xs font-bold text-[#070B14] hover:opacity-95 transition shadow-lg"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Trip & Save to My Trips</span>
                    </button>
                  </div>
                </div>

                {/* Day Duration Selector Buttons */}
                <div className="mt-6 pt-5 border-t border-gray-800/80">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-3">
                    Select Journey Duration (Day 1 ... Day N):
                  </span>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5, 7].map((numDays) => {
                      const isSelected = selectedRoadmapDays === numDays;
                      return (
                        <button
                          key={numDays}
                          id={`btn-select-days-${numDays}`}
                          onClick={() => {
                            setSelectedRoadmapDays(numDays);
                            setEditingDayIndex(null);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                            isSelected
                              ? 'bg-[#E2C076] text-[#070B14] shadow-md scale-105'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{numDays} {numDays === 1 ? 'Day' : 'Days'}</span>
                          {numDays === 3 && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${isSelected ? 'bg-[#070B14]/20 text-[#070B14]' : 'bg-[#E2C076]/20 text-[#E2C076]'}`}>
                              Popular
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* User's Created Trips for this Destination */}
              {userDestTrips.length > 0 && (
                <div className="rounded-2xl border border-indigo-500/30 bg-[#0B132B]/80 p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3 border-b border-indigo-500/20 pb-2">
                    <div className="flex items-center gap-2">
                      <Luggage className="h-4 w-4 text-indigo-400" />
                      <h4 className="text-sm font-bold text-white">
                        Your Trips to {dest.name} ({userDestTrips.length})
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('mytrips')}
                      className="text-xs text-[#E2C076] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>View in My Trips</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {userDestTrips.map((trip) => (
                      <div
                        key={trip.id}
                        className="rounded-xl border border-white/10 bg-white/5 p-3.5 flex flex-col justify-between hover:border-indigo-400/40 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-white truncate max-w-[180px]">{trip.title}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                              {trip.status || 'Active'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400">
                            {trip.travelersCount} Travelers • Budget: {formatPrice(trip.budgetAmount)}
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('mytrips')}
                          className="mt-2 text-left text-[11px] text-indigo-300 hover:text-white flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Inspect Trip Itinerary</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Day-by-Day Cards */}
              {isLoadingRoadmap ? (
                <div className="p-12 text-center bg-[#0B132B]/50 rounded-2xl border border-white/10">
                  <Loader2 className="h-8 w-8 text-[#E2C076] animate-spin mx-auto mb-3" />
                  <p className="text-gray-300 text-sm font-semibold">Loading {selectedRoadmapDays}-Day Roadmap...</p>
                  <p className="text-gray-500 text-xs mt-1">Retrieving verified stays, quarter details, and day schedules.</p>
                </div>
              ) : editedDays && editedDays.length > 0 ? (
                <div className="space-y-6">
                  {editedDays.map((dayItem, index) => {
                    const isEditing = editingDayIndex === index;
                    return (
                      <div
                        key={dayItem.day}
                        id={`roadmap-day-card-${dayItem.day}`}
                        className="rounded-2xl border border-white/10 bg-[#0B132B]/90 p-5 sm:p-6 shadow-xl relative overflow-hidden transition hover:border-white/20"
                      >
                        {/* Day Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-800 pb-4 mb-5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E2C076] text-sm font-extrabold text-[#070B14] shadow">
                              D{dayItem.day}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base sm:text-lg font-bold font-serif text-white">
                                  {dayItem.title}
                                </h4>
                                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E2C076]/10 text-[#E2C076] border border-[#E2C076]/20">
                                  {dayItem.theme}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                                {dayItem.transit && (
                                  <span className="flex items-center gap-1 text-indigo-300">
                                    <Car className="h-3 w-3" />
                                    <span>{dayItem.transit}</span>
                                  </span>
                                )}
                                {dayItem.includedMeals && dayItem.includedMeals.length > 0 && (
                                  <span className="flex items-center gap-1 text-amber-300">
                                    <Utensils className="h-3 w-3" />
                                    <span>{dayItem.includedMeals.join(' • ')}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setEditingDayIndex(isEditing ? null : index)}
                            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-[#E2C076]" />
                            <span>{isEditing ? 'Close Editor' : 'Customize Day'}</span>
                          </button>
                        </div>

                        {/* If in edit mode for this day */}
                        {isEditing && (
                          <div className="mb-6 p-4 rounded-xl border border-[#E2C076]/30 bg-[#E2C076]/5 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#E2C076] uppercase tracking-wider flex items-center gap-1">
                                <Edit3 className="h-3.5 w-3.5" /> Customize Day {dayItem.day} Details
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block text-gray-400 mb-1">Hotel / Stay Name</label>
                                <input
                                  type="text"
                                  value={dayItem.whereToStay?.hotelName || ''}
                                  onChange={(e) => {
                                    const updated = [...editedDays];
                                    updated[index].whereToStay.hotelName = e.target.value;
                                    setEditedDays(updated);
                                  }}
                                  className="w-full rounded bg-[#070B14] border border-gray-700 px-3 py-2 text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-gray-400 mb-1">Suite / Room Tier</label>
                                <input
                                  type="text"
                                  value={dayItem.whereToStay?.roomTierName || ''}
                                  onChange={(e) => {
                                    const updated = [...editedDays];
                                    updated[index].whereToStay.roomTierName = e.target.value;
                                    setEditedDays(updated);
                                  }}
                                  className="w-full rounded bg-[#070B14] border border-gray-700 px-3 py-2 text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-gray-400 mb-1">Where to Live (Neighborhood & Vibe)</label>
                                <input
                                  type="text"
                                  value={dayItem.whereToLive?.neighborhood || ''}
                                  onChange={(e) => {
                                    const updated = [...editedDays];
                                    updated[index].whereToLive.neighborhood = e.target.value;
                                    setEditedDays(updated);
                                  }}
                                  className="w-full rounded bg-[#070B14] border border-gray-700 px-3 py-2 text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-gray-400 mb-1">Evening Dining Spot</label>
                                <input
                                  type="text"
                                  value={dayItem.whereToLive?.eveningDining || ''}
                                  onChange={(e) => {
                                    const updated = [...editedDays];
                                    updated[index].whereToLive.eveningDining = e.target.value;
                                    setEditedDays(updated);
                                  }}
                                  className="w-full rounded bg-[#070B14] border border-gray-700 px-3 py-2 text-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Two Columns: WHERE TO STAY & WHERE TO LIVE */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* 1. WHERE TO STAY */}
                          <div className="rounded-xl border border-white/10 bg-[#070B14]/70 p-4 sm:p-5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E2C076]">
                                  <HotelIcon className="h-4 w-4" />
                                  Where to Stay
                                </span>
                                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                  5-Star Luxury
                                </span>
                              </div>

                              <div className="flex gap-4 mb-3">
                                {dayItem.whereToStay?.image && (
                                  <img
                                    src={dayItem.whereToStay.image}
                                    alt={dayItem.whereToStay.hotelName}
                                    className="h-20 w-24 sm:h-24 sm:w-28 rounded-lg object-cover border border-white/10 flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                )}
                                <div>
                                  <h5 className="text-base font-bold text-white">
                                    {dayItem.whereToStay?.hotelName}
                                  </h5>
                                  <p className="text-xs text-[#E2C076] font-medium">
                                    {dayItem.whereToStay?.roomTierName}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                    <span className="truncate">{dayItem.whereToStay?.address}</span>
                                  </p>
                                  <p className="text-xs text-white font-semibold mt-1">
                                    {formatPrice(dayItem.whereToStay?.pricePerNightUsd || 520)} <span className="text-gray-400 font-normal">/ night</span>
                                  </p>
                                </div>
                              </div>

                              {dayItem.whereToStay?.highlights && dayItem.whereToStay.highlights.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {dayItem.whereToStay.highlights.map((h, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 rounded text-[11px] bg-white/5 text-gray-300 border border-white/5"
                                    >
                                      ✓ {h}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
                              <span className="text-[11px] text-gray-400">Guaranteed VIP Inclusions</span>
                              <button
                                onClick={() => {
                                  const matchingHotel = hotels.find(
                                    (h) =>
                                      h.name.toLowerCase().includes(dayItem.whereToStay.hotelName.toLowerCase()) ||
                                      dayItem.whereToStay.hotelName.toLowerCase().includes(h.name.toLowerCase())
                                  );
                                  if (matchingHotel) {
                                    setSelectedHotelBooking(matchingHotel);
                                  } else {
                                    showToast(`Reservation inquiry dispatched for ${dayItem.whereToStay.hotelName}`, 'success');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition flex items-center gap-1"
                              >
                                <Bed className="h-3 w-3 text-[#E2C076]" />
                                <span>Reserve Suite</span>
                              </button>
                            </div>
                          </div>

                          {/* 2. WHERE TO LIVE & EXPLORE */}
                          <div className="rounded-xl border border-white/10 bg-[#070B14]/70 p-4 sm:p-5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400">
                                  <Home className="h-4 w-4" />
                                  Where to Live & Explore
                                </span>
                                <span className="text-xs font-medium text-gray-400 truncate max-w-[180px]">
                                  {dayItem.whereToLive?.neighborhood}
                                </span>
                              </div>

                              <div className="text-xs text-gray-400 italic mb-3 bg-white/5 p-2.5 rounded-lg border border-white/5">
                                "{dayItem.whereToLive?.vibe}"
                              </div>

                              {/* Morning, Afternoon, Evening schedule */}
                              <div className="space-y-2.5 text-xs">
                                <div className="rounded-lg bg-amber-500/10 p-2.5 border border-amber-500/20">
                                  <span className="font-bold text-amber-300 block mb-0.5">🌅 Morning Immersion</span>
                                  <p className="text-gray-300 leading-relaxed">{dayItem.whereToLive?.morningActivity}</p>
                                </div>

                                <div className="rounded-lg bg-emerald-500/10 p-2.5 border border-emerald-500/20">
                                  <span className="font-bold text-emerald-300 block mb-0.5">☀️ Afternoon Discovery</span>
                                  <p className="text-gray-300 leading-relaxed">{dayItem.whereToLive?.afternoonActivity}</p>
                                </div>

                                <div className="rounded-lg bg-indigo-500/10 p-2.5 border border-indigo-500/20">
                                  <span className="font-bold text-indigo-300 block mb-0.5">🌙 Evening Dining & Vibes</span>
                                  <p className="text-gray-300 leading-relaxed">{dayItem.whereToLive?.eveningDining}</p>
                                </div>
                              </div>
                            </div>

                            {dayItem.whereToLive?.highlights && dayItem.whereToLive.highlights.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-800 flex flex-wrap gap-1.5">
                                {dayItem.whereToLive.highlights.map((h, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/10 text-indigo-200 border border-indigo-500/20"
                                  >
                                    ★ {h}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0B132B]/50 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-sm">No roadmap data found for this duration.</p>
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* 4. CONNECTED STAYS & EXPERIENCES TAB */}
          {/* ========================================== */}
          {activeSubTab === 'stays' && (
            <div id="tab-pane-stays" className="space-y-8">
              {/* Connected Hotels */}
              <div>
                <h3 className="text-xl font-serif font-bold text-white mb-1">
                  5-Star Accommodations in {dest.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mb-6">
                  Hand-selected luxury heritage resorts, overwater villas, and private boutique suites.
                </p>

                {connectedHotels.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {connectedHotels.map((hotel) => (
                      <div
                        key={hotel.id}
                        className="rounded-2xl border border-white/10 bg-[#0B132B]/90 overflow-hidden shadow-md flex flex-col justify-between"
                      >
                        <div className="relative aspect-video w-full overflow-hidden">
                          <img
                            src={hotel.image}
                            alt={hotel.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute top-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-amber-400">
                            ★ {hotel.rating} ({hotel.reviewCount})
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <h4 className="text-lg font-bold font-serif text-white">{hotel.name}</h4>
                            <p className="text-xs text-[#E2C076] mt-0.5">{hotel.tagline}</p>
                            <p className="text-xs text-gray-300 mt-2">{hotel.specialty}</p>

                            <div className="mt-3 flex flex-wrap gap-1">
                              {hotel.amenities.slice(0, 3).map((a, i) => (
                                <span key={i} className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-gray-300">
                                  ✓ {a}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] text-gray-400 block">From</span>
                              <span className="text-lg font-bold text-[#E2C076]">
                                {formatPrice(hotel.pricePerNightUsd)}
                                <span className="text-xs font-normal text-gray-400"> / night</span>
                              </span>
                            </div>

                            <button
                              onClick={() => setSelectedHotelBooking(hotel)}
                              className="rounded-xl bg-gradient-to-r from-[#E2C076] to-[#D4AF37] px-4 py-2 text-xs font-bold text-[#070B14] hover:opacity-95 transition"
                            >
                              Reserve Stay
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-gray-400">
                    No connected stays cataloged directly for {dest.name}. You can explore our global stays catalog or consult the AI concierge for partner hotel options.
                  </div>
                )}
              </div>

              {/* Connected Experiences */}
              <div className="pt-6 border-t border-gray-800">
                <h3 className="text-xl font-serif font-bold text-white mb-1">
                  VIP Experiences & Private Excursions
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mb-6">
                  Helicopter ascents, private yacht cruises, and masterclass culinary tours.
                </p>

                {connectedExperiences.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {connectedExperiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="rounded-xl border border-white/10 bg-[#0B132B]/90 p-4 space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          <span className="rounded bg-[#E2C076]/10 text-[#E2C076] border border-[#E2C076]/20 px-2 py-0.5 text-[10px] font-semibold">
                            {exp.category}
                          </span>
                          <h4 className="text-base font-bold text-white mt-2">{exp.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">Duration: {exp.duration}</p>
                        </div>

                        <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                          <span className="text-base font-bold text-[#E2C076]">
                            {formatPrice(exp.priceUsd)}
                          </span>
                          <button
                            onClick={() => setSelectedExperienceBooking(exp)}
                            className="rounded-lg border border-[#E2C076] px-3 py-1 text-xs font-semibold text-[#E2C076] hover:bg-[#E2C076] hover:text-[#070B14] transition"
                          >
                            Book Experience
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-gray-400">
                    Curated bespoke excursions for {dest.name} can be reserved directly with your AI concierge.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 5. AI TRAVEL ASSISTANT TAB */}
          {/* ========================================== */}
          {activeSubTab === 'ai' && (
            <div id="tab-pane-ai" className="rounded-2xl border border-[#E2C076]/25 bg-[#0B132B]/95 p-5 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E2C076]/10 text-[#E2C076] border border-[#E2C076]/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-white">
                    Live AI Tourism Concierge for {dest.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Instant real-time answers powered by TripNest AI with global travel & budget intelligence.
                  </p>
                </div>
              </div>

              {/* Suggested Quick Prompt Chips */}
              <div className="space-y-2">
                <span className="text-xs text-gray-400 font-medium">Quick Consultation Topics:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    `What are the best photography spots at sunrise in ${dest.name}?`,
                    `What packing essentials do I need for ${dest.name} right now?`,
                    `Recommend a 3-day romantic couple itinerary for ${dest.name}.`,
                    `What are the top hidden culinary gems not in tourist guides?`
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendAiQuestion(chip)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:border-[#E2C076]/40 hover:text-white transition text-left"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="min-h-[200px] max-h-[400px] overflow-y-auto space-y-3 rounded-xl border border-white/10 bg-[#070B14] p-4 scrollbar-thin">
                {aiChatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-44 text-center text-gray-400 text-xs">
                    <Sparkles className="h-8 w-8 text-[#E2C076] mb-2 opacity-60" />
                    <p>Ask anything about {dest.name} (dress codes, restaurant tables, taxi rates, visa updates, or packing tips).</p>
                  </div>
                ) : (
                  aiChatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#E2C076] text-[#070B14] font-medium'
                            : 'bg-white/10 text-gray-200 border border-white/10'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {isAiAnswering && (
                  <div className="flex items-center gap-2 text-xs text-[#E2C076] animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI Concierge is thinking for {dest.name}...</span>
                  </div>
                )}
              </div>

              {/* Input Box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendAiQuestion();
                  }}
                  placeholder={`Ask a question about traveling to ${dest.name}...`}
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs sm:text-sm text-white placeholder-gray-400 focus:border-[#E2C076] focus:outline-none"
                />
                <button
                  onClick={() => handleSendAiQuestion()}
                  disabled={!aiQuestion.trim() || isAiAnswering}
                  className="rounded-xl bg-[#E2C076] px-5 py-3 text-xs font-bold text-[#070B14] hover:opacity-95 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
