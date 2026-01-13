
import React, { useState, useEffect, useRef } from 'react';
import { User, Room, Message } from './types';
import { dbService } from './services/mockDb';
import { ADMIN_EMAIL, COIN_PACKS, TELEGRAM_OWNER, PREMIUM_COST, AD_COST, NEW_ROOM_COST, DEFAULT_AVATAR, DEFAULT_ROOM_IMAGE } from './constants';
import Layout from './components/Layout';

// Updated i18n to include store specific translations
const i18n: any = {
    en: { rooms: "Rooms", myRooms: "My Rooms", shop: "Store", profile: "Profile", search: "Search...", create: "Create", placeholder: "Message...", bio: "Bio", update: "Save", editProfile: "Edit Profile", signout: "Logout", members: "Members", delete: "Delete", lang: "Language", leave: "Leave", delConf: "Delete message?", limitErr: "Limit reached!", editGroup: "Edit Group", premium: "Premium Member", verified: "Verified Blue Badge", crown: "Crown Icon & Badge", roomLimit: "Create up to 5 Rooms", bonus: "1000 Coins Bonus", buyCoins: "Buy Coins", buy: "Buy", alreadyActive: "ALREADY ACTIVE", needCoins: "COINS" },
    ku: { rooms: "ڕوومەکان", myRooms: "ڕوومەکانم", shop: "کۆگا", profile: "پڕۆفایل", search: "گەڕان...", create: "دروستکردن", placeholder: "نامە بنوسە...", bio: "بایۆ", update: "پاشەکەوت", editProfile: "دەستکاری پڕۆفایل", signout: "چوونە دەرەوە", members: "ئەندام", delete: "سڕینەوە", lang: "زمان", leave: "دەرچوون", delConf: "ئایا دڵنیای لە سڕینەوەی ئەم نامەیە؟", limitErr: "گەیشتوویتە ئاستی کۆتایی!", editGroup: "دەستکاری گرووپ", premium: "ئەندامی پریمیم", verified: "سەحی شینی فەرمی", crown: "ئایکۆن و تاجی تایبەت", roomLimit: "دروستکردنی ٥ ڕووم", bonus: "١٠٠٠ کۆین وەک دیاری", buyCoins: "کڕینی کۆین", buy: "بکڕە", alreadyActive: "پێشتر چالاک کراوە", needCoins: "کۆین" },
    ar: { rooms: "الغرف", myRooms: "غرفي", shop: "المتجر", profile: "الملف الشخصي", search: "بحث...", create: "إنشاء", placeholder: "اكتب رسالة...", bio: "البايو", update: "حفظ", editProfile: "تعديل الملف", signout: "خروج", members: "أعضاء", delete: "حذف", lang: "اللغة", leave: "مغادرة", delConf: "هل أنت متأكد من حذف هذه الرسالة؟", limitErr: "لقد وصلت للحد!", editGroup: "تعديل المجموعة", premium: "عضوية بريميوم", verified: "علامة التوثيق الزرقاء", crown: "أيقونة وتاج خاص", roomLimit: "إنشاء حتى ٥ غرف", bonus: "١٠٠٠ كوين هدية", buyCoins: "شراء كوينز", buy: "شراء", alreadyActive: "مفعل مسبقاً", needCoins: "كوين" }
};

type Screen = 'splash' | 'auth' | 'home' | 'chat' | 'admin' | 'notifications' | 'store' | 'profile' | 'create-room';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [lang, setLang] = useState('ku');

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
            if (u.email === ADMIN_EMAIL) { u.isAdmin = true; u.isPremium = true; u.coins = 999999; }
            setCurrentUser(u);
            if((u as any).lang) setLang((u as any).lang);
            setCurrentScreen('home');
          } else { setCurrentScreen('auth'); }
        } else { setCurrentScreen('auth'); }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

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
    if (user.email === ADMIN_EMAIL) {
      user.isAdmin = true; user.isPremium = true; user.coins = 999999;
      dbService.updateUser(user.uid, { isAdmin: true, isPremium: true, coins: 999999 });
    }
    setCurrentUser(user);
    if((user as any).lang) setLang((user as any).lang);
    localStorage.setItem('kuchat_session', user.email);
    setCurrentScreen('home');
  };

  const t = i18n[lang] || i18n.ku;

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
          <h2 className="text-3xl font-bold text-white mb-2">{isRegisterMode ? t.create : 'چوونە ژوورەوە'}</h2>
        </div>
        <div className="space-y-4">
          {isRegisterMode && <input className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none text-white" placeholder="ناوی تەواو" onChange={e => setNameInput(e.target.value)} />}
          <input className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none text-white ltr" placeholder="Email" onChange={e => setEmailInput(e.target.value)} />
          <input type="password" dir="ltr" className="w-full h-14 bg-slate-800 rounded-2xl px-6 outline-none text-white" placeholder="Password" onChange={e => setPassInput(e.target.value)} />
          <button onClick={handleAuth} className="w-full h-14 bg-blue-600 rounded-2xl text-white font-bold text-lg shadow-lg uppercase">{isRegisterMode ? t.create : 'Login'}</button>
          <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="w-full text-center text-blue-400 font-bold mt-4">{isRegisterMode ? 'Already have an account?' : 'Create Account'}</button>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      title={activeTab === 'home' ? 'Kuchat' : activeTab === 'notifications' ? t.notifications : activeTab === 'store' ? t.shop : t.profile} 
      activeTab={activeTab} 
      onTabChange={(tab) => { setActiveTab(tab); setCurrentScreen(tab as Screen); }}
      hideNav={currentScreen === 'chat'}
    >
      {currentScreen === 'home' && (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center mb-6">
            <div className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700 flex items-center gap-2">
              <i className="fas fa-coins text-yellow-500"></i>
              <span className="font-bold">{currentUser?.coins?.toLocaleString()}</span>
            </div>
            <button onClick={() => setCurrentScreen('create-room')} className="bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-lg">
              <i className="fas fa-plus ml-2"></i>{t.create}
            </button>
          </div>
          <div className="grid gap-4">
            {dbService.getRooms().map(room => (
              <div key={room.id} onClick={() => { setActiveRoom(room); setCurrentScreen('chat'); }} className="glass p-3 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-blue-500/50 transition-all border border-white/5">
                <img src={room.photoURL} className="w-14 h-14 rounded-2xl object-cover" />
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold truncate text-sm">{room.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{room.description}</p>
                </div>
                <i className="fas fa-chevron-left text-slate-700 text-xs"></i>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentScreen === 'chat' && activeRoom && <ChatScreen room={activeRoom} user={currentUser!} onBack={() => setCurrentScreen('home')} t={t} />}
      {currentScreen === 'store' && <StoreScreen user={currentUser!} t={t} onUpdate={() => setCurrentUser(dbService.login(currentUser!.email))} />}
      {currentScreen === 'profile' && <ProfileScreen user={currentUser!} t={t} setLang={setLang} lang={lang} onUpdate={(u) => { setCurrentUser(u); dbService.updateUser(u.uid, u); }} onLogout={() => { localStorage.removeItem('kuchat_session'); setCurrentScreen('auth'); }} />}
      {currentScreen === 'notifications' && (
        <div className="p-4 space-y-4">
          <h3 className="text-xl font-bold">{t.notifications || 'News'}</h3>
          {dbService.getNotifications().map(n => (
            <div key={n.id} className="glass p-4 rounded-2xl border-r-4 border-blue-600">
              <h4 className="font-bold text-blue-400 mb-1">{n.title}</h4>
              <p className="text-sm text-slate-300">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

// --- CHAT SCREEN ---
const ChatScreen: React.FC<{ room: Room, user: User, onBack: () => void, t: any }> = ({ room, user, onBack, t }) => {
  const [messages, setMessages] = useState(dbService.getMessages(room.id));
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setMessages(dbService.getMessages(room.id)), 2000);
    return () => clearInterval(interval);
  }, [room.id]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    dbService.sendMessage(room.id, {
      senderId: user.uid, senderName: user.displayName, senderPhoto: user.photoURL || DEFAULT_AVATAR,
      isPremiumSender: user.isPremium, text: input, type: 'text'
    });
    setInput('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col h-full">
      <header className="h-16 glass flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800"><i className="fas fa-chevron-right"></i></button>
          <img src={room.photoURL} className="w-10 h-10 rounded-full object-cover" />
          <h4 className="text-sm font-bold truncate max-w-[150px]">{room.name}</h4>
        </div>
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.senderId === user.uid ? 'flex-row-reverse' : ''}`}>
            <img src={m.senderPhoto} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
            <div className={`max-w-[75%] ${m.senderId === user.uid ? 'items-end' : 'items-start'} flex flex-col`}>
              <span className="text-[10px] font-bold text-slate-500 mb-1">{m.senderName}</span>
              <div className={`p-3 rounded-2xl text-sm ${m.senderId === user.uid ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'}`}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 glass flex items-center gap-2 safe-bottom">
        <input className="flex-1 h-11 bg-slate-800 rounded-full px-5 outline-none text-sm text-white border border-slate-700" placeholder={t.placeholder} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center shadow-lg"><i className="fas fa-paper-plane text-white"></i></button>
      </div>
    </div>
  );
};

// --- STORE SCREEN (FIXED FOR MULTI-LANGUAGE) ---
const StoreScreen: React.FC<{ user: User, t: any, onUpdate: () => void }> = ({ user, t, onUpdate }) => {
  const handleBuyPremium = () => {
    if (user.isPremium) return alert(t.alreadyActive);
    if (user.coins < PREMIUM_COST) return alert(t.needCoins);
    dbService.updateUser(user.uid, { coins: user.coins - PREMIUM_COST + 1000, isPremium: true });
    onUpdate(); alert(t.premium + ' ' + t.update);
  };
  return (
    <div className="p-6 space-y-8">
      <div className="premium-card">
        <div className="premium-inner p-8 text-center">
            <i className="fas fa-crown text-5xl text-blue-400 mb-6 block animate-bounce"></i>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{t.premium}</h3>
            <ul className="text-[11px] text-slate-400 mt-4 mb-8 space-y-2 uppercase font-black text-center">
                <li><i className="fas fa-check text-blue-400 mr-2"></i> {t.verified}</li>
                <li><i className="fas fa-check text-blue-400 mr-2"></i> {t.crown}</li>
                <li><i className="fas fa-check text-blue-400 mr-2"></i> {t.roomLimit}</li>
                <li><i className="fas fa-check text-blue-400 mr-2"></i> {t.bonus}</li>
            </ul>
            <button onClick={handleBuyPremium} className={`w-full h-14 rounded-2xl font-black uppercase active:scale-95 transition-all ${user.isPremium ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'}`}>
                {user.isPremium ? t.alreadyActive : PREMIUM_COST + ' ' + t.needCoins}
            </button>
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="text-lg font-bold">{t.buyCoins}</h4>
        <div className="grid grid-cols-2 gap-4">
          {COIN_PACKS.map(pack => (
            <button key={pack.coins} onClick={() => window.open(TELEGRAM_OWNER, '_blank')} className="glass p-5 rounded-3xl flex flex-col items-center gap-2 border border-white/5 active:scale-95">
              <i className="fas fa-coins text-yellow-500 text-xl"></i>
              <span className="font-bold">{pack.coins.toLocaleString()}</span>
              <span className="text-[10px] text-blue-400 font-bold">{pack.price}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- PROFILE SCREEN ---
const ProfileScreen: React.FC<{ user: User, t: any, lang: string, setLang: (l: string) => void, onUpdate: (u: User) => void, onLogout: () => void }> = ({ user, t, lang, setLang, onUpdate, onLogout }) => {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(user.displayName);

  const handleLang = (l: string) => {
    setLang(l);
    dbService.updateUser(user.uid, { lang: l } as any);
  };

  return (
    <div className="p-6 space-y-8">
       <div className="flex flex-col items-center text-center gap-4">
          <img src={user.photoURL || DEFAULT_AVATAR} className={`w-28 h-28 rounded-3xl object-cover border-4 border-slate-800 ${user.isPremium ? 'ring-2 ring-blue-500' : ''}`} />
          <h3 className="text-2xl font-bold">{user.displayName}</h3>
       </div>
       <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-4 rounded-2xl text-center"><span className="text-[10px] text-slate-500 block uppercase">{t.needCoins}</span><span className="text-lg font-bold text-yellow-500">{user.coins?.toLocaleString()}</span></div>
            <div className="glass p-4 rounded-2xl text-center"><span className="text-[10px] text-slate-500 block uppercase">Rank</span><span className="text-lg font-bold text-blue-400">{user.isAdmin ? 'Admin' : (user.isPremium ? 'Premium' : 'Normal')}</span></div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs text-slate-500 font-bold px-1">{t.lang}</label>
            <div className="grid grid-cols-3 gap-2">
              {['ku', 'ar', 'en'].map(l => (
                <button key={l} onClick={() => handleLang(l)} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${lang === l ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}>
                  {l === 'ku' ? 'کوردی' : l === 'ar' ? 'عربي' : 'English'}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setEditing(!editing)} className="w-full h-14 glass rounded-2xl flex items-center justify-between px-6 border border-slate-800">
            <span className="text-slate-300 text-sm">{t.editProfile}</span><i className="fas fa-edit text-slate-500 text-xs"></i>
          </button>
          
          {editing && (
            <div className="space-y-3 p-4 glass rounded-2xl">
              <input className="w-full h-11 bg-slate-800 rounded-xl px-4 outline-none text-white text-sm" value={newName} onChange={e => setNewName(e.target.value)} />
              <button onClick={() => { onUpdate({ ...user, displayName: newName }); setEditing(false); }} className="w-full h-11 bg-blue-600 rounded-xl font-bold text-sm">{t.update}</button>
            </div>
          )}

          <button onClick={onLogout} className="w-full h-14 bg-red-500/10 text-red-500 rounded-2xl font-bold border border-red-500/20 text-sm">{t.signout}</button>
       </div>
    </div>
  );
};

export default App;
