import React from 'react';
import { ViewState, UserProfile } from '../types';
import { NAV_ITEMS } from '../constants';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  userProfile: UserProfile;
  onOpenConvocation: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userProfile, onOpenConvocation, onLogout }) => {

  return (
    <aside className="w-64 bg-secondary text-white flex flex-col h-full flex-shrink-0 transition-all duration-300">
      <div className="p-6">
        {/* Custom Logo Implementation */}
        <div className="flex items-center gap-0.5 select-none cursor-pointer" onClick={() => onChangeView('dashboard')}>
          <span className="text-3xl font-bold text-primary tracking-tighter font-display">Easy</span>
          <div className="relative flex items-center">
            <span className="text-3xl font-bold text-white tracking-tighter font-display">AS</span>
            {/* Pulse line decoration overlay for the A */}
            <svg className="absolute left-[3px] top-[16px] w-5 h-3 text-primary pointer-events-none opacity-90" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 5 H4 L7 1 L11 9 L14 5 H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="ml-1 mb-1 flex items-center justify-center w-8 h-8 rounded-full bg-primary shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-[1.5rem] font-bold leading-none">check</span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === item.id
              ? 'bg-white/10 text-white shadow-sm border-l-4 border-primary'
              : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={onOpenConvocation}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-[1.25rem]">add</span>
          Nova Convocação
        </button>

        <div className="mt-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-primary flex-shrink-0"
              style={{ backgroundImage: `url('${userProfile.photoUrl}')` }}
            ></div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate text-left">{userProfile.name}</span>
              <span className="text-xs text-gray-400 text-left">Admin</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sair da conta"
            className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[1.25rem]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;