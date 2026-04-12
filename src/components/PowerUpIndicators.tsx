import { Bubble } from '../types/gameTypes';

interface PowerUpIndicatorsProps {
  currentBubble: Bubble | null;
  nextBubble: Bubble | null;
  isFrozen?: boolean;
  frozenTimer?: number;
}

const powerUps = [
  {
    id: 'bomb',
    icon: '💣',
    label: 'Bomb',
    description: 'Explodes nearby bubbles',
    color: 'from-orange-500 to-red-600',
    glowColor: 'shadow-orange-500/50',
    borderColor: 'border-orange-500/40',
    bgColor: 'bg-orange-500/10',
  },
  {
    id: 'freeze',
    icon: '❄️',
    label: 'Freeze',
    description: 'Freezes the board',
    color: 'from-cyan-400 to-blue-500',
    glowColor: 'shadow-cyan-400/50',
    borderColor: 'border-cyan-400/40',
    bgColor: 'bg-cyan-400/10',
  },
  {
    id: 'rainbow',
    icon: '🌈',
    label: 'Rainbow',
    description: 'Matches any color',
    color: 'from-pink-500 via-yellow-400 to-green-400',
    glowColor: 'shadow-pink-500/50',
    borderColor: 'border-pink-500/40',
    bgColor: 'bg-pink-500/10',
  },
];

const PowerUpIndicators = ({ currentBubble, nextBubble, isFrozen, frozenTimer }: PowerUpIndicatorsProps) => {
  const activePowerUp = currentBubble?.powerUp;
  const nextPowerUp = nextBubble?.powerUp;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Power-Ups</div>
      <div className="flex gap-1.5">
        {powerUps.map((pu) => {
          const isActive = activePowerUp === pu.id;
          const isNext = nextPowerUp === pu.id;
          const isFrozenActive = pu.id === 'freeze' && isFrozen;

          return (
            <div
              key={pu.id}
              className={`
                relative flex flex-col items-center justify-center rounded-lg p-1.5 transition-all duration-300 flex-1 min-w-0
                border ${isActive ? `${pu.borderColor} ${pu.bgColor} shadow-lg ${pu.glowColor} scale-110` : isNext ? `${pu.borderColor} ${pu.bgColor} opacity-70` : 'border-white/10 bg-white/5 opacity-40'}
                ${isFrozenActive ? 'border-cyan-400/60 bg-cyan-400/20 opacity-100 animate-pulse' : ''}
              `}
              title={`${pu.label}: ${pu.description}`}
            >
              {isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border border-green-300 animate-pulse" />
              )}
              {isNext && !isActive && (
                <div className="absolute -top-1 -right-1 text-[6px] bg-purple-500/80 text-white px-1 rounded font-bold">
                  NEXT
                </div>
              )}
              <span className={`text-sm ${isActive ? 'animate-bounce' : ''}`}>{pu.icon}</span>
              <span className="text-[8px] text-gray-300 mt-0.5 truncate w-full text-center">{pu.label}</span>
              {isFrozenActive && frozenTimer !== undefined && (
                <span className="text-[8px] text-cyan-300 font-bold">{Math.ceil(frozenTimer / 60)}s</span>
              )}
            </div>
          );
        })}
      </div>
      {activePowerUp && (
        <div className={`text-[9px] text-center py-1 px-2 rounded-md bg-gradient-to-r ${powerUps.find(p => p.id === activePowerUp)?.color} text-white font-bold animate-pulse`}>
          {powerUps.find(p => p.id === activePowerUp)?.description}
        </div>
      )}
    </div>
  );
};

export default PowerUpIndicators;
