import { TripDayItinerary, TripTimeSlotActivity } from '../types';

interface DestinationProfile {
  keywords: string[];
  days: Array<{
    theme: string;
    title: string;
    description: string;
    activities: Array<{ time: string; activity: string }>;
  }>;
}

const DESTINATION_PROFILES: Record<string, DestinationProfile> = {
  kashmir: {
    keywords: ['kashmir', 'srinagar', 'gulmarg', 'pahalgam', 'dal lake', 'sonamarg'],
    days: [
      {
        theme: 'Dal Lake & Royal Mughal Heritage',
        title: 'Arrival in Srinagar & Dal Lake Sunset',
        description: 'Check-in to luxury cedarwood houseboat, floating markets, and royal Mughal terraced gardens.',
        activities: [
          { time: '08:30 AM', activity: 'Traditional Kashmiri Kahwa & freshly baked Bakerkhani breakfast' },
          { time: '10:30 AM', activity: 'Private Shikara cruise through Dal Lake lotus blooms & floating flower market' },
          { time: '01:30 PM', activity: 'Lunch along Boulevard Road overlooking the Zabarwan mountain range' },
          { time: '03:30 PM', activity: 'Royal Mughal Gardens walking tour: Nishat Bagh & Shalimar Bagh water pavilions' },
          { time: '06:30 PM', activity: 'Golden hour panoramic view from Shankaracharya Temple hilltop' },
          { time: '08:30 PM', activity: 'Authentic 7-course Kashmiri Wazwan feast (Rogan Josh, Rista & Gushtaba)' }
        ]
      },
      {
        theme: 'Gulmarg Alpine Gondola & Snow Meadows',
        title: 'High Alpine Ascent at Mount Apharwat',
        description: 'Excursion through pine-clad valleys to Gulmarg and high-altitude cable car ascent.',
        activities: [
          { time: '08:00 AM', activity: 'Kashmiri Girda bread & salted Noon Chai breakfast' },
          { time: '09:30 AM', activity: 'Scenic pine-forest mountain drive to Gulmarg valley (52 km)' },
          { time: '11:30 AM', activity: 'Phase 1 & Phase 2 Apharwat Peak Gondola ascent to 13,780 ft snow slopes' },
          { time: '02:00 PM', activity: 'Alpine meadow picnic lunch with panoramic Himalayan snow peak views' },
          { time: '04:30 PM', activity: 'Pony trail to scenic Strawberry Valley & historic stone St. Mary’s Church' },
          { time: '07:30 PM', activity: 'Fireside timber lodge dinner with live classical Santoor Kashmiri music' }
        ]
      },
      {
        theme: 'Pahalgam Valley of Shepherds & Lidder River',
        title: 'Pahalgam Pine Sanctuaries & Trout Waters',
        description: 'Scenic journey past Pampore saffron fields into the pristine Lidder River valley.',
        activities: [
          { time: '08:00 AM', activity: 'Departure for Pahalgam with photo stop at fragrant Pampore saffron fields' },
          { time: '10:30 AM', activity: 'Exploration of historic 9th-century Awantipora temple ruins' },
          { time: '01:00 PM', activity: 'Fresh grilled Himalayan river trout lunch by the roaring Lidder River' },
          { time: '03:30 PM', activity: 'Scenic excursion through Betaab Valley & Aru Valley pine forests' },
          { time: '06:00 PM', activity: 'Shopping for pure Kashmiri saffron, dried walnuts & wild mountain morels' },
          { time: '08:00 PM', activity: 'Riverside campfire barbecue under starry Himalayan skies' }
        ]
      },
      {
        theme: 'Old City Heritage & Artisan Craftsmanship',
        title: 'Downtown Srinagar Heritage & Silk Weaving',
        description: 'Centuries-old wooden shrines, spice bazaars, and master Pashmina shawl artisans.',
        activities: [
          { time: '09:00 AM', activity: 'Houseboat deck breakfast watching morning lake mist over Dal Lake' },
          { time: '10:30 AM', activity: 'Old Srinagar heritage walk: 378-pillar Jamia Masjid & Shah-e-Hamdan shrine' },
          { time: '01:30 PM', activity: 'Downtown Srinagar traditional Harissa & Seekh Kebab culinary tasting' },
          { time: '03:30 PM', activity: 'Master artisan workshop: authentic Pashmina spinning & walnut wood carving' },
          { time: '06:30 PM', activity: 'Sunset Shikara cruise circling the iconic Char Chinar island' },
          { time: '08:30 PM', activity: 'Candlelit dinner on private cedarwood houseboat with lake breeze' }
        ]
      },
      {
        theme: 'Nigeen Lake Serenity & Departure',
        title: 'Nigeen Lake & Fairy Palace Panorama',
        description: 'Peaceful morning waters of Nigeen Lake and farewell panoramic tea at Pari Mahal.',
        activities: [
          { time: '09:00 AM', activity: 'Lakeside brunch featuring Kashmiri honeycomb, apples, and roasted almonds' },
          { time: '11:00 AM', activity: 'Visit to Pari Mahal (Palace of Fairies) overlooking Srinagar city' },
          { time: '02:00 PM', activity: 'Final souvenir collection of hand-knotted silk carpets & papier-mâché crafts' },
          { time: '05:00 PM', activity: 'Farewell Kashmiri Kahwa toast & airport transfer' }
        ]
      }
    ]
  },
  goa: {
    keywords: ['goa', 'panaji', 'calangute', 'baga', 'anjuna', 'candolim', 'palolem', 'vagator'],
    days: [
      {
        theme: 'North Goa Coastal Vibe & Historic Forts',
        title: 'Fort Aguada & Coastal Beach Shacks',
        description: 'Portuguese coastal bastions, fresh seafood thalis, and sunset beach vibes.',
        activities: [
          { time: '08:30 AM', activity: 'Beachfront breakfast of warm Goan Poi bread, eggs and freshly brewed coffee' },
          { time: '10:30 AM', activity: 'Heritage exploration of 17th-century Fort Aguada & historic lighthouse' },
          { time: '01:30 PM', activity: 'Fresh catch Kingfish rava fry & prawn curry thali at Candolim beachfront' },
          { time: '04:00 PM', activity: 'Parasailing and jet ski water sports along Calangute shoreline' },
          { time: '06:30 PM', activity: 'Sunset cocktails at cliffside Thalassa overlooking Ozran beach' },
          { time: '08:30 PM', activity: 'Beach shack dinner with live acoustic guitars and tropical sea breeze' }
        ]
      },
      {
        theme: 'Latin Quarter Heritage & Spice Plantations',
        title: 'Fontainhas Heritage Walk & Mandovi Cruise',
        description: 'Vibrant pastel Portuguese quarters, organic spice groves, and river cruises.',
        activities: [
          { time: '08:30 AM', activity: 'Artisanal Portuguese egg tart (Pastel de Nata) and espresso in Panaji' },
          { time: '10:00 AM', activity: 'Guided architectural walk through Fontainhas vibrant Latin Quarter' },
          { time: '01:00 PM', activity: 'Traditional lunch at a 200-year-old Portuguese heritage mansion' },
          { time: '03:30 PM', activity: 'Sahakari Spice Farm botanical walk with traditional herbal welcome' },
          { time: '07:00 PM', activity: 'Luxury sunset catamaran cruise on the Mandovi River with Goan folk dances' },
          { time: '09:00 PM', activity: 'Dinner at riverside bistro with grilled red snapper & cashew feni' }
        ]
      },
      {
        theme: 'Vagator Cliffs & Bohemian Flea Markets',
        title: 'Chapora Fort & Anjuna Flea Market',
        description: 'Dramatic sea cliff ruins, wood-fired pizzas, and bohemian artisan markets.',
        activities: [
          { time: '09:00 AM', activity: 'Organic tropical smoothie bowl and avocado sourdough toast in Assagao' },
          { time: '11:00 AM', activity: 'Hike to Chapora Fort ramparts with panoramic views of the Arabian Sea' },
          { time: '02:00 PM', activity: 'Wood-fired Neapolitan pizza and iced tea at Vagator cliffside cafe' },
          { time: '04:30 PM', activity: 'Browsing Anjuna flea market for handcrafted jewelry, spices, and clothing' },
          { time: '07:30 PM', activity: 'Sundowner music and fire dancing performance at beachfront lounge' },
          { time: '09:30 PM', activity: 'Seafood beach barbecue and bonfire under tropical starry skies' }
        ]
      },
      {
        theme: 'South Goa Serenity & Palolem Kayaking',
        title: 'Pristine South Goa & Palolem Backwaters',
        description: 'Tranquil emerald waters, private island kayaking, and cliff sunsets.',
        activities: [
          { time: '08:30 AM', activity: 'Scenic coastal drive south toward secluded Palolem Beach' },
          { time: '10:30 AM', activity: 'Kayaking through the calm backwaters of Palolem to Butterfly Beach' },
          { time: '01:30 PM', activity: 'Fresh Crab Xec Xec lunch at a rustic palm-thatched beach shack' },
          { time: '04:30 PM', activity: 'Dramatic cliff sunset view from Cabo de Rama historic fort' },
          { time: '08:00 PM', activity: 'Quiet candlelit beach dinner with feet in the sand at Agonda' }
        ]
      },
      {
        theme: 'Ayurvedic Wellness & Coastal Farewell',
        title: 'Rejuvenation & Miramar Farewell',
        description: 'Herbal massages, souvenir shopping, and sunset toasts.',
        activities: [
          { time: '09:30 AM', activity: 'Rejuvenating Ayurvedic herbal massage and fresh king coconut water' },
          { time: '11:30 AM', activity: 'Shopping for authentic Bebinca cake, cashew nuts & local spices' },
          { time: '02:00 PM', activity: 'Relaxing final lunch overlooking Miramar beach' },
          { time: '05:30 PM', activity: 'Sunset stroll along the shore & departure airport transfer' }
        ]
      }
    ]
  },
  jaipur: {
    keywords: ['jaipur', 'rajasthan', 'udaipur', 'jodhpur', 'jaisalmer', 'amber fort', 'pink city'],
    days: [
      {
        theme: 'Royal Amber Fort & Pink City Welcome',
        title: 'Amber Fort Majesty & Pink City Heritage',
        description: 'Regal hill forts, shimmering mirror palaces, and traditional Rajasthani snacks.',
        activities: [
          { time: '08:30 AM', activity: 'World-famous Pyaaz Kachori & clay-pot Masala Chai at Rawat Mishthan' },
          { time: '10:00 AM', activity: 'Grand Amber Fort tour & dazzling mirrorwork at Sheesh Mahal' },
          { time: '01:30 PM', activity: 'Royal Rajasthani Thali at 1135 AD inside the fort ramparts' },
          { time: '04:00 PM', activity: 'Scenic photo stop at Jal Mahal (Water Palace) & Hawa Mahal facade' },
          { time: '07:30 PM', activity: 'Chokhi Dhani ethnic village: puppet show, camel ride & royal buffet' }
        ]
      },
      {
        theme: 'City Palace & Astronomical Wonders',
        title: 'City Palace Courtyards & Jantar Mantar',
        description: 'Private royal rooms, UNESCO astronomical observatories, and vibrant gemstone bazaars.',
        activities: [
          { time: '09:00 AM', activity: 'Heritage courtyard breakfast at Baradari inside the City Palace' },
          { time: '10:30 AM', activity: 'City Palace royal residence museum & private Chandra Mahal rooms' },
          { time: '01:00 PM', activity: 'Jantar Mantar UNESCO astronomical observatory guided tour' },
          { time: '03:30 PM', activity: 'Johari Bazaar & Bapu Bazaar shopping for gemstones, quilts & blue pottery' },
          { time: '06:30 PM', activity: 'Nahargarh Fort sunset view overlooking the illuminated Pink City' },
          { time: '08:30 PM', activity: 'Open-air rooftop dinner at Padao with panoramic city views' }
        ]
      },
      {
        theme: 'Stepwells, Jaigarh Fort & Block Printing',
        title: 'Panna Meena Stepwell & Textile Artisans',
        description: 'Geometric architectural stepwells, giant cannons, and artisan block printing workshops.',
        activities: [
          { time: '08:30 AM', activity: 'Morning thick creamy lassi at the legendary Lassiwala on MI Road' },
          { time: '10:00 AM', activity: 'Marvel at the geometric stairways of Panna Meena Ka Kund stepwell' },
          { time: '12:30 PM', activity: 'Jaigarh Fort visit and inspection of the world\'s largest cannon on wheels' },
          { time: '02:30 PM', activity: 'Spicy Laal Maas and Ker Sangri lunch at Handi restaurant' },
          { time: '04:30 PM', activity: 'Hands-on traditional Sanganeri hand-block printing workshop' },
          { time: '08:00 PM', activity: 'Classical Kathak dance performance with candlelit courtyard dinner' }
        ]
      },
      {
        theme: 'Pushkar Desert & Sacred Lakes Excursion',
        title: 'Pushkar Holy Ghats & Thar Desert Dunes',
        description: 'Sacred lake ghats, desert camel rides, and fireside Kalbelia folk performances.',
        activities: [
          { time: '08:00 AM', activity: 'Morning drive to the sacred town of Pushkar' },
          { time: '10:30 AM', activity: 'Walk around the 52 holy ghats of Pushkar Lake & Brahma Temple' },
          { time: '01:30 PM', activity: 'Falafel, fresh mint tea & warm Malpua lunch in Pushkar bazaar' },
          { time: '04:00 PM', activity: 'Sunset camel safari across the rolling Thar desert dunes' },
          { time: '07:30 PM', activity: 'Desert camp dinner with Kalbelia gypsy dancers around campfire' }
        ]
      },
      {
        theme: 'Albert Hall Museum & Royal Farewell',
        title: 'Albert Hall & Patrika Gate Farewell',
        description: 'Indo-Saracenic galleries, royal gardens, and departure.',
        activities: [
          { time: '09:30 AM', activity: 'Breakfast in the royal peacock gardens of Rambagh Palace' },
          { time: '11:00 AM', activity: 'Indo-Saracenic architecture and artifacts at Albert Hall Museum' },
          { time: '02:00 PM', activity: 'High tea and sweet Ghewar tasting at Taj Jai Mahal Palace' },
          { time: '05:30 PM', activity: 'Farewell photo at colorful Patrika Gate & departure transfer' }
        ]
      }
    ]
  },
  kerala: {
    keywords: ['kerala', 'alleppey', 'munnar', 'kochi', 'cochin', 'wayanad', 'kovalam'],
    days: [
      {
        theme: 'Alleppey Backwaters & Houseboat Check-in',
        title: 'Kettuvallam Luxury Houseboat Cruise',
        description: 'Gliding along serene palm-fringed canals, fresh Karimeen fish, and village canoe trails.',
        activities: [
          { time: '08:30 AM', activity: 'Steaming Appam with coconut vegetable stew & Kerala filter coffee' },
          { time: '10:30 AM', activity: 'Board private luxury Kettuvallam wooden houseboat at Punnamada Jetty' },
          { time: '01:00 PM', activity: 'Fresh Karimeen Pollichathu fish lunch while cruising through backwaters' },
          { time: '04:00 PM', activity: 'Narrow village canal ride in an eco-friendly wooden country canoe' },
          { time: '07:30 PM', activity: 'Starry deck dinner featuring traditional Kerala red rice & fish curry' }
        ]
      },
      {
        theme: 'Munnar Misty Tea Hills & Waterfalls',
        title: 'Ascent to Munnar Tea Country',
        description: 'Winding mountain passes, cascading waterfalls, and loose-leaf tea estate tastings.',
        activities: [
          { time: '08:00 AM', activity: 'Fresh coconut water breakfast on lake before checkout' },
          { time: '09:30 AM', activity: 'Scenic winding drive through misty Western Ghats to Munnar' },
          { time: '12:00 PM', activity: 'Photo stop at Cheeyappara & Valara cascading waterfalls' },
          { time: '01:30 PM', activity: 'Fluffy Malabar Parottas and pepper chicken lunch' },
          { time: '03:30 PM', activity: 'Tea Museum tour and loose-leaf tea tasting at Lockhart Estate' },
          { time: '07:00 PM', activity: 'Live Kathakali dance and Kalaripayattu martial arts show' }
        ]
      },
      {
        theme: 'Eravikulam National Park & Spice Plantations',
        title: 'Nilgiri Tahr Safari & Spice Gardens',
        description: 'High-altitude wildlife sanctuary, banana-leaf feasts, and fragrant spice tours.',
        activities: [
          { time: '07:30 AM', activity: 'Early morning wildlife safari at Eravikulam (home to Nilgiri Tahr)' },
          { time: '11:00 AM', activity: 'Echo Point boat pedal and Mattupetty Dam reservoir stroll' },
          { time: '01:30 PM', activity: 'Grand Kerala Sadya feast served on fresh banana leaf' },
          { time: '04:00 PM', activity: 'Guided organic spice plantation tour: cardamom, vanilla & cinnamon' },
          { time: '07:30 PM', activity: 'Rejuvenating Ayurvedic herbal body massage at resort spa' }
        ]
      },
      {
        theme: 'Historic Fort Kochi & Chinese Fishing Nets',
        title: 'Fort Kochi Colonial Walk & Harbor Cruise',
        description: 'Colonial churches, historic fishing piers, antique markets, and harbor sunsets.',
        activities: [
          { time: '08:30 AM', activity: 'Morning descent from Munnar hills to coastal Fort Kochi' },
          { time: '11:30 AM', activity: 'Watch fishermen operating iconic 14th-century Chinese Fishing Nets' },
          { time: '01:30 PM', activity: 'Fresh seafood lunch at colonial heritage cafe overlooking the harbor' },
          { time: '03:30 PM', activity: 'Exploration of Jew Town, Paradesi Synagogue & Dutch Palace' },
          { time: '06:30 PM', activity: 'Sunset harbor ferry cruise along Kochi port' },
          { time: '08:30 PM', activity: 'Contemporary fusion dining at heritage arts cafe' }
        ]
      },
      {
        theme: 'Coastal Wellness & Cherai Beach Farewell',
        title: 'Cherai Beach & Spices Farewell',
        description: 'Coastal breakfast, fresh banana chips, and departure.',
        activities: [
          { time: '09:00 AM', activity: 'Idiyappam breakfast with fresh coconut milk' },
          { time: '11:00 AM', activity: 'Shopping for organic spices, Kerala banana chips & handloom kasavu' },
          { time: '02:00 PM', activity: 'Relaxing lunch by Cherai Beach' },
          { time: '05:30 PM', activity: 'Sunset walk along the golden Arabian Sea shore & airport transfer' }
        ]
      }
    ]
  },
  dubai: {
    keywords: ['dubai', 'uae', 'abu dhabi', 'burj khalifa', 'emirates'],
    days: [
      {
        theme: 'Modern Architecture & Burj Khalifa Skyline',
        title: 'Burj Khalifa Observation & Dubai Mall',
        description: 'Soaring skyscrapers, fountain choreography shows, and luxury marina boardwalks.',
        activities: [
          { time: '09:00 AM', activity: 'Dubai Marina promenade breakfast overlooking luxury superyachts' },
          { time: '11:30 AM', activity: 'Dubai Mall & Burj Khalifa 124th/125th floor observation deck' },
          { time: '02:30 PM', activity: 'Gourmet lunch at Souk Al Bahar overlooking the Dubai Fountain lake' },
          { time: '05:00 PM', activity: 'Dubai Frame glass skybridge sunset experience' },
          { time: '08:30 PM', activity: 'Dubai Fountain light & music choreography show followed by Arabian dinner' }
        ]
      },
      {
        theme: 'Palm Jumeirah & Desert Safari 4x4',
        title: 'Palm Jumeirah & Golden Dune Safari',
        description: 'Iconic Palm archipelago, thrilling desert dune bashing, camel treks, and Bedouin BBQ.',
        activities: [
          { time: '09:00 AM', activity: 'Palm Jumeirah monorail ride & The View at The Palm observation deck' },
          { time: '11:30 AM', activity: 'Lost Chambers Aquarium exploration at Atlantis The Palm' },
          { time: '03:00 PM', activity: 'Desert Safari pickup: 4x4 dune bashing across golden desert dunes' },
          { time: '06:00 PM', activity: 'Sunset camel trekking & sandboarding on red sand dunes' },
          { time: '08:00 PM', activity: 'Bedouin camp BBQ buffet dinner with Tanoura dance & fire show' }
        ]
      },
      {
        theme: 'Old Dubai Heritage & Gold Souks',
        title: 'Abra Creek Cruise & Museum of the Future',
        description: 'Traditional wooden abras, aromatic spice souks, and futuristic architectural icons.',
        activities: [
          { time: '09:30 AM', activity: 'Traditional wooden Abra boat ride across bustling Dubai Creek' },
          { time: '11:00 AM', activity: 'Gold Souk & Spice Souk sensory bargaining walk' },
          { time: '01:30 PM', activity: 'Traditional Emirati lunch at Arabian Tea House in Al Fahidi Historical Quarter' },
          { time: '04:00 PM', activity: 'Museum of the Future interactive exhibits & iconic calligraphy ring' },
          { time: '08:00 PM', activity: 'Luxury yacht dinner cruise around Dubai Marina & Bluewaters Island' }
        ]
      }
    ]
  },
  manali: {
    keywords: ['manali', 'himachal', 'shimla', 'solang', 'rohtang', 'spiti', 'dharamshala'],
    days: [
      {
        theme: 'Old Manali Cafes & Wooden Cedar Shrines',
        title: 'Hadimba Temple & Old Manali Culture',
        description: 'Centuries-old pagodas in deodar woods, sulfur hot springs, and river cafes.',
        activities: [
          { time: '08:30 AM', activity: 'Warm Himalayan apple cider and pancake breakfast in Old Manali' },
          { time: '10:00 AM', activity: 'Visit the 16th-century wooden Hadimba Devi Temple in deodar forest' },
          { time: '01:00 PM', activity: 'Steaming Tibetan Thukpa and Momos lunch at riverside cafe' },
          { time: '03:30 PM', activity: 'Natural sulfur hot water spring bath at historic Vashisht Temple' },
          { time: '06:30 PM', activity: 'Stroll through vibrant Manali Mall Road for woolens & wooden handicrafts' },
          { time: '08:30 PM', activity: 'Wood-fired trout dinner with local apple wine' }
        ]
      },
      {
        theme: 'Solang Valley Adventure & Atal Tunnel',
        title: 'Solang Valley Thrills & Sissu Waterfalls',
        description: 'Paragliding over green valleys and traversing the engineering marvel Atal Tunnel.',
        activities: [
          { time: '08:00 AM', activity: 'Hearty aloo paratha breakfast with homemade white butter' },
          { time: '09:30 AM', activity: 'Paragliding and zorbing adventure at Solang Valley' },
          { time: '12:30 PM', activity: 'Drive through the 9-km Atal Tunnel into dramatic Lahaul Valley' },
          { time: '02:00 PM', activity: 'Picnic lunch beside the thunderous Sissu Waterfall' },
          { time: '05:00 PM', activity: 'Scenic drive back with photo stops along Beas River' },
          { time: '08:00 PM', activity: 'Campfire barbecue with local Himachali Siddu bread tasting' }
        ]
      },
      {
        theme: 'Rohtang Pass Alpine Snow Panorama',
        title: 'Rohtang Pass at 13,058 ft & Mountain Passes',
        description: 'Pristine glaciers, snow panoramic points, and roaring mountain passes.',
        activities: [
          { time: '07:30 AM', activity: 'Early departure for Rohtang Pass (13,058 ft above sea level)' },
          { time: '10:30 AM', activity: 'Snow scooter rides & spectacular Pir Panjal glacier views' },
          { time: '01:30 PM', activity: 'Hot Maggi noodles and thermos tea on the alpine ridge' },
          { time: '03:30 PM', activity: 'Photo stop at Rahala Waterfalls cascading down steep cliffs' },
          { time: '07:30 PM', activity: 'Cozy fireside dinner at mountain boutique lodge' }
        ]
      }
    ]
  },
  ladakh: {
    keywords: ['ladakh', 'leh', 'nubra', 'pangong', 'khardung la'],
    days: [
      {
        theme: 'Acclimatization & Shanti Stupa Golden Hour',
        title: 'Arrival in Leh & Ancient Royal Palace',
        description: 'Gentle acclimatization, prayer wheels, and sunset over Indus Valley.',
        activities: [
          { time: '09:00 AM', activity: 'Acclimatization rest with warm butter tea & apricot kernel cookies' },
          { time: '11:30 AM', activity: 'Gentle walk through Leh Main Bazaar & Tibetan handicraft stalls' },
          { time: '01:30 PM', activity: 'Traditional Ladakhi lunch featuring Tingmo steamed buns & stew' },
          { time: '04:00 PM', activity: 'Visit the 17th-century Leh Royal Palace overlooking the town' },
          { time: '06:30 PM', activity: 'Sunset panoramic view from the whitewashed Shanti Stupa' },
          { time: '08:30 PM', activity: 'Dinner at garden cafe with starry Himalayan views' }
        ]
      },
      {
        theme: 'Ancient Monasteries & Shey Palace',
        title: 'Thiksey Morning Chants & Indus Valley',
        description: 'Monastery morning prayers, Maitreya Buddha statue, and royal palaces.',
        activities: [
          { time: '07:00 AM', activity: 'Early morning monastic prayer chanting ceremony at Thiksey Monastery' },
          { time: '09:30 AM', activity: 'Breakfast with monks in monastery courtyard' },
          { time: '11:00 AM', activity: 'Admire the 2-storey gilded statue of Maitreya Buddha' },
          { time: '01:30 PM', activity: 'Lunch at Shey riverside cafe with views of snow-dusted peaks' },
          { time: '03:30 PM', activity: 'Explore Hemis Monastery & museum displaying ancient Buddhist thangkas' },
          { time: '07:30 PM', activity: 'Traditional woodfire dining in Leh' }
        ]
      },
      {
        theme: 'Khardung La Pass & Nubra Valley Dunes',
        title: 'Highest Motorable Pass & Hunder Dunes',
        description: 'Crossing 17,982 ft Khardung La pass into the desert valley of Nubra.',
        activities: [
          { time: '07:30 AM', activity: 'Scenic mountain climb to Khardung La Pass (17,982 ft)' },
          { time: '10:30 AM', activity: 'Photo stop at top of the pass with colorful Buddhist prayer flags' },
          { time: '01:30 PM', activity: 'Descent into Nubra Valley & lunch at Diskit' },
          { time: '03:30 PM', activity: 'Visit the monumental 106-ft Maitreya Buddha statue at Diskit Monastery' },
          { time: '05:30 PM', activity: 'Double-humped Bactrian camel ride across Hunder white sand dunes' },
          { time: '08:00 PM', activity: 'Camp dinner under the Milky Way in Nubra Valley' }
        ]
      }
    ]
  },
  bali: {
    keywords: ['bali', 'ubud', 'uluwatu', 'seminyak', 'canggu', 'kuta', 'nusa penida'],
    days: [
      {
        theme: 'Sacred Ubud Rainforest & Rice Terraces',
        title: 'Ubud Rainforest & Tegalalang Terraces',
        description: 'Lush emerald tiered terraces, temple purification rites, and riverside dining.',
        activities: [
          { time: '08:30 AM', activity: 'Balinese tropical fruit platter and organic Ubud coffee breakfast' },
          { time: '10:00 AM', activity: 'Walkthrough of Tegalalang emerald tiered rice terraces and jungle swing' },
          { time: '01:00 PM', activity: 'Traditional Crispy Duck (Bebek Betutu) lunch overlooking rice fields' },
          { time: '03:30 PM', activity: 'Spiritual water purification ritual at sacred Tirta Empul Temple' },
          { time: '06:00 PM', activity: 'Ubud Monkey Forest sanctuary walk through moss-covered temples' },
          { time: '08:00 PM', activity: 'Candlelit dining beside the rushing Ayung River' }
        ]
      },
      {
        theme: 'Uluwatu Cliffs & Kecak Fire Dance',
        title: 'Uluwatu Clifftop Ocean Sanctuary',
        description: 'Towering limestone cliffs, Indian Ocean surf, and the hypnotic Kecak dance at sunset.',
        activities: [
          { time: '09:00 AM', activity: 'Acai bowl and iced latte in Canggu cafe' },
          { time: '11:00 AM', activity: 'Scenic coastal drive south to the Bukit Peninsula' },
          { time: '01:30 PM', activity: 'Seafood lunch at Padang Padang beach cove' },
          { time: '04:30 PM', activity: 'Walk along the 70-meter cliff edge of Uluwatu Temple' },
          { time: '06:15 PM', activity: 'Sunset Kecak fire dance performance amphitheater overlooking breaking waves' },
          { time: '08:30 PM', activity: 'Candlelit grilled seafood barbecue on the sands of Jimbaran Bay' }
        ]
      }
    ]
  },
  paris: {
    keywords: ['paris', 'france', 'eiffel', 'louvre'],
    days: [
      {
        theme: 'Historic Paris & Iconic Monuments',
        title: 'Eiffel Tower & Seine River Cruise',
        description: 'Gothic cathedrals, wrought-iron towers, and sunset river cruises.',
        activities: [
          { time: '08:30 AM', activity: 'Freshly baked buttery croissant, cafe au lait, and fresh orange juice' },
          { time: '10:00 AM', activity: 'Ascent to the summit of the Eiffel Tower for panoramic 360° city views' },
          { time: '01:00 PM', activity: 'Classic French bistro lunch (Croque Monsieur & quiche) in Saint-Germain' },
          { time: '03:30 PM', activity: 'Walk across Pont Neuf to admire Notre-Dame Cathedral facade' },
          { time: '06:30 PM', activity: 'Sunset Seine River boat cruise past illuminated bridges' },
          { time: '08:30 PM', activity: 'Dinner at traditional Parisian brasserie with French onion soup & wine' }
        ]
      },
      {
        theme: 'World-Class Art & Montmartre Charm',
        title: 'Louvre Treasures & Montmartre Hill',
        description: 'Masterpiece paintings, cobblestone artists quarters, and panoramic hilltop basilicas.',
        activities: [
          { time: '09:00 AM', activity: 'Pain au chocolat breakfast at Palais-Royal courtyard cafe' },
          { time: '10:30 AM', activity: 'Guided tour of the Louvre Museum: Mona Lisa, Winged Victory & Venus' },
          { time: '01:30 PM', activity: 'Gourmet lunch at Tuileries Garden pavilion cafe' },
          { time: '04:00 PM', activity: 'Funicular ride up to Montmartre & Sacré-Cœur Basilica' },
          { time: '06:30 PM', activity: 'Place du Tertre open-air portrait artists and cobbled alleyways' },
          { time: '08:30 PM', activity: 'Candlelit dinner in Montmartre with live French accordion music' }
        ]
      }
    ]
  },
  tokyo: {
    keywords: ['tokyo', 'japan', 'kyoto', 'shibuya', 'shinjuku'],
    days: [
      {
        theme: 'Modern Metropolis & Neon Crossings',
        title: 'Shibuya Crossing & Meiji Shrine Serenity',
        description: 'Vibrant neon hubs, peaceful evergreen shrines, and Harajuku youth culture.',
        activities: [
          { time: '08:30 AM', activity: 'Traditional Japanese breakfast: tamagoyaki, miso soup & salmon' },
          { time: '10:00 AM', activity: 'Walk through cedar forest torii gate into sacred Meiji Jingu Shrine' },
          { time: '12:30 PM', activity: 'Harajuku Takeshita Street crepes & innovative fashion boutiques' },
          { time: '03:00 PM', activity: 'Witness the iconic Shibuya Scramble Crossing from rooftop observation deck' },
          { time: '06:00 PM', activity: 'Shinjuku golden hour skyline from Tokyo Metropolitan Government Building' },
          { time: '08:00 PM', activity: 'Authentic tonkotsu ramen and gyoza dinner in Omoide Yokocho alley' }
        ]
      },
      {
        theme: 'Old Edo Heritage & Tsukiji Food Walk',
        title: 'Asakusa Senso-ji & Fresh Sushi Tasting',
        description: 'Tokyo’s oldest Buddhist temple, Nakamise shopping street, and pristine sushi.',
        activities: [
          { time: '08:00 AM', activity: 'Tsukiji Outer Market morning street food walk (tamago on stick & sashimi)' },
          { time: '10:30 AM', activity: 'Visit 7th-century Senso-ji Temple and massive Kaminarimon lantern in Asakusa' },
          { time: '01:00 PM', activity: 'Crispy tempura lunch at centuries-old Asakusa restaurant' },
          { time: '03:30 PM', activity: 'Sumida River cruise to futuristic Odaiba waterfront' },
          { time: '06:30 PM', activity: 'Tokyo Skytree 450m observation deck views at twilight' },
          { time: '08:30 PM', activity: 'Chef’s Omakase sushi dining experience in Ginza' }
        ]
      }
    ]
  },
  newyork: {
    keywords: ['new york', 'nyc', 'manhattan', 'broadway', 'brooklyn'],
    days: [
      {
        theme: 'Central Park, The Met & Broadway Night',
        title: 'Central Park Walk, The Met Art & Broadway Theatre',
        description: 'Classic Manhattan bagels, Central Park landmarks, world-class art at The Met, and live Broadway theatre.',
        activities: [
          { time: '08:30 AM', activity: 'Classic New York breakfast with toasted bagel, lox, and artisan roast coffee' },
          { time: '10:30 AM', activity: 'Stroll through Central Park (Bethesda Terrace & Bow Bridge) toward Fifth Avenue' },
          { time: '01:00 PM', activity: 'Pastrami on rye lunch at a legendary Manhattan deli' },
          { time: '03:30 PM', activity: 'Guided highlights tour of The Metropolitan Museum of Art (The Met)' },
          { time: '06:30 PM', activity: 'Golden hour skyline views from Top of the Rock or Summit One Vanderbilt' },
          { time: '08:30 PM', activity: 'Live evening Broadway musical in the Theatre District followed by late dinner' }
        ]
      },
      {
        theme: 'High Line, Chelsea Market & Downtown Manhattan',
        title: 'High Line Walk & One World Observatory',
        description: 'Elevated railway park, artisanal food halls, and harbor views.',
        activities: [
          { time: '09:00 AM', activity: 'Morning coffee and fresh babka in Greenwich Village' },
          { time: '10:30 AM', activity: 'High Line elevated park stroll overlooking Meatpacking District architecture' },
          { time: '01:00 PM', activity: 'Artisanal lobster roll & street food lunch inside Chelsea Market' },
          { time: '03:30 PM', activity: '9/11 Memorial reflection & One World Observatory skydeck view' },
          { time: '06:30 PM', activity: 'Sunset ferry cruise past Statue of Liberty and Brooklyn Bridge' },
          { time: '08:30 PM', activity: 'Candlelit dinner in trendy SoHo or West Village Italian bistro' }
        ]
      }
    ]
  },
  rome: {
    keywords: ['rome', 'roma', 'italy', 'vatican', 'colosseum', 'trastevere'],
    days: [
      {
        theme: 'Colosseum, Roman Forum & Trastevere',
        title: 'Colosseum Arena, Ancient Forum & Trastevere',
        description: 'Ancient gladiator arenas, monumental arches, authentic pasta, and lively trattorias.',
        activities: [
          { time: '08:30 AM', activity: 'Italian espresso and warm cornetto at traditional Rome coffee bar' },
          { time: '10:00 AM', activity: 'VIP entrance to the Colosseum arena floor and Roman Forum ancient ruins' },
          { time: '01:00 PM', activity: 'Classic Roman lunch (Cacio e Pepe & Carbonara) at authentic family trattoria' },
          { time: '03:30 PM', activity: 'Walk past Piazza Venezia to the Pantheon and toss a coin into Trevi Fountain' },
          { time: '06:30 PM', activity: 'Artisanal gelato tasting at Piazza Navona watching street artists' },
          { time: '08:30 PM', activity: 'Evening stroll through cobblestone alleyways of Trastevere & candlelit dinner' }
        ]
      },
      {
        theme: 'Vatican City & St. Peter\'s Dome',
        title: 'Vatican Museums, Sistine Chapel & St. Peter\'s',
        description: 'Michelangelo masterpieces, papal galleries, and sunset dome panoramas.',
        activities: [
          { time: '08:30 AM', activity: 'Morning cappuccino overlooking Borgo Pio' },
          { time: '09:30 AM', activity: 'Vatican Museums guided tour: Raphael Rooms, Gallery of Maps & Sistine Chapel' },
          { time: '01:00 PM', activity: 'Crispy Roman pizza al taglio and suppli lunch' },
          { time: '03:00 PM', activity: 'Marvel at St. Peter\'s Basilica and climb the dome for panoramic Rome views' },
          { time: '06:00 PM', activity: 'Castel Sant\'Angelo sunset walk along the Tiber River' },
          { time: '08:30 PM', activity: 'Rooftop terrace dining with views of illuminated St. Peter\'s Basilica' }
        ]
      }
    ]
  },
  swiss: {
    keywords: ['swiss', 'switzerland', 'alps', 'zermatt', 'interlaken', 'zurich', 'lucerne'],
    days: [
      {
        theme: 'Matterhorn Panorama & Zermatt Alpine Wonder',
        title: 'Gornergrat Railway, Matterhorn & Fondue',
        description: 'High-altitude cogwheel trains, majestic Matterhorn views, and alpine cheese fondue.',
        activities: [
          { time: '08:30 AM', activity: 'Swiss muesli, alpine mountain cheese, and warm hot chocolate breakfast' },
          { time: '10:00 AM', activity: 'Gornergrat cogwheel railway ascent for postcard views of the Matterhorn' },
          { time: '01:00 PM', activity: 'Traditional Swiss cheese fondue lunch on panoramic mountain terrace' },
          { time: '03:30 PM', activity: 'Glacier Paradise cable car into the world\'s highest ice palace' },
          { time: '06:30 PM', activity: 'Twilight walk through car-free Zermatt village and chalet streets' },
          { time: '08:30 PM', activity: 'Fireside dinner featuring Swiss raclette and local Valais wine' }
        ]
      },
      {
        theme: 'Interlaken Lakes & Lauterbrunnen Waterfalls',
        title: 'Lauterbrunnen Valley of Waterfalls & Lake Brienz',
        description: 'Cascading cliff waterfalls, traditional chalet hamlets, and turquoise glacial lakes.',
        activities: [
          { time: '08:30 AM', activity: 'Lakeside breakfast with fresh alpine pastries in Interlaken' },
          { time: '10:00 AM', activity: 'Scenic train ride through the 72-waterfall valley of Lauterbrunnen' },
          { time: '01:00 PM', activity: 'Hearty alpine rosti lunch at mountain inn beside Staubbach Falls' },
          { time: '03:30 PM', activity: 'Cable car up to Mürren cliffside village with Eiger, Mönch & Jungfrau views' },
          { time: '06:30 PM', activity: 'Sunset cruise on turquoise Lake Brienz surrounded by towering peaks' },
          { time: '08:30 PM', activity: 'Timber chalet candlelit dinner with Swiss artisan chocolate dessert' }
        ]
      }
    ]
  },
  london: {
    keywords: ['london', 'uk', 'england', 'westminster', 'thames'],
    days: [
      {
        theme: 'Westminster, Royal Palaces & West End Theatre',
        title: 'Big Ben, Buckingham Palace & West End Musical',
        description: 'Royal landmarks, changing of the guard, river views, and premier West End theatre.',
        activities: [
          { time: '08:30 AM', activity: 'Full English breakfast with artisan sourdough toast & English breakfast tea' },
          { time: '10:00 AM', activity: 'Westminster Abbey visit and photo stop at Big Ben & Houses of Parliament' },
          { time: '12:30 PM', activity: 'Buckingham Palace changing of the guard ceremony & St. James\'s Park walk' },
          { time: '02:00 PM', activity: 'Traditional crispy fish & chips lunch at historic riverside pub' },
          { time: '04:00 PM', activity: 'British Museum highlights tour: Rosetta Stone & Egyptian Sculpture Gallery' },
          { time: '07:30 PM', activity: 'Evening live musical performance in London\'s world-famous West End' },
          { time: '10:00 PM', activity: 'Late-night dinner & craft cocktail in vibrant Covent Garden or Soho' }
        ]
      }
    ]
  },
  iceland: {
    keywords: ['iceland', 'reykjavik', 'aurora', 'golden circle', 'geysir'],
    days: [
      {
        theme: 'Golden Circle Wonders & Aurora Borealis Hunt',
        title: 'Geysir Eruptions, Gullfoss & Northern Lights Safari',
        description: 'Tectonic rift valleys, erupting geysers, geothermal mineral lagoons, and dancing aurora.',
        activities: [
          { time: '08:30 AM', activity: 'Icelandic rye bread with smoked salmon and strong Nordic filter coffee' },
          { time: '10:00 AM', activity: 'Thingvellir National Park: walk between Eurasian & North American tectonic plates' },
          { time: '01:00 PM', activity: 'Geothermal greenhouse tomato soup & fresh artisan bread at Friðheimar' },
          { time: '03:00 PM', activity: 'Watch Strokkur geysir erupt & marvel at roaring Gullfoss two-tier waterfall' },
          { time: '06:00 PM', activity: 'Relaxing soak in mineral-rich geothermal waters at Blue Lagoon or Sky Lagoon' },
          { time: '09:00 PM', activity: 'Northern Lights (Aurora Borealis) night expedition into dark wilderness' }
        ]
      }
    ]
  },
  singapore: {
    keywords: ['singapore', 'marina bay', 'sentosa', 'changi'],
    days: [
      {
        theme: 'Marina Bay Sands & Supertree Grove',
        title: 'Gardens by the Bay & Lau Pa Sat Satay Street',
        description: 'Futuristic vertical gardens, skyline observatories, and world-famous hawker feasts.',
        activities: [
          { time: '08:30 AM', activity: 'Traditional Kaya toast with soft-boiled eggs and hot Nanyang Kopi' },
          { time: '10:00 AM', activity: 'Gardens by the Bay: Flower Dome, Cloud Forest waterfall mountain & Skyway' },
          { time: '01:00 PM', activity: 'Hawker center feast (Hainanese chicken rice & laksa) at Maxwell Market' },
          { time: '03:30 PM', activity: 'Marina Bay Sands SkyPark observation deck for 360° harbor and strait views' },
          { time: '06:30 PM', activity: 'Supertree Grove golden hour & Garden Rhapsody light and sound show' },
          { time: '08:30 PM', activity: 'Satay Street at Lau Pa Sat: charcoal-grilled chicken & beef skewers with peanut sauce' }
        ]
      }
    ]
  },
  maldives: {
    keywords: ['maldives', 'male', 'overwater', 'atoll', 'resort'],
    days: [
      {
        theme: 'Overwater Luxury & Coral Reef Safari',
        title: 'Reef Snorkeling, Sandbank Picnic & Sunset Dolphins',
        description: 'Turquoise lagoons, swimming with sea turtles, private sandbanks, and candlelit beach dinners.',
        activities: [
          { time: '08:30 AM', activity: 'Floating breakfast in private overwater villa infinity pool' },
          { time: '10:30 AM', activity: 'Guided reef snorkeling swimming with sea turtles and colorful reef fish' },
          { time: '01:00 PM', activity: 'Fresh grilled seafood catch lunch with chilled king coconut water' },
          { time: '03:30 PM', activity: 'Private sandbank excursion surrounded by pristine turquoise waters' },
          { time: '06:30 PM', activity: 'Sunset dolphin watching catamaran cruise with champagne toast' },
          { time: '08:30 PM', activity: 'Candlelit beach barbecue under southern constellations with feet in the sand' }
        ]
      }
    ]
  }
};

/**
 * Finds a destination profile matching the given destination name or keywords
 */
function findDestinationProfile(destination: string): DestinationProfile | null {
  if (!destination) return null;
  const clean = destination.toLowerCase().trim();

  for (const key of Object.keys(DESTINATION_PROFILES)) {
    const profile = DESTINATION_PROFILES[key];
    if (profile.keywords.some(kw => clean.includes(kw) || kw.includes(clean))) {
      return profile;
    }
  }
  return null;
}

/**
 * Generates an authentic, contextual, day-by-day itinerary with realistic timings
 * specifically for the user's destination, days count, and start date.
 */
export function generateItineraryForDestination(
  destination: string,
  daysCount: number = 5,
  startDateStr?: string
): TripDayItinerary[] {
  const count = Math.max(1, Math.min(daysCount, 30));
  const cleanDest = (destination || 'Kashmir Valley').trim();
  const profile = findDestinationProfile(cleanDest);

  const baseDate = startDateStr ? new Date(startDateStr) : new Date();

  const result: TripDayItinerary[] = [];

  for (let i = 0; i < count; i++) {
    const dayNum = i + 1;
    const dayDate = new Date(baseDate);
    dayDate.setDate(dayDate.getDate() + i);
    const dateStr = dayDate.toISOString().split('T')[0];

    if (profile && profile.days.length > 0) {
      // Use profile template, cycling smoothly if daysCount exceeds profile length
      const templateDay = profile.days[i % profile.days.length];
      const acts: TripTimeSlotActivity[] = templateDay.activities.map((act, actIdx) => ({
        id: `slot-${dayNum}-${actIdx + 1}-${Date.now().toString(36)}`,
        time: act.time,
        activity: act.activity
      }));

      result.push({
        day: dayNum,
        date: dateStr,
        theme: templateDay.theme,
        title: templateDay.title,
        description: acts.map(a => `${a.time} - ${a.activity}`).join('\n'),
        activities: acts
      });
    } else {
      // Procedural generator tailored specifically to the user's destination
      const proceduralDays = generateProceduralDay(cleanDest, dayNum, count);
      const acts: TripTimeSlotActivity[] = proceduralDays.activities.map((act, actIdx) => ({
        id: `slot-${dayNum}-${actIdx + 1}-${Date.now().toString(36)}`,
        time: act.time,
        activity: act.activity
      }));

      result.push({
        day: dayNum,
        date: dateStr,
        theme: proceduralDays.theme,
        title: proceduralDays.title,
        description: acts.map(a => `${a.time} - ${a.activity}`).join('\n'),
        activities: acts
      });
    }
  }

  return result;
}

/**
 * Fallback procedural day generator that produces destination-specific activities and realistic timings
 */
function generateProceduralDay(
  destination: string,
  dayNum: number,
  totalDays: number
): { theme: string; title: string; activities: Array<{ time: string; activity: string }> } {
  const isFirstDay = dayNum === 1;
  const isLastDay = dayNum === totalDays && totalDays > 1;

  if (isFirstDay) {
    return {
      theme: `${destination} Arrival & Historic Town Center`,
      title: `Arrival in ${destination} & Scenic Orientation`,
      activities: [
        { time: '08:30 AM', activity: `Arrival in ${destination}, hotel check-in & welcome local refreshments` },
        { time: '10:30 AM', activity: `Walking orientation around ${destination} central historic square & landmarks` },
        { time: '01:30 PM', activity: `Lunch at authentic regional bistro sampling local specialties` },
        { time: '04:00 PM', activity: `Afternoon visit to the primary cultural museum & architectural viewpoints` },
        { time: '06:30 PM', activity: `Sunset stroll along ${destination} scenic promenade` },
        { time: '08:30 PM', activity: `Welcome dinner featuring signature cuisine of ${destination}` }
      ]
    };
  }

  if (isLastDay) {
    return {
      theme: `${destination} Leisure, Souvenirs & Farewell`,
      title: `Leisure Morning & Farewell to ${destination}`,
      activities: [
        { time: '09:00 AM', activity: `Relaxing terrace breakfast with fresh fruit, local pastries & artisan coffee` },
        { time: '11:00 AM', activity: `Artisan handicraft & regional food souvenir shopping at local market` },
        { time: '01:30 PM', activity: `Farewell gourmet lunch overlooking the scenic panoramas of ${destination}` },
        { time: '04:30 PM', activity: `Last scenic photo walk at iconic panorama point` },
        { time: '06:30 PM', activity: `Departure transfer with cherished memories of ${destination}` }
      ]
    };
  }

  // Intermediate Days
  const cycleIndex = (dayNum - 2) % 4;
  switch (cycleIndex) {
    case 0:
      return {
        theme: `Natural Landscapes & Scenic Wonders`,
        title: `Exploring Nature & Scenic Trails in ${destination}`,
        activities: [
          { time: '08:00 AM', activity: `Energizing morning breakfast before departure for outdoor excursion` },
          { time: '09:30 AM', activity: `Guided trek through ${destination} nature sanctuary & scenic viewpoints` },
          { time: '01:00 PM', activity: `Alpine or riverside picnic lunch surrounded by pristine nature` },
          { time: '03:30 PM', activity: `Boat tour or outdoor adventure activity native to ${destination}` },
          { time: '06:30 PM', activity: 'Golden hour photography at panoramic mountain or coastal ridge' },
          { time: '08:30 PM', activity: `Cozy fireside dinner with hearty regional dishes` }
        ]
      };
    case 1:
      return {
        theme: `Culinary Discovery & Local Bazaars`,
        title: `Gastronomic Food Walk & Artisan Workshops`,
        activities: [
          { time: '08:30 AM', activity: `Breakfast at a beloved neighborhood cafe known for traditional bakery items` },
          { time: '10:00 AM', activity: `Guided culinary market tour: tasting fresh spices, fruits, and cheeses` },
          { time: '01:30 PM', activity: `Farm-to-table lunch at a historic estate in ${destination}` },
          { time: '04:00 PM', activity: `Hands-on artisan workshop (pottery, weaving, or cooking masterclass)` },
          { time: '07:00 PM', activity: `Sunset rooftop cocktails with panoramic views of ${destination}` },
          { time: '08:30 PM', activity: `Multi-course tasting dinner at renowned chef\'s table` }
        ]
      };
    case 2:
      return {
        theme: `Ancient Heritage, Forts & Architecture`,
        title: `Deep Heritage Dive & Ancient Monuments`,
        activities: [
          { time: '08:30 AM', activity: `Traditional breakfast with local herbal tea or artisan roast` },
          { time: '10:00 AM', activity: `In-depth guided tour of centuries-old fortress, temple, or royal palace` },
          { time: '01:00 PM', activity: `Courtyard lunch at heritage boutique property` },
          { time: '03:30 PM', activity: `Secret alleyways & hidden architectural marvels walk with local historian` },
          { time: '06:30 PM', activity: `Traditional live folk music or cultural performing arts show` },
          { time: '08:30 PM', activity: `Candlelit dinner in a restored historic courtyard` }
        ]
      };
    default:
      return {
        theme: `Hidden Gems & Local Living`,
        title: `Off-the-Beaten-Path Exploration in ${destination}`,
        activities: [
          { time: '09:00 AM', activity: `Slow breakfast watching the morning rhythm of ${destination}` },
          { time: '10:30 AM', activity: `Visit to quiet local neighborhood, botanical garden, or hidden cove` },
          { time: '01:30 PM', activity: `Lunch at a family-run tavern beloved by locals` },
          { time: '04:00 PM', activity: `Scenic bicycle or walking excursion along countryside lanes` },
          { time: '07:00 PM', activity: `Sunset viewpoint drink at elevated cliffside or terrace` },
          { time: '08:30 PM', activity: `Celebratory dinner enjoying the evening atmosphere of ${destination}` }
        ]
      };
  }
}

/**
 * Normalizes day activities: if day has activities with time slots, keeps them.
 * If activities are missing or empty, generates authentic activities tailored
 * to the trip's destination and day index.
 */
export function normalizeDayActivities(
  dayPlan: TripDayItinerary,
  dayIdx: number = 0,
  destination: string = 'Kashmir Valley',
  tripTitle?: string
): { theme: string; activities: TripTimeSlotActivity[] } {
  // If activities array already exists and has slots, respect it!
  if (dayPlan.activities && Array.isArray(dayPlan.activities) && dayPlan.activities.length > 0) {
    const validActivities = dayPlan.activities.filter(a => a.activity && a.activity.trim().length > 0);
    if (validActivities.length > 0) {
      return {
        theme: dayPlan.theme || dayPlan.title || `Day ${dayPlan.day || dayIdx + 1} Schedule`,
        activities: validActivities
      };
    }
  }

  // If description has lines formatted like "time - activity", parse them
  if (dayPlan.description) {
    const lines = dayPlan.description.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed: TripTimeSlotActivity[] = [];
    for (const line of lines) {
      const match = line.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[-–:]\s*(.+)$/i);
      if (match) {
        parsed.push({
          id: `slot-parsed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          time: match[1].trim(),
          activity: match[2].trim()
        });
      }
    }
    if (parsed.length > 0) {
      return {
        theme: dayPlan.theme || dayPlan.title || `Day ${dayPlan.day || dayIdx + 1}`,
        activities: parsed
      };
    }
  }

  // If tripTitle is provided, generate activities driven by the title
  if (tripTitle && tripTitle.trim().length > 0) {
    const generatedFromTitle = generateItineraryFromTitle(tripTitle, destination, (dayPlan.day || dayIdx + 1));
    const targetDay = generatedFromTitle.itinerary[dayIdx] || generatedFromTitle.itinerary[0];
    if (targetDay) {
      return {
        theme: dayPlan.theme || targetDay.theme,
        activities: targetDay.activities || []
      };
    }
  }

  // Generate tailored activities for this day based on the trip's destination
  const generated = generateItineraryForDestination(destination, (dayPlan.day || dayIdx + 1));
  const targetDay = generated[dayIdx] || generated[0];

  return {
    theme: dayPlan.theme || targetDay.theme,
    activities: targetDay.activities || []
  };
}

/**
 * Detects destination and theme/vibe from user-entered trip title.
 */
export function detectDestinationAndThemeFromTitle(
  title: string,
  fallbackDest?: string
): { detectedDestination: string; detectedTheme: string; detectedVibe: string } {
  const cleanTitle = (title || '').toLowerCase().trim();

  let detectedDestination = (fallbackDest || '').trim();

  const DESTINATION_MAP: Array<{ keywords: string[]; name: string }> = [
    { keywords: ['kashmir', 'srinagar', 'gulmarg', 'pahalgam', 'dal lake', 'sonamarg'], name: 'Kashmir Valley' },
    { keywords: ['goa', 'baga', 'calangute', 'anjuna', 'panaji', 'candolim', 'vagator', 'palolem'], name: 'Goa' },
    { keywords: ['jaipur', 'rajasthan', 'udaipur', 'jodhpur', 'jaisalmer', 'amber fort', 'pink city'], name: 'Jaipur' },
    { keywords: ['kerala', 'alleppey', 'munnar', 'kochi', 'cochin', 'wayanad', 'kovalam'], name: 'Kerala' },
    { keywords: ['dubai', 'uae', 'abu dhabi', 'burj khalifa', 'emirates'], name: 'Dubai' },
    { keywords: ['manali', 'solang', 'rohtang', 'shimla', 'himachal', 'spiti', 'dharamshala', 'kasol'], name: 'Manali' },
    { keywords: ['ladakh', 'leh', 'nubra', 'pangong', 'khardung'], name: 'Ladakh' },
    { keywords: ['bali', 'ubud', 'uluwatu', 'canggu', 'seminyak', 'kuta', 'nusa penida'], name: 'Bali' },
    { keywords: ['paris', 'france', 'eiffel', 'louvre', 'montmartre', 'seine'], name: 'Paris' },
    { keywords: ['tokyo', 'kyoto', 'osaka', 'japan', 'shibuya', 'akihabara', 'shinjuku', 'asakusa'], name: 'Tokyo' },
    { keywords: ['new york', 'nyc', 'manhattan', 'broadway', 'brooklyn', 'central park'], name: 'New York City' },
    { keywords: ['rome', 'roma', 'italy', 'vatican', 'colosseum', 'trastevere'], name: 'Rome' },
    { keywords: ['swiss', 'switzerland', 'alps', 'zermatt', 'interlaken', 'zurich', 'lucerne'], name: 'Swiss Alps' },
    { keywords: ['london', 'uk', 'england', 'westminster', 'thames', 'big ben'], name: 'London' },
    { keywords: ['iceland', 'reykjavik', 'aurora', 'golden circle', 'geysir'], name: 'Iceland' },
    { keywords: ['singapore', 'marina bay', 'sentosa', 'changi'], name: 'Singapore' },
    { keywords: ['maldives', 'male atoll', 'overwater'], name: 'Maldives' },
    { keywords: ['santorini', 'greece', 'athens', 'mykonos'], name: 'Santorini, Greece' },
    { keywords: ['bangkok', 'phuket', 'krabi', 'thailand', 'chiang mai'], name: 'Phuket, Thailand' },
    { keywords: ['barcelona', 'spain', 'madrid', 'sagrada'], name: 'Barcelona, Spain' },
    { keywords: ['amsterdam', 'netherlands', 'canals'], name: 'Amsterdam' },
    { keywords: ['hawaii', 'maui', 'honolulu', 'oahu', 'waikiki'], name: 'Hawaii' },
    { keywords: ['sydney', 'australia', 'melbourne', 'opera house'], name: 'Sydney, Australia' },
    { keywords: ['agra', 'taj mahal'], name: 'Agra' },
    { keywords: ['varanasi', 'kashi', 'ganges', 'ghats'], name: 'Varanasi' },
    { keywords: ['rishikesh', 'haridwar', 'ganga rafting'], name: 'Rishikesh' },
    { keywords: ['amritsar', 'golden temple'], name: 'Amritsar' },
    { keywords: ['andaman', 'havelock', 'radhanagar', 'neil island'], name: 'Andaman Islands' },
    { keywords: ['ooty', 'coorg', 'kodaikanal', 'nilgiris'], name: 'Ooty & Nilgiris' }
  ];

  for (const entry of DESTINATION_MAP) {
    if (entry.keywords.some(kw => cleanTitle.includes(kw))) {
      detectedDestination = entry.name;
      break;
    }
  }

  if (!detectedDestination) {
    detectedDestination = fallbackDest || 'Kashmir Valley';
  }

  let detectedTheme = 'Exploration & Discovery';
  let detectedVibe = 'general';

  if (cleanTitle.includes('anime') || cleanTitle.includes('manga') || cleanTitle.includes('gaming') || cleanTitle.includes('akihabara') || cleanTitle.includes('ghibli') || cleanTitle.includes('pokemon')) {
    detectedTheme = 'Anime Arcades, Retro Gaming & Pop Culture';
    detectedVibe = 'anime';
  } else if (cleanTitle.includes('food') || cleanTitle.includes('culinary') || cleanTitle.includes('ramen') || cleanTitle.includes('wine') || cleanTitle.includes('tasting') || cleanTitle.includes('sushi') || cleanTitle.includes('gastronomy') || cleanTitle.includes('bistro') || cleanTitle.includes('street food')) {
    detectedTheme = 'Culinary Market Walk & Artisan Tastings';
    detectedVibe = 'food';
  } else if (cleanTitle.includes('romantic') || cleanTitle.includes('honeymoon') || cleanTitle.includes('couple') || cleanTitle.includes('anniversary') || cleanTitle.includes('candlelit') || cleanTitle.includes('love')) {
    detectedTheme = 'Romantic Escapade, Sunset Vistas & Candlelit Dining';
    detectedVibe = 'romantic';
  } else if (cleanTitle.includes('beach') || cleanTitle.includes('party') || cleanTitle.includes('watersports') || cleanTitle.includes('scuba') || cleanTitle.includes('diving') || cleanTitle.includes('surf') || cleanTitle.includes('coastal') || cleanTitle.includes('shack') || cleanTitle.includes('snorkeling')) {
    detectedTheme = 'Coastal Beachfront, Watersports & Sunset Shacks';
    detectedVibe = 'beach';
  } else if (cleanTitle.includes('snow') || cleanTitle.includes('ski') || cleanTitle.includes('skiing') || cleanTitle.includes('glacier') || cleanTitle.includes('winter') || cleanTitle.includes('snowboard')) {
    detectedTheme = 'High Alpine Snow Slopes & Glacier Excursion';
    detectedVibe = 'snow';
  } else if (cleanTitle.includes('trek') || cleanTitle.includes('hiking') || cleanTitle.includes('hike') || cleanTitle.includes('camp') || cleanTitle.includes('camping') || cleanTitle.includes('rafting') || cleanTitle.includes('adventure') || cleanTitle.includes('expedition')) {
    detectedTheme = 'Mountain Trailhead, Wilderness Trek & Campfire';
    detectedVibe = 'adventure';
  } else if (cleanTitle.includes('heritage') || cleanTitle.includes('history') || cleanTitle.includes('historic') || cleanTitle.includes('palace') || cleanTitle.includes('fort') || cleanTitle.includes('temple') || cleanTitle.includes('museum') || cleanTitle.includes('ancient') || cleanTitle.includes('ruins')) {
    detectedTheme = 'Royal Fortresses, Palaces & Ancient Heritage';
    detectedVibe = 'heritage';
  } else if (cleanTitle.includes('safari') || cleanTitle.includes('wildlife') || cleanTitle.includes('desert') || cleanTitle.includes('dune') || cleanTitle.includes('jungle')) {
    detectedTheme = 'Golden Desert Dunes, 4x4 Safari & Bedouin Camp';
    detectedVibe = 'safari';
  } else if (cleanTitle.includes('luxury') || cleanTitle.includes('shopping') || cleanTitle.includes('mall') || cleanTitle.includes('skyline') || cleanTitle.includes('broadway')) {
    detectedTheme = 'Metropolis Skyline, Designer Shopping & Entertainment';
    detectedVibe = 'luxury';
  } else if (cleanTitle.includes('yoga') || cleanTitle.includes('wellness') || cleanTitle.includes('spa') || cleanTitle.includes('retreat') || cleanTitle.includes('meditation')) {
    detectedTheme = 'Sunrise Yoga, Ayurvedic Spa & Mindful Living';
    detectedVibe = 'wellness';
  }

  return { detectedDestination, detectedTheme, detectedVibe };
}

/**
 * Builds an authentic, accurate Day 1 schedule with exact chronological timings
 * reflecting the user's title and destination.
 */
function buildDayOneFromTitle(
  title: string,
  destination: string,
  vibe: string,
  dateStr: string
): TripDayItinerary {
  const cleanTitle = (title || '').toLowerCase();
  const destClean = destination.toLowerCase();

  let theme = `${destination} Arrival & Highlights`;
  let dayTitle = `Arrival in ${destination} & Highlights`;
  let activities: Array<{ time: string; activity: string }> = [];

  // 1. ANIME / GAMING THEME
  if (vibe === 'anime' || cleanTitle.includes('anime') || cleanTitle.includes('akihabara')) {
    theme = `Akihabara Anime Arcades & Legendary Ramen Quest`;
    dayTitle = `Akihabara Electric Town, Retro Arcades & Ramen Walk`;
    activities = [
      { time: '08:30 AM', activity: `Traditional morning breakfast & matcha latte near Akihabara Electric Town` },
      { time: '10:30 AM', activity: `Explore Akihabara Radio Kaikan, retro game shops, and multi-floor anime character specialty stores` },
      { time: '01:00 PM', activity: `Lunch at award-winning artisan Tonkotsu Ramen bar in Kanda / Akihabara` },
      { time: '03:30 PM', activity: `Interactive VR gaming center, Ghibli character alley & Mandarake collectibles exploration` },
      { time: '06:30 PM', activity: `Twilight neon photo walk through bustling Shibuya Scramble Crossing & MAGNET rooftop` },
      { time: '08:30 PM', activity: `Omoide Yokocho food alley izakaya hopping with charcoal yakitori & Japanese craft beer` }
    ];
  }
  // 2. FOOD / CULINARY / WINE / RAMEN THEME
  else if (vibe === 'food' || cleanTitle.includes('food') || cleanTitle.includes('culinary') || cleanTitle.includes('wine')) {
    theme = `Gastronomic Food Market Walk & Chef's Table Experience`;
    dayTitle = `Artisan Morning Market, Wine Tasting & Signature Chef Feast`;
    activities = [
      { time: '08:30 AM', activity: `Artisanal bakery breakfast: fresh warm croissants, regional pastries, and specialty espresso` },
      { time: '10:30 AM', activity: `Guided food market tasting tour: sampling local artisanal cheeses, cured delicacies & spices` },
      { time: '01:00 PM', activity: `Celebrated regional lunch at historic tavern or noodle master counter in ${destination}` },
      { time: '03:30 PM', activity: `Hands-on cooking masterclass or sommelier-guided wine & local spirits cellar tasting` },
      { time: '06:30 PM', activity: `Sunset aperitivo / cocktails on elevated panoramic terrace overlooking ${destination}` },
      { time: '08:30 PM', activity: `Multi-course gourmet tasting dinner showcasing seasonal culinary specialties of ${destination}` }
    ];
  }
  // 3. ROMANTIC / HONEYMOON THEME
  else if (vibe === 'romantic' || cleanTitle.includes('romantic') || cleanTitle.includes('honeymoon')) {
    theme = `Romantic Escapade, Scenic Cruise & Sunset Vistas`;
    dayTitle = `Boutique Arrival, Private Scenic Cruise & Candlelit Dinner`;
    activities = [
      { time: '09:00 AM', activity: `Champagne breakfast on private balcony with fresh fruit, artisan pastries and flower greeting` },
      { time: '10:30 AM', activity: `Scenic morning walk through historic old quarter hand-in-hand & boutique fragrance/art shops` },
      { time: '01:00 PM', activity: `Charming courtyard lunch at romantic garden bistro in ${destination}` },
      { time: '03:30 PM', activity: `Couples relaxing spa ritual or private carriage/gondola/shikara ride along scenic waters` },
      { time: '06:30 PM', activity: `Golden hour sunset cruise with chilled sparkling wine overlooking illuminated landmarks` },
      { time: '08:30 PM', activity: `Intimate candlelit dinner at celebrated fine-dining restaurant with panoramic skyline views` }
    ];
  }
  // 4. BEACH / WATERSPORTS / PARTY THEME
  else if (vibe === 'beach' || cleanTitle.includes('beach') || cleanTitle.includes('watersports') || cleanTitle.includes('party')) {
    theme = `Coastal Beachfront, Watersports & Sunset Shacks`;
    dayTitle = `Jet Skiing, Parasailing & Sunset Beach Club Beats`;
    activities = [
      { time: '08:30 AM', activity: `Beachfront breakfast with fresh tropical fruits, warm local bread & tender coconut water` },
      { time: '10:30 AM', activity: `High-speed jet skiing, parasailing, and ocean water sports adventure along golden shoreline` },
      { time: '01:00 PM', activity: `Fresh catch seafood barbecue & regional curry thali at breezy beachfront shack` },
      { time: '03:30 PM', activity: `Coastal swimming, paddleboarding, and relaxed sunbathing under tropical palms` },
      { time: '06:30 PM', activity: `Sunset sundowner cocktails at cliffside lounge with live chillout DJ beats overlooking breaking waves` },
      { time: '08:30 PM', activity: `Beach shack barbecue dinner with live music, dancing, and bonfire under starry skies` }
    ];
  }
  // 5. SNOW / SKI / GLACIER THEME
  else if (vibe === 'snow' || cleanTitle.includes('snow') || cleanTitle.includes('ski')) {
    theme = `High Alpine Snow Slopes & Glacier Excursion`;
    dayTitle = `Cable Car Ascent to Snow Slopes & Fireside Chalet Dinner`;
    activities = [
      { time: '08:00 AM', activity: `Hearty alpine breakfast with warm hot chocolate, mountain bread, and local butter` },
      { time: '09:30 AM', activity: `Ski & snowboard gear fitting followed by cable car / gondola ascent to snow slopes` },
      { time: '12:30 PM', activity: `Fresh powder snow skiing, snowboarding, or thrilling snow scooter rides` },
      { time: '02:00 PM', activity: `Alpine mountain hut lunch: hot noodle soup, grilled sausages & warm mulled cider` },
      { time: '04:30 PM', activity: `Glacier ice cave walk and panoramic high-altitude mountain peak photo session` },
      { time: '08:00 PM', activity: `Cozy fireside timber lodge dinner with traditional cheese fondue or roasted mountain specialties` }
    ];
  }
  // 6. TREK / ADVENTURE / HIKING THEME
  else if (vibe === 'adventure' || cleanTitle.includes('trek') || cleanTitle.includes('hike') || cleanTitle.includes('camping')) {
    theme = `Mountain Trailhead, Wilderness Trek & Campfire`;
    dayTitle = `Alpine Trailhead Hike, Waterfalls & Riverside Camp`;
    activities = [
      { time: '07:30 AM', activity: `Energizing trail breakfast with eggs, fresh local honey, oatmeal & mountain roast coffee` },
      { time: '09:00 AM', activity: `Trailhead briefing & guided morning trek through fragrant pine forests and mountain ridges` },
      { time: '12:30 PM', activity: `Scenic picnic lunch beside roaring river rapids or cascading alpine waterfall` },
      { time: '02:30 PM', activity: `White-water rafting thrills or rock climbing & rappelling workshop with safety guide` },
      { time: '06:00 PM', activity: `Ascent to panoramic ridge for golden hour sunset photography over mountain valleys` },
      { time: '08:00 PM', activity: `Riverside campfire barbecue dinner with acoustic folk tunes under starry mountain skies` }
    ];
  }
  // 7. DESERT / SAFARI THEME
  else if (vibe === 'safari' || cleanTitle.includes('safari') || cleanTitle.includes('desert')) {
    theme = `Golden Desert Dunes, 4x4 Safari & Bedouin Camp`;
    dayTitle = `Thrilling 4x4 Dune Bashing, Camel Trek & Bedouin BBQ`;
    activities = [
      { time: '08:30 AM', activity: `Morning breakfast overlooking modern landmarks and Arabian morning horizon` },
      { time: '10:30 AM', activity: `Iconic city skyline observation deck visit or historic heritage souk exploration` },
      { time: '01:00 PM', activity: `Gourmet Arabian mezze lunch with fresh flatbreads and mint lemonade` },
      { time: '03:30 PM', activity: `4x4 Desert Safari departure: thrilling dune bashing across high red sand dunes` },
      { time: '06:00 PM', activity: `Sunset camel caravan ride, sandboarding, and falconry photo demonstration` },
      { time: '08:00 PM', activity: `Bedouin camp buffet BBQ feast with live Tanoura dance, fire show & stargazing` }
    ];
  }
  // 8. LUXURY / SKYLINES / SHOPPING / BROADWAY
  else if (vibe === 'luxury' || cleanTitle.includes('luxury') || cleanTitle.includes('shopping') || cleanTitle.includes('broadway')) {
    theme = `Metropolis Skyline, Designer Shopping & Broadway Show`;
    dayTitle = `Skyline Observatory, Designer Boulevard & Live Theatre`;
    activities = [
      { time: '08:30 AM', activity: `Artisan espresso and gourmet breakfast at trendy metropolitan terrace` },
      { time: '10:30 AM', activity: `Ascent to iconic observation skydeck for 360° panoramic city skyline views` },
      { time: '01:00 PM', activity: `High-end bistro lunch at celebrated shopping district in ${destination}` },
      { time: '03:30 PM', activity: `Curated shopping along luxury designer boulevards and historic flagship department stores` },
      { time: '06:30 PM', activity: `Sunset rooftop cocktails with panoramic city views as neon lights illuminate the streets` },
      { time: '08:30 PM', activity: `World-class theatre / Broadway musical performance followed by late-night dinner` }
    ];
  }
  // 9. YOGA / WELLNESS / RETREAT
  else if (vibe === 'wellness' || cleanTitle.includes('yoga') || cleanTitle.includes('wellness') || cleanTitle.includes('retreat')) {
    theme = `Sunrise Yoga, Ayurvedic Spa & Mindful Living`;
    dayTitle = `Pranayama Meditation, Herbal Spa & Organic Dining`;
    activities = [
      { time: '07:30 AM', activity: `Sunrise yoga and breathwork meditation session surrounded by tranquil nature` },
      { time: '09:00 AM', activity: `Organic smoothie bowl breakfast with fresh cold-pressed herbal elixirs` },
      { time: '10:30 AM', activity: `Mindful walking meditation through botanical forest sanctuary and sacred water springs` },
      { time: '01:00 PM', activity: `Nourishing farm-to-table vegetarian lunch featuring local organic produce` },
      { time: '03:30 PM', activity: `Traditional full-body Ayurvedic herbal oil massage and steam bath rejuvenation` },
      { time: '07:30 PM', activity: `Candlelit wholesome organic dinner followed by soothing Tibetan singing bowl sound healing` }
    ];
  }
  // 10. DESTINATION-SPECIFIC ACCURATE FALLBACK
  else {
    // Check specific known profiles
    if (destClean.includes('kashmir') || cleanTitle.includes('kashmir') || cleanTitle.includes('shikara')) {
      theme = `Dal Lake Shikara Cruise & Srinagar Mughal Pavilions`;
      dayTitle = `Arrival in Srinagar, Houseboat Check-in & Dal Lake Sunset`;
      activities = [
        { time: '08:30 AM', activity: `Traditional Kashmiri Kahwa & freshly baked Bakerkhani breakfast` },
        { time: '10:30 AM', activity: `Private Shikara cruise through Dal Lake lotus blooms, Char Chinar & floating market` },
        { time: '01:30 PM', activity: `Lunch along Boulevard Road overlooking the Zabarwan mountain range` },
        { time: '03:30 PM', activity: `Royal Mughal Gardens walking tour: Nishat Bagh & Shalimar Bagh water pavilions` },
        { time: '06:30 PM', activity: `Golden hour panoramic view from Shankaracharya Temple hilltop` },
        { time: '08:30 PM', activity: `Authentic 7-course Kashmiri Wazwan feast (Rogan Josh, Rista & Gushtaba)` }
      ];
    } else if (destClean.includes('paris') || cleanTitle.includes('paris') || cleanTitle.includes('eiffel')) {
      theme = `Eiffel Tower Summit & Romantic Seine River Cruise`;
      dayTitle = `Eiffel Tower Summit, Latin Quarter & Seine Sunset`;
      activities = [
        { time: '08:30 AM', activity: `Freshly baked buttery croissant, pain au chocolat & café au lait at sidewalk café` },
        { time: '10:00 AM', activity: `Ascent to the summit of the Eiffel Tower for panoramic 360° city views` },
        { time: '01:00 PM', activity: `Classic French bistro lunch (Croque Monsieur & quiche) in Saint-Germain-des-Prés` },
        { time: '03:30 PM', activity: `Walk across Pont Neuf to admire Notre-Dame Cathedral facade & Île de la Cité` },
        { time: '06:30 PM', activity: `Sunset Seine River boat cruise past illuminated historic bridges` },
        { time: '08:30 PM', activity: `Dinner at traditional Parisian brasserie with French onion soup, duck confit & wine` }
      ];
    } else if (destClean.includes('tokyo') || cleanTitle.includes('tokyo') || cleanTitle.includes('japan')) {
      theme = `Shibuya Scramble, Meiji Shrine & Ramen Alley`;
      dayTitle = `Meiji Jingu Shrine, Harajuku Street & Shibuya Crossing`;
      activities = [
        { time: '08:30 AM', activity: `Traditional Japanese breakfast: tamagoyaki, miso soup, steamed rice & grilled salmon` },
        { time: '10:00 AM', activity: `Walk through grand cedar forest torii gate into sacred Meiji Jingu Shrine` },
        { time: '12:30 PM', activity: `Harajuku Takeshita Street crepes & avant-garde fashion boutiques` },
        { time: '03:00 PM', activity: `Witness the iconic Shibuya Scramble Crossing from rooftop observation deck` },
        { time: '06:00 PM', activity: 'Shinjuku golden hour skyline from Tokyo Metropolitan Government Building' },
        { time: '08:00 PM', activity: 'Authentic tonkotsu ramen and crispy gyoza dinner in Omoide Yokocho alley' }
      ];
    } else if (destClean.includes('rome') || cleanTitle.includes('rome') || cleanTitle.includes('colosseum')) {
      theme = `Colosseum Arena, Roman Forum & Trastevere`;
      dayTitle = `Colosseum Arena Floor, Ancient Forum & Trevi Fountain`;
      activities = [
        { time: '08:30 AM', activity: `Italian espresso and warm cornetto at traditional Rome espresso bar` },
        { time: '10:00 AM', activity: `VIP entrance to the Colosseum arena floor and Roman Forum ancient ruins` },
        { time: '01:00 PM', activity: `Classic Roman lunch (Cacio e Pepe & Carbonara) at authentic family trattoria` },
        { time: '03:30 PM', activity: `Walk past Piazza Venezia to the Pantheon and toss a coin into Trevi Fountain` },
        { time: '06:30 PM', activity: `Artisanal gelato tasting at Piazza Navona watching street artists` },
        { time: '08:30 PM', activity: `Evening stroll through cobblestone alleyways of Trastevere & candlelit dinner` }
      ];
    } else if (destClean.includes('dubai') || cleanTitle.includes('dubai')) {
      theme = `Burj Khalifa Observation Deck & Dubai Fountain`;
      dayTitle = `Burj Khalifa 125th Floor Skydeck & Dubai Mall Waterfront`;
      activities = [
        { time: '09:00 AM', activity: `Dubai Marina promenade breakfast overlooking luxury superyachts` },
        { time: '11:30 AM', activity: `Dubai Mall & Burj Khalifa 124th/125th floor observation deck` },
        { time: '02:30 PM', activity: `Gourmet lunch at Souk Al Bahar overlooking the Dubai Fountain lake` },
        { time: '05:00 PM', activity: `Dubai Frame glass skybridge sunset experience` },
        { time: '08:30 PM', activity: `Dubai Fountain light & music choreography show followed by Arabian dinner` }
      ];
    } else {
      theme = `${destination} Historic Town Center & Orientation`;
      dayTitle = `Arrival in ${destination}, Landmark Walk & Welcome Dinner`;
      activities = [
        { time: '08:30 AM', activity: `Arrival in ${destination}, hotel check-in & welcome local refreshments` },
        { time: '10:30 AM', activity: `Walking orientation around ${destination} central historic square & landmarks` },
        { time: '01:30 PM', activity: `Lunch at authentic regional bistro sampling local specialties` },
        { time: '04:00 PM', activity: `Afternoon visit to primary cultural museum & architectural viewpoints in ${destination}` },
        { time: '06:30 PM', activity: `Sunset stroll along ${destination} scenic promenade` },
        { time: '08:30 PM', activity: `Welcome dinner featuring signature cuisine and local wine of ${destination}` }
      ];
    }
  }

  const slotActivities: TripTimeSlotActivity[] = activities.map((act, actIdx) => ({
    id: `slot-1-${actIdx + 1}-${Date.now().toString(36)}`,
    time: act.time,
    activity: act.activity
  }));

  return {
    day: 1,
    date: dateStr,
    theme,
    title: dayTitle,
    description: slotActivities.map(a => `${a.time} - ${a.activity}`).join('\n'),
    activities: slotActivities
  };
}

/**
 * List of prominent / high tourist destinations (Bali, Kashmir, Goa, Maldives, etc.)
 * that should automatically generate accurate authentic day-by-day itineraries and timings.
 */
export const PROMINENT_HIGH_DESTINATIONS = [
  'bali',
  'balli',
  'ubud',
  'uluwatu',
  'canggu',
  'seminyak',
  'kashmir',
  'srinagar',
  'gulmarg',
  'pahalgam',
  'dal lake',
  'sonamarg',
  'goa',
  'calangute',
  'baga',
  'anjuna',
  'panaji',
  'candolim',
  'maldives',
  'male',
  'dubai',
  'abu dhabi',
  'uae',
  'paris',
  'france',
  'tokyo',
  'kyoto',
  'japan',
  'swiss',
  'switzerland',
  'zermatt',
  'interlaken',
  'jaipur',
  'udaipur',
  'rajasthan',
  'kerala',
  'munnar',
  'alleppey',
  'ladakh',
  'leh',
  'manali',
  'solang',
  'rohtang',
  'singapore',
  'rome',
  'italy',
  'london',
  'santorini',
  'greece',
  'new york',
  'nyc',
  'iceland',
  'phuket',
  'thailand',
  'amalfi'
];

/**
 * Checks whether a given destination name or trip title references a prominent / high tourist destination.
 */
export function isProminentHighDestination(text: string): boolean {
  if (!text) return false;
  const clean = text.toLowerCase().trim();
  return PROMINENT_HIGH_DESTINATIONS.some(kw => clean.includes(kw));
}

/**
 * Generates clean blank itinerary spaces for trips so the user can easily enter their own activities.
 * Default time slots are provided for chronological structure.
 */
export function generateBlankItinerary(
  daysCount: number = 3,
  startDateStr?: string,
  tripTitle?: string
): TripDayItinerary[] {
  const defaultTimes = ['09:00 AM', '11:30 AM', '02:00 PM', '05:00 PM', '08:00 PM'];
  const res: TripDayItinerary[] = [];
  const baseDate = startDateStr ? new Date(startDateStr) : new Date();

  for (let i = 1; i <= daysCount; i++) {
    const curDate = new Date(baseDate);
    curDate.setDate(curDate.getDate() + (i - 1));
    const dateStr = curDate.toISOString().split('T')[0];

    res.push({
      day: i,
      date: dateStr,
      theme: i === 1 && tripTitle && tripTitle.trim() ? `${tripTitle.trim()} - Day 1 Schedule` : `Day ${i} Custom Schedule`,
      title: `Day ${i} Plan`,
      description: '',
      activities: defaultTimes.map((time, idx) => ({
        id: `slot-blank-d${i}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        time,
        activity: '' // blank space for user to enter their custom activity
      }))
    });
  }
  return res;
}

/**
 * Generates an authentic itinerary completely driven by the trip Title entered by the user.
 * For prominent destinations (Bali, Kashmir, Goa, Maldives, etc.), Day 1 activities,
 * timings, and themes are automatically generated.
 * For other destinations, clean blank slots are provided so the user can enter them manually.
 */
export function generateItineraryFromTitle(
  title: string,
  fallbackDest: string = 'Kashmir Valley',
  daysCount: number = 5,
  startDateStr?: string,
  forceGenerate: boolean = false
): {
  itinerary: TripDayItinerary[];
  detectedDestination: string;
  detectedTheme: string;
  isProminent: boolean;
} {
  const count = Math.max(1, Math.min(daysCount, 30));
  const isProminent = isProminentHighDestination(title) || isProminentHighDestination(fallbackDest);

  // If NOT a prominent high place and forceGenerate is false, leave blank spaces for user entry
  if (!isProminent && !forceGenerate) {
    return {
      itinerary: generateBlankItinerary(count, startDateStr, title),
      detectedDestination: fallbackDest || 'Custom Destination',
      detectedTheme: title ? `${title} Schedule` : 'Custom Trip Plan',
      isProminent: false
    };
  }

  const { detectedDestination, detectedTheme, detectedVibe } = detectDestinationAndThemeFromTitle(title, fallbackDest);
  const baseDate = startDateStr ? new Date(startDateStr) : new Date();

  // 1. Build Day 1 directly based on the user's title and detected vibe/destination
  const day1DateStr = baseDate.toISOString().split('T')[0];
  const day1 = buildDayOneFromTitle(title, detectedDestination, detectedVibe, day1DateStr);

  const result: TripDayItinerary[] = [day1];

  // 2. Build Days 2 through N based on destination profile or procedural generator
  if (count > 1) {
    const fullItinerary = generateItineraryForDestination(detectedDestination, count, startDateStr);
    for (let i = 1; i < count; i++) {
      if (fullItinerary[i]) {
        result.push(fullItinerary[i]);
      }
    }
  }

  return {
    itinerary: result,
    detectedDestination,
    detectedTheme,
    isProminent: true
  };
}

