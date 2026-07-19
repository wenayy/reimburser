export interface MerchantInfo {
  name: string;
  domain?: string;
  category: string;
}

/** Known merchants: pattern in raw transaction text -> clean merchant info.
 *  Order matters — specific brands first, generic keyword fallbacks last. */
const KNOWN_MERCHANTS: { pattern: RegExp; info: MerchantInfo }[] = [
  // coffee & chai
  { pattern: /starbucks/i, info: { name: "Starbucks", domain: "starbucks.com", category: "Coffee" } },
  { pattern: /cafe coffee day|\bccd\b/i, info: { name: "Cafe Coffee Day", domain: "cafecoffeeday.com", category: "Coffee" } },
  { pattern: /blue tokai/i, info: { name: "Blue Tokai", domain: "bluetokaicoffee.com", category: "Coffee" } },
  { pattern: /third wave/i, info: { name: "Third Wave Coffee", domain: "thirdwavecoffee.in", category: "Coffee" } },
  { pattern: /chaayos/i, info: { name: "Chaayos", domain: "chaayos.com", category: "Chai" } },
  { pattern: /chai point/i, info: { name: "Chai Point", domain: "chaipoint.com", category: "Chai" } },
  { pattern: /dunkin/i, info: { name: "Dunkin'", domain: "dunkindonuts.com", category: "Coffee" } },
  // food
  { pattern: /swiggy/i, info: { name: "Swiggy", domain: "swiggy.com", category: "Food" } },
  { pattern: /zomato/i, info: { name: "Zomato", domain: "zomato.com", category: "Food" } },
  { pattern: /dominos|domino's/i, info: { name: "Domino's", domain: "dominos.co.in", category: "Food" } },
  { pattern: /mcdonald/i, info: { name: "McDonald's", domain: "mcdonalds.com", category: "Food" } },
  { pattern: /\bkfc\b/i, info: { name: "KFC", domain: "kfc.com", category: "Food" } },
  { pattern: /burger king/i, info: { name: "Burger King", domain: "burgerking.in", category: "Food" } },
  { pattern: /subway/i, info: { name: "Subway", domain: "subway.com", category: "Food" } },
  { pattern: /pizza hut/i, info: { name: "Pizza Hut", domain: "pizzahut.com", category: "Food" } },
  { pattern: /taco bell/i, info: { name: "Taco Bell", domain: "tacobell.com", category: "Food" } },
  { pattern: /wow.?momo/i, info: { name: "Wow! Momo", domain: "wowmomo.com", category: "Food" } },
  { pattern: /haldiram/i, info: { name: "Haldiram's", domain: "haldirams.com", category: "Food" } },
  { pattern: /theobroma/i, info: { name: "Theobroma", domain: "theobroma.in", category: "Food" } },
  { pattern: /barbeque nation/i, info: { name: "Barbeque Nation", domain: "barbequenation.com", category: "Food" } },
  // groceries & quick commerce
  { pattern: /blinkit/i, info: { name: "Blinkit", domain: "blinkit.com", category: "Groceries" } },
  { pattern: /zepto/i, info: { name: "Zepto", domain: "zeptonow.com", category: "Groceries" } },
  { pattern: /bigbasket|big basket/i, info: { name: "BigBasket", domain: "bigbasket.com", category: "Groceries" } },
  { pattern: /jiomart|jio mart/i, info: { name: "JioMart", domain: "jiomart.com", category: "Groceries" } },
  { pattern: /\bd\.?mart\b/i, info: { name: "DMart", domain: "dmartindia.com", category: "Groceries" } },
  { pattern: /instamart/i, info: { name: "Swiggy Instamart", domain: "swiggy.com", category: "Groceries" } },
  // transport
  { pattern: /uber/i, info: { name: "Uber", domain: "uber.com", category: "Transport" } },
  { pattern: /\bola\b/i, info: { name: "Ola", domain: "olacabs.com", category: "Transport" } },
  { pattern: /rapido/i, info: { name: "Rapido", domain: "rapido.bike", category: "Transport" } },
  { pattern: /blusmart|blu smart/i, info: { name: "BluSmart", domain: "blu-smart.com", category: "Transport" } },
  { pattern: /redbus|red bus/i, info: { name: "redBus", domain: "redbus.in", category: "Transport" } },
  // shopping
  { pattern: /amazon/i, info: { name: "Amazon", domain: "amazon.in", category: "Shopping" } },
  { pattern: /flipkart/i, info: { name: "Flipkart", domain: "flipkart.com", category: "Shopping" } },
  { pattern: /myntra/i, info: { name: "Myntra", domain: "myntra.com", category: "Shopping" } },
  { pattern: /\bajio\b/i, info: { name: "AJIO", domain: "ajio.com", category: "Shopping" } },
  { pattern: /nykaa/i, info: { name: "Nykaa", domain: "nykaa.com", category: "Shopping" } },
  { pattern: /meesho/i, info: { name: "Meesho", domain: "meesho.com", category: "Shopping" } },
  { pattern: /croma/i, info: { name: "Croma", domain: "croma.com", category: "Shopping" } },
  { pattern: /decathlon/i, info: { name: "Decathlon", domain: "decathlon.in", category: "Shopping" } },
  { pattern: /\bikea\b/i, info: { name: "IKEA", domain: "ikea.com", category: "Shopping" } },
  { pattern: /\bzara\b/i, info: { name: "Zara", domain: "zara.com", category: "Shopping" } },
  { pattern: /\bh&m\b/i, info: { name: "H&M", domain: "hm.com", category: "Shopping" } },
  { pattern: /lenskart/i, info: { name: "Lenskart", domain: "lenskart.com", category: "Shopping" } },
  { pattern: /\bboat\b/i, info: { name: "boAt", domain: "boat-lifestyle.com", category: "Shopping" } },
  // subscriptions & entertainment
  { pattern: /netflix/i, info: { name: "Netflix", domain: "netflix.com", category: "Subscription" } },
  { pattern: /spotify/i, info: { name: "Spotify", domain: "spotify.com", category: "Subscription" } },
  { pattern: /youtube|google \*youtube/i, info: { name: "YouTube Premium", domain: "youtube.com", category: "Subscription" } },
  { pattern: /hotstar|disney/i, info: { name: "JioHotstar", domain: "hotstar.com", category: "Subscription" } },
  { pattern: /prime video/i, info: { name: "Prime Video", domain: "primevideo.com", category: "Subscription" } },
  { pattern: /sonyliv|sony liv/i, info: { name: "SonyLIV", domain: "sonyliv.com", category: "Subscription" } },
  { pattern: /zee5/i, info: { name: "ZEE5", domain: "zee5.com", category: "Subscription" } },
  { pattern: /apple|icloud|app store/i, info: { name: "Apple", domain: "apple.com", category: "Subscription" } },
  { pattern: /google (play|one)|play store/i, info: { name: "Google Play", domain: "play.google.com", category: "Subscription" } },
  { pattern: /\bpvr\b/i, info: { name: "PVR Cinemas", domain: "pvrcinemas.com", category: "Entertainment" } },
  { pattern: /\binox\b/i, info: { name: "INOX", domain: "inoxmovies.com", category: "Entertainment" } },
  { pattern: /bookmyshow/i, info: { name: "BookMyShow", domain: "bookmyshow.com", category: "Entertainment" } },
  // gaming
  { pattern: /\bsteam\b/i, info: { name: "Steam", domain: "steampowered.com", category: "Gaming" } },
  { pattern: /playstation|\bpsn\b/i, info: { name: "PlayStation", domain: "playstation.com", category: "Gaming" } },
  { pattern: /\bxbox\b/i, info: { name: "Xbox", domain: "xbox.com", category: "Gaming" } },
  { pattern: /epic games/i, info: { name: "Epic Games", domain: "epicgames.com", category: "Gaming" } },
  { pattern: /valorant|riot games/i, info: { name: "Riot Games", domain: "riotgames.com", category: "Gaming" } },
  { pattern: /\bbgmi\b|krafton/i, info: { name: "BGMI", domain: "krafton.com", category: "Gaming" } },
  { pattern: /twitch/i, info: { name: "Twitch", domain: "twitch.tv", category: "Gaming" } },
  // software & tools
  { pattern: /openai|chatgpt/i, info: { name: "OpenAI", domain: "openai.com", category: "Software" } },
  { pattern: /anthropic|claude/i, info: { name: "Anthropic", domain: "anthropic.com", category: "Software" } },
  { pattern: /vercel/i, info: { name: "Vercel", domain: "vercel.com", category: "Software" } },
  { pattern: /github/i, info: { name: "GitHub", domain: "github.com", category: "Software" } },
  { pattern: /figma/i, info: { name: "Figma", domain: "figma.com", category: "Software" } },
  { pattern: /adobe/i, info: { name: "Adobe", domain: "adobe.com", category: "Software" } },
  { pattern: /notion/i, info: { name: "Notion", domain: "notion.so", category: "Software" } },
  { pattern: /canva/i, info: { name: "Canva", domain: "canva.com", category: "Software" } },
  { pattern: /midjourney/i, info: { name: "Midjourney", domain: "midjourney.com", category: "Software" } },
  { pattern: /discord/i, info: { name: "Discord", domain: "discord.com", category: "Software" } },
  { pattern: /hostinger|godaddy|namecheap/i, info: { name: "Domain & Hosting", domain: "godaddy.com", category: "Software" } },
  // utilities & connectivity
  { pattern: /airtel/i, info: { name: "Airtel", domain: "airtel.in", category: "Utilities" } },
  { pattern: /\bjio\b/i, info: { name: "Jio", domain: "jio.com", category: "Utilities" } },
  { pattern: /\bvi\b|vodafone/i, info: { name: "Vi", domain: "myvi.in", category: "Utilities" } },
  { pattern: /\bbsnl\b/i, info: { name: "BSNL", domain: "bsnl.co.in", category: "Utilities" } },
  { pattern: /tata play/i, info: { name: "Tata Play", domain: "tataplay.com", category: "Utilities" } },
  // travel
  { pattern: /irctc/i, info: { name: "IRCTC", domain: "irctc.co.in", category: "Travel" } },
  { pattern: /goibibo|makemytrip/i, info: { name: "MakeMyTrip", domain: "makemytrip.com", category: "Travel" } },
  { pattern: /\bindigo\b/i, info: { name: "IndiGo", domain: "goindigo.in", category: "Travel" } },
  { pattern: /ixigo/i, info: { name: "ixigo", domain: "ixigo.com", category: "Travel" } },
  { pattern: /cleartrip/i, info: { name: "Cleartrip", domain: "cleartrip.com", category: "Travel" } },
  { pattern: /airbnb/i, info: { name: "Airbnb", domain: "airbnb.com", category: "Travel" } },
  { pattern: /\boyo\b/i, info: { name: "OYO", domain: "oyorooms.com", category: "Travel" } },
  // health & fitness
  { pattern: /apollo/i, info: { name: "Apollo Pharmacy", domain: "apollopharmacy.in", category: "Health" } },
  { pattern: /pharmeasy/i, info: { name: "PharmEasy", domain: "pharmeasy.in", category: "Health" } },
  { pattern: /\b1mg\b/i, info: { name: "Tata 1mg", domain: "tata1mg.com", category: "Health" } },
  { pattern: /netmeds/i, info: { name: "Netmeds", domain: "netmeds.com", category: "Health" } },
  { pattern: /cult\.?fit|cultfit/i, info: { name: "cult.fit", domain: "cult.fit", category: "Fitness" } },
  // fuel
  { pattern: /indian ?oil|\biocl\b/i, info: { name: "Indian Oil", domain: "iocl.com", category: "Fuel" } },
  { pattern: /\bhpcl\b|hindustan petroleum/i, info: { name: "HP Petrol", domain: "hindustanpetroleum.com", category: "Fuel" } },
  { pattern: /\bbpcl\b|bharat petroleum/i, info: { name: "Bharat Petroleum", domain: "bharatpetroleum.in", category: "Fuel" } },
  { pattern: /\bshell\b/i, info: { name: "Shell", domain: "shell.com", category: "Fuel" } },
  // education
  { pattern: /udemy/i, info: { name: "Udemy", domain: "udemy.com", category: "Education" } },
  { pattern: /coursera/i, info: { name: "Coursera", domain: "coursera.org", category: "Education" } },

  // ---- generic everyday items (no logo — category emoji tile) ----
  { pattern: /\bcig\w*|marlboro|gold ?flake|classic ?mild|four ?square|\bbidi\b|\bpaan\b/i, info: { name: "Cigarettes", category: "Smokes" } },
  { pattern: /\bbeer\b|kingfisher|bira ?91|budweiser|heineken|tuborg|breezer|old ?monk|whisk(e)?y|vodka|\brum\b|\bwine\b|liquor|\bdaa?ru\b|\btheka\b/i, info: { name: "Drinks", category: "Drinks" } },
  { pattern: /\bchai\b|tea ?stall|\btapri\b/i, info: { name: "Chai", category: "Chai" } },
  { pattern: /\bpetrol\b|\bdiesel\b|\bfuel\b/i, info: { name: "Fuel", category: "Fuel" } },
  { pattern: /\bauto\b|rickshaw|riksha/i, info: { name: "Auto Ride", category: "Transport" } },
  { pattern: /\bmetro\b/i, info: { name: "Metro", category: "Transport" } },
  { pattern: /\bbus\b/i, info: { name: "Bus", category: "Transport" } },
  { pattern: /\bparking\b|\btoll\b|fastag/i, info: { name: "Parking & Toll", category: "Transport" } },
  { pattern: /\bgym\b|protein|whey/i, info: { name: "Gym", category: "Fitness" } },
  { pattern: /pharma|medicin|medical ?store|chemist/i, info: { name: "Medicines", category: "Health" } },
  { pattern: /\brent\b/i, info: { name: "Rent", category: "Rent" } },
  { pattern: /electric|power ?bill/i, info: { name: "Electricity", category: "Utilities" } },
  { pattern: /\bwifi\b|broadband|internet/i, info: { name: "Internet", category: "Utilities" } },
  { pattern: /recharge/i, info: { name: "Mobile Recharge", category: "Utilities" } },
  { pattern: /laundry|dry ?clean|istri|ironing/i, info: { name: "Laundry", category: "Services" } },
  { pattern: /\bsalon\b|haircut|barber/i, info: { name: "Salon", category: "Beauty" } },
  { pattern: /\bmovie\b|cinema/i, info: { name: "Movies", category: "Entertainment" } },
  { pattern: /stationery|xerox|printout|\bprint\b/i, info: { name: "Stationery", category: "Education" } },
  { pattern: /\bbooks?\b/i, info: { name: "Books", category: "Education" } },
  { pattern: /canteen|\bmess\b|tiffin/i, info: { name: "Canteen", category: "Food" } },
  { pattern: /\bmomos?\b/i, info: { name: "Momos", category: "Food" } },
  { pattern: /\bbiry?ani\b/i, info: { name: "Biryani", category: "Food" } },
  { pattern: /\bpizza\b/i, info: { name: "Pizza", category: "Food" } },
  { pattern: /\bjuice\b/i, info: { name: "Juice", category: "Food" } },
  { pattern: /\bcoffee\b|\bcafe\b/i, info: { name: "Coffee", category: "Coffee" } },
];

export function resolveMerchant(rawText: string): MerchantInfo {
  for (const { pattern, info } of KNOWN_MERCHANTS) {
    if (pattern.test(rawText)) return info;
  }
  // Fallback: title-case the first words, strip store numbers / noise
  const cleaned = rawText
    .replace(/[*#]|\b(pvt|ltd|india|store|txn|pos|upi)\b/gi, " ")
    .replace(/\d{4,}/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  return { name: cleaned || "Unknown Merchant", category: "Other" };
}

export function logoUrl(domain?: string): string | null {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export const CATEGORY_EMOJI: Record<string, string> = {
  Coffee: "☕️",
  Chai: "🍵",
  Transport: "🚕",
  Food: "🍜",
  Groceries: "🛒",
  Shopping: "🛍️",
  Subscription: "📺",
  Entertainment: "🎬",
  Gaming: "🎮",
  Software: "💻",
  Utilities: "📡",
  Travel: "✈️",
  Smokes: "🚬",
  Drinks: "🍺",
  Fuel: "⛽️",
  Fitness: "🏋️",
  Health: "💊",
  Rent: "🏠",
  Education: "📚",
  Beauty: "💇",
  Services: "🧺",
  Other: "💳",
};
