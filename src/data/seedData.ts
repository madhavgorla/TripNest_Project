import { Destination, Hotel, Experience, CurrencyConfig } from '../types';
import {
  DESTINATION_ATTRACTIONS_MAP,
  DESTINATION_GUIDES_MAP,
  DESTINATION_METADATA_MAP
} from './destinationDetails';

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', rate: 86.5, label: 'INR (₹)' },
  USD: { code: 'USD', symbol: '$', rate: 1.0, label: 'USD ($)' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, label: 'EUR (€)' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.79, label: 'GBP (£)' },
  AED: { code: 'AED', symbol: 'د.إ', rate: 3.67, label: 'AED (د.إ)' },
  JPY: { code: 'JPY', symbol: '¥', rate: 154.0, label: 'JPY (¥)' }
};

const RAW_DESTINATIONS: Destination[] = [
  {
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
    coordinates: {
      lat: 34.0837,
      lng: 74.7973
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
    ],
    featured: true
  },
  {
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
    coordinates: {
      lat: -8.5069,
      lng: 115.2625
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
    ],
    featured: true
  },
  {
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
    coordinates: {
      lat: 45.9765,
      lng: 7.7491
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
    ],
    featured: true
  },
  {
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
    coordinates: {
      lat: 4.1755,
      lng: 73.5093
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
    ],
    featured: true
  },
  {
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
    coordinates: {
      lat: 48.8566,
      lng: 2.3522
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
    ],
    featured: true
  },
  {
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
    coordinates: {
      lat: 25.2048,
      lng: 55.2708
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
    ],
    featured: true
  }
];

export const INITIAL_DESTINATIONS: Destination[] = RAW_DESTINATIONS.map((d) => ({
  ...d,
  attractions: DESTINATION_ATTRACTIONS_MAP[d.id] || [],
  travelGuide: DESTINATION_GUIDES_MAP[d.id],
  ...(DESTINATION_METADATA_MAP[d.id] || {})
}));

export const INITIAL_HOTELS: Hotel[] = [
  {
    id: 'lalit-grand-palace',
    destinationId: 'kashmir',
    destinationName: 'Kashmir Valley',
    name: 'The Lalit Grand Palace Srinagar',
    tagline: 'Former Royal Residence of the Maharaja of Jammu & Kashmir',
    stars: 5,
    rating: 4.9,
    reviewCount: 1420,
    pricePerNightUsd: 450,
    address: 'Gupkar Road, Near Dal Lake, Srinagar, Jammu & Kashmir 190001',
    city: 'Srinagar',
    country: 'India',
    coordinates: {
      lat: 34.0754,
      lng: 74.8431
    },
    distanceFromCenterKm: 4.8,
    drivingTimeMin: 12,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Centuries-old Chinar Gardens', 'Heated Indoor Pool', 'Rejuve Spa', 'Heritage Bar', '24/7 Butler Service', 'Valet Limousine'],
    specialty: 'Historic Maharaja suites with hand-carved deodar walnut woodwork overlooking Dal Lake.',
    dining: ['The Chinar (Authentic Kashmiri Wazwan)', 'The Chinar Garden (Al fresco high tea)', 'Dal Bar'],
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Lalit+Grand+Palace+Srinagar',
    roomTiers: [
      {
        id: 'lalit-palace-deluxe',
        name: 'Deluxe Heritage Room',
        pricePerNightUsd: 450,
        capacity: '2 Guests',
        bedType: '1 King Bed',
        sizeSqFt: 450,
        amenities: ['Garden View', 'Walnut Wood Accents', 'Marble Bath', 'Free High-speed WiFi'],
        description: 'Exquisitely preserved royal suite with rich Kashmiri silk tapestries and views of the palace manicured lawns.',
        availableCount: 5,
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: 'lalit-palace-suite',
        name: 'Maharaja Royal Suite',
        pricePerNightUsd: 850,
        capacity: '3 Guests',
        bedType: '1 Imperial King Bed',
        sizeSqFt: 980,
        amenities: ['Dal Lake Panorama', 'Fireplace', 'Butler Service', 'Private Terrace'],
        description: 'The quintessential regal experience, featuring a grand living hall, antique furnishings, and panoramic Dal Lake vistas.',
        availableCount: 2,
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    featured: true
  },
  {
    id: 'khyber-resort',
    destinationId: 'kashmir',
    destinationName: 'Kashmir Valley',
    name: 'The Khyber Himalayan Resort & Spa',
    tagline: 'Luxury Haven 8,825 ft in the Pir Panjal Range',
    stars: 5,
    rating: 4.96,
    reviewCount: 2150,
    pricePerNightUsd: 550,
    address: 'Near Gondola Base, Gulmarg, Jammu & Kashmir 193403',
    city: 'Gulmarg',
    country: 'India',
    coordinates: {
      lat: 34.0484,
      lng: 74.3805
    },
    distanceFromCenterKm: 38.5,
    drivingTimeMin: 65,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Ski-in Ski-out Access', 'L’Occitane Spa', 'Temperature Controlled Infinity Pool', 'Heated Floors', 'Cigar Lounge'],
    specialty: 'Floor-to-ceiling glass mountain windows facing snow-covered Mount Apharwat.',
    dining: ['Cloves (All Day Fine Dining)', 'Noum (Tea & Sheesha Lounge)', 'Chaikash (Artisan Kehwa)'],
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Khyber+Himalayan+Resort+Spa+Gulmarg',
    roomTiers: [
      {
        id: 'khyber-premier-pine',
        name: 'Premier Pine View Room',
        pricePerNightUsd: 550,
        capacity: '2 Guests',
        bedType: '1 King Bed',
        sizeSqFt: 520,
        amenities: ['Pine Forest View', 'Heated Flooring', 'Kashmiri Silk Robes', 'Soaking Tub'],
        description: 'Wake up to the scent of pine woods and pristine snow through oversized bay windows.',
        availableCount: 4,
        image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: 'khyber-luxury-cottage',
        name: 'Presidential 2-Bedroom Chalet',
        pricePerNightUsd: 1250,
        capacity: '4 Guests',
        bedType: '2 King Beds',
        sizeSqFt: 1450,
        amenities: ['Apharwat Peak Panorama', 'Wood Burning Fireplace', 'Private Sauna', 'Dedicated Chef'],
        description: 'Ultra-exclusive private mountain chalet secluded in virgin snowfields with a personal butler.',
        availableCount: 1,
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    featured: true
  },
  {
    id: 'mandapa-ritz-carlton',
    destinationId: 'bali',
    destinationName: 'Bali (Ubud & Uluwatu)',
    name: 'Mandapa, a Ritz-Carlton Reserve',
    tagline: 'Spiritual Sanctuary nestled along the Ayung River Valley',
    stars: 5,
    rating: 4.98,
    reviewCount: 1890,
    pricePerNightUsd: 850,
    address: 'Jl. Raya Kedewatan, Banjar, Kedewatan, Ubud, Gianyar, Bali 80571',
    city: 'Ubud',
    country: 'Indonesia',
    coordinates: {
      lat: -8.4839,
      lng: 115.2444
    },
    distanceFromCenterKm: 6.4,
    drivingTimeMin: 15,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Patih (Private Butler)', 'Ayurvedic River Spa', 'Private Infinity Pool', 'Organic Permaculture Farm', 'Yoga Shala'],
    specialty: 'Private cocoon dining pods suspended over the rushing Ayung River torrents.',
    dining: ['Kubu Restaurant (Fine European Dining in Bamboo Cocoons)', 'Sawah Terrace (Farm-to-table Balinese)', 'The Pool Bar'],
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Mandapa+a+Ritz-Carlton+Reserve+Ubud',
    roomTiers: [
      {
        id: 'mandapa-reserve-suite',
        name: 'Mandapa Reserve Suite',
        pricePerNightUsd: 850,
        capacity: '2 Guests',
        bedType: '1 King Bed',
        sizeSqFt: 1560,
        amenities: ['Forest Canopy View', 'Deep Terrazzo Tub', 'Personal Butler', 'High-Speed Wi-Fi'],
        description: 'Immersed in lush green canopy with an outdoor terrace and master marble bathroom.',
        availableCount: 3,
        image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: 'mandapa-riverfront-villa',
        name: '1-Bedroom Riverfront Pool Villa',
        pricePerNightUsd: 1450,
        capacity: '2 Guests',
        bedType: '1 King Bed',
        sizeSqFt: 4600,
        amenities: ['Private Heated Pool', 'Direct River Sounds', 'Outdoor Balinese Pavilion', 'Complimentary Daily Spa'],
        description: 'Directly on the banks of the sacred Ayung river with a 30-meter private plunge pool.',
        availableCount: 2,
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    featured: true
  },
  {
    id: 'plaza-athenee-paris',
    destinationId: 'paris',
    destinationName: 'Paris Haute Luxury',
    name: 'Hôtel Plaza Athénée',
    tagline: 'The Epitome of Parisian Haute Couture and Palace Grandeur',
    stars: 5,
    rating: 4.95,
    reviewCount: 3410,
    pricePerNightUsd: 1200,
    address: '25 Avenue Montaigne, 75008 Paris',
    city: 'Paris',
    country: 'France',
    coordinates: {
      lat: 48.8661,
      lng: 2.3045
    },
    distanceFromCenterKm: 3.5,
    drivingTimeMin: 10,
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Dior Spa', 'Courtyard Ice Skating in Winter', 'Michelin Dining', 'Concierge Clefs d’Or', 'Eiffel Tower Terraces'],
    specialty: 'Iconic red geranium balconies directly framing the glittering Eiffel Tower.',
    dining: ['Jean Imbert au Plaza Athénée', 'Le Relais Plaza', 'La Cour Jardin'],
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Hotel+Plaza+Athenee+Paris',
    roomTiers: [
      {
        id: 'plaza-deluxe-montaigne',
        name: 'Deluxe Room Avenue Montaigne',
        pricePerNightUsd: 1200,
        capacity: '2 Guests',
        bedType: '1 King Bed',
        sizeSqFt: 485,
        amenities: ['Louis XVI Furnishings', 'Dior Bath Products', 'Pillow Menu', 'Marble En-suite'],
        description: 'Elegantly furnished with rich Parisian silks, overlooking the iconic fashion boutiques of Avenue Montaigne.',
        availableCount: 3,
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: 'plaza-eiffel-suite',
        name: 'Eiffel Tower Signature Suite',
        pricePerNightUsd: 2800,
        capacity: '2 Guests',
        bedType: '1 Grand King Bed',
        sizeSqFt: 1100,
        amenities: ['Direct Eiffel Tower View', 'Balcony with Red Geraniums', 'Chauffeured Maybach', 'Dom Pérignon Welcome'],
        description: 'World-famous view of the Eiffel Tower from your private wrought-iron terrace.',
        availableCount: 1,
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    featured: true
  },
  {
    id: 'burj-al-arab',
    destinationId: 'dubai',
    destinationName: 'Dubai Oasis & Skyline',
    name: 'Burj Al Arab Jumeirah',
    tagline: 'The World’s Most Iconic All-Suite 7-Star Sail Hotel',
    stars: 5,
    rating: 4.97,
    reviewCount: 4890,
    pricePerNightUsd: 1450,
    address: 'Umm Suqeim 3, Jumeirah Beach Road, Dubai',
    city: 'Dubai',
    country: 'United Arab Emirates',
    coordinates: {
      lat: 25.1412,
      lng: 55.1852
    },
    distanceFromCenterKm: 14.2,
    drivingTimeMin: 18,
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Helipad VIP Arrival', '24-Carat Gold Leaf Interiors', 'Talise Spa', 'Private Luxury Beach', 'Rolls-Royce Chauffeur'],
    specialty: 'Duplex suites with dedicated private 24-hour butler and Hermès amenities.',
    dining: ['Al Mahara (Undersea Aqualounge)', 'Sal (Chic Beachside Dining)', 'Al Muntaha (Level 27 Sky View)'],
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Burj+Al+Arab+Jumeirah+Dubai',
    roomTiers: [
      {
        id: 'burj-one-bed-duplex',
        name: 'Deluxe One-Bedroom Duplex Suite',
        pricePerNightUsd: 1450,
        capacity: '2 Guests',
        bedType: '1 Imperial King Bed',
        sizeSqFt: 1830,
        amenities: ['Two Floors', 'Arabian Gulf Views', 'Hermès Toiletries', 'Jacuzzi with Ocean View'],
        description: 'Spread over two grand levels with floor-to-ceiling panoramic glass windows facing the Arabian Gulf.',
        availableCount: 3,
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    featured: true
  }
];

export const INITIAL_EXPERIENCES: Experience[] = [
  {
    id: 'dal-lake-shikara',
    destinationId: 'kashmir',
    destinationName: 'Kashmir Valley',
    title: 'Dawn Shikara Heritage Cruise & Floating Flower Market',
    category: 'Cruise',
    priceUsd: 65,
    duration: '2.5 Hours',
    rating: 4.96,
    reviewCount: 920,
    image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1000&q=80',
    description: 'Drift across the mist-shrouded waters of Dal Lake in a cushioned wooden Shikara as sunrise illuminates lotus blossoms and lively floating vendor boats.',
    includes: ['Private Carved Shikara', 'Traditional Saffron Kehwa & Walnut Bakarkhani', 'Local Heritage Botanist Guide', 'Hotel Pickup & Dropoff'],
    meetingPoint: 'Gat No. 7, Boulevard Road, Srinagar',
    coordinates: {
      lat: 34.0885,
      lng: 74.8322
    },
    availableSlots: ['05:30 AM - 08:00 AM (Sunrise Magic)', '04:30 PM - 07:00 PM (Golden Sunset)'],
    maxGroupSize: 4,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dal+Lake+Ghat+7+Srinagar'
  },
  {
    id: 'gulmarg-gondola-safari',
    destinationId: 'kashmir',
    destinationName: 'Kashmir Valley',
    title: 'Gulmarg Phase 2 Gondola & High-Altitude Ski Safari',
    category: 'Adventure',
    priceUsd: 110,
    duration: '5 Hours',
    rating: 4.93,
    reviewCount: 1480,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80',
    description: 'Ride the world’s second-highest cable car up to 13,780 ft on Apharwat Peak with VIP skip-the-line passes and a certified alpine instructor.',
    includes: ['VIP Fast-Track Gondola Tickets', 'Alpine Gear & Ski Equipment', 'Certified Himalayan Guide', 'Fireside Mountain Snack'],
    meetingPoint: 'Gulmarg Gondola Boarding Terminal, Gulmarg',
    coordinates: {
      lat: 34.0492,
      lng: 74.3791
    },
    availableSlots: ['09:00 AM - 02:00 PM', '11:00 AM - 04:00 PM'],
    maxGroupSize: 6,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Gulmarg+Gondola+Cable+Car'
  },
  {
    id: 'ubud-jungle-swing-ritual',
    destinationId: 'bali',
    destinationName: 'Bali (Ubud & Uluwatu)',
    title: 'Ubud Rainforest Swing & Tirta Empul Holy Water Blessing',
    category: 'Wellness',
    priceUsd: 85,
    duration: '4 Hours',
    rating: 4.91,
    reviewCount: 1820,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80',
    description: 'Soar high above cascading palm jungles on an extreme canyon swing followed by a sacred Melukat water purification ceremony led by a Balinese priest.',
    includes: ['Express Jungle Swing Passes', 'Temple Sarong & Offerings', 'Private Chauffeur', 'Fresh Young Coconut & Herbal Lunch'],
    meetingPoint: 'Mandapa Lobby / Ubud Central Hub',
    coordinates: {
      lat: -8.4152,
      lng: 115.3156
    },
    availableSlots: ['08:00 AM - 12:00 PM', '01:30 PM - 05:30 PM'],
    maxGroupSize: 8,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tirta+Empul+Temple+Bali'
  },
  {
    id: 'jungfrau-top-of-europe',
    destinationId: 'swiss-alps',
    destinationName: 'Swiss Alps (Zermatt & Interlaken)',
    title: 'Jungfraujoch Top of Europe Private Cogwheel Expedition',
    category: 'VIP',
    priceUsd: 180,
    duration: '6 Hours',
    rating: 4.98,
    reviewCount: 2200,
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1000&q=80',
    description: 'Ascend to 11,332 ft via the high-tech Eiger Express tricable gondola and historic mountain railway into the heart of the Aletsch Glacier Ice Palace.',
    includes: ['First-Class Eiger Express & Cogwheel Passes', 'Ice Palace Entry & Sphinx Observation Deck', 'Swiss Chocolate Tasting', 'Audio Guide'],
    meetingPoint: 'Grindelwald Terminal Station',
    coordinates: {
      lat: 46.5475,
      lng: 7.9854
    },
    availableSlots: ['08:30 AM - 02:30 PM', '10:00 AM - 04:00 PM'],
    maxGroupSize: 10,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jungfraujoch+Top+of+Europe'
  },
  {
    id: 'baa-atoll-manta-snorkel',
    destinationId: 'maldives',
    destinationName: 'Maldives Private Atolls',
    title: 'Hanifaru Bay Bioluminescent & Manta Ray Marine Safari',
    category: 'Adventure',
    priceUsd: 140,
    duration: '3 Hours',
    rating: 4.97,
    reviewCount: 880,
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1000&q=80',
    description: 'Snorkel in crystal-clear waters alongside majestic reef manta rays in the UNESCO World Biosphere Reserve of Hanifaru Bay.',
    includes: ['Twin-Engine Speedboat Transfer', 'Professional Marine Biologist Guide', 'High-End Scubapro Snorkel Set & Fins', 'GoPro 4K Underwater Footage'],
    meetingPoint: 'Dharavandhoo Marina / Resort Water Sports Centre',
    coordinates: {
      lat: 5.1667,
      lng: 73.1333
    },
    availableSlots: ['09:00 AM - 12:00 PM', '02:00 PM - 05:00 PM'],
    maxGroupSize: 6,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Hanifaru+Bay+Baa+Atoll'
  }
];
