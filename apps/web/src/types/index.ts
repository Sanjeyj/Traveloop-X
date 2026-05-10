export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  travelDnaProfile?: string;
  isGuest?: boolean;
}

export interface Weather {
  temp: number;
  feelsLike?: number;
  condition: string;
  description?: string;
  humidity?: number;
  windSpeed?: number;
  icon: string;
  city?: string;
  country?: string;
}

export interface Activity {
  id: string;
  title: string;
  type: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  cost?: number;
  costEstimate?: number;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  imageUrl?: string;
  aiNote?: string;
  isAiSuggested?: boolean;
  votes?: number;
  order?: number;
}

export interface ItineraryDay {
  id: string;
  dayNumber: number;
  date: string;
  title?: string;
  weather?: Weather;
  weatherCache?: string;
  activities: Activity[];
  notes?: string;
}

export interface TripMember {
  id: string;
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  user: { id: string; name?: string; email: string; avatarUrl?: string };
  joinedAt: string;
}

export interface Expense {
  id: string;
  tripId: string;
  title?: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  receiptUrl?: string;
  addedBy?: string;
}

export interface PackingItem {
  id?: string;
  name: string;
  category: string;
  isChecked: boolean;
  aiSuggested?: boolean;
}

export interface JournalEntry {
  id: string;
  tripId: string;
  userId: string;
  dayNumber?: number;
  title?: string;
  notes?: string;
  mood?: string;
  images: string[];
  createdAt: string;
  user?: { name?: string; avatarUrl?: string };
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  latitude?: number;
  longitude?: number;
  startDate: string;
  endDate: string;
  budgetLimit?: number;
  coverImage?: string;
  theme?: string;
  tags?: string;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members: TripMember[];
  days: ItineraryDay[];
  expenses?: Expense[];
  packingList?: { id: string; items: string };
}

export interface StreamEvent {
  type?: 'destination' | 'budget' | 'day' | 'packing';
  status?: 'analyzing' | 'searching' | 'optimizing' | 'building' | 'complete';
  message?: string;
  data?: any;
}

export interface Cursor {
  id: string;
  x: number;
  y: number;
  color: string;
  name: string;
}
