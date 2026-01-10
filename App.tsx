
import React, { useState, useEffect, useRef } from 'react';
import { User, Room, Message } from './types';
import { dbService } from './services/mockDb';
import { ADMIN_EMAIL, COIN_PACKS, TELEGRAM_OWNER, PREMIUM_COST, AD_COST, NEW_ROOM_COST, DEFAULT_AVATAR, DEFAULT_ROOM_IMAGE } from './constants';
import Layout from './components/Layout';

// Screen Types
type Screen = 'splash' | 'auth' | 'home' | 'chat' | 'admin' | 'notifications' | 'store' | 'profile' | 'create-room';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState('home');

  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        const saved = localStorage.getItem('kuchat_session');
        if (saved) {
          const u = dbService.login(saved);
          if (u) {
            // Re-verify admin status on session load
            if (u.email === ADMIN_EMAIL) {
              u.isAdmin = true;
              u.isPremium = true;
              u.coins = 999999;
            }
            setCurrentUser(u);
            setCurrentScreen('home');
          } else {
            setCurrentScreen('auth');
          }
        } else {
          setCurrentScreen('auth');
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        dbService.updateUser(currentUser.uid, { lastActive: Date.now() });
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleAuth = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !passInput) return alert('تکایە هەموو خانەکان پڕ بکەرەوە');
    
    if (isRegisterMode) {
      if (!nameInput) return alert('ناو بنوسە');
      const newUser = dbService.register(email, passInput, nameInput);
      login(newUser);
    } else {
      const user = dbService.login(email);
      if (user) login(user);
      else alert('ئەم ئیمێڵە بونی نیە');
    }
  };

  const login = (user: User) => {
    // Force admin powers if email matches
    if (user.email === ADMIN_EMAIL) {
      user.isAdmin = true;
      user.isPremium = true;
      user.coins = 999999;
      dbService.updateUser(user.uid, { isAdmin: true, isPremium: true, coins: 999999 });
    }
    setCurrentUser(user);
    localStorage.setItem('kuchat_session', user.email);
    setCurrentScreen('home');
  };

  const handleCreateRoom = (name: string, desc: string, img: string) => {
    if (!currentUser) return;
    const rooms = dbService.getRooms();
    if (rooms.find(r => r.name === name)) return alert('ئەم ناوە پێشتر بەکارهاتووە');
    const cost = currentUser.roomsCreatedCount >= 1 ? NEW_ROOM_COST : 0;
    if (currentUser.coins < cost && !currentUser.isAdmin) return alert('کۆینی پێویستت نیە');
    dbService.createRoom({
      name, description: desc, ownerId: currentUser.uid,
      ownerName: currentUser.displayName, photoURL: img || DEFAULT_ROOM_IMAGE
    });
    dbService.updateUser(currentUser.uid, {
      coins: currentUser.isAdmin ? currentUser.coins : currentUser.coins - cost,
      roomsCreatedCount: currentUser.roomsCreatedCount + 1
    });
    setCurrentUser(dbService.login(currentUser.email));
    setCurrentScreen('home');
  };

  const claimBonus = () => {
    if (!currentUser) return;
    const now = Date.now();
    const last = currentUser.dailyBonusLastClaimed || 0;
    if (now - last < 86400000 && !currentUser.isAdmin) return alert('تۆ ئەمڕۆ خەڵاتت وەرگرتووە!');
    dbService.updateUser(currentUser.uid, { coins: currentUser.coins + 1, dailyBonusLastClaimed: now });
    setCurrentUser(dbService.login(currentUser.email));
    alert('یەک کۆینت وەرگرت!');
  };

  if (currentScreen === 'splash') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900">
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl animate-bounce mb-8">
           <i className="fas fa-comment-dots text-5xl text-white"></i>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Kuchat</h1>
        <p className="text-slate-500 mt-2 tracking-widest uppercase text-sm">Communication Reimagined</p>
      </div>
    );
  }

  if (currentScreen === 'auth') {
    return (
      <div className="h-full w-full max-w-md mx-auto bg-slate-900 p-8 flex flex-col justify-center">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fas fa-shield-alt text-3xl text-white"></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{isRegisterMode ? 'دروستکردنی ئەکاونت' : 'چوونە ژوورەوە'}</h2>
          <p className="text-slate-400 text-sm px-4">بۆ چوونە ژوورەوە وەک ئەدمین ئیمێڵی فەرمی بەکاربهێنە</p>
        </div>
        <div className="space-y-4">
          {isRegisterMode && (
            <input className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none focus:ring-2 ring-blue-500 text-white" 
              placeholder="ناوی تەواو" value={nameInput} onChange={e => setNameInput(e.target.value)} />
          )}
          <input className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none focus:ring-2 ring-blue-500 text-white" 
            placeholder="ئیمێڵ" value={emailInput} onChange={e => setEmailInput(e.target.value)} />
          <input type="password" className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none focus:ring-2 ring-blue-500 text-white" 
            placeholder="ڕەمز" value={passInput} onChange={e => setPassInput(e.target.value)} />
          <button onClick={handleAuth} className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white font-bold text-lg shadow-lg">
            {isRegisterMode ? 'تۆمارکردن' : 'بچۆرە ژوورەوە'}
          </button>
          <p className="text-center text-slate-400 mt-4 text-sm">
            {isRegisterMode ? 'ئەکاونتت هەیە؟' : 'ئەکاونتت نییە؟'}
            <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="text-blue-400 font-bold mr-2">
              {isRegisterMode ? 'لۆگین بکە' : 'دروستیکە'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      title={activeTab === 'home' ? 'Kuchat Rooms' : activeTab === 'notifications' ? 'ئاگادارییەکان' : activeTab === 'store' ? 'کۆگا' : 'پڕۆفایل'} 
      activeTab={activeTab} 
      onTabChange={(t) => { setActiveTab(t); setCurrentScreen(t as Screen); }}
      hideNav={currentScreen === 'chat'}
    >
      {currentScreen === 'home' && (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-full px-4 border border-slate-700">
               <i className="fas fa-coins text-yellow-500"></i>
               <span className="font-bold">{currentUser?.coins?.toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
              {currentUser?.isAdmin && (
                <button onClick={() => setCurrentScreen('admin')} className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 flex items-center justify-center shadow-lg shadow-red-500/10">
                  <i className="fas fa-user-shield"></i>
                </button>
              )}
              <button onClick={claimBonus} className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 border border-blue-500/50 flex items-center justify-center animate-pulse">
                <i className="fas fa-gift"></i>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-300">ڕوومە چالاکەکان</h3>
            <button onClick={() => setCurrentScreen('create-room')} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
              <i className="fas fa-plus ml-2"></i>دروستکردنی ڕووم
            </button>
          </div>

          <div className="grid gap-4">
            {dbService.getRooms().map(room => (
              <div key={room.id} 
                onClick={() => {
                  if (room.isOfficial && !currentUser?.isAdmin) return alert('ئەم گروپە تەنها بۆ ئەدمینەکانە');
                  setActiveRoom(room); setCurrentScreen('chat');
                }}
                className={`glass p-3 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-blue-500/50 transition-all ${room.isPinned ? 'premium-border ring-1 ring-blue-500/50' : ''}`}
              >
                <div className="relative">
                  <img src={room.photoURL} className="w-14 h-14 rounded-2xl object-cover" />
                  {room.isOfficial && <div className="absolute -top-1 -right-1 bg-blue-500 text-[8px] p-1 rounded-full"><i className="fas fa-check"></i></div>}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold truncate text-sm">{room.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{room.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <i className="fas fa-chevron-left text-slate-700 text-xs"></i>
                   {room.isOfficial && <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold">Official</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentScreen === 'chat' && activeRoom && (
        <ChatScreen room={activeRoom} user={currentUser!} onBack={() => { setCurrentScreen('home'); setActiveTab('home'); }} />
      )}

      {currentScreen === 'create-room' && (
        <CreateRoomScreen user={currentUser!} onCreated={handleCreateRoom} onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'notifications' && (
        <div className="p-4 space-y-4">
          <h3 className="text-xl font-bold">ئاگادارییەکان</h3>
          {dbService.getNotifications().length === 0 ? (
            <div className="py-20 text-center text-slate-600">
               <i className="fas fa-bell-slash text-4xl mb-4 block"></i>
               هیچ ئاگاداریەک نییە
            </div>
          ) : dbService.getNotifications().map(n => (
            <div key={n.id} className="glass p-4 rounded-2xl border-r-4 border-blue-600">
              <h4 className="font-bold text-blue-400 mb-1">{n.title}</h4>
              <p className="text-sm text-slate-300">{n.message}</p>
              <span className="text-[8px] text-slate-500 mt-2 block">{new Date(n.timestamp).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {currentScreen === 'store' && <StoreScreen user={currentUser!} onBack={() => setCurrentScreen('home')} onUpdate={() => setCurrentUser(dbService.login(currentUser!.email))} />}
      {currentScreen === 'profile' && <ProfileScreen user={currentUser!} onBack={() => setCurrentScreen('home')} onUpdate={(u) => { setCurrentUser(u); dbService.updateUser(u.uid, u); }} onLogout={() => { localStorage.removeItem('kuchat_session'); setCurrentScreen('auth'); }} />}
      {currentScreen === 'admin' && currentUser?.isAdmin && <AdminPanel onBack={() => setCurrentScreen('home')} />}
    </Layout>
  );
};

// --- Sub-components (ChatScreen, CreateRoomScreen, etc. remain largely the same, but ensuring admin checks) ---

const ChatScreen: React.FC<{ room: Room, user: User, onBack: () => void }> = ({ room, user, onBack }) => {
  const [messages, setMessages] = useState(dbService.getMessages(room.id));
  const [input, setInput] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setMessages(dbService.getMessages(room.id)), 2000);
    return () => clearInterval(interval);
  }, [room.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    dbService.sendMessage(room.id, {
      senderId: user.uid, senderName: user.displayName, senderPhoto: user.photoURL || DEFAULT_AVATAR,
      isPremiumSender: user.isPremium, text: input, type: 'text'
    });
    setInput('');
    setMessages(dbService.getMessages(room.id));
  };

  const handleImg = (file: File) => {
    const r = new FileReader();
    r.onload = (e) => {
      dbService.sendMessage(room.id, {
        senderId: user.uid, senderName: user.displayName, senderPhoto: user.photoURL || DEFAULT_AVATAR,
        isPremiumSender: user.isPremium, image: e.target?.result as string, type: 'image'
      });
      setMessages(dbService.getMessages(room.id));
    };
    r.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col h-full overflow-hidden">
      <header className="h-16 glass flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800"><i className="fas fa-chevron-right"></i></button>
          <img src={room.photoURL} className="w-10 h-10 rounded-full object-cover" />
          <div className="flex flex-col">
            <h4 className="text-sm font-bold truncate max-w-[120px]">{room.name}</h4>
            <button onClick={() => setShowMembers(true)} className="text-[10px] text-blue-400 text-right">ئەندامەکان</button>
          </div>
        </div>
        {(room.ownerId === user.uid || user.isAdmin) && <button className="w-9 h-9 rounded-full bg-slate-800"><i className="fas fa-cog text-slate-400"></i></button>}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.senderId === user.uid ? 'flex-row-reverse' : ''}`}>
            <div className="relative shrink-0">
               <img src={m.senderPhoto} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
               <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${dbService.getOnlineUsers().find(u => u.uid === m.senderId)?.isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
            </div>
            <div className={`max-w-[75%] ${m.senderId === user.uid ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] font-bold text-slate-500">{m.senderName}</span>
                {m.isPremiumSender && <i className="fas fa-check-circle text-blue-400 text-[10px]"></i>}
              </div>
              <div className={`p-3 rounded-2xl text-sm shadow-md ${m.senderId === user.uid ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'}`}>
                {m.type === 'text' && m.text}
                {m.type === 'image' && <img src={m.image} className="rounded-lg max-w-full" />}
              </div>
              <span className="text-[8px] text-slate-600 mt-1 uppercase">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 glass shrink-0 flex items-center gap-2 border-t border-slate-800/50 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <label className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleImg(e.target.files[0])} />
          <i className="fas fa-image text-slate-400"></i>
        </label>
        <div className="flex-1 relative">
          <input 
            className="w-full h-11 bg-slate-800 rounded-full px-5 outline-none text-sm text-white border border-slate-700 focus:border-blue-500" 
            placeholder="بنوسە..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
        </div>
        <button onClick={send} className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
          <i className="fas fa-paper-plane text-white transform -rotate-45"></i>
        </button>
      </div>

      {showMembers && (
        <div className="absolute inset-0 z-[110] glass flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 w-full max-h-[80%] rounded-3xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">ئەندامەکان</h3>
              <button onClick={() => setShowMembers(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800"><i className="fas fa-times text-slate-400"></i></button>
            </div>
            <div className="space-y-4">
              {dbService.getOnlineUsers().map(u => (
                <div key={u.uid} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <img src={u.photoURL || DEFAULT_AVATAR} className="w-10 h-10 rounded-full border border-slate-700" />
                    <div>
                      <h5 className="text-sm font-bold flex items-center gap-1">{u.displayName} {u.isPremium && <i className="fas fa-check-circle text-blue-400 text-xs"></i>}</h5>
                      <span className="text-[10px] text-slate-500">{u.isOnline ? 'ئۆنلاین' : 'ئۆفلاین'}</span>
                    </div>
                  </div>
                  {u.isAdmin && <span className="text-[8px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded uppercase font-bold">Admin</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ... Rest of the screens remain functionally identical but respect the isAdmin flag.
const CreateRoomScreen: React.FC<{ user: User, onCreated: (name: string, desc: string, img: string) => void, onBack: () => void }> = ({ user, onCreated, onBack }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [img, setImg] = useState('');
  const cost = user.roomsCreatedCount >= 1 ? NEW_ROOM_COST : 0;

  return (
    <div className="p-6 space-y-6">
       <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800"><i className="fas fa-arrow-right"></i></button>
          <h2 className="text-xl font-bold">ڕوومێکی نوێ</h2>
       </div>
       <div className="space-y-4">
          <input className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none text-white border border-slate-700 focus:border-blue-500" placeholder="ناوی ڕووم" value={name} onChange={e => setName(e.target.value)} />
          <textarea className="w-full h-32 bg-slate-800 rounded-2xl px-6 py-4 outline-none text-white resize-none border border-slate-700 focus:border-blue-500" placeholder="دەربارەی ڕووم..." value={desc} onChange={e => setDesc(e.target.value)} />
          <div className="p-4 glass rounded-2xl flex justify-between items-center text-sm">
             <span className="text-slate-400">تێچوو:</span>
             <span className="font-bold text-yellow-500">{user.isAdmin ? 'Free' : cost + ' کۆین'}</span>
          </div>
          <button onClick={() => onCreated(name, desc, img)} className="w-full h-14 bg-blue-600 rounded-2xl text-white font-bold shadow-xl">دروستکردن</button>
       </div>
    </div>
  );
};

const StoreScreen: React.FC<{ user: User, onBack: () => void, onUpdate: () => void }> = ({ user, onUpdate }) => {
  const handleBuyPremium = () => {
    if (user.isPremium) return alert('پێشتر هەتە');
    if (user.coins < PREMIUM_COST) return alert('کۆینت کەمە');
    dbService.updateUser(user.uid, { coins: user.coins - PREMIUM_COST + 1000, isPremium: true });
    onUpdate(); alert('پریمیم چالاککرا!');
  };
  return (
    <div className="p-6 space-y-8">
      <div className="glass p-6 rounded-3xl premium-border shadow-lg">
        <h3 className="text-xl font-bold text-white">ئەندامی پریمیم</h3>
        <p className="text-xs text-slate-400 mt-1 mb-6">سەحی شین + ١٠٠٠ کۆین دیاری</p>
        <button onClick={handleBuyPremium} className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-bold">
          {user.isPremium ? 'چالاکە' : PREMIUM_COST + ' کۆین - بکڕە'}
        </button>
      </div>
      <div className="space-y-4">
        <h4 className="text-lg font-bold">کڕینی کۆین</h4>
        <div className="grid grid-cols-2 gap-4">
          {COIN_PACKS.map(pack => (
            <button key={pack.coins} onClick={() => window.open(TELEGRAM_OWNER, '_blank')} className="glass p-4 rounded-2xl flex flex-col items-center gap-2">
              <i className="fas fa-coins text-yellow-500 text-xl"></i>
              <span className="font-bold">{pack.coins.toLocaleString()}</span>
              <span className="text-[10px] text-blue-400">{pack.price}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProfileScreen: React.FC<{ user: User, onBack: () => void, onUpdate: (u: User) => void, onLogout: () => void }> = ({ user, onUpdate, onLogout }) => {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(user.displayName);
  return (
    <div className="p-6 space-y-8">
       <div className="flex flex-col items-center text-center gap-4">
          <div className="relative">
            <img src={user.photoURL || DEFAULT_AVATAR} className={`w-28 h-28 rounded-3xl object-cover border-4 border-slate-800 ${user.isPremium ? 'ring-2 ring-blue-500' : ''}`} />
            {user.isPremium && <i className="fas fa-check-circle absolute -bottom-2 -right-2 text-blue-400 text-2xl bg-slate-900 rounded-full"></i>}
          </div>
          <div>
            <h3 className="text-2xl font-bold">{user.displayName}</h3>
            <p className="text-slate-500 text-sm">{user.email}</p>
          </div>
       </div>
       <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-4 rounded-2xl text-center"><span className="text-[10px] text-slate-500 block uppercase">کۆین</span><span className="text-lg font-bold text-yellow-500">{user.coins?.toLocaleString()}</span></div>
            <div className="glass p-4 rounded-2xl text-center"><span className="text-[10px] text-slate-500 block uppercase">پلە</span><span className="text-lg font-bold text-blue-400">{user.isAdmin ? 'Admin' : (user.isPremium ? 'Premium' : 'Normal')}</span></div>
          </div>
          {!editing ? (
            <div className="space-y-3 pt-4">
              <button onClick={() => setEditing(true)} className="w-full h-14 glass rounded-2xl flex items-center justify-between px-6 border border-slate-800"><span className="text-slate-300 text-sm">گۆڕینی ناو</span><i className="fas fa-edit text-slate-500 text-xs"></i></button>
              <button onClick={() => window.open(TELEGRAM_OWNER, '_blank')} className="w-full h-14 glass rounded-2xl flex items-center justify-between px-6 border border-slate-800"><span className="text-slate-300 text-sm">پشتیوانی</span><i className="fab fa-telegram text-blue-400 text-xs"></i></button>
              <button onClick={onLogout} className="w-full h-14 bg-red-500/10 text-red-500 rounded-2xl font-bold mt-4 border border-red-500/20 text-sm">چوونە دەرەوە</button>
            </div>
          ) : (
            <div className="space-y-4">
              <input className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none border border-slate-700 text-sm" value={newName} onChange={e => setNewName(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={() => { onUpdate({ ...user, displayName: newName }); setEditing(false); }} className="flex-1 h-12 bg-blue-600 rounded-xl font-bold text-sm">پاشەکەوت</button>
                <button onClick={() => setEditing(false)} className="flex-1 h-12 glass rounded-xl font-bold text-sm">لابردن</button>
              </div>
            </div>
          )}
       </div>
    </div>
  );
};

const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const send = () => {
    if (!title || !msg) return alert('پڕیکەوە');
    dbService.addNotification({ title, message: msg });
    setTitle(''); setMsg(''); alert('نێردرا بۆ هەمووان');
  };
  return (
    <div className="p-6 space-y-6">
       <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800"><i className="fas fa-arrow-right"></i></button>
       <h2 className="text-xl font-bold text-red-500">ئەدمین پەنێڵ</h2>
       <div className="glass p-6 rounded-3xl space-y-4 border border-red-500/20">
          <input className="w-full h-12 bg-slate-800 rounded-xl px-4 outline-none text-white text-sm" placeholder="ناونیشان" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea className="w-full h-24 bg-slate-800 rounded-xl px-4 py-3 outline-none text-white resize-none text-sm" placeholder="نامە..." value={msg} onChange={e => setMsg(e.target.value)} />
          <button onClick={send} className="w-full h-12 bg-red-600 rounded-xl font-bold text-sm shadow-lg shadow-red-900/20">ناردنی گشتی</button>
       </div>
    </div>
  );
};

export default App;
