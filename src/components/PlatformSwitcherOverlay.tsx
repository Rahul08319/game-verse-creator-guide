import React, { useState } from 'react';
import { PLATFORMS_CATALOG, setPlatformOverride, adapter } from '../platforms';
import { Haptics } from '../utils/haptics';
import { SoundManager } from '../utils/soundManager';

interface PlatformSwitcherOverlayProps {
  onClose: () => void;
  onPlatformChanged?: (platformId: string) => void;
}

export const PlatformSwitcherOverlay: React.FC<PlatformSwitcherOverlayProps> = ({
  onClose,
  onPlatformChanged,
}) => {
  const currentPlatformId = adapter.platform;
  const [selectedId, setSelectedId] = useState<string>(currentPlatformId);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'social' | 'web' | 'store'>('all');

  const filtered = PLATFORMS_CATALOG.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'video') return matchesSearch && p.category === 'Video & Streaming';
    if (activeTab === 'social') return matchesSearch && p.category === 'Social & Chat';
    if (activeTab === 'web') return matchesSearch && p.category === 'Web Portals';
    if (activeTab === 'store') return matchesSearch && (p.category === 'Desktop & OS' || p.category === 'Quick Apps' || p.category === 'Regional & Telecom');
    return matchesSearch;
  });

  const handleSelect = (id: string) => {
    Haptics.pop();
    SoundManager.attach();
    setSelectedId(id);
    setPlatformOverride(id);
    if (onPlatformChanged) {
      onPlatformChanged(id);
    }
  };

  const handleLaunchMode = (id: string) => {
    handleSelect(id);
    onClose();
    // Reload with query param to ensure full clean lifecycle re-init
    const url = new URL(window.location.href);
    url.searchParams.set('platform', id);
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[2rem] glass-heavy border border-white/20 shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-cyan-500 flex items-center justify-center text-xl shadow-lg shadow-pink-500/25">
              
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">Platform Universe</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  13 Editions
                </span>
              </div>
              <p className="text-xs text-white/60">
                Native integrations without Playgama SDK — YouTube, Poki, Facebook, Discord & more
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              Haptics.pop();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all press-scale"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="px-6 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/20">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: 'all', label: 'All Platforms (13)' },
              { id: 'video', label: '▶️ YouTube' },
              { id: 'social', label: '💬 Social & Chat' },
              { id: 'web', label: '🕹️ Web Portals' },
              { id: 'store', label: '🪟 Stores & Telecom' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  Haptics.pop();
                  setActiveTab(tab.id as any);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all press-scale whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-black shadow-md'
                    : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="Search platform..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 pl-8 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <span className="absolute left-2.5 top-2 text-white/40 text-xs">🔍</span>
          </div>
        </div>

        {/* Platforms Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isCurrent = currentPlatformId === item.id;
            const isSelected = selectedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`group relative p-4 rounded-2xl glass transition-all cursor-pointer flex flex-col justify-between border ${
                  isSelected
                    ? 'border-cyan-400/80 bg-white/[0.12] shadow-xl shadow-cyan-500/10 scale-[1.02]'
                    : isCurrent
                    ? 'border-pink-500/60 bg-white/[0.08]'
                    : 'border-white/10 hover:border-white/25 hover:bg-white/[0.10]'
                } press-scale`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1.5 rounded-xl bg-white/10 border border-white/10">
                        {item.icon}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                          {item.name}
                          {isCurrent && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </h3>
                        <span className="text-[10px] text-white/50">{item.category}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-white/70 line-clamp-2 mb-3">
                    {item.tagline}
                  </p>

                  {/* Capabilities Badges */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.capabilities.cloudSave && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">
                        ☁️ Cloud Save
                      </span>
                    )}
                    {item.capabilities.rewardedAds && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                        🎁 Rewarded Ads
                      </span>
                    )}
                    {item.capabilities.interstitialAds && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25">
                        📺 Mid-Roll
                      </span>
                    )}
                    {item.capabilities.scoreLeaderboard && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-300 border border-pink-500/25">
                        🏆 Leaderboard
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-white/40">Pure Native SDK</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLaunchMode(item.id);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-md'
                        : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {isCurrent ? 'Current Mode' : 'Switch & Play'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3.5 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Active Engine: <strong className="text-white capitalize">{currentPlatformId}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Rahul08319/game-verse-creator-guide"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              GitHub Source ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
