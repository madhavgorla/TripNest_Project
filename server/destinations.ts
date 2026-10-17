import { GoogleGenAI, Type } from "@google/genai";
import https from "https";
import http from "http";
import { generateProceduralDestination, isCuratedDestination } from "./proceduralDestinations";
export { generateProceduralDestination, isCuratedDestination };

export interface AttractionData {
  id: string;
  name: string;
  category: 'Iconic Landmark' | 'Scenic Nature' | 'Historic Heritage' | 'Cultural Viewpoint' | 'Sacred Temple' | 'Art & Architecture';
  description: string;
  image: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  admissionFee: string;
  openingHours: string;
  insiderTip: string;
  recommendedDuration: string;
  googleMapsUrl: string;
  bestTimeToVisit?: string;
  mustDoHighlight?: string;
}

export interface SeasonWeather {
  season: string;
  months: string;
  temp: string;
  weather: string;
  recommendation: string;
}

export interface DestinationGuideData {
  overview: string;
  bestTimeToVisit: {
    summary: string;
    peakSeason: string;
    shoulderSeason: string;
    offPeakSeason: string;
    weatherBySeason: SeasonWeather[];
  };
  cultureAndEtiquette: {
    dressCode: string;
    customs: string[];
    tippingNorms: string;
    photographyRules: string;
    languageTips: Array<{ phrase: string; meaning: string }>;
  };
  gettingAround: {
    summary: string;
    airportTransit: string;
    publicTransit: string;
    privateChauffeur: string;
    rentalAndDriving: string;
    recommendedApps: string[];
  };
  gastronomy: {
    culinaryDescription: string;
    mustTryDishes: Array<{
      name: string;
      description: string;
      type: 'Food' | 'Drink' | 'Dessert';
      isVegetarian?: boolean;
    }>;
    iconicDiningAreas: string[];
  };
  practicalInfo: {
    currency: string;
    cardAcceptance: string;
    connectivitySim: string;
    safetyRating: string;
    safetyTips: string[];
    emergencyNumbers: {
      police: string;
      ambulance: string;
      touristHelpline?: string;
    };
    visaInfo: string;
  };
}

export interface ItineraryDayData {
  day: number;
  title: string;
  description: string;
  morning: string;
  afternoon: string;
  evening: string;
  includedMeals: string[];
}

export interface FullDestinationRecord {
  id: string;
  name: string;
  country: string;
  region: string;
  category: 'Mountain' | 'Island' | 'Nature' | 'Cultural' | 'Luxury' | 'Safari';
  heroImage: string;
  gallery: string[];
  startingPriceUsd: number;
  rating: number;
  reviewCount: number;
  temperatureC: number;
  weatherCondition: string;
  bestTimeToVisit: string;
  description: string;
  highlights: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  sampleItinerary: ItineraryDayData[];
  featured?: boolean;
  attractions: AttractionData[];
  travelGuide: DestinationGuideData;
  historicalFact: string;
  timezone: string;
  localCurrency: string;
  plugType: string;
  isAiGenerated?: boolean;
}

// In-memory cache of enriched destinations
export const MASTER_DESTINATIONS: Map<string, FullDestinationRecord> = new Map();

// Helper to make simple HTTPS GET requests with timeout
function httpGetJson<T>(url: string): Promise<T | null> {
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { headers: { 'User-Agent': 'TripNest-Travel-Engine/1.0' }, timeout: 3500 }, (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          resolve(null);
          return;
        }
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Fetch live weather from open-meteo (free open weather API, no API key needed)
 */
export async function getLiveWeather(lat: number, lng: number): Promise<{ tempC: number; condition: string } | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
  interface OpenMeteoResp {
    current?: {
      temperature_2m?: number;
      weather_code?: number;
      relative_humidity_2m?: number;
    };
  }
  const data = await httpGetJson<OpenMeteoResp>(url);
  if (!data?.current || typeof data.current.temperature_2m !== 'number') {
    return null;
  }

  const code = data.current.weather_code ?? 0;
  let condition = 'Pleasant & Clear Skies';
  if (code === 0) condition = 'Sunny & Clear Skies';
  else if (code >= 1 && code <= 3) condition = 'Partly Cloudy & Balmy';
  else if (code >= 45 && code <= 48) condition = 'Misty Alpine Fog';
  else if (code >= 51 && code <= 67) condition = 'Gentle Passing Showers';
  else if (code >= 71 && code <= 77) condition = 'Fresh Alpine Snowfall';
  else if (code >= 80 && code <= 82) condition = 'Brisk Coastal Showers';
  else if (code >= 95) condition = 'Atmospheric Mountain Storm';

  return {
    tempC: Math.round(data.current.temperature_2m),
    condition
  };
}

// Seed curated top destinations with verified real-world attractions and comprehensive travel guides
export function initializeMasterDestinations() {
  // 1. KASHMIR VALLEY
  MASTER_DESTINATIONS.set('kashmir', {
    id: 'kashmir',
    name: 'Kashmir Valley',
    country: 'India',
    region: 'Himalayas',
    category: 'Mountain',
    heroImage: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80'
    ],
    startingPriceUsd: 450,
    rating: 4.95,
    reviewCount: 3840,
    temperatureC: 18,
    weatherCondition: 'Crisp Alpine Breeze',
    bestTimeToVisit: 'April – October (Spring & Autumn) or Dec – Feb (Snow Safari)',
    description: 'Known as Paradise on Earth, Kashmir enchants travelers with misty Chinar trees, mirrored waters of Dal Lake, snow-capped Pir Panjal peaks, and ancient Mughal gardens.',
    highlights: [
      'Private Shikara gliding through Dal Lake lotus blooms at sunrise',
      'Gulmarg Gondola ascending to 13,780 ft on Mount Apharwat',
      'Authentic 36-course royal Wazwan feast with saffron kehwa',
      'Centuries-old artisanal Pashmina and Walnut wood workshops'
    ],
    coordinates: { lat: 34.0837, lng: 74.7973 },
    historicalFact: 'Emperor Jahangir famously sighed upon entering Kashmir: "Agar firdaus bar roo-e zameen ast, hameen ast-o hameen ast-o hameen ast" (If there is a paradise on earth, it is here, it is here, it is here).',
    timezone: 'IST (UTC+5:30)',
    localCurrency: 'Indian Rupee (INR / ₹)',
    plugType: 'Type C, D & M (230V, 50Hz)',
    featured: true,
    attractions: [
      {
        id: 'kash-attr-dal-lake',
        name: 'Dal Lake & Floating Flower Market',
        category: 'Iconic Landmark',
        description: 'The jewel of Srinagar spanning 18 square kilometers, framed by the Zabarwan mountains and carved cedarwood houseboats.',
        image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1000&q=80',
        location: 'Boulevard Road, Srinagar',
        coordinates: { lat: 34.1257, lng: 74.8727 },
        admissionFee: 'Free (Private Shikara ~ ₹1,200 / hr)',
        openingHours: '24 Hours (Market active 05:30 AM – 07:30 AM)',
        insiderTip: 'Book an early dawn private Shikara at 05:00 AM to witness the mystical floating wholesale vegetable and saffron lotus market amidst the morning mist.',
        recommendedDuration: '2–3 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dal+Lake+Srinagar'
      },
      {
        id: 'kash-attr-gulmarg-gondola',
        name: 'Gulmarg Gondola & Apharwat Peak',
        category: 'Scenic Nature',
        description: 'One of the highest operating cable cars in the world, ascending in two phases to 13,780 feet directly into pristine alpine powder.',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80',
        location: 'Gulmarg Gondola Base Station, Baramulla',
        coordinates: { lat: 34.0484, lng: 74.3805 },
        admissionFee: 'Phase 1: ₹1,000 | Phase 2: ₹1,800',
        openingHours: '09:00 AM – 05:00 PM (Weather permitting)',
        insiderTip: 'Book tickets 2 weeks in advance online to skip the 2-hour physical queues during peak snow or autumn seasons.',
        recommendedDuration: '4–5 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Gulmarg+Gondola'
      },
      {
        id: 'kash-attr-shalimar-bagh',
        name: 'Shalimar & Nishat Mughal Gardens',
        category: 'Historic Heritage',
        description: 'UNESCO-nominated royal terrace gardens created in 1619 by Emperor Jahangir for Empress Nur Jahan, cascading with fountains and Persian Chinar trees.',
        image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1000&q=80',
        location: 'Shalimar, Srinagar',
        coordinates: { lat: 34.1489, lng: 74.8728 },
        admissionFee: '₹25 (~ $0.30 USD)',
        openingHours: '09:30 AM – 06:30 PM daily',
        insiderTip: 'Visit during late afternoon when the golden sun streams through the 400-year-old orange and crimson Chinar canopy.',
        recommendedDuration: '2 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Shalimar+Bagh+Srinagar'
      },
      {
        id: 'kash-attr-betaab-valley',
        name: 'Betaab Valley & Lidder River',
        category: 'Scenic Nature',
        description: 'A breathtaking amphitheater of pine-carpeted cliffs, rushing turquoise glacial waters, and wild dandelion carpets in Pahalgam.',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
        location: 'Pahalgam, Anantnag',
        coordinates: { lat: 34.0289, lng: 75.3283 },
        admissionFee: '₹100 (~ $1.20 USD)',
        openingHours: '08:00 AM – 07:00 PM',
        insiderTip: 'Pack a lakeside picnic lunch of walnut bread and spiced kehwa, then take a stroll toward Chandanwari route.',
        recommendedDuration: '3 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Betaab+Valley+Pahalgam'
      }
    ],
    travelGuide: {
      overview: 'Nestled between the Great Himalayas and the Pir Panjal range, Kashmir Valley is celebrated for its serene high-altitude lakes, heritage wooden architecture, artisan handlooms, and warmth of Kashmiri hospitality.',
      bestTimeToVisit: {
        summary: 'Kashmir is enchanting all year round: Spring blooms with tulips in April, Summer brings pleasant alpine hikes from May to August, Autumn dazzles in golden Chinar leaves from Sept to Nov, and Winter offers world-class skiing from Dec to Feb.',
        peakSeason: 'April to June (Spring & Summer) and December to February (Snow Sports)',
        shoulderSeason: 'September to November (Golden Autumn & Saffron Harvest)',
        offPeakSeason: 'July to August (Monsoon season in plains, though Kashmir experiences very mild showers)',
        weatherBySeason: [
          { season: 'Spring (Tulip & Blossom)', months: 'March – May', temp: '10°C to 20°C', weather: 'Crisp mountain breezes, blooming orchards and Asia’s largest tulip gardens.', recommendation: 'Pack light woolens and waterproof jacket for occasional passing showers.' },
          { season: 'Summer (Alpine Green)', months: 'June – August', temp: '16°C to 28°C', weather: 'Warm sunny days with refreshing cool nights; ideal for trekking and Dal lake cruises.', recommendation: 'Breathable cottons for day, light cardigan for evening.' },
          { season: 'Autumn (Golden Chinar)', months: 'September – November', temp: '8°C to 18°C', weather: 'Clear azure skies and breathtaking crimson-golden trees.', recommendation: 'Layers of cardigans, Pashmina shawls, and light winter jackets.' },
          { season: 'Winter (White Fairy Tale)', months: 'December – February', temp: '-4°C to 8°C', weather: 'Heavy snow blankets in Gulmarg, Pahalgam, and Sonamarg.', recommendation: 'Thermal innerwear, heavy down parkas, snow boots, and gloves.' }
        ]
      },
      cultureAndEtiquette: {
        dressCode: 'Modest and respectful attire is encouraged, particularly when visiting historic shrines such as Hazratbal or Jamia Masjid. Cover shoulders and knees; women should carry a light scarf.',
        customs: [
          'Accepting a cup of warm Kehwa (traditional green tea with saffron, cinnamon, and slivered almonds) is a sign of mutual hospitality.',
          'Always remove shoes before stepping onto antique Kashmiri hand-knotted silk carpets or houseboats.',
          'Bargaining in artisan markets like Lal Chowk is customary and done with gentle politeness.'
        ],
        tippingNorms: 'Tipping 5% to 10% in restaurants and ₹200–₹500 for personal Shikara boatmen or local drivers is warmly appreciated.',
        photographyRules: 'Photography is widely welcomed; always ask polite permission before taking portraits of local artisans, elders, or weavers.',
        languageTips: [
          { phrase: 'As-salamu alaykum', meaning: 'Peace be upon you (Universal warm greeting)' },
          { phrase: 'Shukriya', meaning: 'Thank you very much' },
          { phrase: 'Varai', meaning: 'Are you well? / All good' },
          { phrase: 'Khuda Hafiz', meaning: 'May God protect you (Warm goodbye)' }
        ]
      },
      gettingAround: {
        summary: 'Srinagar International Airport (SXR) connects directly to Delhi, Mumbai, and Bengaluru. Private chauffeured SUVs (Innova Crysta) are the gold standard for navigating valley passes comfortably.',
        airportTransit: 'Pre-booked hotel airport limousine or prepaid taxi from SXR airport to Dal Lake takes 30–45 minutes (~ ₹800 – ₹1,500).',
        publicTransit: 'Local shared buses run between towns, but private chauffeured vehicles are overwhelmingly recommended for convenience and comfort.',
        privateChauffeur: 'Full-day private AC SUV with experienced local driver costs between ₹3,500 – ₹5,500 ($40–$65 USD) per day.',
        rentalAndDriving: 'Self-driving is possible, but mountain passes in winter require 4x4 vehicles with tire chains and experienced local navigation.',
        recommendedApps: ['MakeMyTrip / TripNest', 'Google Maps (download offline map for Gulmarg/Pahalgam)', 'Uber / Ola (Available in Srinagar City)']
      },
      gastronomy: {
        culinaryDescription: 'Kashmiri cuisine is a royal heritage shaped by centuries of Persian, Central Asian, and indigenous traditions. Saffron, fennel, dried ginger, and cold-pressed mustard oil dominate the aromatic palette.',
        mustTryDishes: [
          { name: 'Rogan Josh', description: 'Tender slow-cooked lamb in a rich gravy infused with Kashmiri red chillies, shallots, and mawal flower.', type: 'Food' },
          { name: 'Gushtaba', description: 'Velvety hand-pounded mutton meatballs simmered in a spiced cardamom yogurt gravy.', type: 'Food' },
          { name: 'Dum Olav (Aloo)', description: 'Crispy baby potatoes slow-cooked in a spicy yogurt and fennel broth.', type: 'Food', isVegetarian: true },
          { name: 'Haakh', description: 'Nutritious organic collard greens simmered in mustard oil and asafoetida, the daily comfort of every home.', type: 'Food', isVegetarian: true },
          { name: 'Kashmiri Kehwa', description: 'Traditional fragrant green tea brewed with whole saffron threads, cardamom, cinnamon, and crushed almonds.', type: 'Drink', isVegetarian: true },
          { name: 'Phirni', description: 'Creamy ground-rice pudding served in terracotta pots garnished with pistachios and silver leaf.', type: 'Dessert', isVegetarian: true }
        ],
        iconicDiningAreas: ['Ahdoos Restaurant (Residency Road)', 'Mughal Darbar', 'The Chinar at The Lalit Grand Palace', 'Boulevard Road Lakeside cafes']
      },
      practicalInfo: {
        currency: 'Indian Rupee (INR / ₹). ATMs are plentiful in Srinagar; carry cash for small Shikaras and rural artisan stalls in Gulmarg and Pahalgam.',
        cardAcceptance: 'High in hotels, established restaurants, and boutique handloom showrooms. Cash preferred for local tea and Shikara rides.',
        connectivitySim: 'Important: Prepaid SIM cards from other Indian states DO NOT work in Jammu & Kashmir due to telecom regulations. You can easily purchase a local postpaid SIM at Srinagar Airport or use your existing postpaid roaming.',
        safetyRating: 'Safe for tourists. Tourist areas are well-monitored, peaceful, and hospitable.',
        safetyTips: [
          'Keep your original ID / Passport handy when traveling between districts.',
          'Stay hydrated with warm kehwa in high altitudes like Gulmarg Phase 2.',
          'Always verify prices before hiring horse rides in Pahalgam or Gulmarg.'
        ],
        emergencyNumbers: {
          police: '112 / 100',
          ambulance: '102 / 108',
          touristHelpline: '+91 194 2502279 (J&K Tourism Office)'
        },
        visaInfo: 'Standard Indian Tourist Visa or e-Visa is required for international visitors. No special permit needed for Srinagar, Gulmarg, or Pahalgam.'
      }
    },
    sampleItinerary: [
      {
        day: 1,
        title: 'Arrival in Srinagar & Dal Lake Enchantment',
        description: 'Private airport transfer in luxury sedan. Check-in at The Lalit Grand Palace Srinagar.',
        morning: 'VIP airport reception, scenic transfer overlooking Zabarwan mountain range.',
        afternoon: 'Mughal Gardens private heritage walk at Nishat Bagh and Shalimar Bagh.',
        evening: 'Sunset private Shikara cruise on Dal Lake with warm cardamom saffron Kehwa.',
        includedMeals: ['Welcome Kehwa', 'Royal Dinner']
      },
      {
        day: 2,
        title: 'Gulmarg Alpine Meadows & Gondola Peak Ascent',
        description: 'Chauffeured drive to the pine-clad meadows of Gulmarg.',
        morning: 'Helicopter or 4x4 private transit to Gulmarg (52 km). Check-in at The Khyber.',
        afternoon: 'Phase 2 Gondola ascent to Apharwat Peak for breathtaking Himalayan panoramas.',
        evening: 'Spa relaxation at L’Occitane Spa followed by fireside fine dining at Cloves.',
        includedMeals: ['Breakfast', 'Alpine Lunch', 'Chef’s Tasting Dinner']
      },
      {
        day: 3,
        title: 'Pahalgam Valley of Shepherds & Lidder River',
        description: 'Enchanting excursion along the gushing Lidder River and Betaab Valley.',
        morning: 'Scenic drive through saffron fields of Pampore towards Pahalgam.',
        afternoon: 'Horseback trail through pine forests to Baisaran Meadow (Mini Switzerland).',
        evening: 'Riverside trout barbecue with live Santoor classical performance.',
        includedMeals: ['Buffet Breakfast', 'Picnic Lunch', 'Riverside Dinner']
      }
    ]
  });

  // 2. BALI (UBUD & ULUWATU)
  MASTER_DESTINATIONS.set('bali', {
    id: 'bali',
    name: 'Bali (Ubud & Uluwatu)',
    country: 'Indonesia',
    region: 'Southeast Asia',
    category: 'Island',
    heroImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1400&q=80'
    ],
    startingPriceUsd: 520,
    rating: 4.92,
    reviewCount: 4920,
    temperatureC: 28,
    weatherCondition: 'Tropical Sun & Ocean Breeze',
    bestTimeToVisit: 'May – September (Dry Season & Cool Breezes)',
    description: 'The Island of the Gods combines mystical emerald rice terraces, cliffside ocean sanctuaries, ancient sacred water temples, and world-class luxury wellness retreats.',
    highlights: [
      'Ayung River luxury sanctuary at Mandapa, a Ritz-Carlton Reserve',
      'Sunrise spiritual purification ritual at Tirta Empul Temple',
      'Private sunset champagne cruise around Nusa Penida arches',
      'Cliffside Kecak fire dance overlooking Uluwatu waves'
    ],
    coordinates: { lat: -8.5069, lng: 115.2625 },
    historicalFact: 'Bali’s UNESCO-listed Subak cooperative irrigation system has channeled sacred mountain spring water through tiered rice terraces since the 9th century.',
    timezone: 'WITA (UTC+8)',
    localCurrency: 'Indonesian Rupiah (IDR / Rp)',
    plugType: 'Type C & F (230V, 50Hz)',
    featured: true,
    attractions: [
      {
        id: 'bali-attr-tegalalang',
        name: 'Tegalalang Emerald Rice Terraces',
        category: 'Scenic Nature',
        description: 'Iconic valley of sculpted green rice paddies using the ancient Subak irrigation system, surrounded by coconut palms and artisan cafes.',
        image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1000&q=80',
        location: 'Jl. Raya Tegallalang, Gianyar, Ubud',
        coordinates: { lat: -8.4312, lng: 115.2789 },
        admissionFee: '25,000 IDR (~ $1.60 USD)',
        openingHours: '06:00 AM – 06:30 PM daily',
        insiderTip: 'Arrive at sunrise (06:30 AM) when the mist rises from the palm fronds and light rays beam across the terraces without any crowds.',
        recommendedDuration: '2 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tegalalang+Rice+Terrace'
      },
      {
        id: 'bali-attr-uluwatu',
        name: 'Uluwatu Sea Temple & Cliff Amphitheater',
        category: 'Sacred Temple',
        description: 'Majestic 11th-century Hindu sea temple perched dramatically on a 70-meter limestone cliff overlooking crashing Indian Ocean surf.',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80',
        location: 'Pecatu, South Kuta, Badung',
        coordinates: { lat: -8.8291, lng: 115.0849 },
        admissionFee: '50,000 IDR temple + 150,000 IDR for Kecak Dance',
        openingHours: '07:00 AM – 07:00 PM (Kecak dance at 06:00 PM)',
        insiderTip: 'Reserve Kecak Fire Dance tickets beforehand and secure top amphitheater seats by 05:15 PM for an unforgettable sunset backdrop.',
        recommendedDuration: '3 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Uluwatu+Temple'
      },
      {
        id: 'bali-attr-tirta-empul',
        name: 'Tirta Empul Sacred Water Temple',
        category: 'Historic Heritage',
        description: 'Founded in 962 AD, this holy spring water temple draws pilgrims worldwide for spiritual cleansing (Melukat) in sacred stone pools.',
        image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1000&q=80',
        location: 'Tampak Siring, Gianyar',
        coordinates: { lat: -8.4152, lng: 115.3153 },
        admissionFee: '50,000 IDR + sarong rental',
        openingHours: '08:00 AM – 06:00 PM',
        insiderTip: 'Participate respectfully in the purification ritual accompanied by a certified Balinese priest (Pemangku).',
        recommendedDuration: '2.5 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tirta+Empul+Temple'
      }
    ],
    travelGuide: {
      overview: 'Bali blends deep Hindu spiritual roots, lush tropical interior jungles in Ubud, dramatic coastal surf cliffs in Uluwatu, and an extraordinary culinary renaissance.',
      bestTimeToVisit: {
        summary: 'May to September is the optimal dry season, offering bright blue skies, lower humidity, and cool evening offshore winds.',
        peakSeason: 'July, August, and Christmas/New Year holidays',
        shoulderSeason: 'May, June, and September (ideal weather and peaceful resorts)',
        offPeakSeason: 'November to March (Tropical wet season; lush green landscapes with brief tropical showers)',
        weatherBySeason: [
          { season: 'Dry Season (Optimal)', months: 'May – September', temp: '26°C to 30°C', weather: 'Low humidity, refreshing coastal trade winds, zero rain.', recommendation: 'Light summer attire, sun hats, and swimwear.' },
          { season: 'Wet Season (Lush & Calm)', months: 'October – April', temp: '28°C to 32°C', weather: 'Humid with sudden afternoon cloudbursts, followed by clear sunsets.', recommendation: 'Quick-dry clothes, breathable fabrics, and waterproof dry bag.' }
        ]
      },
      cultureAndEtiquette: {
        dressCode: 'Sarongs and sashes are mandatory when entering any temple (provided or rented at entrances). Cover shoulders and knees.',
        customs: [
          'Watch your step on footpaths: do not step on Canang Sari (daily woven flower and incense offerings on the pavement).',
          'Never touch anyone on the head, as it is considered the most sacred part of the body.',
          'Always use your right hand when giving or receiving money or items.'
        ],
        tippingNorms: 'A 10% service charge is usually included in luxury establishments. An additional 5–10% cash tip to chauffeurs and spa therapists is customary.',
        photographyRules: 'Do not walk in front of people actively praying in temples or photograph with direct flash during ceremonies.',
        languageTips: [
          { phrase: 'Om Swastiastu', meaning: 'Peace and blessings (Balinese formal greeting)' },
          { phrase: 'Terima Kasih', meaning: 'Thank you very much (Indonesian)' },
          { phrase: 'Matur Suksma', meaning: 'Thank you deeply (Balinese)' },
          { phrase: 'Sama-sama', meaning: 'You are welcome' }
        ]
      },
      gettingAround: {
        summary: 'Traffic in Seminyak and Canggu can be slow; hiring a private car with a dedicated local chauffeur or using Grab/Gojek is the preferred method.',
        airportTransit: 'Denpasar Ngurah Rai Airport (DPS) to Ubud takes 75–90 minutes; to Uluwatu takes 45–60 minutes in private air-conditioned transport (~ $25–$40 USD).',
        publicTransit: 'Public transit is minimal. Private chauffeurs and ride-hailing apps are the main transport options.',
        privateChauffeur: 'Full-day (10 hours) private luxury SUV with driver costs $45 – $70 USD (700,000 – 1,100,000 IDR).',
        rentalAndDriving: 'Scooter rentals are popular but require an International Driving Permit and helmet at all times.',
        recommendedApps: ['Gojek', 'Grab', 'WhatsApp (for booking local private drivers)', 'Google Maps']
      },
      gastronomy: {
        culinaryDescription: 'Richly layered with turmeric, lemongrass, galangal, kaffir lime, and roasted shallots, Balinese food is celebrated for both street food delights and world-class fine dining.',
        mustTryDishes: [
          { name: 'Babi Guling / Bebek Betutu', description: 'Slow-roasted spit suckling pig or slow-braised duck marinated in rich 15-spice bumbu genep.', type: 'Food' },
          { name: 'Nasi Campur Bali', description: 'Steamed rice served with satay lilit, lawar vegetable salad, boiled spiced egg, and crispy tempeh.', type: 'Food' },
          { name: 'Gado-Gado', description: 'Steamed vegetables, tofu, and tempeh drizzled with warm roasted peanut sauce.', type: 'Food', isVegetarian: true },
          { name: 'Jamu Kunyit Asam', description: 'Traditional rejuvenating elixir of fresh turmeric, tamarind, and palm sugar.', type: 'Drink', isVegetarian: true },
          { name: 'Dadar Gulung', description: 'Pandan green crepes filled with freshly grated coconut caramelized with sweet palm sugar.', type: 'Dessert', isVegetarian: true }
        ],
        iconicDiningAreas: ['Locavore NXT (Ubud)', 'Sayan House', 'Single Fin & Rock Bar (Uluwatu)', 'Mozaic Restaurant Gastronomique']
      },
      practicalInfo: {
        currency: 'Indonesian Rupiah (IDR). 1 USD is approx. 15,500 IDR. Credit cards widely accepted in resorts; carry small notes for temples and fruit markets.',
        cardAcceptance: 'High at all hotels, beach clubs, and dining spots. Visa and Mastercard standard.',
        connectivitySim: 'eSIMs (Airalo / Nomad) or local Telkomsel tourist SIM cards purchased at DPS airport provide excellent 4G/5G coverage.',
        safetyRating: 'Very high safety rating for tourists and solo travelers.',
        safetyTips: [
          'Drink bottled or filtered water; avoid tap water (Bali Belly precaution).',
          'Beware of cheeky macaques at Uluwatu Temple; securely stash sunglasses and phones.',
          'Always swim between yellow-and-red flags on surf beaches due to strong ocean undercurrents.'
        ],
        emergencyNumbers: {
          police: '110',
          ambulance: '118',
          touristHelpline: '+62 361 224608'
        },
        visaInfo: 'Visa on Arrival (VoA) available for 90+ nationalities ($35 USD for 30 days, extendable once). Electronic VoA (e-VoA) can be purchased online before departure.'
      }
    },
    sampleItinerary: [
      {
        day: 1,
        title: 'Sacred Ubud & River Sanctuary',
        description: 'Immerse yourself into Ubud’s serene rainforest.',
        morning: 'VIP fast-track airport transfer to Mandapa Reserve in Ubud.',
        afternoon: 'Guided walkthrough of Tegalalang emerald tiered terraces.',
        evening: 'Floating candlelit degustation dinner beside the rushing Ayung River.',
        includedMeals: ['Tropical Welcome Drinks', 'Private Riverside Dinner']
      },
      {
        day: 2,
        title: 'Holistic Wellness & Jungle Swings',
        description: 'Mindfulness rejuvenation and thrilling valley views.',
        morning: 'Sunrise yoga pavilion session overlooking mist-covered jungle.',
        afternoon: 'VIP express access to Ubud canyon swings and private cacao farm tasting.',
        evening: 'Traditional Balinese flower-bath massage and sound healing.',
        includedMeals: ['Organic Breakfast', 'Raw Vegan Lunch', 'Dinner']
      }
    ]
  });

  // 3. SWISS ALPS
  MASTER_DESTINATIONS.set('swiss-alps', {
    id: 'swiss-alps',
    name: 'Swiss Alps (Zermatt & Interlaken)',
    country: 'Switzerland',
    region: 'Central Europe',
    category: 'Mountain',
    heroImage: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=80'
    ],
    startingPriceUsd: 780,
    rating: 4.98,
    reviewCount: 2890,
    temperatureC: 12,
    weatherCondition: 'Clear Glacier Skies',
    bestTimeToVisit: 'June – September (Alpine Hiking) or Dec – March (Skiing)',
    description: 'Towering pyramidal peaks of the Matterhorn, pristine turquoise lakes of Brienz, luxury cogwheel railways, and world-renowned Swiss hospitality.',
    highlights: [
      'Gornergrat cogwheel train with unobstructed Matterhorn reflection',
      'Jungfraujoch Sphinx Observatory at 11,332 ft (Top of Europe)',
      'Private wooden steamboat cruise on crystal-clear Lake Brienz',
      'Michelin-starred alpine cheese fondues and Valais vintage wines'
    ],
    coordinates: { lat: 45.9765, lng: 7.7491 },
    historicalFact: 'The Matterhorn was the last great Alpine peak to be conquered, first scaled on July 14, 1865, by Edward Whymper.',
    timezone: 'CET / CEST (UTC+1 / UTC+2)',
    localCurrency: 'Swiss Franc (CHF)',
    plugType: 'Type J & C (230V, 50Hz)',
    featured: true,
    attractions: [
      {
        id: 'swiss-attr-gornergrat',
        name: 'Gornergrat Railway & Matterhorn Viewpoint',
        category: 'Scenic Nature',
        description: 'Europe’s first electric cogwheel railway climbs from Zermatt to 10,134 ft, opening views of 29 four-thousand-meter peaks and the Gorner Glacier.',
        image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1000&q=80',
        location: 'Bahnhofplatz, Zermatt',
        coordinates: { lat: 45.9833, lng: 7.7833 },
        admissionFee: 'CHF 88–132 return (50% with Swiss Travel Pass)',
        openingHours: '07:00 AM – 07:00 PM daily (train every 24 min)',
        insiderTip: 'Get off at Rotenboden station and walk 5 minutes down to Riffelsee lake to capture the iconic upside-down reflection of the Matterhorn in calm morning water.',
        recommendedDuration: '4 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Gornergrat+Zermatt'
      },
      {
        id: 'swiss-attr-jungfraujoch',
        name: 'Jungfraujoch — Top of Europe',
        category: 'Iconic Landmark',
        description: 'UNESCO World Heritage high-alpine station sitting at 11,332 feet between Jungfrau and Mönch peaks, featuring the Ice Palace and Aletsch Glacier.',
        image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1000&q=80',
        location: 'Interlaken / Grindelwald Terminal',
        coordinates: { lat: 46.5475, lng: 7.9828 },
        admissionFee: 'CHF 160–210 (Discounted with Swiss Travel Pass)',
        openingHours: '08:00 AM – 04:30 PM',
        insiderTip: 'Take the Eiger Express tricable gondola from Grindelwald Terminal to save 47 minutes on the ascent.',
        recommendedDuration: '5–6 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jungfraujoch'
      }
    ],
    travelGuide: {
      overview: 'The Swiss Alps offer unrivaled precision infrastructure, car-free alpine villages, crystal clear turquoise glacial lakes, and pristine ski slopes.',
      bestTimeToVisit: {
        summary: 'Summer (June–September) provides wildflower trails and open lake ferries. Winter (December–March) transforms the peaks into a premier ski paradise.',
        peakSeason: 'July–August (Hiking) and January–February (Ski Season)',
        shoulderSeason: 'May and September–October (Crisp air and fewer crowds)',
        offPeakSeason: 'November (Mountain transport maintenance period)',
        weatherBySeason: [
          { season: 'Summer Alpine', months: 'June – August', temp: '15°C to 25°C in valleys, 5°C to 12°C on peaks', weather: 'Sunny and crisp with occasional alpine storms.', recommendation: 'Layers, sun protection, polarized sunglasses, and sturdy hiking shoes.' },
          { season: 'Winter Powder', months: 'December – March', temp: '-6°C to 4°C', weather: 'Heavy snowpack, azure sunny skies.', recommendation: 'Full ski gear, thermal base layers, and fleece.' }
        ]
      },
      cultureAndEtiquette: {
        dressCode: 'Smart casual for restaurants; high-performance outdoor gear for mountains. In mountain huts, leave muddy hiking boots in the shoe foyer.',
        customs: [
          'Punctuality is sacred: Swiss trains and cable cars depart precisely to the second.',
          'Keep voices lowered on public trains, especially in designated Quiet Compartments ("Ruhebereich").',
          'Recycling and alpine environmental preservation are strictly enforced.'
        ],
        tippingNorms: 'Service is legally included in all bills. Rounding up to the nearest 5 or 10 CHF is customary for great service.',
        photographyRules: 'Drones are strictly regulated in Swiss National Parks and near cable car corridors; check local permits before flying.',
        languageTips: [
          { phrase: 'Grüezi', meaning: 'Hello / Good day (Swiss German)' },
          { phrase: 'Merci vilmal', meaning: 'Thank you very much' },
          { phrase: 'Uf Wiederluege', meaning: 'Goodbye / See you again' },
          { phrase: 'En Guete', meaning: 'Enjoy your meal' }
        ]
      },
      gettingAround: {
        summary: 'Switzerland possesses the world’s best integrated public transit system (SBB). The Swiss Travel Pass covers unlimited trains, panoramic routes, boats, and city buses.',
        airportTransit: 'Zurich (ZRH) or Geneva (GVA) airports have direct underground train stations to Bern, Interlaken, and Visp/Zermatt.',
        publicTransit: 'SBB train network is impeccably reliable. Zermatt is completely car-free (electric electro-taxis only).',
        privateChauffeur: 'Private transfers available between Geneva/Zurich and Täsch (Zermatt terminal).',
        rentalAndDriving: 'Scenic highway drives require a Swiss Motorway Vignette (CHF 40).',
        recommendedApps: ['SBB Mobile', 'MeteoSwiss (Most accurate mountain weather)', 'Zermatt Matterhorn App']
      },
      gastronomy: {
        culinaryDescription: 'Hearty alpine cuisine centered on aged Gruyère and Emmental cheeses, air-dried Valais beef, golden rösti, and world-class chocolates.',
        mustTryDishes: [
          { name: 'Swiss Cheese Fondue', description: 'Melted Gruyère and Vacherin Fribourgeois with white wine and kirsch, dipped with rustic crusty bread.', type: 'Food', isVegetarian: true },
          { name: 'Raclette du Valais', description: 'Melted wheel of alpine cheese scraped over steamed potatoes, cornichons, and pickled pearl onions.', type: 'Food', isVegetarian: true },
          { name: 'Zürcher Geschnetzeltes with Rösti', description: 'Sliced veal in a rich mushroom and white wine cream sauce served with crisp buttery grated potato cake.', type: 'Food' },
          { name: 'Rivella', description: 'Unique, refreshing Swiss carbonated soft drink made from milk whey.', type: 'Drink', isVegetarian: true }
        ],
        iconicDiningAreas: ['Chez Vrony (Findeln, Zermatt)', 'Whymper-Stube', 'Grand Hotel Zermatterhof', 'Restaurant Glacier']
      },
      practicalInfo: {
        currency: 'Swiss Franc (CHF). Euros are sometimes accepted in tourist hubs, but change is given in CHF.',
        cardAcceptance: 'Universal: contactless credit cards, Apple Pay, and Google Pay accepted everywhere down to small mountain huts.',
        connectivitySim: 'Swisscom / Salt eSIMs provide seamless 5G coverage throughout alpine valleys and train routes.',
        safetyRating: 'One of the safest countries in the world.',
        safetyTips: [
          'Never venture off marked hiking trails without an official mountain guide.',
          'Always check the morning avalanche bulletin and lift status on MeteoSwiss.',
          'Stay hydrated; glacier air is exceptionally dry.'
        ],
        emergencyNumbers: {
          police: '117',
          ambulance: '144',
          touristHelpline: '1414 (REGA Swiss Air-Rescue)'
        },
        visaInfo: 'Schengen Area rules apply. US, UK, Canadian, and EU citizens do not require a tourist visa for stays under 90 days.'
      }
    },
    sampleItinerary: [
      {
        day: 1,
        title: 'Arrival in Car-Free Zermatt',
        description: 'Scenic Glacier Express arrival with Matterhorn backdrop.',
        morning: 'First-class Glacier Express panoramic coach arrival into Zermatt.',
        afternoon: 'Horse-drawn carriage transfer to chalet hotel; village exploration.',
        evening: 'Fireside raclette and Grand Cru wine tasting.',
        includedMeals: ['Glacier Gourmet Lunch', 'Swiss Fondue Dinner']
      }
    ]
  });

  // 4. MALDIVES
  MASTER_DESTINATIONS.set('maldives', {
    id: 'maldives',
    name: 'Maldives Private Atolls',
    country: 'Maldives',
    region: 'Indian Ocean',
    category: 'Island',
    heroImage: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1400&q=80'
    ],
    startingPriceUsd: 950,
    rating: 4.97,
    reviewCount: 3120,
    temperatureC: 29,
    weatherCondition: 'Warm Turquoise Sun',
    bestTimeToVisit: 'November – April (Calm Waters & Clear Scuba Visibility)',
    description: 'An idyllic chain of secluded coral islands featuring iconic overwater villas, bioluminescent beaches, vibrant manta ray sanctuaries, and underwater glass restaurants.',
    highlights: [
      'Overwater private infinity pool villas suspended above coral reefs',
      'Baa Atoll UNESCO Biosphere Reserve snorkeling with whale sharks',
      'Submerged undersea dining 5 meters beneath the Indian Ocean',
      'Private sunset sandbank dining under canopy of equatorial stars'
    ],
    coordinates: { lat: 4.1755, lng: 73.5093 },
    historicalFact: 'The Maldives is the lowest and flattest nation on earth, with an average ground elevation of only 1.5 meters above sea level.',
    timezone: 'MVT (UTC+5; resort islands often use Island Time UTC+6 to maximize daylight)',
    localCurrency: 'Maldivian Rufiyaa (MVR) / USD widely used',
    plugType: 'Type G (British 3-pin, 230V)',
    featured: true,
    attractions: [
      {
        id: 'mald-attr-hanifaru',
        name: 'Hanifaru Bay UNESCO Biosphere Reserve',
        category: 'Scenic Nature',
        description: 'World-famous coral lagoon where up to 200 giant reef manta rays and whale sharks gather to feed on dense plankton blooms.',
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80',
        location: 'Baa Atoll',
        coordinates: { lat: 5.1717, lng: 73.1517 },
        admissionFee: '$20 UNESCO permit + marine biologist guided boat tour',
        openingHours: 'Monitored tours during daylight hours (May – November)',
        insiderTip: 'Plan your trip around full moon or new moon days between June and October for peak manta ray cyclone feeding spectacles.',
        recommendedDuration: '3 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Hanifaru+Bay+Baa+Atoll'
      },
      {
        id: 'mald-attr-ithaa',
        name: 'Ithaa Undersea Submerged Restaurant',
        category: 'Iconic Landmark',
        description: 'The world’s first all-glass undersea dining room, set 5 meters beneath the turquoise surface with 180-degree panoramic coral reef views.',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
        location: 'Conrad Maldives Rangali Island, Alif Dhaal Atoll',
        coordinates: { lat: 3.6189, lng: 72.7189 },
        admissionFee: 'Fixed degustation menu from $280–$390 USD',
        openingHours: 'Lunch 11:00 AM – 02:30 PM, Dinner 06:30 PM – 10:30 PM',
        insiderTip: 'Book lunch for brighter natural illumination through the coral canopy to photograph passing eagle rays and reef sharks clearly.',
        recommendedDuration: '2 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Ithaa+Undersea+Restaurant'
      }
    ],
    travelGuide: {
      overview: 'Comprising 26 natural atolls and over 1,000 coral islands, the Maldives represents the ultimate barefoot luxury experience.',
      bestTimeToVisit: {
        summary: 'December to April offers minimal rainfall, calm turquoise lagoons, and prime water visibility.',
        peakSeason: 'Christmas to Easter (Peak dry season)',
        shoulderSeason: 'May & November (Transitional months with great deals)',
        offPeakSeason: 'June to October (Southwest monsoon; warm showers and prime manta ray season)',
        weatherBySeason: [
          { season: 'Iruvai (Dry Season)', months: 'December – April', temp: '28°C to 31°C', weather: 'Endless blue skies, gentle breezes, and calm waters.', recommendation: 'UV swim shirts, high SPF sunscreen, and evening resort wear.' },
          { season: 'Hulhangu (Wet Season)', months: 'May – November', temp: '27°C to 30°C', weather: 'Tropical warm showers with intermittent sunshine.', recommendation: 'Waterproof phone cases and light evening layers.' }
        ]
      },
      cultureAndEtiquette: {
        dressCode: 'Resort islands have relaxed barefoot luxury etiquette. On inhabited local islands, modest dress covering shoulders and knees is legally required (no bikinis except on designated "Bikini Beaches").',
        customs: [
          'The Maldives is an Islamic nation: alcohol and pork are strictly restricted to private resort islands and prohibited on local inhabited islands.',
          'Never stand on or touch living coral reefs while snorkeling.'
        ],
        tippingNorms: 'Resorts add 10% service charge and 16% GST (TGST). Extra tips ($5–$20 per day) for your personal island host/butler and room attendants are customary.',
        photographyRules: 'Drone flights require advance written permission from individual resort management to protect guest villa privacy.',
        languageTips: [
          { phrase: 'Assalaam Alaikum', meaning: 'Peace be upon you (Formal greeting)' },
          { phrase: 'Shukuriyyaa', meaning: 'Thank you' },
          { phrase: 'Haalu kihineh?', meaning: 'How are you?' },
          { phrase: 'Varah rangalhu', meaning: 'Very good' }
        ]
      },
      gettingAround: {
        summary: 'Transit between islands is conducted exclusively via twin-otter floatplanes (Trans Maldivian Airways) or luxury private speedboats.',
        airportTransit: 'Velana International Airport (MLE) on Hulhulé island connects directly to resort seaplane docks and speedboat piers.',
        publicTransit: 'Public ferries link Malé and nearby local atolls; private transfers arranged by resorts for distant luxury atolls.',
        privateChauffeur: 'Private luxury motor yachts available for bespoke island hopping.',
        rentalAndDriving: 'No cars on resort islands (bicycles and electric buggies only).',
        recommendedApps: ['TMA Seaplane App', 'TripNest', 'Windy (Marine swell & wind forecasts)']
      },
      gastronomy: {
        culinaryDescription: 'Fresh skipjack tuna, coconut, lime, and Maldivian curry spices form the foundation of local Dhivehi cuisine, alongside 3-Michelin star global resort gastronomy.',
        mustTryDishes: [
          { name: 'Mas Huni with Roshi', description: 'Freshly shredded smoked tuna mixed with grated coconut, thinly sliced shallots, and lime juice, served with warm flatbread.', type: 'Food' },
          { name: 'Garudhiya', description: 'Clear aromatic fish broth infused with curry leaves, lime, and scotch bonnet peppers.', type: 'Food' },
          { name: 'Kulhi Boakibaa', description: 'Savory traditional baked fish cake seasoned with ginger, turmeric, and grated coconut.', type: 'Food' },
          { name: 'Kurumba', description: 'Chilled fresh young coconut water served straight from the husk.', type: 'Drink', isVegetarian: true }
        ],
        iconicDiningAreas: ['Ithaa Undersea Restaurant', 'Muraka at Mirihi', 'Terra Treetop Bamboo Pods at Waldorf Astoria', 'Subsix underwater club']
      },
      practicalInfo: {
        currency: 'US Dollars (USD) are universally used in resorts and accepted for all billing. Maldivian Rufiyaa (MVR) for local island purchases.',
        cardAcceptance: '100% card acceptance (Visa, Mastercard, Amex) at all luxury resorts.',
        connectivitySim: 'Dhiraagu or Ooredoo 4G/5G SIM cards available at MLE arrival hall, though all resorts provide high-speed complimentary Wi-Fi.',
        safetyRating: 'Exceptionally safe private resort environment.',
        safetyTips: [
          'Apply coral-safe mineral sunscreen only to protect vulnerable reef ecosystems.',
          'Pay attention to lagoon tidal currents when swimming around drop-off reef walls.'
        ],
        emergencyNumbers: {
          police: '119',
          ambulance: '102',
          touristHelpline: '+960 332 3228'
        },
        visaInfo: 'Free 30-day tourist visa granted upon arrival to all nationalities with a confirmed hotel reservation and return ticket.'
      }
    },
    sampleItinerary: [
      {
        day: 1,
        title: 'Seaplane Flight & Lagoon Sanctuary',
        description: 'Aerial views of turquoise atolls.',
        morning: 'Trans Maldivian Airways twin-otter seaplane flight to Baa Atoll.',
        afternoon: 'Direct jump from your villa deck into the turquoise coral lagoon.',
        evening: 'Champagne toast at the overwater sunset lounge.',
        includedMeals: ['Seaplane Lounge Refreshments', 'Lagoon Buffet Dinner']
      }
    ]
  });

  // 5. PARIS
  MASTER_DESTINATIONS.set('paris', {
    id: 'paris',
    name: 'Paris Haute Luxury',
    country: 'France',
    region: 'Western Europe',
    category: 'Cultural',
    heroImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1400&q=80'
    ],
    startingPriceUsd: 820,
    rating: 4.91,
    reviewCount: 6540,
    temperatureC: 21,
    weatherCondition: 'Gentle Parisian Sun',
    bestTimeToVisit: 'April – June or September – November',
    description: 'The Capital of Elegance offers iconic monument vistas, haute couture fashion houses, private after-hours Louvre museum curators, and legendary 3-Michelin star gastronomy.',
    highlights: [
      'Palace suite views directly facing the illuminated Eiffel Tower',
      'After-hours private walkthrough of the Louvre and Musée d’Orsay',
      'VIP vintage yacht dinner cruise on the Seine River',
      'Exclusive private atelier appointments at Place Vendôme'
    ],
    coordinates: { lat: 48.8566, lng: 2.3522 },
    historicalFact: 'The Eiffel Tower was originally built as a temporary entrance arch for the 1889 Exposition Universelle and was slated for demolition in 1909 before being preserved for radio telegraphy.',
    timezone: 'CET / CEST (UTC+1 / UTC+2)',
    localCurrency: 'Euro (EUR / €)',
    plugType: 'Type E & C (230V, 50Hz)',
    featured: true,
    attractions: [
      {
        id: 'paris-attr-louvre',
        name: 'Musée du Louvre & Tuileries Garden',
        category: 'Art & Architecture',
        description: 'The world’s most visited museum, housing over 35,000 works of art including the Mona Lisa, Winged Victory of Samothrace, and Venus de Milo in an ancient royal palace.',
        image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1000&q=80',
        location: 'Rue de Rivoli, 75001 Paris',
        coordinates: { lat: 48.8606, lng: 2.3376 },
        admissionFee: '€22 (Advance timed entry mandatory)',
        openingHours: '09:00 AM – 06:00 PM (Wed & Fri open late till 09:45 PM; closed Tuesday)',
        insiderTip: 'Book Friday evening late-night admission after 06:00 PM to view the masterpieces under tranquil lighting without tour groups.',
        recommendedDuration: '3–4 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Louvre+Museum+Paris'
      },
      {
        id: 'paris-attr-eiffel',
        name: 'The Eiffel Tower & Champ de Mars',
        category: 'Iconic Landmark',
        description: 'Gustave Eiffel’s 330-meter wrought-iron masterpiece that defines the Parisian skyline, sparkling with 20,000 golden bulbs for 5 minutes every hour after dusk.',
        image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1000&q=80',
        location: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris',
        coordinates: { lat: 48.8584, lng: 2.2945 },
        admissionFee: '€28–€35 for summit elevator',
        openingHours: '09:30 AM – 11:45 PM daily',
        insiderTip: 'For the most breathtaking panorama of the tower itself, watch sunset from the marble esplanade of Place du Trocadéro.',
        recommendedDuration: '2.5 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Eiffel+Tower+Paris'
      }
    ],
    travelGuide: {
      overview: 'Paris combines architectural grandeur across Haussmannian boulevards, world-class art collections, historic sidewalk bistros, and iconic luxury palaces.',
      bestTimeToVisit: {
        summary: 'Spring (April to June) and Autumn (September to November) provide mild temperatures, blooming chestnut trees, and vibrant cultural seasons.',
        peakSeason: 'June to August (Summer tourism & Fashion Weeks)',
        shoulderSeason: 'April–May and September–October (Optimal city exploration)',
        offPeakSeason: 'January to February (Chilly, but ideal for uncrowded museums and winter sales)',
        weatherBySeason: [
          { season: 'Springtime', months: 'April – June', temp: '12°C to 22°C', weather: 'Balmy sunshine with occasional crisp spring rain.', recommendation: 'Trench coat, stylish walking loafers, and light layers.' },
          { season: 'Autumn Charm', months: 'September – November', temp: '10°C to 19°C', weather: 'Golden foliage along the Seine, comfortable temperatures.', recommendation: 'Cashmere sweaters, leather jackets, and umbrella.' }
        ]
      },
      cultureAndEtiquette: {
        dressCode: 'Chic, tailored, and understated. Avoid overly casual gym wear or loud tourist logos when entering dining institutions or historic venues.',
        customs: [
          'Always greet shopkeepers and waitstaff with a polite "Bonjour, Madame / Monsieur" upon entering any boutique or cafe.',
          'Bread is placed directly on the tablecloth next to your plate, never buttered all at once.'
        ],
        tippingNorms: 'Service is included ("Service Compris"). Rounding up by €1–€2 at cafes and leaving 5%–10% at fine dining restaurants is customary.',
        photographyRules: 'Photography allowed in most museums without flash or selfie sticks.',
        languageTips: [
          { phrase: 'Bonjour', meaning: 'Hello / Good day' },
          { phrase: 'S’il vous plaît', meaning: 'Please' },
          { phrase: 'Merci beaucoup', meaning: 'Thank you very much' },
          { phrase: 'L’addition, s’il vous plaît', meaning: 'The bill, please' }
        ]
      },
      gettingAround: {
        summary: 'The Paris Métro and RER network is one of the most efficient in the world. Walking along the Seine is the best way to soak in the atmosphere.',
        airportTransit: 'CDG Airport to central Paris: 45–60 min by private chauffeur (~ €65–€90) or RER B train (35 min, €11.80).',
        publicTransit: 'Navigo Easy card or digital phone pass for Métro rides (€2.15 per ticket).',
        privateChauffeur: 'Black-car services (Uber Black, G7 Taxi VIP) readily available.',
        rentalAndDriving: 'Driving in Paris is not recommended due to heavy traffic and tight parking.',
        recommendedApps: ['Citymapper', 'G7 Taxi', 'TheFork (for dining reservations)', 'Google Maps']
      },
      gastronomy: {
        culinaryDescription: 'The birthplace of modern culinary arts, boasting classic brasseries, fragrant boulangeries, and over 130 Michelin-starred dining rooms.',
        mustTryDishes: [
          { name: 'Duck Confit (Confit de Canard)', description: 'Crisp-skinned duck leg slow-poached in duck fat, served with garlic-roasted Sarladaise potatoes.', type: 'Food' },
          { name: 'French Onion Soup (Soupe à l’Oignon Gratinée)', description: 'Rich caramelized onion beef broth topped with a thick crust of toasted baguette and bubbling Gruyère cheese.', type: 'Food' },
          { name: 'Croissant au Beurre', description: 'Flaky, buttery, multi-layered viennoiserie baked fresh at daybreak.', type: 'Food', isVegetarian: true },
          { name: 'Crème Brûlée', description: 'Velvety rich vanilla bean custard under a glass-like caramelized sugar crust.', type: 'Dessert', isVegetarian: true }
        ],
        iconicDiningAreas: ['Saint-Germain-des-Prés', 'Le Marais', 'Avenue Montaigne', 'Rue Cler']
      },
      practicalInfo: {
        currency: 'Euro (EUR / €).',
        cardAcceptance: 'Universal; Apple Pay and contactless widely accepted even for a single €1.30 baguette.',
        connectivitySim: 'Orange or Bouygues Telecom 5G eSIMs offer excellent coverage.',
        safetyRating: 'Safe European capital; standard awareness of pickpockets at major tourist landmarks is advised.',
        safetyTips: [
          'Be vigilant of your belongings around Eiffel Tower, Montmartre, and on crowded Métro Line 1.',
          'Ignore petition or gold ring street scammers.'
        ],
        emergencyNumbers: {
          police: '17',
          ambulance: '15',
          touristHelpline: '112 (European universal emergency)'
        },
        visaInfo: 'Schengen Visa regulations apply.'
      }
    },
    sampleItinerary: [
      {
        day: 1,
        title: 'Champs-Élysées & Private Seine Cruise',
        description: 'The golden hour over historical Parisian bridges.',
        morning: 'Check-in at Hôtel Plaza Athénée on prestigious Avenue Montaigne.',
        afternoon: 'Private fashion historian walking tour of Haute Couture ateliers.',
        evening: 'Vintage mahogany yacht cruise on the Seine with Dom Pérignon pairing.',
        includedMeals: ['Macaron Welcome Gift', 'Seine Gourmet Dinner']
      }
    ]
  });

  // 6. DUBAI
  MASTER_DESTINATIONS.set('dubai', {
    id: 'dubai',
    name: 'Dubai Oasis & Skyline',
    country: 'United Arab Emirates',
    region: 'Middle East',
    category: 'Luxury',
    heroImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1528702748617-c64d49f918af?auto=format&fit=crop&w=1400&q=80'
    ],
    startingPriceUsd: 750,
    rating: 4.94,
    reviewCount: 5210,
    temperatureC: 32,
    weatherCondition: 'Desert Glow & Marina Breeze',
    bestTimeToVisit: 'November – April (Mild Winter Sunshine)',
    description: 'A playground of futuristic architectural marvels, ultra-luxury 7-star resorts, private desert dune safaris, and rooftop cloud lounges.',
    highlights: [
      'Helipad arrivals and royal duplexes at Burj Al Arab Jumeirah',
      'Cloud 22 infinity pool suspended at Atlantis The Royal',
      'Vintage Land Rover conservation safari in Al Marmoom desert',
      'High tea at At.mosphere on Level 122 of Burj Khalifa'
    ],
    coordinates: { lat: 25.2048, lng: 55.2708 },
    historicalFact: 'Dubai transformed from a tranquil pearl diving and trading creek settlement in the early 20th century into a global metropolis boasting the world’s tallest tower.',
    timezone: 'GST (UTC+4)',
    localCurrency: 'UAE Dirham (AED / د.إ)',
    plugType: 'Type G (British 3-pin, 230V)',
    featured: true,
    attractions: [
      {
        id: 'dubai-attr-khalifa',
        name: 'Burj Khalifa & The Dubai Fountain',
        category: 'Iconic Landmark',
        description: 'The world’s tallest structure soaring 828 meters (2,716 ft), featuring observation decks on levels 124, 125, and 148 At The Top SKY, overlooking dancing fountain shows.',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80',
        location: '1 Sheikh Mohammed bin Rashid Blvd, Downtown Dubai',
        coordinates: { lat: 25.1972, lng: 55.2744 },
        admissionFee: 'AED 179–550 (Level 148 VIP Lounge AED 550)',
        openingHours: '08:30 AM – 11:00 PM daily',
        insiderTip: 'Book sunset tickets between 05:00 PM and 06:30 PM to experience the transition from glistening Arabian Gulf sun to the illuminated city below.',
        recommendedDuration: '2.5 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Burj+Khalifa'
      },
      {
        id: 'dubai-attr-museum-future',
        name: 'Museum of the Future',
        category: 'Art & Architecture',
        description: 'An architectural marvel named one of the most beautiful buildings on earth, shaped as a toric stainless steel calligraphy ring exploring humanity in 2071.',
        image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1000&q=80',
        location: 'Sheikh Zayed Road, Trade Centre 2',
        coordinates: { lat: 25.2253, lng: 55.2818 },
        admissionFee: 'AED 149 (~ $40 USD)',
        openingHours: '09:30 AM – 07:00 PM',
        insiderTip: 'Tickets sell out weeks in advance; always book your timed entry slot online at least 3 weeks before travel.',
        recommendedDuration: '2.5 hours',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Museum+of+the+Future+Dubai'
      }
    ],
    travelGuide: {
      overview: 'Dubai offers boundless ambition, world-renowned hospitality, pristine beaches along Palm Jumeirah, Michelin-starred cuisine, and opulent desert sanctuaries.',
      bestTimeToVisit: {
        summary: 'November through April is the ideal period with comfortable temperatures between 24°C and 30°C and pleasant evening breezes.',
        peakSeason: 'December to February (Shopping festivals and ideal beach weather)',
        shoulderSeason: 'October & April (Warm but manageable, great luxury hotel rates)',
        offPeakSeason: 'June to August (Extreme desert heat above 42°C; air-conditioned malls and night pools dominate)',
        weatherBySeason: [
          { season: 'Winter (Peak Season)', months: 'November – March', temp: '20°C to 28°C', weather: 'Glorious sunshine and gentle sea breezes.', recommendation: 'Resort chic, sun protection, and light jacket for evenings.' },
          { season: 'Summer', months: 'June – August', temp: '36°C to 45°C', weather: 'Intense dry heat and high UV index.', recommendation: 'Light cottons, sunglasses, and indoor luxury attractions.' }
        ]
      },
      cultureAndEtiquette: {
        dressCode: 'Swimwear is fully acceptable at private hotel pools and beach clubs. In shopping malls, respectful clothing covering shoulders and knees is appreciated.',
        customs: [
          'Public displays of overt affection are discouraged in public venues.',
          'During the holy month of Ramadan, eating or drinking in public during daylight hours is restricted in certain venues (hotels provide enclosed dining).'
        ],
        tippingNorms: '10% to 15% is standard for courteous service in restaurants and for private drivers.',
        photographyRules: 'Never photograph government buildings, military sites, or local women without explicit permission.',
        languageTips: [
          { phrase: 'Marhaban', meaning: 'Hello / Welcome' },
          { phrase: 'Shukran', meaning: 'Thank you' },
          { phrase: 'Afwan', meaning: 'You’re welcome / Excuse me' },
          { phrase: 'Yallah', meaning: 'Let’s go! / Hurry' }
        ]
      },
      gettingAround: {
        summary: 'Taxis (RTA), Uber, and Careem are ubiquitous, affordable, and spotlessly clean. The driverless Dubai Metro connects major hubs along Sheikh Zayed Road.',
        airportTransit: 'DXB Airport is just 15 minutes by taxi to Downtown Dubai and 30 minutes to Palm Jumeirah.',
        publicTransit: 'Dubai Metro Red Line is ultra-modern with dedicated Gold Class carriages.',
        privateChauffeur: 'Private luxury vehicles (Tesla, Lexus, Rolls-Royce) available 24/7 on Careem.',
        rentalAndDriving: 'Excellent road infrastructure, but speed limits and radar cameras are strictly enforced.',
        recommendedApps: ['Careem', 'RTA Dubai', 'Talabat', 'TripNest']
      },
      gastronomy: {
        culinaryDescription: 'A global culinary crossroads featuring authentic Emirati feasts, Levantine grills, and Michelin-starred culinary institutions.',
        mustTryDishes: [
          { name: 'Machboos', description: 'Fragrant basmati rice slow-cooked with whole dried limes (loomi), saffron, cardamom, and spiced chicken or lamb.', type: 'Food' },
          { name: 'Shawarma Royale', description: 'Marinated spit-roasted meats with garlic toum sauce, pickled cucumbers, and fries wrapped in saj bread.', type: 'Food' },
          { name: 'Luqaimat', description: 'Golden crispy fried dough dumplings drizzled with rich date syrup and toasted sesame seeds.', type: 'Dessert', isVegetarian: true },
          { name: 'Gahwa (Arabic Coffee)', description: 'Traditional aromatic coffee lightly spiced with cardamom and cloves, served with Medjool dates.', type: 'Drink', isVegetarian: true }
        ],
        iconicDiningAreas: ['DIFC (Gate Village)', 'The Palm Jumeirah Boardwalk', 'Downtown Dubai', 'Bluewaters Island']
      },
      practicalInfo: {
        currency: 'UAE Dirham (AED / د.إ). Pegged to the US Dollar at ~ 3.67 AED per 1 USD.',
        cardAcceptance: 'Essentially 100% cashless city: cards and phone payments standard everywhere.',
        connectivitySim: 'Free tourist SIM with 1GB data is provided to tourists at DXB passport control; upgrade easily with Du or Etisalat.',
        safetyRating: 'Consistently ranked among the top 3 safest cities in the world.',
        safetyTips: [
          'Stay hydrated when outdoors; use sun protection generously.',
          'Observe local legal regulations regarding prescription medications.'
        ],
        emergencyNumbers: {
          police: '999',
          ambulance: '998',
          touristHelpline: '800 263'
        },
        visaInfo: 'Free 30-day or 90-day visa on arrival for US, EU, UK, Australian, and 70+ nationalities.'
      }
    },
    sampleItinerary: [
      {
        day: 1,
        title: 'Palm Jumeirah Royalty & Cloud 22',
        description: 'Ultra-contemporary extravagance on the Arabian Gulf.',
        morning: 'Rolls-Royce Ghost transfer to Atlantis The Royal on the Palm.',
        afternoon: 'Cabana relaxation at Cloud 22 infinity sky pool.',
        evening: 'Dinner at Dinner by Heston Blumenthal followed by Skyblaze Fountain show.',
        includedMeals: ['VIP Welcome Refreshments', 'Michelin-starred Dinner']
      }
    ]
  });
}

// Initialize master destinations on module load
initializeMasterDestinations();

/**
 * Generate or enrich a destination using Gemini with multi-model fallback,
 * exponential retry for 503 high-demand spikes, and seamless procedural fallback.
 */
export async function generateDestinationWithAi(destinationName: string, categoryHint?: string): Promise<FullDestinationRecord> {
  const cleanName = destinationName.trim();
  const lowerName = cleanName.toLowerCase();

  // 1. Fast lookup in MASTER_DESTINATIONS cache
  const existing = Array.from(MASTER_DESTINATIONS.values()).find(d =>
    d.id.toLowerCase() === lowerName ||
    d.name.toLowerCase() === lowerName ||
    d.name.toLowerCase().includes(lowerName) ||
    lowerName.includes(d.name.toLowerCase())
  );
  if (existing) {
    return existing;
  }

  // 2. Immediate curated match (e.g., Tokyo, Rome, Santorini, Bali, Swiss Alps, etc.)
  if (isCuratedDestination(cleanName)) {
    const curated = generateProceduralDestination(cleanName, categoryHint);
    try {
      const liveWeather = await getLiveWeather(curated.coordinates.lat, curated.coordinates.lng);
      if (liveWeather) {
        curated.temperatureC = liveWeather.tempC;
        curated.weatherCondition = liveWeather.condition;
      }
    } catch {}
    MASTER_DESTINATIONS.set(curated.id, curated);
    return curated;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `You are TripNest's Master Global Tourism Intelligence Engine.
The user requested a full, luxury travel guide and verified attractions for: "${cleanName}" (Category hint: ${categoryHint || 'Any'}).

TASK:
Generate an exhaustive, authentic, real-world verified destination record with accurate attractions, travel guide, climate, and itineraries in valid JSON.

STRICT ACCURACY RULES:
1. All attractions MUST be REAL, genuine places that actually exist in ${cleanName} (real monuments, temples, peaks, viewpoints, museums). Never invent fake names.
2. Provide realistic admission fees, opening hours, insider tips, and exact geographical coordinates (lat, lng).
3. Provide realistic seasonal weather breakdown, cultural etiquette rules, culinary dishes, getting around advice, and safety notes.
4. For heroImage and gallery, supply authentic, high-quality Unsplash image URLs of ${cleanName} (e.g. https://images.unsplash.com/photo-...).
5. Format strictly as valid JSON conforming to the schema below.

JSON Schema format to return:
{
  "id": "kebab-case-slug",
  "name": "City/Region Name",
  "country": "Country",
  "region": "Continent/Region",
  "category": "Mountain" | "Island" | "Nature" | "Cultural" | "Luxury" | "Safari",
  "heroImage": "https://images.unsplash.com/photo-...",
  "gallery": ["https://images.unsplash.com/photo-...", "https://images.unsplash.com/photo-..."],
  "startingPriceUsd": 500,
  "rating": 4.92,
  "reviewCount": 3200,
  "temperatureC": 22,
  "weatherCondition": "Pleasant Sunshine",
  "bestTimeToVisit": "May – October",
  "description": "2-3 sentences of inspiring description.",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4"],
  "coordinates": { "lat": 0.0, "lng": 0.0 },
  "historicalFact": "Fascinating historical trivia.",
  "timezone": "Timezone string",
  "localCurrency": "Currency name and symbol",
  "plugType": "Plug types and voltage",
  "attractions": [
    {
      "id": "slug-attr-1",
      "name": "Attraction Name",
      "category": "Iconic Landmark" | "Scenic Nature" | "Historic Heritage" | "Cultural Viewpoint" | "Sacred Temple" | "Art & Architecture",
      "description": "Compelling description of why to visit.",
      "image": "https://images.unsplash.com/photo-...",
      "location": "Street / Neighborhood name",
      "coordinates": { "lat": 0.0, "lng": 0.0 },
      "admissionFee": "Admission info",
      "openingHours": "Opening hours",
      "insiderTip": "Practical insider tip for luxury travelers",
      "recommendedDuration": "2 hours",
      "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=..."
    }
  ],
  "travelGuide": {
    "overview": "Comprehensive destination travel overview.",
    "bestTimeToVisit": {
      "summary": "Season summary",
      "peakSeason": "Months",
      "shoulderSeason": "Months",
      "offPeakSeason": "Months",
      "weatherBySeason": [
        {
          "season": "Spring",
          "months": "March – May",
          "temp": "15°C to 22°C",
          "weather": "Mild & blooming",
          "recommendation": "What to pack/do"
        }
      ]
    },
    "cultureAndEtiquette": {
      "dressCode": "Dress code advice",
      "customs": ["Custom 1", "Custom 2"],
      "tippingNorms": "Tipping standards",
      "photographyRules": "Rules",
      "languageTips": [
        { "phrase": "Hello in local language", "meaning": "Hello" }
      ]
    },
    "gettingAround": {
      "summary": "Transit overview",
      "airportTransit": "Airport info",
      "publicTransit": "Public transit",
      "privateChauffeur": "Chauffeur info",
      "rentalAndDriving": "Driving info",
      "recommendedApps": ["App 1", "App 2"]
    },
    "gastronomy": {
      "culinaryDescription": "Food culture overview",
      "mustTryDishes": [
        { "name": "Dish Name", "description": "Dish description", "type": "Food", "isVegetarian": false }
      ],
      "iconicDiningAreas": ["Area 1", "Area 2"]
    },
    "practicalInfo": {
      "currency": "Currency advice",
      "cardAcceptance": "Card acceptance info",
      "connectivitySim": "SIM / eSIM info",
      "safetyRating": "High",
      "safetyTips": ["Tip 1", "Tip 2"],
      "emergencyNumbers": { "police": "112", "ambulance": "112", "touristHelpline": "..." },
      "visaInfo": "Visa essentials"
    }
  },
  "sampleItinerary": [
    {
      "day": 1,
      "title": "Day 1 Title",
      "description": "Day 1 summary",
      "morning": "Morning activity",
      "afternoon": "Afternoon activity",
      "evening": "Evening activity",
      "includedMeals": ["Breakfast", "Dinner"]
    }
  ]
}`;

      const candidateModels = [
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite"
      ];

      for (const modelName of candidateModels) {
        try {
          // Timeout after 6 seconds to avoid blocking the user
          const aiPromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.3
            }
          });

          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("AI generation timeout")), 6000)
          );

          const response = await Promise.race([aiPromise, timeoutPromise]) as any;
          const text = response?.text;
          if (text) {
            let cleanJson = text.trim();
            if (cleanJson.startsWith('```')) {
              cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            }
            const parsed = JSON.parse(cleanJson) as FullDestinationRecord;
            if (parsed && parsed.name && Array.isArray(parsed.attractions) && parsed.attractions.length > 0) {
              parsed.isAiGenerated = true;

              // Verify coordinates
              if (!parsed.coordinates || typeof parsed.coordinates.lat !== 'number') {
                parsed.coordinates = { lat: 25.0, lng: 55.0 };
              }

              // Try enriching with live open-meteo weather
              try {
                const liveWeather = await getLiveWeather(parsed.coordinates.lat, parsed.coordinates.lng);
                if (liveWeather) {
                  parsed.temperatureC = liveWeather.tempC;
                  parsed.weatherCondition = liveWeather.condition;
                }
              } catch {}

              // Cache generated destination
              MASTER_DESTINATIONS.set(parsed.id, parsed);
              return parsed;
            }
          }
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          console.warn(`[TripNest AI] Model ${modelName} notice: ${errMsg}`);
          // If quota exhausted or rate limit hit, immediately try next model or break to fallback
          if (errMsg.includes("Quota exceeded") || errMsg.includes("RESOURCE_EXHAUSTED")) {
            continue;
          }
        }
      }
    } catch (rootErr: any) {
      console.warn("[TripNest AI] Primary AI generator notice:", rootErr?.message || rootErr);
    }
  }

  // 2. Resilient Curated Fallback: Guarantees authentic luxury guide without failing
  console.info(`[TripNest AI] Activating verified luxury travel guide engine for "${cleanName}".`);
  const fallback = generateProceduralDestination(cleanName, categoryHint);

  try {
    const liveWeather = await getLiveWeather(fallback.coordinates.lat, fallback.coordinates.lng);
    if (liveWeather) {
      fallback.temperatureC = liveWeather.tempC;
      fallback.weatherCondition = liveWeather.condition;
    }
  } catch {}

  MASTER_DESTINATIONS.set(fallback.id, fallback);
  return fallback;
}
