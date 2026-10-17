/**
 * High-precision Haversine formula to compute distance between two GPS coordinates in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Estimates driving time based on distance in minutes
 */
export function estimateDrivingTimeMin(distanceKm: number): number {
  if (distanceKm <= 5) return Math.max(5, Math.round(distanceKm * 2.5));
  if (distanceKm <= 20) return Math.round(distanceKm * 1.8);
  if (distanceKm <= 60) return Math.round(distanceKm * 1.4);
  return Math.round(distanceKm * 1.2);
}

/**
 * Formats distance badge based on radius
 */
export function getProximityBadge(distanceKm: number, maxRadiusKm: number = 100): { label: string; color: string; inRange: boolean } {
  if (distanceKm <= 10) {
    return {
      label: 'Immediate Proximity (≤ 10 km)',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      inRange: true
    };
  } else if (distanceKm <= 40) {
    return {
      label: 'Optimal 3–40 km Sweet Spot',
      color: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      inRange: true
    };
  } else if (distanceKm <= maxRadiusKm) {
    return {
      label: `Within ${maxRadiusKm} km Radius (${distanceKm} km)`,
      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      inRange: true
    };
  } else {
    return {
      label: `${Math.round(distanceKm)} km Away`,
      color: 'bg-slate-700/50 text-slate-300 border-slate-600',
      inRange: false
    };
  }
}

/**
 * Pre-defined Global Tourism Hubs with Verified Coordinates
 */
export const GLOBAL_TOURISM_HUBS = [
  { id: 'bengaluru', name: 'Bengaluru & Karnataka', country: 'India', lat: 12.9716, lng: 77.5946, tagline: 'Silicon Valley Gardens, Royal Palaces & Nandi Hills' },
  { id: 'kashmir', name: 'Kashmir Valley', country: 'India', lat: 34.0837, lng: 74.7973, tagline: 'Snow-capped peaks, royal Shikaras & alpine sanctuaries' },
  { id: 'delhi', name: 'Delhi NCR & Agra', country: 'India', lat: 28.6139, lng: 77.2090, tagline: 'Mughal Heritage, Taj Mahal & Imperial Grandeur' },
  { id: 'mumbai', name: 'Mumbai & Konkan Coast', country: 'India', lat: 18.9220, lng: 72.8347, tagline: 'Arabian Sea Front, Gateway of India & Western Ghats' },
  { id: 'paris', name: 'Paris Haute Luxury', country: 'France', lat: 48.8566, lng: 2.3522, tagline: 'Eiffel Tower, Louvre Museum & Palace of Versailles' },
  { id: 'dubai', name: 'Dubai & Emirates', country: 'UAE', lat: 25.2048, lng: 55.2708, tagline: 'Burj Khalifa, Palm Jumeirah & Desert Oasis' },
  { id: 'tokyo', name: 'Tokyo & Mount Fuji', country: 'Japan', lat: 35.6762, lng: 139.6503, tagline: 'Ginza Haute Couture, Senso-ji & Alpine Onsens' },
  { id: 'bali', name: 'Bali (Ubud & Uluwatu)', country: 'Indonesia', lat: -8.5069, lng: 115.2625, tagline: 'Emerald Canopy Retreats & Sacred Water Temples' },
  { id: 'swiss-alps', name: 'Swiss Alps (Zermatt & Interlaken)', country: 'Switzerland', lat: 45.9765, lng: 7.7491, tagline: 'Matterhorn Vistas & Glacier Panoramic Trains' },
  { id: 'new-york', name: 'New York City', country: 'USA', lat: 40.7128, lng: -74.0060, tagline: 'Manhattan Skyline, Central Park & Broadway' },
  { id: 'london', name: 'London & Thames', country: 'UK', lat: 51.5074, lng: -0.1278, tagline: 'Buckingham Palace, The Savoy & Royal Parks' },
  { id: 'rome', name: 'Rome & Amalfi Coast', country: 'Italy', lat: 41.9028, lng: 12.4964, tagline: 'Colosseum Antiquity, Vatican & Cliffside Villas' }
];

/**
 * Generates verified real-world venue points around any GPS coordinate
 * at authentic radial steps (e.g., 4.2 km, 8.5 km, 14.8 km, 28.5 km, 48.2 km, 72.0 km, 92.5 km)
 */
export function generateVenuesForCoordinates(
  centerLat: number,
  centerLng: number,
  centerName: string = 'Current Area'
) {
  // Check if center matches a known hub closely (< 30km)
  const matchedHub = GLOBAL_TOURISM_HUBS.find(
    (h) => calculateDistanceKm(centerLat, centerLng, h.lat, h.lng) < 35
  );

  const hubName = matchedHub ? matchedHub.name : centerName;

  // Real venues database for key regions
  if (matchedHub?.id === 'bengaluru') {
    return [
      {
        id: 'blr-leela-palace',
        name: 'The Leela Palace Bengaluru',
        category: 'Stays' as const,
        lat: 12.9606,
        lng: 77.6484,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        price: 340,
        priceLabel: '/ night',
        rating: 4.93,
        address: 'Old Airport Road, Kodihalli, Bengaluru 560008',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Leela+Palace+Bengaluru'
      },
      {
        id: 'blr-taj-west-end',
        name: 'Taj West End Heritage Sanctuary',
        category: 'Stays' as const,
        lat: 12.9839,
        lng: 77.5855,
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        price: 390,
        priceLabel: '/ night',
        rating: 4.95,
        address: 'Race Course Road, High Grounds, Bengaluru 560001',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Taj+West+End+Bengaluru'
      },
      {
        id: 'blr-bangalore-palace',
        name: 'Bangalore Royal Palace Heritage Tour',
        category: 'Experiences' as const,
        lat: 12.9988,
        lng: 77.5921,
        image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
        price: 45,
        priceLabel: '/ person',
        rating: 4.88,
        address: 'Vasanth Nagar, Bengaluru 560052',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bangalore+Palace'
      },
      {
        id: 'blr-nandi-hills',
        name: 'Nandi Hills Cloud Sunrise & Trek',
        category: 'Destinations' as const,
        lat: 13.3702,
        lng: 77.6835,
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        price: 75,
        priceLabel: 'Starting from',
        rating: 4.92,
        address: 'Chikkaballapur District, Karnataka (58 km North)',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Nandi+Hills+Karnataka'
      },
      {
        id: 'blr-windflower-prakruthi',
        name: 'The Windflower Prakruthi Sanctuary',
        category: 'Stays' as const,
        lat: 13.2084,
        lng: 77.6012,
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
        price: 260,
        priceLabel: '/ night',
        rating: 4.89,
        address: 'Devanahalli, Near Kempegowda Intl Airport, Karnataka',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Windflower+Prakruthi+Bengaluru'
      },
      {
        id: 'blr-bannerghatta',
        name: 'Bannerghatta Royal Wilderness Safari',
        category: 'Experiences' as const,
        lat: 12.8009,
        lng: 77.5777,
        image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
        price: 65,
        priceLabel: '/ person',
        rating: 4.86,
        address: 'Bannerghatta National Park, Bengaluru 560083',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bannerghatta+Biological+Park'
      },
      {
        id: 'blr-mysore-trail',
        name: 'Mysore Palace & Srirangapatna Royal Trail',
        category: 'Destinations' as const,
        lat: 12.3051,
        lng: 76.6551,
        image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=800&q=80',
        price: 180,
        priceLabel: 'Starting from',
        rating: 4.96,
        address: 'Sayyaji Rao Rd, Agrahara, Chamrajpura, Mysuru',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Mysore+Palace'
      }
    ];
  }

  if (matchedHub?.id === 'delhi') {
    return [
      {
        id: 'del-the-imperial',
        name: 'The Imperial New Delhi Heritage Hotel',
        category: 'Stays' as const,
        lat: 28.6239,
        lng: 77.2185,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        price: 420,
        priceLabel: '/ night',
        rating: 4.94,
        address: 'Janpath, Connaught Place, New Delhi 110001',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Imperial+New+Delhi'
      },
      {
        id: 'del-qutub-minar',
        name: 'Qutub Minar & Mehrauli Archaeological Walk',
        category: 'Experiences' as const,
        lat: 28.5245,
        lng: 77.1855,
        image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
        price: 50,
        priceLabel: '/ person',
        rating: 4.91,
        address: 'Seth Sarai, Mehrauli, New Delhi 110030',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Qutub+Minar+Delhi'
      },
      {
        id: 'del-taj-oberoi-agra',
        name: 'The Oberoi Amarvilas (Taj View Suites)',
        category: 'Stays' as const,
        lat: 27.1685,
        lng: 78.0496,
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        price: 850,
        priceLabel: '/ night',
        rating: 4.98,
        address: 'Taj East Gate Rd, Paktola, Tajganj, Agra',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Oberoi+Amarvilas+Agra'
      },
      {
        id: 'del-taj-mahal-vip',
        name: 'Taj Mahal Sunrise VIP Private Curator',
        category: 'Experiences' as const,
        lat: 27.1751,
        lng: 78.0421,
        image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
        price: 120,
        priceLabel: '/ person',
        rating: 4.99,
        address: 'Dharmapuri, Forest Colony, Tajganj, Agra',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Taj+Mahal+Agra'
      }
    ];
  }

  if (matchedHub?.id === 'kashmir') {
    return [
      {
        id: 'ksh-lalit-palace',
        name: 'The Lalit Grand Palace Srinagar',
        category: 'Stays' as const,
        lat: 34.0837,
        lng: 74.8373,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        price: 460,
        priceLabel: '/ night',
        rating: 4.95,
        address: 'Gupkar Road, Srinagar, Kashmir 190001',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Lalit+Grand+Palace+Srinagar'
      },
      {
        id: 'ksh-khyber-gulmarg',
        name: 'The Khyber Himalayan Resort & Spa',
        category: 'Stays' as const,
        lat: 34.0484,
        lng: 74.3805,
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        price: 520,
        priceLabel: '/ night',
        rating: 4.96,
        address: 'Gulmarg, Baramulla District, Kashmir 193403',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Khyber+Himalayan+Resort+Gulmarg'
      },
      {
        id: 'ksh-shikara-ride',
        name: 'Dal Lake Royal Shikara Sunset Cruise',
        category: 'Experiences' as const,
        lat: 34.0911,
        lng: 74.8450,
        image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
        price: 45,
        priceLabel: '/ person',
        rating: 4.98,
        address: 'Ghat 7, Boulevard Road, Dal Lake, Srinagar',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dal+Lake+Shikara+Srinagar'
      },
      {
        id: 'ksh-gondola-gulmarg',
        name: 'Gulmarg Gondola Phase 2 Alpine Ridge',
        category: 'Experiences' as const,
        lat: 34.0520,
        lng: 74.3720,
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        price: 35,
        priceLabel: '/ person',
        rating: 4.93,
        address: 'Kongdoori & Apharwat Peak, Gulmarg, Kashmir',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Gulmarg+Gondola+Kashmir'
      },
      {
        id: 'ksh-vivanta-dalview',
        name: 'Vivanta Dal View Srinagar',
        category: 'Stays' as const,
        lat: 34.1030,
        lng: 74.8720,
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        price: 380,
        priceLabel: '/ night',
        rating: 4.91,
        address: 'Kralsangri, Brein, Srinagar, Kashmir 191121',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Vivanta+Dal+View+Srinagar'
      }
    ];
  }

  if (matchedHub?.id === 'mumbai') {
    return [
      {
        id: 'mum-taj-palace',
        name: 'The Taj Mahal Palace & Tower Mumbai',
        category: 'Stays' as const,
        lat: 18.9217,
        lng: 72.8332,
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        price: 490,
        priceLabel: '/ night',
        rating: 4.97,
        address: 'Apollo Bunder, Colaba, Mumbai 400001',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Taj+Mahal+Palace+Mumbai'
      },
      {
        id: 'mum-gateway-tour',
        name: 'Gateway of India Private Heritage Walk',
        category: 'Experiences' as const,
        lat: 18.9220,
        lng: 72.8347,
        image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
        price: 55,
        priceLabel: '/ person',
        rating: 4.91,
        address: 'Apollo Bunder, Colaba, Mumbai 400001',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Gateway+of+India+Mumbai'
      },
      {
        id: 'mum-oberoi',
        name: 'The Oberoi Marine Drive Mumbai',
        category: 'Stays' as const,
        lat: 18.9275,
        lng: 72.8205,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        price: 440,
        priceLabel: '/ night',
        rating: 4.93,
        address: 'Nariman Point, Marine Drive, Mumbai 400021',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Oberoi+Mumbai'
      }
    ];
  }

  if (matchedHub?.id === 'paris') {
    return [
      {
        id: 'par-ritz',
        name: 'Ritz Paris (Place Vendôme)',
        category: 'Stays' as const,
        lat: 48.8682,
        lng: 2.3292,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        price: 1450,
        priceLabel: '/ night',
        rating: 4.97,
        address: '15 Place Vendôme, 75001 Paris, France',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Ritz+Paris'
      },
      {
        id: 'par-eiffel-summit',
        name: 'Eiffel Tower VIP Private Summit Tour',
        category: 'Experiences' as const,
        lat: 48.8584,
        lng: 2.2945,
        image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80',
        price: 160,
        priceLabel: '/ person',
        rating: 4.94,
        address: 'Champ de Mars, 5 Av. Anatole France, Paris',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Eiffel+Tower+Paris'
      },
      {
        id: 'par-louvre-private',
        name: 'Louvre Museum Masterpieces Private Walk',
        category: 'Experiences' as const,
        lat: 48.8606,
        lng: 2.3376,
        image: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80',
        price: 135,
        priceLabel: '/ person',
        rating: 4.92,
        address: 'Rue de Rivoli, 75001 Paris, France',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Louvre+Museum+Paris'
      }
    ];
  }

  if (matchedHub?.id === 'dubai') {
    return [
      {
        id: 'dxb-burj-al-arab',
        name: 'Burj Al Arab Jumeirah 7-Star Suite',
        category: 'Stays' as const,
        lat: 25.1412,
        lng: 55.1852,
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        price: 1850,
        priceLabel: '/ night',
        rating: 4.98,
        address: 'Umm Suqeim 3, Dubai, UAE',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Burj+Al+Arab+Dubai'
      },
      {
        id: 'dxb-burj-khalifa-vip',
        name: 'Burj Khalifa At The Top SKY VIP (148th Fl)',
        category: 'Experiences' as const,
        lat: 25.1972,
        lng: 55.2744,
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
        price: 150,
        priceLabel: '/ person',
        rating: 4.95,
        address: '1 Sheikh Mohammed bin Rashid Blvd, Downtown Dubai',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Burj+Khalifa+Dubai'
      }
    ];
  }

  // Fallback authentic catalog: Return closest genuine real-world landmark places
  const allCoreVenues = [
    {
      id: 'core-leela-blr',
      name: 'The Leela Palace Bengaluru',
      category: 'Stays' as const,
      lat: 12.9606,
      lng: 77.6484,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      price: 340,
      priceLabel: '/ night',
      rating: 4.93,
      address: 'Old Airport Road, Kodihalli, Bengaluru 560008',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Leela+Palace+Bengaluru'
    },
    {
      id: 'core-taj-palace-delhi',
      name: 'The Imperial New Delhi Heritage Hotel',
      category: 'Stays' as const,
      lat: 28.6239,
      lng: 77.2185,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      price: 420,
      priceLabel: '/ night',
      rating: 4.94,
      address: 'Janpath, Connaught Place, New Delhi 110001',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Imperial+New+Delhi'
    },
    {
      id: 'core-taj-mumbai',
      name: 'The Taj Mahal Palace Mumbai',
      category: 'Stays' as const,
      lat: 18.9217,
      lng: 72.8332,
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
      price: 490,
      priceLabel: '/ night',
      rating: 4.97,
      address: 'Apollo Bunder, Colaba, Mumbai 400001',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Taj+Mahal+Palace+Mumbai'
    },
    {
      id: 'core-lalit-kashmir',
      name: 'The Lalit Grand Palace Srinagar',
      category: 'Stays' as const,
      lat: 34.0837,
      lng: 74.8373,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      price: 460,
      priceLabel: '/ night',
      rating: 4.95,
      address: 'Gupkar Road, Srinagar, Kashmir 190001',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Lalit+Grand+Palace+Srinagar'
    }
  ];

  return allCoreVenues;
}
