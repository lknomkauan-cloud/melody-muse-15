import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import {
  Play,
  Square,
  Plus,
  Trash2,
  Music2,
  Grid3X3,
  Sliders,
  ListMusic,
  Volume2,
  VolumeX,
  Headphones,
  Copy,
  Eraser,
  Repeat,
} from "lucide-react";

/* ============================================================
   FL STUDIO STYLE DAW — totalmente funcional (Web Audio / Tone.js)
============================================================ */

const FL = {
  bg: "#1b1b1f",
  panel: "#26262b",
  panelAlt: "#2f2f36",
  border: "#131316",
  line: "#3a3a42",
  text: "#e6e6ea",
  dim: "#9a9aa5",
  accent: "#f59f2b",
  accent2: "#4ea3ff",
  green: "#54d86b",
  red: "#e05555",
};

const STEP_COLORS = ["#f59f2b", "#4ea3ff", "#54d86b", "#e05a8a", "#b98bff", "#f2d94e", "#48d6c4", "#ff7a59"];

type DrumKind = "kick" | "snare" | "clap" | "hat" | "openhat" | "tom" | "cymbal";
type ChannelKind = "drum" | "synth" | "bass" | "pluck";

interface Channel {
  id: string;
  name: string;
  kind: ChannelKind;
  drum?: DrumKind;
  baseNote: string;
  vol: number; // 0..1.2
  pan: number; // -1..1
  mute: boolean;
  solo: boolean;
  color: string;
}

interface PRNote {
  step: number;
  note: string;
  len: number; // em steps
}

interface Pattern {
  id: string;
  name: string;
  color: string;
  steps: Record<string, boolean[]>;
  notes: Record<string, PRNote[]>;
}

const STEPS = 16;
const nid = () => Math.random().toString(36).slice(2, 9);

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function pianoRollNotes(): string[] {
  const out: string[] = [];
  for (let oct = 5; oct >= 2; oct--) {
    for (let i = NOTE_NAMES.length - 1; i >= 0; i--) out.push(`${NOTE_NAMES[i]}${oct}`);
  }
  return out;
}
const PR_NOTES = pianoRollNotes();

function emptySteps(): boolean[] {
  return Array.from({ length: STEPS }, () => false);
}

function makeChannels(): Channel[] {
  const defs: Array<[string, ChannelKind, DrumKind | undefined, string]> = [
    ["Kick", "drum", "kick", "C1"],
    ["Clap", "drum", "clap", "C3"],
    ["Snare", "drum", "snare", "D2"],
    ["Hat", "drum", "hat", "C4"],
    ["Open Hat", "drum", "openhat", "C4"],
    ["Bass 808", "bass", undefined, "C2"],
    ["Pluck", "pluck", undefined, "C4"],
    ["Pad Synth", "synth", undefined, "C4"],
  ];
  return defs.map(([name, kind, drum, baseNote], i) => ({
    id: nid(),
    name,
    kind,
    drum,
    baseNote,
    vol: 0.85,
    pan: 0,
    mute: false,
    solo: false,
    color: STEP_COLORS[i % STEP_COLORS.length],
  }));
}

function makePattern(name: string, channels: Channel[], color: string, seed = false): Pattern {
  const steps: Record<string, boolean[]> = {};
  const notes: Record<string, PRNote[]> = {};
  channels.forEach((c) => {
    steps[c.id] = emptySteps();
    notes[c.id] = [];
  });
  if (seed && channels.length >= 5) {
    // groove básico
    [0, 4, 8, 12].forEach((s) => (steps[channels[0].id][s] = true));
    [4, 12].forEach((s) => (steps[channels[1].id][s] = true));
    [8].forEach((s) => (steps[channels[2].id][s] = true));
    [2, 6, 10, 14].forEach((s) => (steps[channels[3].id][s] = true));
  }
  return { id: nid(), name, color, steps, notes };
}

/* ============================================================
   MOTOR DE ÁUDIO
============================================================ */

interface Voice {
  out: Tone.Panner;
  gain: Tone.Gain;
  trigger: (time: number, note: string, dur: string | number, vel: number) => void;
  dispose: () => void;
}

function buildVoice(ch: Channel): Voice {
  const panner = new Tone.Panner(ch.pan).toDestination();
  const gain = new Tone.Gain(ch.vol).connect(panner);

  if (ch.kind === "drum") {
    switch (ch.drum) {
      case "kick": {
        const s = new Tone.MembraneSynth({
          pitchDecay: 0.04,
          octaves: 6,
          envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.1 },
        }).connect(gain);
        return {
          out: panner,
          gain,
          trigger: (t, _n, _d, v) => s.triggerAttackRelease("C1", "8n", t, v),
          dispose: () => { s.dispose(); gain.dispose(); panner.dispose(); },
        };
      }
      case "snare": {
        const noise = new Tone.NoiseSynth({
          noise: { type: "white" },
          envelope: { attack: 0.001, decay: 0.16, sustain: 0 },
        });
        const filt = new Tone.Filter(1800, "bandpass").connect(gain);
        noise.connect(filt);
        const body = new Tone.MembraneSynth({
          pitchDecay: 0.02,
          octaves: 4,
          envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
        }).connect(gain);
        return {
          out: panner,
          gain,
          trigger: (t, _n, _d, v) => {
            noise.triggerAttackRelease("16n", t, v);
            body.triggerAttackRelease("D2", "32n", t, v * 0.5);
          },
          dispose: () => { noise.dispose(); filt.dispose(); body.dispose(); gain.dispose(); panner.dispose(); },
        };
      }
      case "clap": {
        const noise = new Tone.NoiseSynth({
          noise: { type: "pink" },
          envelope: { attack: 0.001, decay: 0.12, sustain: 0 },
        });
        const filt = new Tone.Filter(1200, "highpass").connect(gain);
        noise.connect(filt);
        return {
          out: panner,
          gain,
          trigger: (t, _n, _d, v) => {
            noise.triggerAttackRelease("32n", t, v * 0.7);
            noise.triggerAttackRelease("16n", t + 0.012, v);
          },
          dispose: () => { noise.dispose(); filt.dispose(); gain.dispose(); panner.dispose(); },
        };
      }
      case "openhat":
      case "cymbal": {
        const s = new Tone.MetalSynth({
          envelope: { attack: 0.001, decay: ch.drum === "cymbal" ? 1.2 : 0.35, release: 0.2 },
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 5000,
          octaves: 1.5,
        }).connect(gain);
        return {
          out: panner,
          gain,
          trigger: (t, _n, _d, v) => s.triggerAttackRelease("16n", t, v * 0.35),
          dispose: () => { s.dispose(); gain.dispose(); panner.dispose(); },
        };
      }
      case "tom": {
        const s = new Tone.MembraneSynth({ octaves: 3 }).connect(gain);
        return {
          out: panner,
          gain,
          trigger: (t, n, _d, v) => s.triggerAttackRelease(n || "G2", "8n", t, v),
          dispose: () => { s.dispose(); gain.dispose(); panner.dispose(); },
        };
      }
      default: {
        const s = new Tone.MetalSynth({
          envelope: { attack: 0.001, decay: 0.08, release: 0.02 },
          harmonicity: 5.1,
          modulationIndex: 32,
          resonance: 8000,
          octaves: 1.5,
        }).connect(gain);
        return {
          out: panner,
          gain,
          trigger: (t, _n, _d, v) => s.triggerAttackRelease("32n", t, v * 0.25),
          dispose: () => { s.dispose(); gain.dispose(); panner.dispose(); },
        };
      }
    }
  }

  if (ch.kind === "bass") {
    const s = new Tone.MonoSynth({
      oscillator: { type: "sine" },
      filter: { Q: 2, type: "lowpass" },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.5, release: 0.4 },
      filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.3, baseFrequency: 80, octaves: 2.5 },
    }).connect(gain);
    return {
      out: panner,
      gain,
      trigger: (t, n, d, v) => s.triggerAttackRelease(n, d, t, v),
      dispose: () => { s.dispose(); gain.dispose(); panner.dispose(); },
    };
  }

  if (ch.kind === "pluck") {
    const s = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.002, decay: 0.25, sustain: 0.05, release: 0.3 },
    }).connect(gain);
    return {
      out: panner,
      gain,
      trigger: (t, n, d, v) => s.triggerAttackRelease(n, d, t, v),
      dispose: () => { s.dispose(); gain.dispose(); panner.dispose(); },
    };
  }

  const reverb = new Tone.Reverb({ decay: 3, wet: 0.35 }).connect(gain);
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.12, decay: 0.4, sustain: 0.6, release: 1.2 },
  }).connect(reverb);
  return {
    out: panner,
    gain,
    trigger: (t, n, d, v) => pad.triggerAttackRelease(n, d, t, v * 0.6),
    dispose: () => { pad.dispose(); reverb.dispose(); gain.dispose(); panner.dispose(); },
  };
}

/* ============================================================
   COMPONENTE
============================================================ */

type View = "rack" | "piano" | "playlist" | "mixer";

export default function FLStudio() {
  const [channels, setChannels] = useState<Channel[]>(() => makeChannels());
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [currentPattern, setCurrentPattern] = useState<string>("");
  const [view, setView] = useState<View>("rack");
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(128);
  const [swing, setSwing] = useState(0);
  const [master, setMaster] = useState(0.8);
  const [songMode, setSongMode] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [prChannel, setPrChannel] = useState<string>("");
  const [bars, setBars] = useState(8);
  // playlist: patternId -> set de barras
  const [playlist, setPlaylist] = useState<Record<string, boolean[]>>({});

  // init patterns depois dos canais
  useEffect(() => {
    if (patterns.length === 0 && channels.length > 0) {
      const p1 = makePattern("Pattern 1", channels, STEP_COLORS[0], true);
      const p2 = makePattern("Pattern 2", channels, STEP_COLORS[1]);
      setPatterns([p1, p2]);
      setCurrentPattern(p1.id);
      setPlaylist({
        [p1.id]: Array.from({ length: 32 }, (_, i) => i < 4),
        [p2.id]: Array.from({ length: 32 }, () => false),
      });
      setPrChannel(channels[5]?.id ?? channels[0].id);
    }
  }, [channels, patterns.length]);

  const voicesRef = useRef<Map<string, Voice>>(new Map());
  const stateRef = useRef({ channels, patterns, currentPattern, playlist, songMode, bars });
  stateRef.current = { channels, patterns, currentPattern, playlist, songMode, bars };
  const stepRef = useRef(0);
  const loopIdRef = useRef<number | null>(null);

  const ensureVoices = useCallback(() => {
    const map = voicesRef.current;
    channels.forEach((c) => {
      if (!map.has(c.id)) map.set(c.id, buildVoice(c));
    });
    // remover canais deletados
    Array.from(map.keys()).forEach((id) => {
      if (!channels.some((c) => c.id === id)) {
        map.get(id)?.dispose();
        map.delete(id);
      }
    });
  }, [channels]);

  // sincronizar volume/pan/mute
  useEffect(() => {
    const anySolo = channels.some((c) => c.solo);
    channels.forEach((c) => {
      const v = voicesRef.current.get(c.id);
      if (!v) return;
      const audible = !c.mute && (!anySolo || c.solo);
      v.gain.gain.rampTo(audible ? c.vol : 0, 0.03);
      v.out.pan.rampTo(c.pan, 0.03);
    });
  }, [channels]);

  useEffect(() => {
    Tone.getDestination().volume.rampTo(Tone.gainToDb(Math.max(0.0001, master)), 0.05);
  }, [master]);

  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
    Tone.getTransport().swing = swing;
    Tone.getTransport().swingSubdivision = "16n";
  }, [bpm, swing]);

  useEffect(() => () => {
    const t = Tone.getTransport();
    t.stop();
    if (loopIdRef.current !== null) t.clear(loopIdRef.current);
    voicesRef.current.forEach((v) => v.dispose());
    voicesRef.current.clear();
  }, []);

  const stepDur = "16n";

  const triggerStep = useCallback((globalStep: number, time: number) => {
    const st = stateRef.current;
    const step = globalStep % STEPS;
    const bar = Math.floor(globalStep / STEPS);

    const activePatterns: Pattern[] = st.songMode
      ? st.patterns.filter((p) => st.playlist[p.id]?.[bar])
      : st.patterns.filter((p) => p.id === st.currentPattern);

    for (const pat of activePatterns) {
      for (const ch of st.channels) {
        const voice = voicesRef.current.get(ch.id);
        if (!voice) continue;
        if (pat.steps[ch.id]?.[step]) {
          voice.trigger(time, ch.baseNote, stepDur, 0.9);
        }
        const prNotes = pat.notes[ch.id];
        if (prNotes) {
          for (const n of prNotes) {
            if (n.step === step) {
              voice.trigger(time, n.note, `${Math.max(1, n.len) * 0.25}n`.replace("0.25n", "16n"), 0.85);
            }
          }
        }
      }
    }
  }, []);

  const start = useCallback(async () => {
    await Tone.start();
    ensureVoices();
    const t = Tone.getTransport();
    t.bpm.value = bpm;
    stepRef.current = 0;
    if (loopIdRef.current !== null) t.clear(loopIdRef.current);
    loopIdRef.current = t.scheduleRepeat((time) => {
      const st = stateRef.current;
      const total = st.songMode ? st.bars * STEPS : STEPS;
      const s = stepRef.current % total;
      triggerStep(s, time);
      Tone.getDraw().schedule(() => setPlayhead(s), time);
      stepRef.current = (s + 1) % total;
    }, "16n");
    t.start();
    setPlaying(true);
  }, [bpm, ensureVoices, triggerStep]);

  const stop = useCallback(() => {
    const t = Tone.getTransport();
    t.stop();
    if (loopIdRef.current !== null) {
      t.clear(loopIdRef.current);
      loopIdRef.current = null;
    }
    stepRef.current = 0;
    setPlayhead(0);
    setPlaying(false);
  }, []);

  const pat = patterns.find((p) => p.id === currentPattern);

  const previewChannel = useCallback(async (ch: Channel, note?: string) => {
    await Tone.start();
    ensureVoices();
    const v = voicesRef.current.get(ch.id);
    v?.trigger(Tone.now(), note ?? ch.baseNote, "8n", 0.9);
  }, [ensureVoices]);

  const toggleStep = (chId: string, step: number) => {
    setPatterns((ps) =>
      ps.map((p) => {
        if (p.id !== currentPattern) return p;
        const arr = [...(p.steps[chId] ?? emptySteps())];
        arr[step] = !arr[step];
        return { ...p, steps: { ...p.steps, [chId]: arr } };
      }),
    );
  };

  const toggleNote = (chId: string, step: number, note: string) => {
    setPatterns((ps) =>
      ps.map((p) => {
        if (p.id !== currentPattern) return p;
        const list = p.notes[chId] ?? [];
        const exists = list.find((n) => n.step === step && n.note === note);
        const next = exists
          ? list.filter((n) => !(n.step === step && n.note === note))
          : [...list, { step, note, len: 1 }];
        return { ...p, notes: { ...p.notes, [chId]: next } };
      }),
    );
  };

  const updateChannel = (id: string, patch: Partial<Channel>) =>
    setChannels((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const addChannel = (kind: ChannelKind, drum?: DrumKind) => {
    const ch: Channel = {
      id: nid(),
      name: drum ? drum.toUpperCase() : kind === "bass" ? "Bass" : kind === "pluck" ? "Pluck" : "Synth",
      kind,
      drum,
      baseNote: kind === "bass" ? "C2" : "C4",
      vol: 0.85,
      pan: 0,
      mute: false,
      solo: false,
      color: STEP_COLORS[channels.length % STEP_COLORS.length],
    };
    setChannels((cs) => [...cs, ch]);
    setPatterns((ps) =>
      ps.map((p) => ({ ...p, steps: { ...p.steps, [ch.id]: emptySteps() }, notes: { ...p.notes, [ch.id]: [] } })),
    );
  };

  const removeChannel = (id: string) => {
    setChannels((cs) => cs.filter((c) => c.id !== id));
    voicesRef.current.get(id)?.dispose();
    voicesRef.current.delete(id);
    if (prChannel === id) setPrChannel(channels.find((c) => c.id !== id)?.id ?? "");
  };

  const addPattern = () => {
    const p = makePattern(`Pattern ${patterns.length + 1}`, channels, STEP_COLORS[patterns.length % STEP_COLORS.length]);
    setPatterns((ps) => [...ps, p]);
    setPlaylist((pl) => ({ ...pl, [p.id]: Array.from({ length: 32 }, () => false) }));
    setCurrentPattern(p.id);
  };

  const duplicatePattern = () => {
    if (!pat) return;
    const copy: Pattern = {
      ...pat,
      id: nid(),
      name: `${pat.name} (cópia)`,
      steps: Object.fromEntries(Object.entries(pat.steps).map(([k, v]) => [k, [...v]])),
      notes: Object.fromEntries(Object.entries(pat.notes).map(([k, v]) => [k, v.map((n) => ({ ...n }))])),
    };
    setPatterns((ps) => [...ps, copy]);
    setPlaylist((pl) => ({ ...pl, [copy.id]: Array.from({ length: 32 }, () => false) }));
    setCurrentPattern(copy.id);
  };

  const clearPattern = () => {
    setPatterns((ps) =>
      ps.map((p) =>
        p.id === currentPattern
          ? {
              ...p,
              steps: Object.fromEntries(channels.map((c) => [c.id, emptySteps()])),
              notes: Object.fromEntries(channels.map((c) => [c.id, []])),
            }
          : p,
      ),
    );
  };

  const deletePattern = (id: string) => {
    if (patterns.length <= 1) return;
    setPatterns((ps) => ps.filter((p) => p.id !== id));
    setPlaylist((pl) => {
      const c = { ...pl };
      delete c[id];
      return c;
    });
    if (currentPattern === id) setCurrentPattern(patterns.find((p) => p.id !== id)!.id);
  };

  const togglePlaylistCell = (patternId: string, bar: number) =>
    setPlaylist((pl) => {
      const arr = [...(pl[patternId] ?? Array.from({ length: 32 }, () => false))];
      arr[bar] = !arr[bar];
      return { ...pl, [patternId]: arr };
    });

  const currentBar = songMode ? Math.floor(playhead / STEPS) : 0;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: FL.bg, border: `1px solid ${FL.border}`, color: FL.text }}
    >
      {/* ---------- TOOLBAR ---------- */}
      <div
        className="flex flex-wrap items-center gap-3 px-3 py-2"
        style={{ background: FL.panel, borderBottom: `1px solid ${FL.border}` }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={playing ? stop : start}
            title={playing ? "Parar" : "Tocar"}
            className="flex h-9 w-9 items-center justify-center rounded"
            style={{ background: playing ? FL.green : FL.panelAlt, color: playing ? "#10240f" : FL.text }}
          >
            <Play className="h-4 w-4" />
          </button>
          <button
            onClick={stop}
            title="Stop"
            className="flex h-9 w-9 items-center justify-center rounded"
            style={{ background: FL.panelAlt }}
          >
            <Square className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSongMode((s) => !s)}
            title="Pattern / Song"
            className="ml-1 flex h-9 items-center gap-1 rounded px-3 text-xs font-semibold"
            style={{ background: songMode ? FL.accent : FL.panelAlt, color: songMode ? "#241503" : FL.dim }}
          >
            <Repeat className="h-3.5 w-3.5" />
            {songMode ? "SONG" : "PAT"}
          </button>
        </div>

        <div className="flex items-center gap-2 rounded px-2 py-1" style={{ background: FL.panelDarkFallback ?? FL.bg }}>
          <span className="text-[10px] uppercase tracking-wide" style={{ color: FL.dim }}>BPM</span>
          <input
            type="number"
            min={40}
            max={250}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value) || 120)}
            className="w-16 bg-transparent text-lg font-bold outline-none"
            style={{ color: FL.accent }}
          />
        </div>

        <label className="flex items-center gap-2 text-xs" style={{ color: FL.dim }}>
          Swing
          <input
            type="range"
            min={0}
            max={0.6}
            step={0.02}
            value={swing}
            onChange={(e) => setSwing(Number(e.target.value))}
            className="w-20"
          />
        </label>

        <label className="flex items-center gap-2 text-xs" style={{ color: FL.dim }}>
          <Volume2 className="h-3.5 w-3.5" /> Master
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={master}
            onChange={(e) => setMaster(Number(e.target.value))}
            className="w-24"
          />
        </label>

        <div className="ml-auto flex gap-1">
          {([
            ["rack", "Channel Rack", <Grid3X3 key="a" className="h-3.5 w-3.5" />],
            ["piano", "Piano Roll", <Music2 key="b" className="h-3.5 w-3.5" />],
            ["playlist", "Playlist", <ListMusic key="c" className="h-3.5 w-3.5" />],
            ["mixer", "Mixer", <Sliders key="d" className="h-3.5 w-3.5" />],
          ] as Array<[View, string, React.ReactNode]>).map(([v, label, icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex items-center gap-1.5 rounded px-3 py-2 text-xs font-medium"
              style={{
                background: view === v ? FL.accent : FL.panelAlt,
                color: view === v ? "#241503" : FL.dim,
              }}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---------- PATTERN BAR ---------- */}
      <div
        className="flex flex-wrap items-center gap-2 px-3 py-2"
        style={{ background: FL.panelAlt, borderBottom: `1px solid ${FL.border}` }}
      >
        <span className="text-[10px] uppercase tracking-wide" style={{ color: FL.dim }}>Patterns</span>
        {patterns.map((p) => (
          <div key={p.id} className="flex items-center">
            <button
              onClick={() => setCurrentPattern(p.id)}
              className="rounded-l px-3 py-1 text-xs font-semibold"
              style={{
                background: p.id === currentPattern ? p.color : FL.panel,
                color: p.id === currentPattern ? "#1b1b1f" : FL.dim,
              }}
            >
              {p.name}
            </button>
            <button
              onClick={() => deletePattern(p.id)}
              className="rounded-r px-1.5 py-1"
              style={{ background: FL.panel, color: FL.dim }}
              title="Excluir pattern"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button onClick={addPattern} className="rounded px-2 py-1 text-xs" style={{ background: FL.panel, color: FL.accent }}>
          <Plus className="inline h-3 w-3" /> Novo
        </button>
        <button onClick={duplicatePattern} className="rounded px-2 py-1 text-xs" style={{ background: FL.panel, color: FL.accent2 }}>
          <Copy className="inline h-3 w-3" /> Duplicar
        </button>
        <button onClick={clearPattern} className="rounded px-2 py-1 text-xs" style={{ background: FL.panel, color: FL.red }}>
          <Eraser className="inline h-3 w-3" /> Limpar
        </button>
      </div>

      {/* ---------- VIEWS ---------- */}
      <div className="p-3">
        {view === "rack" && pat && (
          <ChannelRack
            channels={channels}
            pattern={pat}
            playhead={songMode ? playhead % STEPS : playhead}
            playing={playing}
            onToggleStep={toggleStep}
            onUpdate={updateChannel}
            onRemove={removeChannel}
            onPreview={previewChannel}
            onAdd={addChannel}
            onOpenPiano={(id) => { setPrChannel(id); setView("piano"); }}
          />
        )}

        {view === "piano" && pat && (
          <PianoRoll
            channels={channels}
            channelId={prChannel}
            setChannelId={setPrChannel}
            pattern={pat}
            playhead={songMode ? playhead % STEPS : playhead}
            playing={playing}
            onToggleNote={toggleNote}
            onPreview={(note) => {
              const ch = channels.find((c) => c.id === prChannel);
              if (ch) previewChannel(ch, note);
            }}
          />
        )}

        {view === "playlist" && (
          <Playlist
            patterns={patterns}
            playlist={playlist}
            bars={bars}
            setBars={setBars}
            currentBar={playing && songMode ? currentBar : -1}
            onToggle={togglePlaylistCell}
            songMode={songMode}
            setSongMode={setSongMode}
          />
        )}

        {view === "mixer" && (
          <Mixer channels={channels} master={master} setMaster={setMaster} onUpdate={updateChannel} />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   CHANNEL RACK
============================================================ */

function ChannelRack({
  channels,
  pattern,
  playhead,
  playing,
  onToggleStep,
  onUpdate,
  onRemove,
  onPreview,
  onAdd,
  onOpenPiano,
}: {
  channels: Channel[];
  pattern: Pattern;
  playhead: number;
  playing: boolean;
  onToggleStep: (chId: string, step: number) => void;
  onUpdate: (id: string, patch: Partial<Channel>) => void;
  onRemove: (id: string) => void;
  onPreview: (ch: Channel, note?: string) => void;
  onAdd: (kind: ChannelKind, drum?: DrumKind) => void;
  onOpenPiano: (id: string) => void;
}) {
  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* números dos steps */}
          <div className="mb-1 flex items-center gap-1 pl-[196px]">
            {Array.from({ length: STEPS }).map((_, i) => (
              <div
                key={i}
                className="flex h-4 w-7 items-center justify-center text-[9px]"
                style={{ color: i % 4 === 0 ? FL.accent : FL.dim }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {channels.map((ch) => {
            const steps = pattern.steps[ch.id] ?? emptySteps();
            const noteCount = (pattern.notes[ch.id] ?? []).length;
            return (
              <div key={ch.id} className="mb-1 flex items-center gap-1">
                <div
                  className="flex w-[192px] shrink-0 items-center gap-1 rounded px-2 py-1"
                  style={{ background: FL.panel, borderLeft: `3px solid ${ch.color}` }}
                >
                  <button
                    onClick={() => onUpdate(ch.id, { mute: !ch.mute })}
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: ch.mute ? FL.line : ch.color }}
                    title="Mute"
                  />
                  <button
                    onClick={() => onPreview(ch)}
                    className="flex-1 truncate text-left text-xs font-medium"
                    style={{ color: FL.text }}
                    title="Ouvir"
                  >
                    {ch.name}
                  </button>
                  {noteCount > 0 && (
                    <span className="rounded px-1 text-[9px]" style={{ background: FL.panelAlt, color: FL.accent2 }}>
                      {noteCount}♪
                    </span>
                  )}
                  <button
                    onClick={() => onOpenPiano(ch.id)}
                    className="rounded p-1"
                    style={{ color: FL.accent2 }}
                    title="Piano Roll"
                  >
                    <Music2 className="h-3 w-3" />
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1.2}
                    step={0.01}
                    value={ch.vol}
                    onChange={(e) => onUpdate(ch.id, { vol: Number(e.target.value) })}
                    className="w-12"
                    title="Volume"
                  />
                  <button onClick={() => onRemove(ch.id)} className="rounded p-1" style={{ color: FL.dim }} title="Remover">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {steps.map((on, i) => {
                  const isBeat = i % 4 === 0;
                  const active = playing && playhead === i;
                  return (
                    <button
                      key={i}
                      onClick={() => onToggleStep(ch.id, i)}
                      className="h-7 w-7 shrink-0 rounded-sm transition-colors"
                      style={{
                        background: on ? ch.color : isBeat ? FL.panelAlt : FL.panel,
                        outline: active ? `2px solid ${FL.accent}` : "none",
                        boxShadow: on ? `inset 0 -6px 8px rgba(0,0,0,.25)` : "none",
                        border: `1px solid ${FL.border}`,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-[10px] uppercase tracking-wide self-center" style={{ color: FL.dim }}>Adicionar canal</span>
        {([
          ["Kick", "drum", "kick"],
          ["Snare", "drum", "snare"],
          ["Clap", "drum", "clap"],
          ["Hat", "drum", "hat"],
          ["Tom", "drum", "tom"],
          ["Crash", "drum", "cymbal"],
          ["Bass", "bass", undefined],
          ["Pluck", "pluck", undefined],
          ["Pad", "synth", undefined],
        ] as Array<[string, ChannelKind, DrumKind | undefined]>).map(([label, kind, drum]) => (
          <button
            key={label}
            onClick={() => onAdd(kind, drum)}
            className="rounded px-2.5 py-1 text-xs"
            style={{ background: FL.panel, color: FL.text, border: `1px solid ${FL.line}` }}
          >
            <Plus className="mr-1 inline h-3 w-3" style={{ color: FL.accent }} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   PIANO ROLL
============================================================ */

function PianoRoll({
  channels,
  channelId,
  setChannelId,
  pattern,
  playhead,
  playing,
  onToggleNote,
  onPreview,
}: {
  channels: Channel[];
  channelId: string;
  setChannelId: (id: string) => void;
  pattern: Pattern;
  playhead: number;
  playing: boolean;
  onToggleNote: (chId: string, step: number, note: string) => void;
  onPreview: (note: string) => void;
}) {
  const notes = pattern.notes[channelId] ?? [];
  const ch = channels.find((c) => c.id === channelId);
  const has = (step: number, note: string) => notes.some((n) => n.step === step && n.note === note);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide" style={{ color: FL.dim }}>Canal</span>
        <select
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          className="rounded px-2 py-1 text-xs"
          style={{ background: FL.panel, color: FL.text, border: `1px solid ${FL.line}` }}
        >
          {channels.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <span className="text-xs" style={{ color: FL.dim }}>
          Clique nas células para escrever a melodia — {notes.length} nota(s)
        </span>
      </div>

      <div className="overflow-auto rounded" style={{ maxHeight: 460, border: `1px solid ${FL.border}` }}>
        <div className="min-w-[700px]">
          {PR_NOTES.map((note) => {
            const isSharp = note.includes("#");
            return (
              <div key={note} className="flex items-center">
                <button
                  onClick={() => onPreview(note)}
                  className="sticky left-0 z-10 flex h-5 w-14 shrink-0 items-center px-1 text-[9px]"
                  style={{
                    background: isSharp ? "#191920" : "#e9e9ef",
                    color: isSharp ? "#c9c9d4" : "#1b1b1f",
                    borderBottom: `1px solid ${FL.border}`,
                  }}
                >
                  {note}
                </button>
                {Array.from({ length: STEPS }).map((_, s) => {
                  const on = has(s, note);
                  return (
                    <button
                      key={s}
                      onClick={() => { onToggleNote(channelId, s, note); if (!on) onPreview(note); }}
                      className="h-5 w-9 shrink-0"
                      style={{
                        background: on
                          ? ch?.color ?? FL.accent
                          : playing && playhead === s
                            ? "#3d3d47"
                            : isSharp
                              ? "#212128"
                              : s % 4 === 0
                                ? "#2b2b33"
                                : FL.panel,
                        borderRight: `1px solid ${s % 4 === 3 ? FL.line : FL.border}`,
                        borderBottom: `1px solid ${FL.border}`,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PLAYLIST
============================================================ */

function Playlist({
  patterns,
  playlist,
  bars,
  setBars,
  currentBar,
  onToggle,
  songMode,
  setSongMode,
}: {
  patterns: Pattern[];
  playlist: Record<string, boolean[]>;
  bars: number;
  setBars: (n: number) => void;
  currentBar: number;
  onToggle: (patternId: string, bar: number) => void;
  songMode: boolean;
  setSongMode: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setSongMode(true)}
          className="rounded px-3 py-1 text-xs font-semibold"
          style={{ background: songMode ? FL.accent : FL.panel, color: songMode ? "#241503" : FL.dim }}
        >
          Modo Song {songMode ? "(ativo)" : "(ativar)"}
        </button>
        <label className="flex items-center gap-2 text-xs" style={{ color: FL.dim }}>
          Compassos
          <input
            type="number"
            min={1}
            max={32}
            value={bars}
            onChange={(e) => setBars(Math.min(32, Math.max(1, Number(e.target.value) || 1)))}
            className="w-14 rounded px-1 py-0.5"
            style={{ background: FL.panel, color: FL.text, border: `1px solid ${FL.line}` }}
          />
        </label>
        <span className="text-xs" style={{ color: FL.dim }}>
          Clique para posicionar patterns no arranjo.
        </span>
      </div>

      <div className="overflow-x-auto rounded" style={{ border: `1px solid ${FL.border}` }}>
        <div className="min-w-[640px]">
          <div className="flex" style={{ background: FL.panelAlt }}>
            <div className="w-32 shrink-0 px-2 py-1 text-[10px] uppercase" style={{ color: FL.dim }}>Pattern</div>
            {Array.from({ length: bars }).map((_, b) => (
              <div
                key={b}
                className="w-10 shrink-0 py-1 text-center text-[10px]"
                style={{ color: b === currentBar ? FL.accent : FL.dim, borderLeft: `1px solid ${FL.border}` }}
              >
                {b + 1}
              </div>
            ))}
          </div>
          {patterns.map((p) => (
            <div key={p.id} className="flex items-center" style={{ borderTop: `1px solid ${FL.border}` }}>
              <div
                className="w-32 shrink-0 truncate px-2 py-1 text-xs"
                style={{ background: FL.panel, borderLeft: `3px solid ${p.color}` }}
              >
                {p.name}
              </div>
              {Array.from({ length: bars }).map((_, b) => {
                const on = playlist[p.id]?.[b];
                return (
                  <button
                    key={b}
                    onClick={() => onToggle(p.id, b)}
                    className="h-7 w-10 shrink-0"
                    style={{
                      background: on ? p.color : b === currentBar ? "#33333b" : FL.bg,
                      borderLeft: `1px solid ${FL.border}`,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MIXER
============================================================ */

function Mixer({
  channels,
  master,
  setMaster,
  onUpdate,
}: {
  channels: Channel[];
  master: number;
  setMaster: (v: number) => void;
  onUpdate: (id: string, patch: Partial<Channel>) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Strip
        name="MASTER"
        color={FL.accent}
        vol={master}
        pan={0}
        mute={false}
        solo={false}
        onVol={setMaster}
        isMaster
      />
      {channels.map((c) => (
        <Strip
          key={c.id}
          name={c.name}
          color={c.color}
          vol={c.vol}
          pan={c.pan}
          mute={c.mute}
          solo={c.solo}
          onVol={(v) => onUpdate(c.id, { vol: v })}
          onPan={(v) => onUpdate(c.id, { pan: v })}
          onMute={() => onUpdate(c.id, { mute: !c.mute })}
          onSolo={() => onUpdate(c.id, { solo: !c.solo })}
        />
      ))}
    </div>
  );
}

function Strip({
  name,
  color,
  vol,
  pan,
  mute,
  solo,
  onVol,
  onPan,
  onMute,
  onSolo,
  isMaster,
}: {
  name: string;
  color: string;
  vol: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  onVol: (v: number) => void;
  onPan?: (v: number) => void;
  onMute?: () => void;
  onSolo?: () => void;
  isMaster?: boolean;
}) {
  return (
    <div
      className="flex w-[92px] shrink-0 flex-col items-center gap-2 rounded p-2"
      style={{ background: FL.panel, border: `1px solid ${FL.border}`, borderTop: `3px solid ${color}` }}
    >
      <div className="w-full truncate text-center text-[10px] font-semibold" style={{ color: FL.text }}>{name}</div>
      {!isMaster && (
        <label className="w-full text-center text-[9px]" style={{ color: FL.dim }}>
          PAN
          <input
            type="range"
            min={-1}
            max={1}
            step={0.02}
            value={pan}
            onChange={(e) => onPan?.(Number(e.target.value))}
            className="w-full"
          />
        </label>
      )}
      <input
        type="range"
        min={0}
        max={isMaster ? 1 : 1.2}
        step={0.01}
        value={vol}
        onChange={(e) => onVol(Number(e.target.value))}
        className="h-28"
        style={{ writingMode: "vertical-lr" as never, direction: "rtl", accentColor: color }}
      />
      <div className="text-[9px]" style={{ color: FL.dim }}>{Math.round(vol * 100)}</div>
      {!isMaster && (
        <div className="flex gap-1">
          <button
            onClick={onMute}
            className="rounded p-1"
            style={{ background: mute ? FL.red : FL.panelAlt, color: mute ? "#fff" : FL.dim }}
            title="Mute"
          >
            {mute ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </button>
          <button
            onClick={onSolo}
            className="rounded p-1"
            style={{ background: solo ? FL.accent : FL.panelAlt, color: solo ? "#241503" : FL.dim }}
            title="Solo"
          >
            <Headphones className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
