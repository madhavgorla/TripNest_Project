import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  calculateDistanceKm,
  estimateDrivingTimeMin,
  getProximityBadge,
  GLOBAL_TOURISM_HUBS,
  generateVenuesForCoordinates
} from '../lib/geoUtils';
import {
  MapPin,
  Compass,
  Navigation,
  Hotel,
  Ticket,
  Sliders,
  ExternalLink,
  Sparkles,
  Info,
  Clock,
  Car,
  Radio,
  Globe,
  Search,
  CheckCircle2
} from 'lucide-react';
import L from 'leaflet';

export const InteractiveMap: React.FC = () => {
  const {
    destinations,
    hotels,
    experiences,
    userLocation,
    setUserLocation,
    requestGpsLocation,
    formatPrice,
    setSelectedHotelBooking,
    setSelectedExperienceBooking,
    setSelectedDestinationModal,
    openAiWithPrompt
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);

  const [filterRadiusKm, setFilterRadiusKm] = useState<number>(100);
  const [selectedMapCategory, setSelectedMapCategory] = useState<'All' | 'Stays' | 'Experiences' | 'Destinations'>('All');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [customSearchQuery, setCustomSearchQuery] = useState<string>('');

  // Current center coordinates
  const currentCenterLat = userLocation?.lat || 12.9716;
  const currentCenterLng = userLocation?.lng || 77.5946;
  const currentCenterName = userLocation?.name || 'Selected Tourism Hub';

  // Combine seed points + dynamic coordinates-aware local venues
  const allMapPoints = useMemo(() => {
    // Dynamic authentic venues centered on user's exact coordinate
    const dynamicVenues = generateVenuesForCoordinates(currentCenterLat, currentCenterLng, currentCenterName);

    const baseSeedPoints = [
      ...destinations.map((d) => ({
        id: d.id,
        name: d.name,
        category: 'Destinations' as const,
        lat: d.coordinates.lat,
        lng: d.coordinates.lng,
        image: d.heroImage,
        price: d.startingPriceUsd,
        priceLabel: 'Starting from',
        rating: d.rating,
        address: `${d.region}, ${d.country}`,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.name)}`,
        raw: d
      })),
      ...hotels.map((h) => ({
        id: h.id,
        name: h.name,
        category: 'Stays' as const,
        lat: h.coordinates.lat,
        lng: h.coordinates.lng,
        image: h.image,
        price: h.pricePerNightUsd,
        priceLabel: '/ night',
        rating: h.rating,
        address: h.address,
        googleMapsUrl: h.googleMapsUrl,
        raw: h
      })),
      ...experiences.map((e) => ({
        id: e.id,
        name: e.title,
        category: 'Experiences' as const,
        lat: e.coordinates.lat,
        lng: e.coordinates.lng,
        image: e.image,
        price: e.priceUsd,
        priceLabel: '/ person',
        rating: e.rating,
        address: e.meetingPoint,
        googleMapsUrl: e.googleMapsUrl,
        raw: e
      }))
    ];

    // Combine avoiding duplicate IDs
    const combined = [...dynamicVenues.map(v => ({ ...v, raw: undefined })), ...baseSeedPoints];
    const unique = new Map();
    for (const item of combined) {
      if (!unique.has(item.id)) {
        unique.set(item.id, item);
      }
    }
    return Array.from(unique.values());
  }, [destinations, hotels, experiences, currentCenterLat, currentCenterLng, currentCenterName]);

  // Calculate high-precision distance for each point from currentCenter
  const pointsWithDistance = useMemo(() => {
    return allMapPoints.map((pt) => {
      const dist = calculateDistanceKm(currentCenterLat, currentCenterLng, pt.lat, pt.lng);
      const driveTime = estimateDrivingTimeMin(dist);
      return {
        ...pt,
        distanceKm: dist,
        drivingTimeMin: driveTime,
        badge: getProximityBadge(dist, filterRadiusKm)
      };
    });
  }, [allMapPoints, currentCenterLat, currentCenterLng, filterRadiusKm]);

  // STRICT FILTERING: Only show venues with distanceKm <= filterRadiusKm
  const filteredPoints = useMemo(() => {
    return pointsWithDistance
      .filter((pt) => {
        const matchCategory =
          selectedMapCategory === 'All' || pt.category === selectedMapCategory;
        // Strictly filter to within the chosen radius
        const matchRadius = pt.distanceKm <= filterRadiusKm;
        return matchCategory && matchRadius;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [pointsWithDistance, selectedMapCategory, filterRadiusKm]);

  // Automatically request and point to current location on initial mount if not already locked
  useEffect(() => {
    if (!userLocation?.isLiveGps) {
      requestGpsLocation(true);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentCenterLat, currentCenterLng],
        zoom: 11,
        zoomControl: false
      });

      // Standard OpenStreetMap tiles - Free, public & zero API key required
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // Whenever center coordinates update, ensure the map flies directly to current location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([currentCenterLat, currentCenterLng], Math.max(map.getZoom(), 11), {
        duration: 1.2
      });
    }
  }, [currentCenterLat, currentCenterLng]);

  // Update center, circle, and markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // Remove old radius circle
    if (circleLayerRef.current) {
      map.removeLayer(circleLayerRef.current);
    }

    // Draw user location pin with glowing pulse effect
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(56, 189, 248, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background: #0284C7; border: 3px solid #FFFFFF; box-shadow: 0 0 18px rgba(56, 189, 248, 1); display: flex; align-items: center; justify-content: center; position: relative; z-index: 2;">
            <div style="width: 7px; height: 7px; border-radius: 50%; background: #FFFFFF;"></div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const userMarker = L.marker([currentCenterLat, currentCenterLng], { icon: userIcon })
      .bindPopup(
        `<div style="font-size: 13px; font-weight: 800; color: #0284C7;">📍 Current Live Location</div>
         <div style="font-size: 11px; font-weight: 600; color: #1E293B; margin-top: 2px;">${currentCenterName}</div>
         <div style="font-size: 10px; color: #64748B; margin-top: 2px;">Lat: ${currentCenterLat.toFixed(4)}, Lng: ${currentCenterLng.toFixed(4)}</div>
         <div style="font-size: 10px; color: #10B981; font-weight: 700; margin-top: 4px;">✓ Real-Time Radar: ≤ ${filterRadiusKm} km</div>`
      );
    markersLayer.addLayer(userMarker);

    // Draw Radar Radius Circle
    if (filterRadiusKm > 0) {
      circleLayerRef.current = L.circle([currentCenterLat, currentCenterLng], {
        radius: filterRadiusKm * 1000,
        color: '#38BDF8',
        weight: 1.5,
        opacity: 0.8,
        fillColor: '#38BDF8',
        fillOpacity: 0.06,
        dashArray: '6, 6'
      }).addTo(map);
    }

    // Add Markers for places
    filteredPoints.forEach((pt) => {
      const isSelected = selectedPlaceId === pt.id;
      const markerColor = pt.category === 'Stays' ? '#38BDF8' : pt.category === 'Experiences' ? '#A855F7' : '#10B981';

      const customIcon = L.divIcon({
        className: `place-marker-${pt.id}`,
        html: `
          <div style="
            background: #0c0c12;
            border: 1.5px solid ${isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.25)'};
            border-radius: 9999px;
            padding: 4px 10px;
            color: #FFFFFF;
            font-size: 11px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 5px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.7);
            white-space: nowrap;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            transition: all 0.2s ease;
          ">
            <span style="color: ${markerColor};">★ ${pt.rating}</span>
            <span>${pt.name.length > 18 ? pt.name.substring(0, 16) + '...' : pt.name}</span>
            <span style="color: #94A3B8; font-size: 10px;">(${pt.distanceKm}km)</span>
          </div>
        `,
        iconSize: [140, 30],
        iconAnchor: [70, 15]
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon });

      const popupHtml = `
        <div style="width: 220px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <img src="${pt.image}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 12px; margin-bottom: 8px;" />
          <div style="font-weight: bold; font-size: 13px; color: #FFFFFF; line-height: 1.3;">${pt.name}</div>
          <div style="font-size: 11px; color: #38BDF8; margin-top: 2px; font-weight: 600;">📍 ${pt.distanceKm} km away (~${pt.drivingTimeMin}m drive)</div>
          <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">${pt.address}</div>
          <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: #FFFFFF; font-size: 13px;">${formatPrice(pt.price)} <span style="font-size: 10px; color: #94A3B8;">${pt.priceLabel}</span></span>
            <a href="${pt.googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="color: #38BDF8; font-size: 11px; text-decoration: underline;">Maps ↗</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedPlaceId(pt.id);
      });

      markersLayer.addLayer(marker);
    });
  }, [filteredPoints, filterRadiusKm, currentCenterLat, currentCenterLng, selectedPlaceId, currentCenterName]);

  const handleLocateMe = async () => {
    setIsLocating(true);
    const loc = await requestGpsLocation();
    setIsLocating(false);
    if (loc && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 12, { duration: 1.5 });
    }
  };

  const handlePresetLocation = (lat: number, lng: number, name: string) => {
    setUserLocation({ lat, lng, name });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 10, { duration: 1.2 });
    }
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearchQuery.trim()) return;
    const query = customSearchQuery.trim().toLowerCase();
    const matched = GLOBAL_TOURISM_HUBS.find(
      h => h.name.toLowerCase().includes(query) || h.country.toLowerCase().includes(query) || h.tagline.toLowerCase().includes(query)
    );
    if (matched) {
      handlePresetLocation(matched.lat, matched.lng, matched.name);
    } else {
      openAiWithPrompt(`What are the best hotels, attractions, and sightseeing spots within ${filterRadiusKm} km of ${customSearchQuery}?`);
    }
  };

  return (
    <motion.div
      id="radar-map-module"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="w-full bg-transparent py-16 border-t border-[#E2C076]/15"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#0E1726] border border-[#E2C076]/30 text-xs font-bold text-[#E2C076] mb-3 shadow-md">
              <Compass className="h-3.5 w-3.5 text-[#E2C076]" />
              <span>Real-Time Tourism Proximity Radar</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Interactive Tourism Map.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl font-normal leading-relaxed">
              Strictly calculates verified tourism venues and stays within your selected radius. Never displays points beyond your chosen distance limit.
            </p>
          </div>

          {/* Quick Destination Centering Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#0E1726]/90 border border-[#E2C076]/20 backdrop-blur-xl">
            <span className="text-xs text-[#E2C076] font-semibold px-2 flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-[#E2C076]" />
              <span>Popular Hubs:</span>
            </span>
            {GLOBAL_TOURISM_HUBS.slice(0, 6).map((loc) => {
              const isSelected = calculateDistanceKm(currentCenterLat, currentCenterLng, loc.lat, loc.lng) < 20;
              return (
                <button
                  key={loc.id}
                  onClick={() => handlePresetLocation(loc.lat, loc.lng, loc.name)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {loc.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="mb-6 rounded-3xl border border-[#E2C076]/25 bg-[#0E1726]/95 p-4 sm:p-5 shadow-xl grid grid-cols-1 gap-4 lg:grid-cols-12 items-center">
          
          {/* GPS Locate Me Button & Center Info */}
          <div className="lg:col-span-4 flex items-center gap-3">
            <button
              id="gps-locate-me-btn"
              onClick={handleLocateMe}
              disabled={isLocating}
              className="flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] px-4 py-2.5 text-xs font-bold text-[#070B14] active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-[#D4A853]/20 shrink-0"
            >
              <Navigation className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locking GPS...' : 'My Live GPS'}</span>
            </button>
            <div className="overflow-hidden">
              <span className="block text-[10px] uppercase font-bold text-[#E2C076] truncate">Current Center</span>
              <span className="block text-xs font-bold text-white truncate">{currentCenterName}</span>
            </div>
          </div>

          {/* Strict Radius Slider (Supports 5km to 200km) */}
          <div className="lg:col-span-5 px-2">
            <div className="flex items-center justify-between text-xs font-medium mb-1.5">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <Sliders className="h-3 w-3 text-[#E2C076]" />
                <span className="font-bold">Strict Distance Limit:</span>
              </span>
              <span className="text-[#E2C076] font-bold px-2 py-0.5 rounded-md bg-white/10 border border-[#E2C076]/30">
                ≤ {filterRadiusKm} km
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={filterRadiusKm}
              onChange={(e) => setFilterRadiusKm(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#E2C076]"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>5 km</span>
              <span className={filterRadiusKm === 50 ? 'text-[#E2C076] font-bold' : ''}>50 km</span>
              <span className={filterRadiusKm === 100 ? 'text-[#E2C076] font-bold' : ''}>100 km</span>
              <span>200 km</span>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="lg:col-span-3 flex items-center justify-end gap-1.5 flex-wrap">
            {(['All', 'Stays', 'Experiences', 'Destinations'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedMapCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedMapCategory === cat
                    ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Map Stage + Synchronized Proximity Sidebar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Map Container */}
          <div className="lg:col-span-8 overflow-hidden rounded-3xl border border-[#E2C076]/25 bg-[#0E1726] shadow-2xl relative min-h-[460px] lg:min-h-[580px]">
            <div ref={mapContainerRef} className="h-full w-full min-h-[460px] lg:min-h-[580px] z-10" />

            {/* Floating Map HUD Indicator */}
            <div className="absolute top-4 left-4 z-20 rounded-full border border-[#E2C076]/30 bg-[#070B14]/85 px-4 py-1.5 backdrop-blur-md shadow-lg">
              <div className="flex items-center space-x-2 text-xs">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">Strict ≤ {filterRadiusKm} km Radius</span>
                <span className="text-[#E2C076]">•</span>
                <span className="text-slate-200 font-medium">{filteredPoints.length} Verified Venues In Range</span>
              </div>
            </div>
          </div>

          {/* Proximity Listing Side Panel */}
          <div className="lg:col-span-4 flex flex-col rounded-3xl border border-[#E2C076]/25 bg-[#0E1726]/95 p-5 shadow-xl max-h-[580px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Venues Within {filterRadiusKm} km ({filteredPoints.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Strictly calculated from {currentCenterName}
                </p>
              </div>
              <button
                onClick={() =>
                  openAiWithPrompt(
                    `Give me the best verified luxury hotels, restaurants, and sights strictly within ${filterRadiusKm} km of ${currentCenterName}`
                  )
                }
                className="h-8 w-8 rounded-full border border-[#E2C076]/30 bg-white/[0.04] flex items-center justify-center text-[#E2C076] hover:bg-[#E2C076]/20 transition-all"
                title="Ask AI Concierge for recommendations"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* List */}
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {filteredPoints.length === 0 ? (
                <div className="p-8 text-center text-slate-300">
                  <Info className="mx-auto h-8 w-8 text-[#E2C076] mb-2" />
                  <p className="text-xs">No venues found within {filterRadiusKm} km of this location.</p>
                  <button
                    onClick={() => setFilterRadiusKm(150)}
                    className="mt-3 rounded-full bg-[#E2C076] text-[#070B14] font-bold px-4 py-1.5 text-xs hover:bg-[#F6E05E] transition-colors"
                  >
                    Expand to 150 km
                  </button>
                </div>
              ) : (
                filteredPoints.map((pt) => {
                  const isSelected = selectedPlaceId === pt.id;
                  return (
                    <div
                      key={pt.id}
                      onClick={() => {
                        setSelectedPlaceId(pt.id);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.flyTo([pt.lat, pt.lng], 13, { duration: 1 });
                        }
                      }}
                      className={`group cursor-pointer rounded-2xl border p-3.5 transition-all ${
                        isSelected
                          ? 'border-[#E2C076] bg-[#E2C076]/10 shadow-lg'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-[#E2C076]/30 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={pt.image}
                          alt={pt.name}
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                        />
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${pt.badge.color}`}
                            >
                              📍 {pt.distanceKm} km
                            </span>
                            <span className="text-xs font-bold text-white flex items-center space-x-1">
                              <span className="text-amber-400">★</span>
                              <span>{pt.rating}</span>
                            </span>
                          </div>

                          <h4 className="mt-1 text-xs font-extrabold text-white group-hover:text-[#E2C076] transition-colors truncate">
                            {pt.name}
                          </h4>

                          {/* Distance & Drive Time */}
                          <div className="mt-1 flex items-center space-x-3 text-[11px] text-slate-300">
                            <span className="flex items-center space-x-1 font-semibold text-emerald-400">
                              <span>≤ {filterRadiusKm} km filter</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Car className="h-3 w-3 text-slate-400" />
                              <span>~{pt.drivingTimeMin}m drive</span>
                            </span>
                          </div>

                          {/* Price & Actions */}
                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#E2C076]">
                              {formatPrice(pt.price)}{' '}
                              <span className="text-[10px] text-slate-300 font-normal">
                                {pt.priceLabel}
                              </span>
                            </span>

                            <div className="flex items-center space-x-1.5">
                              <a
                                href={pt.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                                title="Open on Google Maps"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                              {pt.category === 'Stays' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const hotelObj = pt.raw || {
                                      id: pt.id,
                                      name: pt.name,
                                      destinationName: currentCenterName,
                                      tagline: 'Verified luxury property and suites',
                                      description: `Authentic verified property located at ${pt.address}. High guest ratings (${pt.rating}/5) and prime accessibility.`,
                                      rating: pt.rating,
                                      reviewCount: 450,
                                      pricePerNightUsd: pt.price,
                                      image: pt.image,
                                      gallery: [pt.image],
                                      amenities: ['High-speed Wi-Fi', 'VIP Concierge', 'Valet Parking', 'Fine Dining', 'Pool & Spa'],
                                      coordinates: { lat: pt.lat, lng: pt.lng },
                                      address: pt.address,
                                      googleMapsUrl: pt.googleMapsUrl,
                                      featured: true,
                                      roomTiers: [
                                        {
                                          id: `room-${pt.id}-1`,
                                          name: 'Executive Deluxe Suite',
                                          pricePerNightUsd: pt.price,
                                          description: 'Spacious suite with panoramic views, king bed, and complimentary breakfast.',
                                          capacity: '2 Guests',
                                          bedType: '1 King Bed',
                                          sizeSqFt: 550,
                                          image: pt.image
                                        },
                                        {
                                          id: `room-${pt.id}-2`,
                                          name: 'Royal Signature Suite',
                                          pricePerNightUsd: Math.round(pt.price * 1.5),
                                          description: 'Luxury multi-room suite with private butler service and balcony.',
                                          capacity: '3 Guests',
                                          bedType: '1 King + 1 Daybed',
                                          sizeSqFt: 850,
                                          image: pt.image
                                        }
                                      ]
                                    };
                                    setSelectedHotelBooking(hotelObj as any);
                                  }}
                                  className="rounded-full bg-gradient-to-r from-[#D4A853] to-[#E2C076] px-2.5 py-1 text-[10px] font-bold text-[#070B14] hover:from-[#C59B3F] hover:to-[#D4A853] transition-all"
                                >
                                  Reserve
                                </button>
                              )}
                              {pt.category === 'Experiences' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const expObj = pt.raw || {
                                      id: pt.id,
                                      title: pt.name,
                                      destinationName: currentCenterName,
                                      category: 'Sightseeing',
                                      duration: '3-4 Hours',
                                      priceUsd: pt.price,
                                      rating: pt.rating,
                                      reviewCount: 380,
                                      image: pt.image,
                                      gallery: [pt.image],
                                      shortDescription: `Verified premier experience at ${pt.name}.`,
                                      fullDescription: `Enjoy authentic guided experiences, cultural heritage, and curated access at ${pt.name} (${pt.address}).`,
                                      highlights: ['Local expert guide', 'VIP priority pass', 'All entry permits included'],
                                      included: ['Guided tour', 'Refreshments', 'Transport assistance'],
                                      meetingPoint: pt.address,
                                      coordinates: { lat: pt.lat, lng: pt.lng },
                                      googleMapsUrl: pt.googleMapsUrl,
                                      availableSlots: ['09:00 AM', '11:30 AM', '02:30 PM', '05:00 PM'],
                                      featured: true
                                    };
                                    setSelectedExperienceBooking(expObj as any);
                                  }}
                                  className="rounded-full bg-[#E2C076] px-2.5 py-1 text-[10px] font-bold text-[#070B14] hover:bg-[#F6E05E] transition-all"
                                >
                                  Book
                                </button>
                              )}
                              {pt.category === 'Destinations' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (pt.raw) setSelectedDestinationModal(pt.raw as any);
                                  }}
                                  className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-white/25 transition-all"
                                >
                                  Plan
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

