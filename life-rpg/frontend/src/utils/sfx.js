// Web Audio API 8-Bit Retro Synthesizer
let audioCtx = null

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export const playSound = (type, muted = false) => {
  if (muted) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    if (type === 'click') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04)
      gain.gain.setValueAtTime(0.1, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.04)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.04)
    } 
    else if (type === 'quest_complete') {
      // Golden chime arpeggio: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.50]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + idx * 0.07)
        gain.gain.setValueAtTime(0, now + idx * 0.07)
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.07)
        osc.stop(now + idx * 0.07 + 0.26)
      })
    }
    else if (type === 'level_up') {
      // Epic Grace Ascension fanfare
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(freq, now + idx * 0.09)
        gain.gain.setValueAtTime(0, now + idx * 0.09)
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.09 + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.09)
        osc.stop(now + idx * 0.09 + 0.42)
      })
    }
    else if (type === 'purchase') {
      // Coin clink
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      osc1.type = 'sine'
      osc2.type = 'square'
      osc1.frequency.setValueAtTime(987.77, now)
      osc1.frequency.setValueAtTime(1318.51, now + 0.08)
      osc2.frequency.setValueAtTime(1975.53, now)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.3)
      osc2.stop(now + 0.3)
    }
    else if (type === 'hit') {
      // Sword slash / punch impact
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.12)
    }
    else if (type === 'defeat') {
      // Deep ominous drone (You Died)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(110, now)
      osc.frequency.exponentialRampToValueAtTime(45, now + 1.5)
      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 2.0)
    }
    else if (type === 'victory') {
      // Victory brass triumph
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, now + idx * 0.12)
        gain.gain.setValueAtTime(0, now + idx * 0.12)
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.5)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.12)
        osc.stop(now + idx * 0.12 + 0.52)
      })
    }
  } catch (e) {
    // Audio contexts may be blocked before interaction, safe fallback
  }
}
