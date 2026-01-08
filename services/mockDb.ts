
import { User, Room, Message, AppNotification } from '../types';
import { ADMIN_EMAIL } from '../constants';

// Simulated database using LocalStorage for persistence in this demo environment
const STORAGE_KEY = 'kuchat_v1_db';

interface DB {
  users: Record<string, User>;
  rooms: Record<string, Room>;
  messages: Record<string, Message[]>;
  notifications: AppNotification[];
}

const initialDb: DB = {
  users: {},
  rooms: {
    'official-admin': {
      id: 'official-admin',
      name: 'ڕوومی فەرمی ئەدمینەکان',
      description: 'گرووپی فەرمی بۆ گفتوگۆی ئەدمین و ڕێنماییەکان',
      ownerId: 'system',
      ownerName: 'Kuchat Admin',
      photoURL: 'https://picsum.photos/seed/official/400/300',
      createdAt: Date.now(),
      isPinned: true,
      isOfficial: true
    }
  },
  messages: {
    'official-admin': []
  },
  notifications: []
};

function getDb(): DB {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : initialDb;
}

function saveDb(db: DB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export const dbService = {
  // Auth
  register: (email: string, pass: string, name: string): User => {
    const db = getDb();
    const uid = Math.random().toString(36).substring(7);
    const isAdmin = email === ADMIN_EMAIL;
    const user: User = {
      uid,
      email,
      displayName: name,
      photoURL: '',
      coins: isAdmin ? 999999 : 0,
      isPremium: isAdmin,
      isAdmin,
      lastActive: Date.now(),
      roomsCreatedCount: 0
    };
    db.users[uid] = user;
    saveDb(db);
    return user;
  },

  login: (email: string): User | null => {
    const db = getDb();
    const user = Object.values(db.users).find(u => u.email === email);
    if (user) {
      user.lastActive = Date.now();
      saveDb(db);
      return user;
    }
    return null;
  },

  updateUser: (uid: string, data: Partial<User>) => {
    const db = getDb();
    if (db.users[uid]) {
      db.users[uid] = { ...db.users[uid], ...data };
      saveDb(db);
    }
  },

  // Rooms
  getRooms: (): Room[] => {
    const db = getDb();
    return Object.values(db.rooms).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });
  },

  createRoom: (room: Omit<Room, 'id' | 'createdAt' | 'isPinned'>): Room => {
    const db = getDb();
    const id = Math.random().toString(36).substring(7);
    const newRoom: Room = { ...room, id, createdAt: Date.now(), isPinned: false };
    db.rooms[id] = newRoom;
    db.messages[id] = [];
    saveDb(db);
    return newRoom;
  },

  updateRoom: (roomId: string, data: Partial<Room>) => {
    const db = getDb();
    if (db.rooms[roomId]) {
      db.rooms[roomId] = { ...db.rooms[roomId], ...data };
      saveDb(db);
    }
  },

  // Messages
  getMessages: (roomId: string): Message[] => {
    const db = getDb();
    return db.messages[roomId] || [];
  },

  sendMessage: (roomId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const db = getDb();
    const newMessage: Message = { ...message, id: Math.random().toString(36).substring(7), timestamp: Date.now() };
    if (!db.messages[roomId]) db.messages[roomId] = [];
    db.messages[roomId].push(newMessage);
    saveDb(db);
    return newMessage;
  },

  // Notifications
  getNotifications: () => getDb().notifications,
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp'>) => {
    const db = getDb();
    const n: AppNotification = { ...notif, id: Date.now().toString(), timestamp: Date.now() };
    db.notifications.unshift(n);
    saveDb(db);
  },

  // Users online
  getOnlineUsers: () => {
    const db = getDb();
    const now = Date.now();
    return Object.values(db.users).map(u => ({
      ...u,
      isOnline: (now - u.lastActive) < 60000 // Online if active in last 1 min
    }));
  }
};
