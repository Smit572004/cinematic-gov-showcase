const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { texts } = await req.json();
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(JSON.stringify({ error: "texts array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Simple translation map for common forestry/garden terms
    // For more complex texts, use AI translation
    const translations = texts.map((text: string) => simpleTranslate(text));

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Basic German to English translation using word/phrase replacement
function simpleTranslate(text: string): string {
  if (!text || text.trim() === "") return text;
  
  const dictionary: Record<string, string> = {
    // Common forestry terms
    "Eiche": "Oak", "Buche": "Beech", "Fichte": "Spruce", "Kiefer": "Pine",
    "Lärche": "Larch", "Birke": "Birch", "Douglasie": "Douglas Fir", "Kirsche": "Cherry",
    "Tanne": "Fir", "Ahorn": "Maple", "Esche": "Ash", "Ulme": "Elm",
    "Erle": "Alder", "Pappel": "Poplar", "Weide": "Willow", "Linde": "Linden",
    // Garden terms
    "Rose": "Rose", "Rosen": "Roses", "Tulpe": "Tulip", "Tulpen": "Tulips",
    "Sonnenblume": "Sunflower", "Sonnenblumen": "Sunflowers",
    "Tomate": "Tomato", "Tomaten": "Tomatoes",
    "Gurke": "Cucumber", "Gurken": "Cucumbers",
    "Paprika": "Pepper", "Karotte": "Carrot", "Karotten": "Carrots",
    "Salat": "Lettuce", "Kräuter": "Herbs", "Basilikum": "Basil",
    "Petersilie": "Parsley", "Lavendel": "Lavender", "Nelke": "Carnation",
    "Dahlie": "Dahlia", "Dahlien": "Dahlias", "Geranie": "Geranium",
    "Primel": "Primrose", "Veilchen": "Violet",
    // Common descriptive words
    "rot": "red", "rote": "red", "roter": "red", "rotes": "red",
    "blau": "blue", "blaue": "blue", "gelb": "yellow", "gelbe": "yellow",
    "weiß": "white", "weiße": "white", "grün": "green", "grüne": "green",
    "klein": "small", "kleine": "small", "groß": "large", "große": "large",
    "schön": "beautiful", "schöne": "beautiful", "wunderschön": "gorgeous",
    "wunderschöne": "gorgeous",
    "Pflanze": "Plant", "Pflanzen": "Plants", "Blume": "Flower", "Blumen": "Flowers",
    "Baum": "Tree", "Bäume": "Trees", "Strauch": "Shrub", "Sträucher": "Shrubs",
    "Setzling": "Seedling", "Setzlinge": "Seedlings",
    "Garten": "Garden", "Forst": "Forest", "Wald": "Forest",
    "für": "for", "und": "and", "mit": "with", "ohne": "without",
    "Ihren": "your", "den": "the", "die": "the", "das": "the", "der": "the",
    "ein": "a", "eine": "a", "einer": "a",
    "sehr": "very", "gut": "good", "gute": "good",
    "frisch": "fresh", "frische": "fresh",
    "neu": "new", "neue": "new",
    "beste": "best", "bester": "best",
    "Qualität": "Quality", "hochwertig": "high-quality", "hochwertige": "high-quality",
    "Bio": "Organic", "biologisch": "organic",
    "winterhart": "winter-hardy", "winterharte": "winter-hardy",
    "mehrjährig": "perennial", "mehrjährige": "perennial",
    "einjährig": "annual", "einjährige": "annual",
    "Containerpflanze": "Container plant", "Containerpflanzen": "Container plants",
    "Topf": "Pot", "Töpfe": "Pots",
    "Samen": "Seeds", "Saatgut": "Seed",
    "Dünger": "Fertilizer", "Erde": "Soil", "Substrat": "Substrate",
    "Bewässerung": "Irrigation", "Pflege": "Care",
    "Geschäftsführer": "Managing Director", "Geschäftsführerin": "Managing Director",
    "Betriebsleiter": "Operations Manager", "Betriebsleiterin": "Operations Manager",
    "Produktionsleiter": "Production Manager", "Produktionsleiterin": "Production Manager",
    "Leiter": "Manager", "Leiterin": "Manager",
    "Mitarbeiter": "Employee", "Mitarbeiterin": "Employee",
    "Vorarbeiter": "Foreman", "Gärtner": "Gardener", "Gärtnerin": "Gardener",
    "Forstingenieur": "Forest Engineer", "Forstwirt": "Forester",
    "Verwaltung": "Administration",
    // Site content
    "Aufforstung": "Reforestation", "Pflanzenvermehrung": "Plant Propagation",
    "Forschung": "Research", "Technologie": "Technology",
    "Nachhaltigkeit": "Sustainability", "nachhaltig": "sustainable",
    "Klimafreundlich": "Climate-friendly", "klimafreundlich": "climate-friendly",
  };

  // Try exact match first
  if (dictionary[text]) return dictionary[text];

  // Word-by-word translation for longer texts
  const words = text.split(/(\s+)/);
  let translated = words.map(word => {
    const clean = word.replace(/[.,!?;:()]/g, "");
    const punct = word.slice(clean.length);
    if (dictionary[clean]) return dictionary[clean] + punct;
    // Try lowercase
    const lower = clean.charAt(0).toLowerCase() + clean.slice(1);
    if (dictionary[lower]) {
      const trans = dictionary[lower];
      // Preserve capitalization
      if (clean[0] === clean[0].toUpperCase()) {
        return trans.charAt(0).toUpperCase() + trans.slice(1) + punct;
      }
      return trans + punct;
    }
    return word; // Keep original if no translation found
  }).join("");

  return translated;
}
