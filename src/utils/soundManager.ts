
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3, detune: number = 0) => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.detune.setValueAtTime(detune, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio errors
  }
};

const playNoise = (duration: number, volume: number = 0.1) => {
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch (e) {}
};

export const SoundManager = {
  pop: () => {
    const freq = 400 + Math.random() * 200;
    playTone(freq, 0.15, 'sine', 0.25);
    playTone(freq * 1.5, 0.1, 'sine', 0.1);
  },

  multiPop: (count: number) => {
    for (let i = 0; i < Math.min(count, 6); i++) {
      setTimeout(() => {
        playTone(500 + i * 80, 0.12, 'sine', 0.2);
      }, i * 40);
    }
  },

  shoot: () => {
    playTone(200, 0.08, 'triangle', 0.15);
    playTone(300, 0.06, 'sine', 0.1);
  },

  bomb: () => {
    playNoise(0.4, 0.3);
    playTone(80, 0.5, 'sawtooth', 0.2);
    playTone(60, 0.6, 'sine', 0.15);
  },

  freeze: () => {
    playTone(1200, 0.3, 'sine', 0.2);
    playTone(1600, 0.4, 'sine', 0.15);
    playTone(2000, 0.3, 'sine', 0.1);
  },

  rainbow: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, 'sine', 0.15), i * 60);
    });
  },

  combo: (level: number) => {
    const baseFreq = 400 + level * 100;
    for (let i = 0; i < Math.min(level + 1, 5); i++) {
      setTimeout(() => {
        playTone(baseFreq + i * 150, 0.2, 'sine', 0.2);
        playTone(baseFreq + i * 150 + 5, 0.2, 'sine', 0.1); // slight detune for richness
      }, i * 80);
    }
  },

  levelUp: () => {
    const melody = [523, 659, 784, 1047, 1319];
    melody.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, 'sine', 0.25), i * 100);
    });
  },

  gameOver: () => {
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.4, 'sawtooth', 0.15), i * 200);
    });
  },

  attach: () => {
    playTone(350, 0.06, 'square', 0.08);
  },

  init: () => {
    getAudioContext();
  }
};
