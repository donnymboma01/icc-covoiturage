import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs, getDoc, doc, Timestamp } from "firebase/firestore";
import { app } from "@/app/config/firebase-config";

const db = getFirestore(app);

interface SearchAnalysis {
  intent: "search_rides" | "recommend" | "explain" | "stats";
  filters: {
    departure?: string;
    arrival?: string;
    date?: Date;
    dateRange?: { start: Date; end: Date };
    maxPrice?: number;
    minSeats?: number;
    churchId?: string;
    timeOfDay?: "morning" | "afternoon" | "evening";
  };
  sortBy?: "price" | "date" | "rating" | "proximity";
  limit?: number;
}

async function analyzeQuery(userQuery: string, userContext: any): Promise<SearchAnalysis> {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const analysis: SearchAnalysis = {
    intent: "search_rides",
    filters: {},
    sortBy: "date",
    limit: 20
  };

  const queryLower = userQuery.toLowerCase();

  if (queryLower.includes("demain")) {
    analysis.filters.date = tomorrow;
  } else if (queryLower.includes("aujourd'hui") || queryLower.includes("aujourdhui")) {
    analysis.filters.date = today;
  }

  if (queryLower.includes("matin")) {
    analysis.filters.timeOfDay = "morning";
  } else if (queryLower.includes("après-midi") || queryLower.includes("apres-midi")) {
    analysis.filters.timeOfDay = "afternoon";
  } else if (queryLower.includes("soir")) {
    analysis.filters.timeOfDay = "evening";
  }

  const cities = ["bruxelles", "liège", "liege", "anvers", "namur", "charleroi", "gand", "bruges", "mons", "louvain"];
  for (const city of cities) {
    if (queryLower.includes(city)) {
      if (queryLower.includes("vers " + city) || queryLower.includes("à " + city) || queryLower.includes("pour " + city)) {
        analysis.filters.arrival = city.charAt(0).toUpperCase() + city.slice(1);
      } else if (queryLower.includes("depuis " + city) || queryLower.includes("de " + city)) {
        analysis.filters.departure = city.charAt(0).toUpperCase() + city.slice(1);
      } else {
        analysis.filters.arrival = city.charAt(0).toUpperCase() + city.slice(1);
      }
    }
  }

  if (queryLower.includes("pas cher") || queryLower.includes("économique") || queryLower.includes("economique")) {
    analysis.filters.maxPrice = 10;
    analysis.sortBy = "price";
  }

  if (queryLower.includes("église") || queryLower.includes("eglise") || queryLower.includes("dimanche")) {
    if (userContext.churchId) {
      analysis.filters.churchId = userContext.churchId;
    }
  }

  return analysis;
}

async function searchRides(analysis: SearchAnalysis, userId: string) {
  const ridesRef = collection(db, "rides");
  let constraints: any[] = [
    where("status", "==", "active"),
  ];

  if (analysis.filters.date) {
    const startOfDay = new Date(analysis.filters.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(analysis.filters.date);
    endOfDay.setHours(23, 59, 59, 999);
    
    constraints.push(where("departureTime", ">=", startOfDay));
    constraints.push(where("departureTime", "<=", endOfDay));
  } else if (analysis.filters.dateRange) {
    constraints.push(where("departureTime", ">=", analysis.filters.dateRange.start));
    constraints.push(where("departureTime", "<=", analysis.filters.dateRange.end));
  } else {
    constraints.push(where("departureTime", ">=", new Date()));
  }

  if (analysis.filters.timeOfDay) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (analysis.filters.timeOfDay === "morning") {
      const morning = new Date(now);
      morning.setHours(6, 0, 0, 0);
      const noon = new Date(now);
      noon.setHours(12, 0, 0, 0);
      constraints.push(where("departureTime", ">=", morning));
      constraints.push(where("departureTime", "<=", noon));
    } else if (analysis.filters.timeOfDay === "afternoon") {
      const afternoon = new Date(now);
      afternoon.setHours(12, 0, 0, 0);
      const evening = new Date(now);
      evening.setHours(18, 0, 0, 0);
      constraints.push(where("departureTime", ">=", afternoon));
      constraints.push(where("departureTime", "<=", evening));
    } else if (analysis.filters.timeOfDay === "evening") {
      const evening = new Date(now);
      evening.setHours(18, 0, 0, 0);
      const night = new Date(now);
      night.setHours(23, 59, 59, 999);
      constraints.push(where("departureTime", ">=", evening));
      constraints.push(where("departureTime", "<=", night));
    }
  }

  const q = query(ridesRef, ...constraints);
  const querySnapshot = await getDocs(q);
  
  let rides: any[] = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    departureTime: doc.data().departureTime.toDate()
  }));

  if (analysis.filters.departure) {
    const departureLower = analysis.filters.departure.toLowerCase();
    rides = rides.filter(ride => 
      ride.departureAddress?.toLowerCase().includes(departureLower)
    );
  }

  if (analysis.filters.arrival) {
    const arrivalLower = analysis.filters.arrival.toLowerCase();
    rides = rides.filter(ride => 
      ride.arrivalAddress?.toLowerCase().includes(arrivalLower)
    );
  }

  if (analysis.filters.maxPrice) {
    rides = rides.filter(ride => 
      !ride.price || ride.price <= analysis.filters.maxPrice!
    );
  }

  if (analysis.filters.minSeats) {
    rides = rides.filter(ride => 
      ride.availableSeats >= analysis.filters.minSeats!
    );
  }

  if (analysis.filters.churchId) {
    rides = rides.filter(ride => 
      ride.churchId === analysis.filters.churchId
    );
  }

  if (analysis.sortBy === "price") {
    rides.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (analysis.sortBy === "date") {
    rides.sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime());
  }

  if (analysis.limit) {
    rides = rides.slice(0, analysis.limit);
  }

  return rides;
}

async function formatResponse(rides: any[], userQuery: string, analysis: SearchAnalysis) {
  if (rides.length === 0) {
    return `Je n'ai trouvé aucun trajet correspondant à votre recherche "${userQuery}". Essayez de modifier vos critères ou de rechercher pour une autre date.`;
  }

  let response = `J'ai trouvé ${rides.length} trajet${rides.length > 1 ? 's' : ''} pour vous:\n\n`;
  
  rides.slice(0, 5).forEach((ride, i) => {
    response += `${i + 1}. ${ride.departureAddress} → ${ride.arrivalAddress}\n`;
    response += `   Départ: ${ride.departureTime.toLocaleDateString('fr-FR')} à ${ride.departureTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n`;
    response += `   Places: ${ride.availableSeats} | Prix: ${ride.price ? ride.price + '€' : 'Gratuit'}\n\n`;
  });

  if (rides.length > 5) {
    response += `... et ${rides.length - 5} autre${rides.length - 5 > 1 ? 's' : ''} trajet${rides.length - 5 > 1 ? 's' : ''}.`;
  }

  return response;
}

export async function POST(req: NextRequest) {
  try {
    const { query: userQuery, userId, churchId, preferences } = await req.json();

    if (!userQuery || !userId) {
      return NextResponse.json(
        { error: "Query et userId requis" },
        { status: 400 }
      );
    }

    const userContext = {
      userId,
      churchId,
      preferences: preferences || {}
    };

    const analysis = await analyzeQuery(userQuery, userContext);
    const rides = await searchRides(analysis, userId);
    const formattedResponse = await formatResponse(rides, userQuery, analysis);

    return NextResponse.json({
      response: formattedResponse,
      rides: rides,
      analysis: analysis
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}
