import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNotificationsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onNotificationsClick }) => {
  return (
    <header className="bg-white border-b border-gray-100 h-16 px-8 flex items-center justify-between shrink-0 z-10">
      <div>
        <h2 className="text-xl font-bold text-secondary tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-6">
        {/* Search - Removed as per request */}


        {/* Notifications */}
        <button
          onClick={onNotificationsClick}
          className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors group"
        >
          <span className="material-symbols-outlined group-hover:text-secondary transition-colors">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-status-danger rounded-full border border-white animate-pulse"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;