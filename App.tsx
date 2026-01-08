
import React, { useState, useEffect } from 'react';
import { User, Room } from './types';
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

  // Auth Inputs
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Splash logic
  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        const saved = localStorage.getItem('kuchat_session');
        if (saved) {
          const u = dbService.login(saved);
          if (u) {
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

  // Online status heartbeat
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        dbService.updateUser(currentUser.uid, { lastActive: Date.now() });
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleAuth = () => {
    if (!emailInput || !passInput) return alert('تکایە هەموو خانەکان پڕ بکەرەوە');
    
    if (isRegisterMode) {
      if (!nameInput) return alert('ناو بنوسە');
      const newUser = dbService.register(emailInput, passInput, nameInput);
      login(newUser);
    } else {
      const user = dbService.login(emailInput);
      if (user) {
        login(user);
      } else {
        alert('ئەم ئیمێڵە بونی نیە');
      }
    }
  };

  const login = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('kuchat_session', user.email);
    setCurrentScreen('home');
  };

  const handleCreateRoom = (name: string, desc: string, img: string) => {
    if (!currentUser) return;
    
    const rooms = dbService.getRooms();
    const exists = rooms.find(r => r.name === name);
    if (exists) return alert('ئەم ناوە پێشتر بەکارهاتووە');

    const cost = currentUser.roomsCreatedCount >= 1 ? NEW_ROOM_COST : 0;
    if (currentUser.coins < cost) return alert('کۆینی پێویستت نیە');

    dbService.createRoom({
      name,
      description: desc,
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName,
      photoURL: img || DEFAULT_ROOM_IMAGE
    });

    dbService.updateUser(currentUser.uid, {
      coins: currentUser.coins - cost,
      roomsCreatedCount: currentUser.roomsCreatedCount + 1
    });

    // Refresh user state
    const updated = dbService.login(currentUser.email);
    setCurrentUser(updated);
    setCurrentScreen('home');
  };

  const claimBonus = () => {
    if (!currentUser) return;
    const now = Date.now();
    const last = currentUser.dailyBonusLastClaimed || 0;
    if (now - last < 86400000) return alert('تۆ ئەمڕۆ خەڵاتت وەرگرتووە! بەیانی وەرەوە');
    
    dbService.updateUser(currentUser.uid, {
      coins: currentUser.coins + 1,
      dailyBonusLastClaimed: now
    });
    const updated = dbService.login(currentUser.email);
    setCurrentUser(updated);
    alert('یەک کۆینت وەرگرت!');
  };

  // Rendering logic
  if (currentScreen === 'splash') {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 overflow-hidden">
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
      <div className="h-screen w-screen max-w-md mx-auto bg-slate-900 p-8 flex flex-col justify-center">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">{isRegisterMode ? 'دروستکردنی ئەکاونت' : 'چوونە ژوورەوە'}</h2>
          <p className="text-slate-400">بەخێربێیت بۆ جیهانی کوچات</p>
        </div>

        <div className="space-y-4">
          {isRegisterMode && (
            <input 
              className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none focus:ring-2 ring-blue-500 text-white" 
              placeholder="ناوی تەواو"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
            />
          )}
          <input 
            className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none focus:ring-2 ring-blue-500 text-white" 
            placeholder="ئیمێڵ" 
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
          />
          <input 
            type="password"
            className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none focus:ring-2 ring-blue-500 text-white" 
            placeholder="ڕەمز"
            value={passInput}
            onChange={e => setPassInput(e.target.value)}
          />
          <button 
            onClick={handleAuth}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white font-bold text-lg shadow-lg"
          >
            {isRegisterMode ? 'تۆمارکردن' : 'بچۆرە ژوورەوە'}
          </button>
          
          <p className="text-center text-slate-400 mt-4">
            {isRegisterMode ? 'ئەکاونتت هەیە؟' : 'ئەکاونتت نییە؟'}
            <button 
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-blue-400 font-bold mr-2"
            >
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
      onTabChange={(t) => {
        setActiveTab(t);
        setCurrentScreen(t as Screen);
      }}
    >
      {currentScreen === 'home' && (
        <div className="p-4 space-y-4">
          {/* Header Stats */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-full px-4 border border-slate-700">
               <i className="fas fa-coins text-yellow-500"></i>
               <span className="font-bold">{currentUser?.coins}</span>
            </div>
            <div className="flex gap-2">
              {currentUser?.email === ADMIN_EMAIL && (
                <button onClick={() => setCurrentScreen('admin')} className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 flex items-center justify-center">
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
            <button 
              onClick={() => setCurrentScreen('create-room')}
              className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg"
            >
              <i className="fas fa-plus ml-2"></i>
              دروستکردنی ڕووم
            </button>
          </div>

          <div className="grid gap-4">
            {dbService.getRooms().map(room => (
              <div 
                key={room.id} 
                onClick={() => {
                  if (room.isOfficial && currentUser?.email !== ADMIN_EMAIL) {
                    return alert('ئەم گروپە تەنها بۆ ئەدمینەکانە');
                  }
                  setActiveRoom(room);
                  setCurrentScreen('chat');
                }}
                className={`glass p-3 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-blue-500/50 transition-all ${room.isPinned ? 'premium-border ring-1 ring-blue-500/50' : ''}`}
              >
                <div className="relative">
                  <img src={room.photoURL} className="w-14 h-14 rounded-2xl object-cover" alt="" />
                  {room.isOfficial && <div className="absolute -top-1 -right-1 bg-blue-500 text-[8px] p-1 rounded-full"><i className="fas fa-check"></i></div>}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold truncate">{room.name}</h4>
                    {room.isPinned && <i className="fas fa-star text-yellow-500 text-xs"></i>}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{room.description}</p>
                </div>
                <div className="text-xs text-slate-500 flex flex-col items-end">
                   <span>جۆین</span>
                   <i className="fas fa-chevron-left mt-1"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentScreen === 'chat' && activeRoom && (
        <ChatScreen room={activeRoom} user={currentUser!} onBack={() => {
           setCurrentScreen('home');
           setActiveTab('home');
        }} />
      )}

      {currentScreen === 'create-room' && (
        <CreateRoomScreen user={currentUser!} onCreated={handleCreateRoom} onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'notifications' && (
        <div className="p-4 space-y-4">
          <h3 className="text-xl font-bold">ئاگادارییەکان</h3>
          {dbService.getNotifications().length === 0 ? (
            <div className="text-center py-20 text-slate-500">هیچ ئاگاداریەک نییە</div>
          ) : (
            dbService.getNotifications().map(n => (
              <div key={n.id} className="glass p-4 rounded-2xl border-r-4 border-blue-500">
                <h4 className="font-bold text-blue-400 mb-1">{n.title}</h4>
                <p className="text-sm text-slate-300">{n.message}</p>
                <span className="text-[10px] text-slate-500 block mt-2">{new Date(n.timestamp).toLocaleString('ku-IQ')}</span>
              </div>
            ))
          )}
        </div>
      )}

      {currentScreen === 'store' && (
        <StoreScreen user={currentUser!} onBack={() => setCurrentScreen('home')} onUpdate={() => setCurrentUser(dbService.login(currentUser!.email))} />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen user={currentUser!} onBack={() => setCurrentScreen('home')} onUpdate={(u) => {
           setCurrentUser(u);
           dbService.updateUser(u.uid, u);
        }} onLogout={() => {
           localStorage.removeItem('kuchat_session');
           setCurrentScreen('auth');
        }} />
      )}

      {currentScreen === 'admin' && currentUser?.email === ADMIN_EMAIL && (
        <AdminPanel onBack={() => setCurrentScreen('home')} />
      )}
    </Layout>
  );
};

// --- Sub-components ---

const ChatScreen: React.FC<{ room: Room, user: User, onBack: () => void }> = ({ room, user, onBack }) => {
  const [messages, setMessages] = useState(dbService.getMessages(room.id));
  const [input, setInput] = useState('');
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(dbService.getMessages(room.id));
    }, 2000);
    return () => clearInterval(interval);
  }, [room.id]);

  const send = () => {
    if (!input.trim()) return;
    dbService.sendMessage(room.id, {
      senderId: user.uid,
      senderName: user.displayName,
      senderPhoto: user.photoURL || DEFAULT_AVATAR,
      isPremiumSender: user.isPremium,
      text: input,
      type: 'text'
    });
    setInput('');
    setMessages(dbService.getMessages(room.id));
  };

  const compressAndSendImage = (file: File) => {
    // Basic compression logic representation
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      dbService.sendMessage(room.id, {
        senderId: user.uid,
        senderName: user.displayName,
        senderPhoto: user.photoURL || DEFAULT_AVATAR,
        isPremiumSender: user.isPremium,
        image: base64,
        type: 'image'
      });
      setMessages(dbService.getMessages(room.id));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col h-full overflow-hidden">
      <header className="h-16 glass flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700">
            <i className="fas fa-chevron-right"></i>
          </button>
          <img src={room.photoURL} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h4 className="text-sm font-bold truncate w-32">{room.name}</h4>
            <button onClick={() => setShowMembers(true)} className="text-[10px] text-blue-400">بینینی ئەندامەکان</button>
          </div>
        </div>
        <div className="flex gap-2">
          {room.ownerId === user.uid && (
            <button className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400">
              <i className="fas fa-cog"></i>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.senderId === user.uid ? 'flex-row-reverse' : ''}`}>
            <div className="relative shrink-0">
               <img src={m.senderPhoto} className="w-8 h-8 rounded-full" />
               <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${dbService.getOnlineUsers().find(u => u.uid === m.senderId)?.isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
            </div>
            <div className={`max-w-[75%] ${m.senderId === user.uid ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] font-bold text-slate-400">{m.senderName}</span>
                {m.isPremiumSender && <i className="fas fa-check-circle text-blue-400 text-[10px]"></i>}
              </div>
              <div className={`p-3 rounded-2xl text-sm ${m.senderId === user.uid ? 'bg-blue-600 rounded-tr-none' : 'glass rounded-tl-none'}`}>
                {m.type === 'text' && m.text}
                {m.type === 'image' && <img src={m.image} className="rounded-lg max-w-full" />}
                {m.type === 'voice' && <div className="flex items-center gap-2"><i className="fas fa-play"></i><span>0:05</span></div>}
              </div>
              <span className="text-[8px] text-slate-500 mt-1">{new Date(m.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 glass shrink-0 flex items-center gap-2">
        <label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && compressAndSendImage(e.target.files[0])} />
          <i className="fas fa-image text-slate-400 hover:text-blue-400 text-xl"></i>
        </label>
        <button className="text-slate-400 hover:text-blue-400 text-xl"><i className="fas fa-microphone"></i></button>
        <input 
          className="flex-1 bg-slate-800 rounded-full px-4 h-10 outline-none text-sm" 
          placeholder="بنوسە..." 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button onClick={send} className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
          <i className="fas fa-paper-plane text-white"></i>
        </button>
      </div>

      {showMembers && (
        <div className="absolute inset-0 z-[60] glass flex items-center justify-center p-6">
          <div className="bg-slate-800 w-full max-h-[70%] rounded-3xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">ئەندامەکانی ڕووم</h3>
              <button onClick={() => setShowMembers(false)}><i className="fas fa-times text-slate-400"></i></button>
            </div>
            <div className="space-y-4">
              {dbService.getOnlineUsers().map(u => (
                <div key={u.uid} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={u.photoURL || DEFAULT_AVATAR} className="w-10 h-10 rounded-full" />
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${u.isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold flex items-center gap-1">
                        {u.displayName}
                        {u.isPremium && <i className="fas fa-check-circle text-blue-400 text-xs"></i>}
                      </h5>
                      <span className="text-[10px] text-slate-500">{u.isOnline ? 'ئۆنلاین' : 'ئۆفلاین'}</span>
                    </div>
                  </div>
                  {u.uid === room.ownerId && <span className="text-[8px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">خاوەن ڕووم</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateRoomScreen: React.FC<{ user: User, onCreated: (name: string, desc: string, img: string) => void, onBack: () => void }> = ({ user, onCreated, onBack }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [img, setImg] = useState('');

  const cost = user.roomsCreatedCount >= 1 ? NEW_ROOM_COST : 0;

  return (
    <div className="p-6 space-y-6">
       <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800"><i className="fas fa-arrow-right"></i></button>
          <h2 className="text-xl font-bold">ڕوومێکی نوێ دروستکە</h2>
       </div>

       <div className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-3xl bg-slate-800 flex items-center justify-center overflow-hidden">
               {img ? <img src={img} className="w-full h-full object-cover" /> : <i className="fas fa-camera text-2xl text-slate-600"></i>}
            </div>
            <button onClick={() => setImg(`https://picsum.photos/seed/${Math.random()}/400/300`)} className="text-blue-400 text-xs font-bold underline">گۆڕینی وێنە</button>
          </div>

          <input className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none text-white" placeholder="ناوی ڕووم" value={name} onChange={e => setName(e.target.value)} />
          <textarea className="w-full h-32 bg-slate-800 rounded-2xl px-6 py-4 outline-none text-white resize-none" placeholder="دەربارەی ڕووم (بایۆ)" value={desc} onChange={e => setDesc(e.target.value)} />
          
          <div className="p-4 glass rounded-2xl flex justify-between items-center text-sm">
             <span className="text-slate-400">تێچووی دروستکردن:</span>
             <span className="font-bold text-yellow-500">{cost} کۆین</span>
          </div>

          <button 
            onClick={() => onCreated(name, desc, img)}
            className="w-full h-14 bg-blue-600 rounded-2xl text-white font-bold"
          >
            دروستکردن
          </button>
       </div>
    </div>
  );
};

const StoreScreen: React.FC<{ user: User, onBack: () => void, onUpdate: () => void }> = ({ user, onUpdate }) => {
  
  const handleBuyPremium = () => {
    if (user.isPremium) return alert('تۆ پێشتر پریمیمت هەیە');
    if (user.coins < PREMIUM_COST) return alert('کۆینی پێویستت نییە');
    
    dbService.updateUser(user.uid, {
      coins: user.coins - PREMIUM_COST + 1000, // Cost is 10k, user gets 1000 gift
      isPremium: true
    });
    onUpdate();
    alert('پریمیم چالاککرا! ١٠٠٠ کۆینت بە دیاری وەرگرت');
  };

  const handleBoost = () => {
    if (user.coins < AD_COST) return alert('کۆینی پێویستت نییە');
    // Simulated ad boost logic: user picks a room they own
    const userRoom = dbService.getRooms().find(r => r.ownerId === user.uid);
    if (!userRoom) return alert('تۆ هیچ ڕوومێکت نییە بۆ ڕێکلامکردن');
    
    dbService.updateRoom(userRoom.id, { isPinned: true });
    dbService.updateUser(user.uid, { coins: user.coins - AD_COST });
    onUpdate();
    alert('ڕوومەکەت چوو بۆ لیستی یەکەم!');
  };

  return (
    <div className="p-6 space-y-8">
      <div className="glass p-6 rounded-3xl premium-border">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">ئەندامی پریمیم</h3>
            <p className="text-xs text-slate-400 mt-1">سەحی شین + ١٠٠٠ کۆین دیاری</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-blue-400">١٠،٠٠٠</span>
            <span className="text-[10px] block text-slate-500">کۆین</span>
          </div>
        </div>
        <button 
          onClick={handleBuyPremium}
          className="w-full mt-6 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-bold"
        >
          {user.isPremium ? 'کڕدراوە' : 'ئێستا بکڕە'}
        </button>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-bold">کڕینی کۆین</h4>
        <div className="grid grid-cols-2 gap-4">
          {COIN_PACKS.map(pack => (
            <button 
              key={pack.coins}
              onClick={() => window.open(TELEGRAM_OWNER, '_blank')}
              className="glass p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <i className="fas fa-coins text-yellow-500 text-xl"></i>
              <span className="font-bold">{pack.coins.toLocaleString()}</span>
              <span className="text-[10px] text-blue-400">{pack.price}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass p-6 rounded-3xl">
        <h3 className="text-lg font-bold mb-2">ڕێکلام بۆ ڕووم</h3>
        <p className="text-xs text-slate-400 mb-4">ڕوومەکەت دەکەینە لیستی یەکەمی ئەپڵیکەیشن بۆ ئەوەی زیاتر ببینرێت</p>
        <button 
          onClick={handleBoost}
          className="w-full h-12 border border-slate-700 rounded-xl text-slate-300 font-bold hover:bg-slate-800"
        >
          {AD_COST.toLocaleString()} کۆین - بکڕە
        </button>
      </div>
    </div>
  );
};

const ProfileScreen: React.FC<{ user: User, onBack: () => void, onUpdate: (u: User) => void, onLogout: () => void }> = ({ user, onUpdate, onLogout }) => {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(user.displayName);
  const [newPass, setNewPass] = useState('');

  const save = () => {
    onUpdate({ ...user, displayName: newName });
    setEditing(false);
    alert('گۆڕانکارییەکان سەرکەوتووبوو');
  };

  return (
    <div className="p-6">
       <div className="flex flex-col items-center text-center gap-4 mb-8">
          <div className="relative">
            <img src={user.photoURL || DEFAULT_AVATAR} className={`w-28 h-28 rounded-3xl object-cover border-4 border-slate-800 ${user.isPremium ? 'ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''}`} />
            {user.isPremium && <i className="fas fa-check-circle absolute -bottom-2 -right-2 text-blue-400 text-2xl bg-slate-900 rounded-full"></i>}
          </div>
          <div>
            <h3 className="text-2xl font-bold">{user.displayName}</h3>
            <p className="text-slate-500 text-sm">{user.email}</p>
          </div>
       </div>

       <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass p-4 rounded-2xl text-center">
              <span className="text-[10px] text-slate-500 block uppercase mb-1">کۆینەکان</span>
              <span className="text-lg font-bold text-yellow-500">{user.coins.toLocaleString()}</span>
            </div>
            <div className="glass p-4 rounded-2xl text-center">
              <span className="text-[10px] text-slate-500 block uppercase mb-1">جۆری ئەکاونت</span>
              <span className={`text-lg font-bold ${user.isPremium ? 'text-blue-400' : 'text-slate-400'}`}>{user.isPremium ? 'پریمیم' : 'سادە'}</span>
            </div>
          </div>

          {!editing ? (
            <div className="space-y-3">
              <button onClick={() => setEditing(true)} className="w-full h-14 glass rounded-2xl flex items-center justify-between px-6">
                <span className="text-slate-300">گۆڕینی ناوی پڕۆفایل</span>
                <i className="fas fa-edit text-slate-500"></i>
              </button>
              <button onClick={() => setEditing(true)} className="w-full h-14 glass rounded-2xl flex items-center justify-between px-6">
                <span className="text-slate-300">گۆڕینی ڕەمز</span>
                <i className="fas fa-lock text-slate-500"></i>
              </button>
              <button onClick={() => window.open(TELEGRAM_OWNER, '_blank')} className="w-full h-14 glass rounded-2xl flex items-center justify-between px-6 text-slate-300">
                <span>پەیوەندی بە پڕۆگرامەر</span>
                <i className="fab fa-telegram text-blue-400"></i>
              </button>
              <div className="pt-6 text-center text-[10px] text-slate-600">
                دروستکراوە لەلایەن Anatoly Programmer <br/> هەموو مافەکان پارێزراوە ٢٠٢٦
              </div>
              <button onClick={onLogout} className="w-full h-14 bg-red-500/10 text-red-500 rounded-2xl font-bold mt-4">چوونە دەرەوە</button>
            </div>
          ) : (
            <div className="space-y-4">
              <input className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none" value={newName} onChange={e => setNewName(e.target.value)} placeholder="ناوی نوێ" />
              <input type="password" className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="ڕەمزی نوێ" />
              <div className="flex gap-4">
                <button onClick={save} className="flex-1 h-14 bg-blue-600 rounded-2xl font-bold">پاشەکەوتکردن</button>
                <button onClick={() => setEditing(false)} className="flex-1 h-14 glass rounded-2xl font-bold">پەشیمانبوونەوە</button>
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

  const sendNotif = () => {
    if (!title || !msg) return alert('هەموو پڕ بکەرەوە');
    dbService.addNotification({ title, message: msg });
    setTitle('');
    setMsg('');
    alert('ئاگاداری نێردرا بۆ هەمووان');
  };

  return (
    <div className="p-6 space-y-6">
       <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800"><i className="fas fa-arrow-right"></i></button>
          <h2 className="text-xl font-bold text-red-500">بەڕێوەبەرایەتی</h2>
       </div>

       <div className="glass p-6 rounded-3xl space-y-4">
          <h3 className="font-bold">ناردنی ئاگاداری گشتی</h3>
          <input className="w-full h-12 bg-slate-800 rounded-xl px-4 outline-none text-sm" placeholder="ناونیشان" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea className="w-full h-24 bg-slate-800 rounded-xl px-4 py-3 outline-none text-sm resize-none" placeholder="نامەکە" value={msg} onChange={e => setMsg(e.target.value)} />
          <button onClick={sendNotif} className="w-full h-12 bg-red-600 rounded-xl font-bold text-white shadow-lg">ناردن</button>
       </div>

       <div className="space-y-4">
          <h3 className="font-bold">ئاماری گشتی</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-4 rounded-2xl">
              <span className="text-xs text-slate-500">یوزەرەکان</span>
              <p className="text-xl font-bold">{dbService.getOnlineUsers().length}</p>
            </div>
            <div className="glass p-4 rounded-2xl">
              <span className="text-xs text-slate-500">ڕوومەکان</span>
              <p className="text-xl font-bold">{dbService.getRooms().length}</p>
            </div>
          </div>
       </div>
    </div>
  );
};

export default App;
