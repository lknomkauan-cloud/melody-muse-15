import * as Tone from "tone";

// Timbres reais (soundfont FluidR3_GM — instrumentos gravados, licença livre)
const GM = "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM";

type Cfg = { baseUrl: string; urls: Record<string, string> };

/** ids usados no afinador */
export const TUNER_SAMPLES: Record<string, Cfg> = {
  violao: {
    baseUrl: `${GM}/acoustic_guitar_nylon-mp3/`,
    urls: { E2: "E2.mp3", A2: "A2.mp3", D3: "D3.mp3", G3: "G3.mp3", B3: "B3.mp3", E4: "E4.mp3" },
  },
  guitarra: {
    baseUrl: `${GM}/electric_guitar_clean-mp3/`,
    urls: { E2: "E2.mp3", A2: "A2.mp3", D3: "D3.mp3", G3: "G3.mp3", B3: "B3.mp3", E4: "E4.mp3" },
  },
  baixo: {
    baseUrl: `${GM}/electric_bass_finger-mp3/`,
    urls: { E1: "E1.mp3", A1: "A1.mp3", D2: "D2.mp3", G2: "G2.mp3", C3: "C3.mp3" },
  },
  violino: {
    baseUrl: `${GM}/violin-mp3/`,
    urls: { G3: "G3.mp3", D4: "D4.mp3", A4: "A4.mp3", E5: "E5.mp3" },
  },
  sax: {
    baseUrl: `${GM}/alto_sax-mp3/`,
    urls: { C4: "C4.mp3", E4: "E4.mp3", G4: "G4.mp3", C5: "C5.mp3" },
  },
  flauta: {
    baseUrl: `${GM}/recorder-mp3/`,
    urls: { C5: "C5.mp3", E5: "E5.mp3", G5: "G5.mp3", C6: "C6.mp3" },
  },
  banjo: {
    baseUrl: `${GM}/banjo-mp3/`,
    urls: { G3: "G3.mp3", C4: "C4.mp3", E4: "E4.mp3", G4: "G4.mp3" },
  },
  sanfona: {
    baseUrl: `${GM}/accordion-mp3/`,
    urls: { C3: "C3.mp3", C4: "C4.mp3", G4: "G4.mp3", C5: "C5.mp3" },
  },
  bateria: {
    // peles afinadas: tom melódico real do soundfont
    baseUrl: `${GM}/melodic_tom-mp3/`,
    urls: { C2: "C2.mp3", C3: "C3.mp3", C4: "C4.mp3" },
  },
  cromatico: {
    baseUrl: `${GM}/acoustic_grand_piano-mp3/`,
    urls: { C3: "C3.mp3", C4: "C4.mp3", E4: "E4.mp3", G4: "G4.mp3", C5: "C5.mp3" },
  },
};

const cache = new Map<string, { sampler: Tone.Sampler; ready: Promise<void> }>();

/** Carrega (e reaproveita) o sampler com o som original do instrumento. */
export async function getInstrumentSampler(id: string): Promise<Tone.Sampler | null> {
  const cfg = TUNER_SAMPLES[id];
  if (!cfg) return null;
  let entry = cache.get(id);
  if (!entry) {
    let resolveReady: () => void = () => {};
    let rejectReady: (e: unknown) => void = () => {};
    const ready = new Promise<void>((res, rej) => {
      resolveReady = res;
      rejectReady = rej;
    });
    const sampler = new Tone.Sampler({
      urls: cfg.urls,
      baseUrl: cfg.baseUrl,
      release: 1,
      onload: () => resolveReady(),
      onerror: (e) => rejectReady(e),
    }).toDestination();
    entry = { sampler, ready };
    cache.set(id, entry);

  }
  try {
    await entry.ready;
  } catch (e) {
    console.error(`Falha ao carregar timbre de ${id}`, e);
    cache.delete(id);
    return null;
  }
  return entry.sampler;
}

/**
 * Caixa (snare): membrana afinada + esteira (ruído).
 * Nenhum soundfont GM tem caixa isolada, então sintetizamos o timbre real.
 */
export async function playSnare(freq: number): Promise<boolean> {
  try {
    await Tone.start();
    const now = Tone.now();

    // corpo da pele (duas parciais afinadas na nota alvo)
    const bodyGain = new Tone.Gain(0.5).toDestination();
    const body = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.05 },
    }).connect(bodyGain);
    body.triggerAttackRelease(freq, 0.2, now);

    // esteira: ruído com banda alta
    const noiseFilter = new Tone.Filter({ type: "highpass", frequency: 1400, Q: 0.8 }).toDestination();
    const noise = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.16, sustain: 0 },
    }).connect(noiseFilter);
    noise.triggerAttackRelease(0.15, now);

    window.setTimeout(() => {
      body.dispose();
      bodyGain.dispose();
      noise.dispose();
      noiseFilter.dispose();
    }, 1200);
    return true;
  } catch (e) {
    console.error("playSnare", e);
    return false;
  }
}

/** Toca uma nota com o timbre real; retorna false se não deu (para fallback). */
export async function playInstrumentNote(id: string, note: string, duration = 1.8): Promise<boolean> {
  try {
    await Tone.start();
    const sampler = await getInstrumentSampler(id);
    if (!sampler) return false;
    sampler.releaseAll();
    sampler.triggerAttackRelease(note, duration);
    return true;
  } catch (e) {
    console.error("playInstrumentNote", e);
    return false;
  }
}
