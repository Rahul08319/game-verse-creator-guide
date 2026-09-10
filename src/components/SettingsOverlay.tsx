
import React, { useState } from 'react';
import { Slider } from './ui/slider';
import type { ParticleStyle, ThemeName } from '../utils/gameLogic';
import { getCosmeticUnlocks, getNextCosmeticGoal } from '../utils/cosmetics';

export interface GameSettings {
  difficulty: 'easy' | 'normal' | 'hard';
  volume: number; // 0-100
  theme: ThemeName;
  particleStyle: ParticleStyle;
  colorBlindMode: boolean;
  reduceMotion: boolean;
  hapticsEnabled: boolean;
}

interface SettingsOverlayProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onClose: () => void;
}

const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ settings, onSave, onClose }) => {
  const [local, setLocal] = useState<GameSettings>({ ...settings });
  const unlocks = getCosmeticUnlocks();
  const nextCosmeticGoal = getNextCosmeticGoal();

  const difficulties = [
    { key: 'easy' as const, label: 'Easy', desc: 'Fewer colors, more power-ups' },
    { key: 'normal' as const, label: 'Normal', desc: 'Balanced gameplay' },
    { key: 'hard' as const, label: 'Hard', desc: 'More colors, fewer power-ups' },
  ];

  const themes = [
    { key: 'neon' as const, label: '🌌 Neon', colors: ['#FF0080', '#00FFFF', '#FF00FF'] },
    { key: 'retro' as const, label: '🕹️ Retro', colors: ['#FF6600', '#FFFF00', '#00FF41'] },
    { key: 'ocean' as const, label: '🌊 Ocean', colors: ['#0080FF', '#00CCCC', '#6600FF'] },
    { key: 'aurora' as const, label: '🌌 Aurora', colors: ['#7DF9FF', '#B388FF', '#69F0AE'], unlock: 'Level 3' },
    { key: 'solar' as const, label: '☀️ Solar', colors: ['#FF6B35', '#F7C948', '#D65DB1'], unlock: 'Level 5' },
  ];

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-3xl flex items-center justify-center z-30 animate-fade-in">
      <div className="bg-gradient-to-br from-[#1a0a2e]/95 to-[#0a1a2e]/95 rounded-2xl p-5 w-[90%] max-w-xs max-h-[90%] overflow-auto border border-purple-500/30 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">
            ⚙️ Settings
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
        </div>

        {/* Difficulty */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wider">Difficulty</h3>
          <div className="space-y-1.5">
            {difficulties.map(d => (
              <button
                key={d.key}
                onClick={() => setLocal(s => ({ ...s, difficulty: d.key }))}
                className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 ${
                  local.difficulty === d.key
                    ? 'bg-purple-500/20 border-purple-400/50 shadow-lg shadow-purple-500/10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <span className={`text-sm font-semibold ${local.difficulty === d.key ? 'text-purple-300' : 'text-white'}`}>
                  {d.label}
                </span>
                <p className="text-[10px] text-gray-500 mt-0.5">{d.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wider">
            Volume: {local.volume}%
          </h3>
          <div className="px-1">
            <Slider
              value={[local.volume]}
              onValueChange={([v]) => setLocal(s => ({ ...s, volume: v }))}
              min={0}
              max={100}
              step={5}
              className="[&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-purple-500 [&_.relative]:bg-white/10 [&_[data-orientation=horizontal]>.absolute]:bg-gradient-to-r [&_[data-orientation=horizontal]>.absolute]:from-pink-500 [&_[data-orientation=horizontal]>.absolute]:to-cyan-500"
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>🔇</span>
            <span>🔊</span>
          </div>
        </div>

        {/* Color Theme */}
        <div className="mb-5">
          <h3 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wider">Color Theme</h3>
          <div className="flex gap-2">
            {themes.map(t => (
              <button
                key={t.key}
                disabled={!unlocks.themes.includes(t.key)}
                onClick={() => setLocal(s => ({ ...s, theme: t.key }))}
                className={`flex-1 p-2.5 rounded-xl border text-center transition-all duration-200 ${
                  local.theme === t.key
                    ? 'bg-purple-500/20 border-purple-400/50 shadow-lg shadow-purple-500/10 scale-105'
                    : unlocks.themes.includes(t.key) ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/[0.03] border-white/5 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-sm mb-1">{unlocks.themes.includes(t.key) ? t.label : `🔒 ${t.unlock}`}</div>
                <div className="flex justify-center gap-1">
                  {t.colors.map((c, i) => (
                    <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}` }} />
                  ))}
                </div>
              </button>
            ))}
          </div>
          {nextCosmeticGoal && <p className="text-[10px] text-cyan-300/80 mt-2">✨ {nextCosmeticGoal}</p>}
        </div>

        <div className="mb-5">
          <h3 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wider">Pop effect</h3>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'spark', label: '✦ Spark' },
              { key: 'stardust', label: '✧ Stardust', unlock: 'Level 3' },
              { key: 'confetti', label: '🎉 Confetti', unlock: '5 runs' },
            ] as const).map(effect => {
              const unlocked = unlocks.particleStyles.includes(effect.key);
              return <button key={effect.key} disabled={!unlocked} onClick={() => setLocal(s => ({ ...s, particleStyle: effect.key }))}
                className={`p-2 rounded-xl border text-[10px] font-semibold ${local.particleStyle === effect.key ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200' : unlocked ? 'bg-white/5 border-white/10 text-white' : 'bg-white/[0.03] border-white/5 text-gray-500 cursor-not-allowed'}`}>
                {unlocked ? effect.label : `🔒 ${effect.unlock}`}
              </button>;
            })}
          </div>
        </div>

        <div className="space-y-2 mb-5">
          <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">Accessibility</h3>
          <button
            onClick={() => setLocal(s => ({ ...s, colorBlindMode: !s.colorBlindMode }))}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left ${local.colorBlindMode ? 'bg-cyan-500/15 border-cyan-400/40' : 'bg-white/5 border-white/10'}`}
          >
            <span><span className="text-sm font-semibold text-white">Color-blind palette</span><span className="block text-[10px] text-gray-400">High-contrast blue, orange, green, and purple bubbles</span></span>
            <span className="text-lg">{local.colorBlindMode ? '✓' : '○'}</span>
          </button>
          <button
            onClick={() => setLocal(s => ({ ...s, reduceMotion: !s.reduceMotion }))}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left ${local.reduceMotion ? 'bg-cyan-500/15 border-cyan-400/40' : 'bg-white/5 border-white/10'}`}
          >
            <span><span className="text-sm font-semibold text-white">Reduce motion</span><span className="block text-[10px] text-gray-400">Limits animations, shake, and visual movement</span></span>
            <span className="text-lg">{local.reduceMotion ? '✓' : '○'}</span>
          </button>
          <button
            onClick={() => setLocal(s => ({ ...s, hapticsEnabled: !s.hapticsEnabled }))}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left ${local.hapticsEnabled ? 'bg-cyan-500/15 border-cyan-400/40' : 'bg-white/5 border-white/10'}`}
          >
            <span><span className="text-sm font-semibold text-white">Haptic feedback</span><span className="block text-[10px] text-gray-400">Vibration for pops, combos, and milestones</span></span>
            <span className="text-lg">{local.hapticsEnabled ? '✓' : '○'}</span>
          </button>
        </div>

        <button
          onClick={() => onSave(local)}
          className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white py-3 rounded-full font-bold text-sm hover:scale-105 transform transition-all duration-200 shadow-lg shadow-pink-500/25"
        >
          Save Settings ✓
        </button>
      </div>
    </div>
  );
};

export default SettingsOverlay;
