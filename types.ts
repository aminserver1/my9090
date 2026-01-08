
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  coins: number;
  isPremium: boolean;
  isAdmin: boolean;
  lastActive: number;
  roomsCreatedCount: number;
  dailyBonusLastClaimed?: number;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  photoURL: string;
  createdAt: number;
  isPinned: boolean; // For ads/top rooms
  isOfficial?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  isPremiumSender: boolean;
  text?: string;
  image?: string;
  voice?: string;
  timestamp: number;
  type: 'text' | 'image' | 'voice';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
}
