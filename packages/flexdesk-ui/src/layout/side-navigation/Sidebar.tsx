'use client';

import React, { useState } from 'react';
import {
  Search,
  Settings,
  Users,
  Building2,
  Target,
  ChevronDown,
  User,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  // Local state for collapsible sections
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  // Dummy data
  const workspaceMenuItems: MenuItem[] = [
    { label: 'People', icon: Users },
    { label: 'Companies', icon: Building2 },
    { label: 'Opportunities', icon: Target },
  ];

  const favoriteItems: MenuItem[] = [
    { label: 'Favorite Item 1', icon: Users },
    { label: 'Favorite Item 2', icon: Building2 },
  ];

  const handleMenuItemClick = (label: string) => {
    setActiveItem(label);
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#171717] ${className}`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Fixed Top Section */}
      <div className="flex flex-col gap-2 p-3 pt-3 pb-4">
        <button
          onClick={() => handleMenuItemClick('Search')}
          className={`flex items-center gap-3 h-8 px-2 rounded text-[16px] font-medium transition-colors duration-150 ${
            activeItem === 'Search'
              ? 'bg-[rgba(255,255,255,0.059)] text-[#EBEBEB]'
              : 'text-[#B3B3B3] hover:bg-[rgba(255,255,255,0.059)] hover:text-[#EBEBEB]'
          }`}
        >
          <Search size={16} className="flex-shrink-0" />
          <span>Search</span>
        </button>
        <button
          onClick={() => handleMenuItemClick('Settings')}
          className={`flex items-center gap-3 h-8 px-2 rounded text-[16px] font-medium transition-colors duration-150 ${
            activeItem === 'Settings'
              ? 'bg-[rgba(255,255,255,0.059)] text-[#EBEBEB]'
              : 'text-[#B3B3B3] hover:bg-[rgba(255,255,255,0.059)] hover:text-[#EBEBEB]'
          }`}
        >
          <Settings size={16} className="flex-shrink-0" />
          <span>Settings</span>
        </button>
      </div>

      {/* Scrollable Middle Section */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="flex flex-col gap-3">
          {/* Workspace Section */}
          <div>
            <button
              onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
              className="flex items-center justify-between w-full h-8 px-2 py-1 rounded text-[#666666] text-[16px] font-medium hover:bg-[rgba(255,255,255,0.059)] transition-colors duration-150 cursor-pointer"
            >
              <span>Workspace</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 flex-shrink-0 ${
                  isWorkspaceOpen ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>
            {isWorkspaceOpen && (
              <div className="mt-1 flex flex-col">
                {workspaceMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleMenuItemClick(item.label)}
                      className={`flex items-center gap-3 h-8 px-2 rounded text-[16px] font-medium transition-colors duration-150 ${
                        activeItem === item.label
                          ? 'bg-[rgba(255,255,255,0.059)] text-[#EBEBEB]'
                          : 'text-[#B3B3B3] hover:bg-[rgba(255,255,255,0.059)] hover:text-[#EBEBEB]'
                      }`}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Favorites Section */}
          <div>
            <button
              onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
              className="flex items-center justify-between w-full h-8 px-2 py-1 rounded text-[#666666] text-[16px] font-medium hover:bg-[rgba(255,255,255,0.059)] transition-colors duration-150 cursor-pointer"
            >
              <span>Favorites</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 flex-shrink-0 ${
                  isFavoritesOpen ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>
            {isFavoritesOpen && (
              <div className="mt-1 flex flex-col">
                {favoriteItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleMenuItemClick(item.label)}
                      className={`flex items-center gap-3 h-8 px-2 rounded text-[16px] font-medium transition-colors duration-150 ${
                        activeItem === item.label
                          ? 'bg-[rgba(255,255,255,0.059)] text-[#EBEBEB]'
                          : 'text-[#B3B3B3] hover:bg-[rgba(255,255,255,0.059)] hover:text-[#EBEBEB]'
                      }`}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Section - Profile/User */}
      <div className="border-t border-[rgba(255,255,255,0.1)] p-3 pt-4">
        <div className="flex items-center gap-3 h-8 px-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
            <User size={16} className="text-[#B3B3B3]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[16px] font-medium text-[#EBEBEB] truncate">
              John Doe
            </span>
            <span className="text-[14px] text-[#B3B3B3] truncate">
              john@example.com
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
