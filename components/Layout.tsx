
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  hideNav?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, onBack, hideNav, activeTab, onTabChange }) => {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-900 overflow-hidden relative shadow-2xl">
      {/* Header */}
      {title && (
        <header className="h-16 glass flex items-center justify-between px-4 z-20 shrink-0">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700">
                <i className="fas fa-chevron-right"></i>
              </button>
            )}
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800">
             <i className="fas fa-comment-dots text-blue-400"></i>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Nav */}
      {!hideNav && (
        <nav className="h-16 glass absolute bottom-0 left-0 right-0 flex items-center justify-around px-4 z-20 border-t border-slate-700">
          <button 
            onClick={() => onTabChange?.('home')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-blue-400' : 'text-slate-400'}`}
          >
            <i className="fas fa-home"></i>
            <span className="text-xs">سەرەکی</span>
          </button>
          <button 
             onClick={() => onTabChange?.('notifications')}
             className={`flex flex-col items-center gap-1 ${activeTab === 'notifications' ? 'text-blue-400' : 'text-slate-400'}`}
          >
            <i className="fas fa-bell"></i>
            <span className="text-xs">ئاگاداری</span>
          </button>
          <button 
             onClick={() => onTabChange?.('store')}
             className={`flex flex-col items-center gap-1 ${activeTab === 'store' ? 'text-blue-400' : 'text-slate-400'}`}
          >
            <i className="fas fa-coins"></i>
            <span className="text-xs">کۆین</span>
          </button>
          <button 
             onClick={() => onTabChange?.('profile')}
             className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-blue-400' : 'text-slate-400'}`}
          >
            <i className="fas fa-user"></i>
            <span className="text-xs">پڕۆفایل</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default Layout;
