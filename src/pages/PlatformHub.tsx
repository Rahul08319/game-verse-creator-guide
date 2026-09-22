import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLATFORMS_CATALOG, setPlatformOverride, adapter } from '../platforms';
import { Haptics } from '../utils/haptics';
import { SoundManager } from '../utils/soundManager';

const PlatformHub: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlatform, setSelectedPlatform] = useState(
    PLATFORMS_CATALOG.find((p) => p.id === adapter.platform) || PLATFORMS_CATALOG[0]
  );
  const [testLog, setTestLog] = useState<string[]>([]);
  const [isSimulatingAd, setIsSimulatingAd] = useState(false);

  const addLog = (msg: string) => {
    setTestLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const handleLaunch = (platformId: string) => {
    Haptics.levelUp();
    SoundManager.celebration();
    setPlatformOverride(platformId);
    navigate(`/?platform=${platformId}`);
  };

  const handleTestInterstitial = async () => {
    Haptics.pop();
    addLog(`Testing Interstitial Ad on [${selectedPlatform.name}]...`);
    setIsSimulatingAd(true);
    try {
      const activeAdapter = adapter;
      const res = await activeAdapter.requestInterstitialAd();
      addLog(`Interstitial result: ${res ? 'Served successfully' : 'No ad / Not supported in local mode'}`);
    } catch (e: any) {
      addLog(`Interstitial error: ${e?.message || 'Unknown'}`);
    } finally {
      setIsSimulatingAd(false);
    }
  };

  const handleTestRewarded = async () => {
    Haptics.combo(2);
    addLog(`Testing Rewarded Ad on [${selectedPlatform.name}]...`);
    setIsSimulatingAd(true);
    try {
      const activeAdapter = adapter;
      const res = await activeAdapter.requestRewardedAd('test-reward-123');
      addLog(`Rewarded Ad earned: ${res ? 'YES (+1 Life granted)' : 'NO'}`);
    } catch (e: any) {
      addLog(`Rewarded Ad error: ${e?.message || 'Unknown'}`);
    } finally {
      setIsSimulatingAd(false);
    }
  };

  const handleTestSave = async () => {
    Haptics.attach();
    addLog(`Testing Cloud Save on [${selectedPlatform.name}]...`);
    try {
      const dummySave = { score: 12500, level: 7, timestamp: Date.now() };
      const saved = await adapter.saveData(dummySave);
      addLog(`Save result: ${saved ? 'Successfully synced' : 'Failed'}`);
    } catch (e: any) {
      addLog(`Save error: ${e?.message || 'Unknown'}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-pink-500 selection:text-white pb-20">
      
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-pink-600/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px]" />
      </div>

      {/* Apple-style Floating Navigation Bar */}
      <header className="sticky top-4 z-40 max-w-5xl mx-auto px-4">
        <nav className="glass-heavy rounded-full px-5 py-3 flex items-center justify-between border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-white transition-all press-scale"
              title="Return to Game"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🫧</span>
              <span className="font-bold text-sm sm:text-base tracking-tight bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Bubble Pop Blast
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/80">
                Universe Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLaunch(selectedPlatform.id)}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10 transition-all press-scale flex items-center gap-1.5"
            >
              <span>Play Now</span>
              <span>→</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Header */}
      <section className="max-w-5xl mx-auto px-6 pt-12 sm:pt-20 pb-8 text-center animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/15 text-xs text-white/70 mb-4 animate-scale-in">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          <span>Zero Playgama Dependencies · Pure Native Platform SDKs</span>
        </div>
        
        <h1 className="display-text mb-4 text-white">
          One Game. <br />
          <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            13 Native Ecosystems.
          </span>
        </h1>

        <p className="body-text max-w-2xl mx-auto text-sm sm:text-base mb-8">
          Crafted with Apple design language, spring animations, and native platform SDK adapters for YouTube Playables, Poki, Facebook Instant Games, CrazyGames, Discord Activities, and beyond.
        </p>

        {/* Global Stats Bento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-12">
          {[
            { label: 'Platforms', value: '13', icon: '🌐' },
            { label: 'SDK Dependencies', value: '0', icon: '⚡' },
            { label: 'Audio & Cloud Sync', value: '100%', icon: '☁️' },
            { label: 'Apple HIG Motion', value: 'Fluid', icon: '' },
          ].map((stat, i) => (
            <div key={i} className="glass p-4 rounded-2xl border border-white/10 text-center press-scale">
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
              <div className="text-[11px] uppercase tracking-wider text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Bento Layout: Left Platform Selector & Right Detailed Inspector */}
      <main className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Platform List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm uppercase tracking-wider font-bold text-white/60">Choose Platform</h2>
            <span className="text-xs text-cyan-400 font-medium">13 Editions</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {PLATFORMS_CATALOG.map((p) => {
              const isSelected = selectedPlatform.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    Haptics.pop();
                    setSelectedPlatform(p);
                    setPlatformOverride(p.id);
                  }}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer border flex items-center justify-between press-scale ${
                    isSelected
                      ? 'glass-heavy border-cyan-400/80 shadow-xl shadow-cyan-500/10 scale-[1.01]'
                      : 'glass border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-white/10">{p.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{p.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 border border-white/10">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 line-clamp-1">{p.tagline}</p>
                    </div>
                  </div>

                  <span className={`text-xs ${isSelected ? 'text-cyan-400' : 'text-white/20'}`}>
                    →
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Platform Inspector & Test Console (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Platform Card */}
          <div className="glass-heavy p-6 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] -z-10 opacity-30"
              style={{ backgroundColor: selectedPlatform.brandColor }}
            />

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-3 rounded-2xl bg-white/10 border border-white/15 shadow-inner">
                  {selectedPlatform.icon}
                </span>
                <div>
                  <h3 className="text-xl font-black text-white">{selectedPlatform.name}</h3>
                  <span className="text-xs text-white/60">{selectedPlatform.category}</span>
                </div>
              </div>

              <button
                onClick={() => handleLaunch(selectedPlatform.id)}
                className="px-5 py-2 rounded-full font-bold text-xs bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-lg shadow-pink-500/25 hover:scale-105 transition-all press-scale"
              >
                Launch this Edition 🚀
              </button>
            </div>

            <p className="text-sm text-white/80 leading-relaxed mb-6">
              {selectedPlatform.description}
            </p>

            {/* Capabilities Matrix */}
            <div className="mb-6">
              <h4 className="text-xs uppercase tracking-wider font-bold text-white/50 mb-2">Capabilities</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Cloud Save', enabled: selectedPlatform.capabilities.cloudSave },
                  { label: 'Interstitial Ads', enabled: selectedPlatform.capabilities.interstitialAds },
                  { label: 'Rewarded Ads', enabled: selectedPlatform.capabilities.rewardedAds },
                  { label: 'Score Leaderboards', enabled: selectedPlatform.capabilities.scoreLeaderboard },
                  { label: 'Locale Detection', enabled: selectedPlatform.capabilities.localeSync },
                  { label: 'Audio Syncing', enabled: selectedPlatform.capabilities.audioSync },
                ].map((cap, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-xl border text-xs flex items-center gap-2 ${
                      cap.enabled
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-white/40'
                    }`}
                  >
                    <span>{cap.enabled ? '✓' : '—'}</span>
                    <span>{cap.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SDK Requirements Breakdown */}
            <div className="mb-6">
              <h4 className="text-xs uppercase tracking-wider font-bold text-white/50 mb-2">
                Native SDK Requirements
              </h4>
              <ul className="space-y-1.5 text-xs text-white/70">
                {selectedPlatform.sdkRequirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Official documentation link */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <a
                href={selectedPlatform.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <span>Read Official Developer Guide</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          {/* Interactive SDK Live Test Bench */}
          <div className="glass p-5 rounded-3xl border border-white/15">
            <h4 className="text-xs uppercase tracking-wider font-bold text-white/60 mb-3 flex items-center gap-2">
              <span>🛠️ Native SDK Live Test Console</span>
              <span className="text-[10px] text-white/40">(Interactive Simulation)</span>
            </h4>

            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={handleTestInterstitial}
                disabled={isSimulatingAd}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold hover:bg-purple-500/30 transition-all press-scale disabled:opacity-50"
              >
                📺 Test Interstitial
              </button>
              <button
                onClick={handleTestRewarded}
                disabled={isSimulatingAd}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-all press-scale disabled:opacity-50"
              >
                🎁 Test Rewarded (+1 Life)
              </button>
              <button
                onClick={handleTestSave}
                className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-500/30 transition-all press-scale"
              >
                ☁️ Test Cloud Save
              </button>
            </div>

            {/* Console Log Output */}
            <div className="bg-black/60 rounded-xl p-3 font-mono text-[11px] text-white/70 max-h-36 overflow-y-auto border border-white/10">
              {testLog.length === 0 ? (
                <span className="text-white/30">Click any test button above to simulate SDK responses...</span>
              ) : (
                testLog.map((log, i) => (
                  <div key={i} className="leading-tight py-0.5">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 mt-16 text-center text-xs text-white/40">
        <p>
          Bubble Pop Blast Universal Engine · Clean Architecture without Playgama SDK · Apple Liquid Glass Design
        </p>
      </footer>
    </div>
  );
};

export default PlatformHub;
