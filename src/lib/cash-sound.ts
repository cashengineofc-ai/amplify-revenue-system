/** Som de caixa registradora sintetizado via Web Audio (sem arquivos externos). */
export function playCashSound() {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const ding = (freq: number, at: number, dur: number, gain: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + at);
      g.gain.setValueAtTime(0, now + at);
      g.gain.linearRampToValueAtTime(gain, now + at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + dur + 0.05);
    };

    // "cha-ching"
    ding(1318.5, 0, 0.5, 0.22);
    ding(1760, 0.06, 0.6, 0.18);
    ding(2637, 0.12, 0.5, 0.1);

    // gaveta abrindo (ruído curto)
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
    }
    const noise = ctx.createBufferSource();
    const ng = ctx.createGain();
    ng.gain.value = 0.09;
    noise.buffer = buffer;
    noise.connect(ng).connect(ctx.destination);
    noise.start(now + 0.02);

    setTimeout(() => void ctx.close(), 1600);
  } catch {
    /* áudio bloqueado pelo navegador — ignora */
  }
}
