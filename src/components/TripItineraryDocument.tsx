import React, { useState } from 'react';
import { Printer, Copy, Check, X, Calendar, MapPin, Sparkles, Download } from 'lucide-react';
import { CustomTrip, TripDayItinerary, TripTimeSlotActivity } from '../types';
import { normalizeDayActivities as baseNormalizeDayActivities } from '../utils/itineraryGenerator';

export { normalizeDayActivities } from '../utils/itineraryGenerator';

interface TripItineraryDocumentProps {
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  itinerary: TripDayItinerary[];
  className?: string;
}

/**
 * Clean visual component rendering the "Trip Itinerary" sheet design without decorative images or action bars
 */
export const TripItineraryDocument: React.FC<TripItineraryDocumentProps> = ({
  title,
  destination = '----',
  startDate = '--/--/----',
  endDate = '--/--/----',
  itinerary,
  className = ''
}) => {
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr || dateStr.includes('--')) return '--/--/----';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    } catch {
      return dateStr;
    }
  };

  const daysToRender = itinerary && itinerary.length > 0 ? itinerary : [];

  return (
    <div
      className={`relative bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200/90 font-sans ${className}`}
      id="printable-trip-itinerary-sheet"
    >
      {/* Main Title Section */}
      <div className="relative pb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 font-sans">
            Trip Itinerary
          </h1>
          {title && (
            <span className="text-base sm:text-lg font-bold text-[#EA580C]">
              {title}
            </span>
          )}
        </div>
        {/* Distinctive Orange Underline Bar */}
        <div className="mt-3 h-[4px] w-full max-w-[280px] bg-gradient-to-r from-[#EA580C] to-[#F97316] rounded-full" />
      </div>

      {/* Metadata Fields: Start Date, End Date, Destination */}
      <div className="mt-4 pb-4 border-b border-slate-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 min-w-[85px]">Start Date</span>
            <span className="font-mono text-slate-800 tracking-wider">
              {formatDateDisplay(startDate)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 min-w-[80px]">End Date</span>
            <span className="font-mono text-slate-800 tracking-wider">
              {formatDateDisplay(endDate)}
            </span>
          </div>
          <div className="sm:col-span-2 flex items-center space-x-2 pt-1">
            <span className="font-bold text-slate-900 min-w-[85px]">Destination</span>
            <span className="font-semibold text-slate-800 border-b border-dotted border-slate-400 pb-0.5 min-w-[120px]">
              {destination}
            </span>
          </div>
        </div>
      </div>

      {/* Day Cards List */}
      <div className="mt-6 space-y-4">
        {daysToRender.map((day, dayIndex) => {
          const { theme, activities } = baseNormalizeDayActivities(day, dayIndex, destination, title);
          const dayNumber = day.day || dayIndex + 1;

          return (
            <div
              key={`itinerary-day-${dayNumber}`}
              className="flex items-stretch rounded-2xl bg-[#FFF8F5] border border-orange-100/80 shadow-xs overflow-hidden transition-all hover:shadow-md"
            >
              {/* Left Orange Vertical Badge */}
              <div className="w-14 sm:w-16 shrink-0 bg-[#EA580C] flex items-center justify-center py-4 rounded-l-2xl select-none">
                <span className="text-white font-extrabold text-xs sm:text-sm tracking-widest uppercase -rotate-90 whitespace-nowrap">
                  DAY {dayNumber}
                </span>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 p-4 sm:p-5">
                {/* Header Row: Time | Activity - Theme */}
                <div className="flex items-center pb-2.5 border-b border-dotted border-orange-300/80 text-xs sm:text-sm font-bold text-slate-900">
                  <span className="w-24 sm:w-28 shrink-0 tracking-wide text-slate-950 font-extrabold">
                    Time
                  </span>
                  <span className="flex-1 text-slate-950 font-extrabold">
                    Activity - {theme}
                  </span>
                </div>

                {/* Activity Rows with Dotted Dividers */}
                <div className="divide-y divide-dotted divide-orange-200/90 text-xs sm:text-sm text-slate-800">
                  {activities.map((item, actIndex) => (
                    <div
                      key={item.id || `act-${actIndex}`}
                      className="flex items-start py-2.5 leading-relaxed"
                    >
                      <span className="w-24 sm:w-28 shrink-0 font-medium text-slate-700 select-none">
                        {item.time}
                      </span>
                      <span className="flex-1 font-normal text-slate-800">
                        {item.activity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface TripItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: CustomTrip | null;
}

/**
 * Modal to view and print the exact "Trip Itinerary" image document for any trip
 */
export const TripItineraryModal: React.FC<TripItineraryModalProps> = ({
  isOpen,
  onClose,
  trip
}) => {
  if (!isOpen || !trip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-auto">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 sm:right-2 flex items-center space-x-1 px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs font-semibold print:hidden shadow-lg border border-slate-700"
        >
          <X className="h-4 w-4" />
          <span>Close Sheet</span>
        </button>

        {/* The Document */}
        <TripItineraryDocument
          title={trip.title}
          destination={trip.destination}
          startDate={trip.startDate}
          endDate={trip.endDate}
          itinerary={trip.itinerary && trip.itinerary.length > 0 ? trip.itinerary : []}
        />
      </div>
    </div>
  );
};
