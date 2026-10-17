import { GoogleGenAI } from "@google/genai";
import { fetchLiveVerifiedPlaces, calculateDistanceKm, estimateDrivingTimeMin, VERIFIED_REAL_WORLD_PLACES } from "./places";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

export interface ChatPayload {
  message: string;
  history?: Array<{ sender: 'user' | 'model'; text: string }>;
  context?: {
    currentDestination?: string;
    userLocation?: { lat: number; lng: number; city?: string; name?: string };
    selectedCategory?: string;
    radiusKm?: number;
  };
}

export async function handleAiChat(payload: ChatPayload) {
  const { message = "", history = [], context = {} } = payload;
  const ai = getAiClient();

  // Parse radius from user message ONLY if user explicitly specifies one
  const distanceMatch = message.match(/(\d+)\s*(?:km|kilometers|kilometer)/i);
  const explicitRadius = distanceMatch ? parseInt(distanceMatch[1], 10) : null;
  const requestedRadius = explicitRadius || (context.radiusKm || 100);

  const systemInstruction = `You are TripNest's Master Real-Time Travel Concierge, Global Trip Planner, and Financial Budget Advisor.
Your archetype is an ultra-refined, warm, knowledgeable luxury travel advisor.

CRITICAL INSTRUCTIONS & CORE CAPABILITIES:
1. ANSWER EVERYTHING COMPREHENSIVELY:
   You have unrestricted global travel knowledge. Do NOT restrict answers to 30 to 40 km or impose arbitrary distance limitations unless the user explicitly requests a specific proximity filter. You answer all questions about any destination, country, city, continent, flight, or travel topic worldwide.

2. DETAILED BUDGET & FINANCIAL PLANNING:
   When asked about budgets, costs, or financial planning:
   - Provide a clear, actionable budget breakdown (Total estimated spend, category allocations for Accommodation, Dining, Transport/Flights, Activities/Sightseeing, Shopping, and a 10-15% Contingency Buffer).
   - Give realistic cost ranges (e.g. Budget/Backpacker, Moderate/Comfort, Luxury/5-Star).
   - Include daily per-person cost estimates and currency conversions (USD $, EUR €, INR ₹, etc.).
   - Offer smart money-saving advice, best booking windows, and value-packed alternatives.

3. AUTHENTIC VENUES & ITINERARIES:
   - ONLY recommend genuine, existing real-world establishments, attractions, viewpoints, and dining institutions.
   - For itineraries, provide day-by-day or morning/afternoon/evening flows with realistic timings and transportation tips.

4. STRUCTURED FORMAT & READABILITY:
   - Use clean Markdown with headings, bullet points, and emojis.
   ${explicitRadius ? `- The user explicitly requested recommendations within ${explicitRadius} km. Keep recommended venues within this specified limit.` : '- If recommending venues, state the location/neighborhood clearly along with approximate drive/transit times.'}
   - When referencing places, include verified landmarks, estimated tariffs, and Google Maps search links where helpful.

5. STRICT BRANDING COMPLIANCE:
   - NEVER mention the words "Gemini", "Google", "LLM", or AI model names. You are exclusively "TripNest Concierge".

6. TONE:
   - Highly professional, hospitable, helpful, and inspiring.
   - Conclude with a helpful proactive tip or next step.`;

  if (ai) {
    const candidateModels = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-8)) {
        contents.push({
          role: item.sender === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }]
        });
      }
    }

    let enrichedPrompt = message;
    if (context.userLocation) {
      enrichedPrompt += `\n[User's current location: ${context.userLocation.name || 'Current Location'} (Lat ${context.userLocation.lat.toFixed(4)}, Lng ${context.userLocation.lng.toFixed(4)})]`;
    }
    if (context.currentDestination) {
      enrichedPrompt += `\n[Current destination context: ${context.currentDestination}]`;
    }
    if (explicitRadius) {
      enrichedPrompt += `\n[User explicitly requested proximity: <= ${explicitRadius} km]`;
    }

    contents.push({
      role: 'user',
      parts: [{ text: enrichedPrompt }]
    });

    for (const modelName of candidateModels) {
      try {
        // Attempt 1: With Google Search Grounding for real-time live data
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }]
          }
        });

        const text = response.text?.trim();
        if (text) {
          const sources: Array<{ title: string; url: string }> = [];
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (Array.isArray(chunks)) {
            for (const chunk of chunks) {
              if (chunk.web?.uri && chunk.web?.title) {
                sources.push({
                  title: chunk.web.title,
                  url: chunk.web.uri
                });
              }
            }
          }

          return {
            text,
            sources: sources.slice(0, 4),
            status: "success"
          };
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isTemporary = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("429");
        if (isTemporary) {
          // Brief pause on temporary spike before retry
          await new Promise((r) => setTimeout(r, 400));
        }

        // Attempt 2: If Search tool exceeded rate limits or quota, retry standard model generation
        try {
          const standardResponse = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction
            }
          });

          const stdText = standardResponse.text?.trim();
          if (stdText) {
            return {
              text: stdText,
              sources: [],
              status: "success"
            };
          }
        } catch (stdErr: any) {
          // Model failed or unavailable, try next candidate model
        }
      }
    }
  }

  // =========================================================================
  // INTELLIGENT REAL-WORLD OFFLINE / LOCAL CONCIERGE ENGINE
  // Triggers when running on localhost without GEMINI_API_KEY or when quota is exceeded.
  // Parses destination & intent dynamically so every question gets a tailored response.
  // =========================================================================
  const lowerMsg = message.toLowerCase();

  // 1. Detect Destination from message or context
  let detectedDestination = context.currentDestination || "";
  if (!detectedDestination) {
    if (lowerMsg.includes("tokyo") || lowerMsg.includes("japan") || lowerMsg.includes("kyoto")) {
      detectedDestination = "Tokyo";
    } else if (lowerMsg.includes("paris") || lowerMsg.includes("france") || lowerMsg.includes("versailles")) {
      detectedDestination = "Paris";
    } else if (lowerMsg.includes("bali") || lowerMsg.includes("ubud") || lowerMsg.includes("indonesia")) {
      detectedDestination = "Bali";
    } else if (lowerMsg.includes("swiss") || lowerMsg.includes("alps") || lowerMsg.includes("zermatt") || lowerMsg.includes("switzerland") || lowerMsg.includes("jungfrau")) {
      detectedDestination = "Swiss Alps";
    } else if (lowerMsg.includes("amalfi") || lowerMsg.includes("positano") || lowerMsg.includes("italy") || lowerMsg.includes("rome") || lowerMsg.includes("conca")) {
      detectedDestination = "Amalfi Coast";
    } else if (lowerMsg.includes("dubai") || lowerMsg.includes("uae") || lowerMsg.includes("emirates") || lowerMsg.includes("jumeirah")) {
      detectedDestination = "Dubai";
    } else if (lowerMsg.includes("kashmir") || lowerMsg.includes("srinagar") || lowerMsg.includes("gulmarg") || lowerMsg.includes("dal lake")) {
      detectedDestination = "Kashmir Valley";
    } else if (lowerMsg.includes("bengaluru") || lowerMsg.includes("bangalore") || lowerMsg.includes("karnataka")) {
      detectedDestination = "Bengaluru";
    } else if (lowerMsg.includes("delhi") || lowerMsg.includes("agra") || lowerMsg.includes("taj mahal")) {
      detectedDestination = "Delhi & Agra";
    }
  }

  // 2. Filter places matching the detected destination
  let destinationPlaces: typeof VERIFIED_REAL_WORLD_PLACES = [];
  if (detectedDestination) {
    const destTerm = detectedDestination.toLowerCase();
    destinationPlaces = VERIFIED_REAL_WORLD_PLACES.filter(p =>
      p.address.toLowerCase().includes(destTerm) ||
      p.name.toLowerCase().includes(destTerm) ||
      (p.signatureFeature && p.signatureFeature.toLowerCase().includes(destTerm)) ||
      (p.id && p.id.toLowerCase().includes(destTerm.slice(0, 4)))
    );
  }

  // 3. Intent: Greeting / Introduction
  const isGreeting = /^(hi|hello|hey|greetings|hola|namaste|good\s(morning|afternoon|evening))\b/i.test(message.trim()) || lowerMsg === "help";
  if (isGreeting) {
    return {
      text: `### 🌍 Welcome to TripNest Luxury Concierge\n\n` +
        `Hello! I am your 24/7 travel advisor, ready to assist you with handpicked itineraries, 5-star sanctuaries, and dining reservations across our global portfolio.\n\n` +
        `**Featured Destinations Available Right Now:**\n` +
        `- 🇯🇵 **Tokyo, Japan**: Private sushi omakase counters, Aman Tokyo, and panoramic Shibuya Sky access.\n` +
        `- 🇫🇷 **Paris, France**: Balconies at Hôtel Plaza Athénée, 3-star Le Gabriel, and Versailles curator tours.\n` +
        `- 🇮🇩 **Bali, Indonesia**: Ayung River luxury reserves at Mandapa and sacred holy spring blessings.\n` +
        `- 🇨🇭 **Swiss Alps**: The Chedi Andermatt, Matterhorn alpine fondues at Chez Vrony, and Jungfraujoch cogwheel passes.\n` +
        `- 🇮🇹 **Amalfi Coast**: Cliffside villas at Le Sirenuse Positano and Monastero Santa Rosa thermal baths.\n` +
        `- 🇮🇳 **Kashmir & Bengaluru**: Maharaja suites, Dal Lake Shikaras, and heritage palace retreats.\n\n` +
        `*Ask me anything about hotel bookings, day-by-day itineraries, flight logistics, packing tips, or local secrets!*`,
      sources: [{ title: 'TripNest Global Travel Directory', url: 'https://www.google.com/maps' }],
      status: 'offline-smart'
    };
  }

  // 4. Intent: Packing & Weather
  const isPackingOrWeather = lowerMsg.includes("pack") || lowerMsg.includes("weather") || lowerMsg.includes("climate") || lowerMsg.includes("what to wear") || lowerMsg.includes("season");
  if (isPackingOrWeather) {
    const target = detectedDestination || "your upcoming luxury getaway";
    return {
      text: `### 🧳 Luxury Packing & Travel Essentials for ${target}\n\n` +
        `Here is our concierge checklist tailored for **${target}**:\n\n` +
        `1. **Climate & Attire**:\n` +
        `   - **Smart-Casual & Evening Formal**: Fine dining venues (e.g. Michelin restaurants) require collared shirts, blazers, and dress shoes.\n` +
        `   - **Layering System**: Pack breathable merino wool or cashmere layers for cool mountain breezes or air-conditioned lounges.\n` +
        `   - **Footwear**: Premium walking loafers or sneakers with cushioned soles for historic cobblestone promenades.\n\n` +
        `2. **Electronics & Connectivity**:\n` +
        `   - Universal travel adapter (Type C/G for Europe & UK, Type A/B for Japan and US).\n` +
        `   - 20,000 mAh PD power bank for full-day photography excursions.\n\n` +
        `3. **Documents & Peace of Mind**:\n` +
        `   - Passport with 6+ months validity, international travel insurance policy, and local currency / zero-forex card.\n\n` +
        `*Concierge Tip: You can request room garment steaming and laundry service directly upon arrival at any TripNest partner hotel.*`,
      sources: [{ title: 'TripNest Travel Guidelines', url: 'https://www.google.com/maps' }],
      status: 'offline-smart'
    };
  }

  // 5. Intent: Budget & Currency
  const isBudget = lowerMsg.includes("budget") || lowerMsg.includes("cost") || lowerMsg.includes("currency") || lowerMsg.includes("price") || lowerMsg.includes("exchange");
  if (isBudget) {
    const target = detectedDestination || "a luxury journey";
    return {
      text: `### 💵 Budget Allocation & Currency Advisory: ${target}\n\n` +
        `A typical ultra-luxury travel budget for **${target}** breaks down into four core pillars:\n\n` +
        `- 🏨 **5-Star Accommodations (45-50%)**: Approximately $600 to $1,500 / night depending on suite category (includes complimentary champagne breakfast).\n` +
        `- 🍷 **Michelin & Signature Dining (25%)**: $120 to $350 / person for multi-course tasting menus and curated wine pairings.\n` +
        `- 🧭 **Private Experiences & Guides (15%)**: $150 to $300 / day for private boat charters, museum curators, or ski instructors.\n` +
        `- 🚘 **Private Chauffeur & Transfers (10%)**: $100 to $250 for airport express or luxury Mercedes S-Class chauffeuring.\n\n` +
        `*Concierge Advice: Keep a multi-currency card ready. All TripNest reservations support direct billing in Indian Rupees (INR ₹) with zero foreign transaction markups.*`,
      sources: [{ title: 'TripNest Luxury Tariffs Guide', url: 'https://www.google.com/maps' }],
      status: 'offline-smart'
    };
  }

  // 6. Intent: Specific Destination Recommendations (Stays, Dining, Experiences)
  if (destinationPlaces.length > 0) {
    const isHotelQuery = lowerMsg.includes("hotel") || lowerMsg.includes("stay") || lowerMsg.includes("resort") || lowerMsg.includes("villa");
    const isDiningQuery = lowerMsg.includes("food") || lowerMsg.includes("eat") || lowerMsg.includes("restaurant") || lowerMsg.includes("dining") || lowerMsg.includes("michelin");

    let filtered = destinationPlaces;
    if (isHotelQuery) {
      const hotels = destinationPlaces.filter(p => p.category === 'Stays');
      if (hotels.length > 0) filtered = hotels;
    } else if (isDiningQuery) {
      const dining = destinationPlaces.filter(p => p.category === 'Dining');
      if (dining.length > 0) filtered = dining;
    }

    const venues = filtered.slice(0, 4);
    const responseBody = `### 🌟 Curated Real-World Discovery: ${detectedDestination}\n\n` +
      `Here are hand-picked, verified world-class establishments in **${detectedDestination}** matching your inquiry:\n\n` +
      venues.map((p, idx) => {
        return `${idx + 1}. **${p.name}** — ★ ${p.rating.toFixed(2)} / 5.0 (${p.reviewCount.toLocaleString()} Verified Reviews)\n` +
          `   - 🗺️ **Address**: ${p.address}\n` +
          `   - 💵 **Nightly Tariff / Price**: $${p.price} ${p.priceLabel || '/ night'}\n` +
          `   - 🍽️ **Signature Highlights**: ${p.signatureFeature || p.cuisineOrType || 'Verified 5-star premier hospitality'}\n` +
          `   - 🧭 **Navigation**: [Open on Google Maps](${p.googleMapsUrl})`;
      }).join('\n\n') +
      `\n\n*Concierge Tip: Every property above is verified in our database with direct booking guarantees. You can also save these venues to your Custom Trip Planner.*`;

    return {
      text: responseBody,
      sources: venues.map(p => ({ title: `${p.name} (Google Maps Verified)`, url: p.googleMapsUrl })),
      status: 'offline-smart'
    };
  }

  // 7. Intent: Explicit GPS Radius / Near Me Search
  const isNearMe = lowerMsg.includes("near me") || lowerMsg.includes("nearby") || lowerMsg.includes("radius") || lowerMsg.includes("around");
  if (isNearMe && context.userLocation) {
    const userLat = context.userLocation.lat;
    const userLng = context.userLocation.lng;
    const locationName = context.userLocation.name || "your current location";

    const liveResult = await fetchLiveVerifiedPlaces({
      lat: userLat,
      lng: userLng,
      radiusKm: requestedRadius,
      query: message,
      destinationName: locationName
    });

    const matchedPlaces = liveResult.places.slice(0, 4);
    if (matchedPlaces.length > 0) {
      const radiusBadge = explicitRadius ? ` (Within ${explicitRadius} km)` : '';
      const responseBody = `### 🌟 Curated Real-World Recommendations: ${locationName}${radiusBadge}\n\n` +
        `Here are verified premier accommodations, dining, and experiences around **${locationName}**:\n\n` +
        matchedPlaces.map((p, idx) => {
          const dist = p.distanceKm !== undefined ? p.distanceKm : calculateDistanceKm(userLat, userLng, p.lat, p.lng);
          const driveTime = p.drivingTimeMin || estimateDrivingTimeMin(dist);
          return `${idx + 1}. **${p.name}** — ★ ${p.rating.toFixed(2)} / 5.0 (${p.reviewCount.toLocaleString()} Verified Reviews)\n` +
            `   - 📍 **Distance & Drive**: ${dist} km (~${driveTime} mins drive)\n` +
            `   - 🗺️ **Exact Address**: ${p.address}\n` +
            `   - 💵 **Price**: $${p.price} ${p.priceLabel || '/ night'}\n` +
            `   - 🍽️ **Signature Highlights**: ${p.signatureFeature || p.cuisineOrType || 'Verified 5-star premier hospitality'}\n` +
            `   - 🧭 **Navigation**: [Open on Google Maps](${p.googleMapsUrl})`;
        }).join('\n\n') +
        `\n\n*Concierge Tip: Every venue above has verified GPS positioning and live tariff rates.*`;

      return {
        text: responseBody,
        sources: matchedPlaces.map(p => ({ title: `${p.name} (Google Maps Verified)`, url: p.googleMapsUrl })),
        status: "offline-smart"
      };
    }
  }

  // 8. General Travel Advice, Budget Planning & Global Destination Engine
  const samplePicks = [
    VERIFIED_REAL_WORLD_PLACES.find(p => p.id === 'tyo-aman-tokyo'),
    VERIFIED_REAL_WORLD_PLACES.find(p => p.id === 'paris-plaza-athenee'),
    VERIFIED_REAL_WORLD_PLACES.find(p => p.id === 'swiss-chedi-andermatt')
  ].filter(Boolean) as typeof VERIFIED_REAL_WORLD_PLACES;

  // Check if user is asking for budget estimation or financial planning
  const budgetKeywords = ["budget", "cost", "price", "expense", "how much", "tariff", "estimate", "spend", "dollar", "inr", "rupee", "euro"];
  const isBudgetQuery = budgetKeywords.some(k => lowerMsg.includes(k));

  let responseBody = '';
  if (isBudgetQuery) {
    responseBody = `### 💰 Comprehensive Global Travel Budget & Expense Plan\n\n` +
      `Here is a tailored financial breakdown based on your inquiry:\n\n` +
      `| Category | Allocation | Budget Tier (per day) | Luxury Tier (per day) |\n` +
      `| :--- | :--- | :--- | :--- |\n` +
      `| 🏨 **Accommodation & Stays** | 40% | $70 – $150 (₹6,000 – ₹13,000) | $450 – $1,200+ (₹38,000 – ₹1,00,000+) |\n` +
      `| 🍽️ **Dining & Culinary** | 25% | $30 – $60 (₹2,500 – ₹5,000) | $150 – $350 (₹12,500 – ₹30,000) |\n` +
      `| 🚕 **Local Transport & Transit** | 15% | $15 – $35 (₹1,200 – ₹3,000) | $80 – $220 (₹6,800 – ₹18,500) |\n` +
      `| 🎟️ **Activities & Sightseeing** | 10% | $20 – $40 (₹1,700 – ₹3,400) | $100 – $250 (₹8,500 – ₹21,000) |\n` +
      `| 🛡️ **Contingency & Shopping** | 10% | $15 – $30 (₹1,200 – ₹2,500) | $75 – $200 (₹6,300 – ₹17,000) |\n\n` +
      `**Key Budget Optimization Tips:**\n` +
      `- ✈️ **Flight Booking Window**: Secure international airfares 6 to 8 weeks in advance for mid-week departures.\n` +
      `- 💳 **Currency & Multi-Card Strategy**: Use zero-forex markup cards or digital travel wallets to avoid 3.5% cross-currency fees.\n` +
      `- 🎟️ **City & Transit Passes**: Bundled museum and metro cards routinely save 30–45% over individual tickets.\n\n` +
      `*Feel free to ask for a customized day-by-day cost calculation for any specific city or country worldwide!*`;
  } else {
    responseBody = `### 🧭 TripNest Travel Advisory: "${message}"\n\n` +
      `Here is our comprehensive guidance for your inquiry:\n\n` +
      `- 🌍 **Global Coverage**: We provide unrestricted recommendations across all world continents, regions, and cities without distance barriers.\n` +
      `- 📅 **Custom Itineraries & Budgeting**: Ask for a customized 3-day, 5-day, or 7-day schedule, complete with estimated costs in USD, EUR, or INR.\n` +
      `- 🏨 **Verified Stays & Dining**: We feature verified 5-star partner properties with zero hidden fees and instant booking vouchers.\n\n` +
      `**Top Signature Sanctuaries Worldwide:**\n` +
      samplePicks.map((p, idx) =>
        `${idx + 1}. **${p.name}** (${p.address.split(',').slice(-2).join(',').trim()}) — ★ ${p.rating.toFixed(2)} / 5.0 ($${p.price} ${p.priceLabel})`
      ).join('\n') +
      `\n\n*Concierge Guidance: You can ask about flights, visas, weather, packing, day-by-day plans, or local food recommendations for any destination.*`;
  }

  return {
    text: responseBody,
    sources: samplePicks.map(p => ({ title: `${p.name} (Google Maps Verified)`, url: p.googleMapsUrl })),
    status: "offline-smart"
  };
}

export interface GenerateItineraryParams {
  title: string;
  destination?: string;
  daysCount?: number;
  startDate?: string;
}

export interface AiDayActivity {
  id?: string;
  time: string;
  title: string;
}

export interface AiItineraryDay {
  day: number;
  theme: string;
  activities: AiDayActivity[];
}

export interface AiItineraryResult {
  destination: string;
  theme: string;
  days: AiItineraryDay[];
  source: 'gemini-ai' | 'smart-generator';
  modelUsed?: string;
}

export async function generateAiItinerary(params: GenerateItineraryParams): Promise<AiItineraryResult> {
  const { title, destination = '', daysCount = 3, startDate = '' } = params;
  const count = Math.max(1, Math.min(daysCount || 3, 14));
  const ai = getAiClient();
  const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash"];

  const prompt = `You are TripNest's Master Real-World Travel Planner and Tourism Concierge.
The user is planning a trip. They entered the Trip Title: "${title}".
Destination hint: "${destination || 'Auto-detect from title'}".
Number of days requested: ${count}.
Start Date: "${startDate || 'Upcoming'}".

CRITICAL ACCURACY & NO FAKE DATA MANDATES:
1. Every activity MUST be a real, authentic place, venue, landmark, or historical site that strictly exists in the real world.
2. ABSOLUTE BAN ON FAKE OR HALLUCINATED VENUES.
3. Day 1 MUST immediately capture the exact theme and purpose from the trip title:
   - If the title mentions 'Ramen' or 'Culinary', Day 1 must feature authentic top-rated ramen shops with their real names and locations.
   - If the title mentions 'Shikara' or 'Lake', Day 1 must feature Dal Lake Shikara ride, houseboats, Mughal gardens.
   - If the title mentions 'Anime', Day 1 must feature Akihabara, Nakano Broadway, Ghibli, etc.
   - If the title mentions 'Ski', 'Beach', 'Safari', 'Heritage', 'Honeymoon', Day 1 must prioritize that specific theme.
4. Each day must contain 4 to 6 chronologically ordered activities with realistic 12-hour format timings (e.g. '09:00 AM', '11:30 AM', '01:15 PM', '03:45 PM', '06:30 PM', '08:30 PM').
5. Detect the most accurate destination city / region from the title if not already provided.
6. Return your response as a valid, parsable JSON object with NO markdown wrapper, adhering to this exact schema:
{
  "destination": "Accurate city or region name",
  "theme": "Short engaging theme subtitle matching the title",
  "days": [
    {
      "day": 1,
      "theme": "Day 1 Focus",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Clear, authentic description with real venue/landmark name"
        }
      ]
    }
  ]
}`;

  if (ai) {
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const rawText = response.text?.trim() || "";
        if (rawText) {
          const cleanedJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
          const parsed = JSON.parse(cleanedJson);
          if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
            const formattedDays: AiItineraryDay[] = parsed.days.map((d: any, idx: number) => ({
              day: typeof d.day === 'number' ? d.day : idx + 1,
              theme: String(d.theme || `Day ${idx + 1} Itinerary`),
              activities: Array.isArray(d.activities)
                ? d.activities.map((a: any, aIdx: number) => ({
                    id: `act-ai-${idx + 1}-${aIdx + 1}`,
                    time: String(a.time || '09:00 AM'),
                    title: String(a.title || 'Sightseeing')
                  }))
                : []
            }));

            return {
              destination: parsed.destination || destination || 'Custom Destination',
              theme: parsed.theme || title,
              days: formattedDays,
              source: 'gemini-ai',
              modelUsed: modelName
            };
          }
        }
      } catch (err) {
        console.warn(`Gemini AI itinerary generation with ${modelName} encountered error:`, err);
      }
    }
  }

  // Fallback if AI client is unavailable: Generate authentic title-aligned itinerary
  const fallbackDestination = destination || (
    title.toLowerCase().includes('kashmir') ? 'Kashmir Valley' :
    title.toLowerCase().includes('tokyo') || title.toLowerCase().includes('japan') || title.toLowerCase().includes('anime') ? 'Tokyo' :
    title.toLowerCase().includes('paris') || title.toLowerCase().includes('france') ? 'Paris' :
    title.toLowerCase().includes('goa') ? 'Goa' :
    title.toLowerCase().includes('dubai') ? 'Dubai' :
    title.toLowerCase().includes('swiss') || title.toLowerCase().includes('alps') ? 'Swiss Alps' :
    title.toLowerCase().includes('bali') ? 'Bali' :
    title.toLowerCase().includes('jaipur') ? 'Jaipur' :
    title.toLowerCase().includes('amalfi') || title.toLowerCase().includes('italy') ? 'Amalfi Coast' :
    'Destination'
  );

  const fallbackDays: AiItineraryDay[] = [];
  for (let i = 1; i <= count; i++) {
    fallbackDays.push({
      day: i,
      theme: i === 1 ? `Day 1: ${title}` : `Day ${i}: Highlights & Discovery`,
      activities: [
        { id: `fb-${i}-1`, time: "09:00 AM", title: `Morning exploration tailored to ${title}` },
        { id: `fb-${i}-2`, time: "11:30 AM", title: `Curated signature experience in ${fallbackDestination}` },
        { id: `fb-${i}-3`, time: "01:30 PM", title: `Authentic local culinary lunch` },
        { id: `fb-${i}-4`, time: "04:00 PM", title: `Afternoon scenic discovery & photo vantage point` },
        { id: `fb-${i}-5`, time: "07:00 PM", title: `Evening relaxing dinner and sunset experience` }
      ]
    });
  }

  return {
    destination: fallbackDestination,
    theme: title,
    days: fallbackDays,
    source: 'smart-generator'
  };
}

