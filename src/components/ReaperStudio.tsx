import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import {
  Play,
  Square,
  Circle,
  SkipBack,
  Repeat,
  Volume2,
  VolumeX,
  Headphones,
  Mic,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings2,
  Music2,
  Piano,
  Drum,
  Radio,
  Waves,
  Save,
  FolderOpen,
  Upload,
  Sliders,
  Cpu,
} from "lucide-react";

/* ============================================================
   TIPOS
============================================================ */

type ClipKind = "audio" | "midi";

interface AudioClip {
  kind: "audio";
  id: string;
  name: string;
  start: number; // seg na timeline
  duration: number;
  buffer: AudioBuffer;
  waveform: number[]; // valores 0..1 (peaks)
  url: string;
}

interface MidiNote {
  midi: number;
  time: number; // seg dentro do clipe
  duration: number;
  velocity: number;
}

interface MidiClip {
  kind: "midi";
  id: string;
  name: string;
  start: number;
  duration: number;
  notes: MidiNote[];
}

type Clip = AudioClip | MidiClip;

interface FxSlot {
  id: string;
  type: "eq3" | "comp" | "reverb" | "delay" | "wam";
  bypass: boolean;
  label: string;
  wamUrl?: string;
  params: Record<string, number>;
}

interface Track {
  id: string;
  name: string;
  color: string;
  type: "audio" | "midi";
  instrument?: InstrumentKind;
  volume: number; // 0..1.2
  pan: number; // -1..1
  mute: boolean;
  solo: boolean;
  arm: boolean;
  height: number; // px
  clips: Clip[];
  fx: FxSlot[];
  meterL: number; // 0..1 (visual)
  meterR: number;
}

type InstrumentKind =
  | "kontakt-piano"
  | "arturia-mini"
  | "korg-m1-pad"
  | "arturia-jup"
  | "808-drums";

/* ============================================================
   PALETA REAPER
============================================================ */

const CLIP_COLORS = [
  "#7ba7d6",
  "#c78bd6",
  "#d68b8b",
  "#d6c78b",
  "#8bd6a1",
  "#d6a17b",
  "#8bb2d6",
  "#c9d68b",
];

const R = {
  bg: "#2d2d2d",
  panel: "#3a3a3a",
  panelDark: "#242424",
  border: "#1a1a1a",
  borderLight: "#4a4a4a",
  text: "#d4d4d4",
  textDim: "#888",
  accent: "#5b9bd5",
  rec: "#e05555",
  play: "#7cc47c",
  meter1: "#4ec14e",
  meter2: "#e0d155",
  meter3: "#e05555",
};

/* ============================================================
   HELPERS
============================================================ */

const nid = () => Math.random().toString(36).slice(2, 10);

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function computeWaveform(buffer: AudioBuffer, targetPeaks = 800): number[] {
  const data = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / targetPeaks));
  const peaks: number[] = [];
  for (let i = 0; i < data.length; i += step) {
    let max = 0;
    const end = Math.min(i + step, data.length);
    for (let j = i; j < end; j++) {
      const v = Math.abs(data[j]);
      if (v > max) max = v;
    }
    peaks.push(max);
  }
  return peaks;
}

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function ReaperStudio() {
  const [tracks, setTracks] = useState<Track[]>(() => makeDefaultTracks());
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [position, setPosition] = useState(0); // seg
  const [bpm, setBpm] = useState(120);
  const [zoom, setZoom] = useState(60); // px por segundo
  const [showMixer, setShowMixer] = useState(true);
  const [metronome, setMetronome] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [openFxTrack, setOpenFxTrack] = useState<string | null>(null);
  const [openInstrumentTrack, setOpenInstrumentTrack] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const playStartRef = useRef(0);
  const posStartRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const activeNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<BlobPart[]>([]);
  const recTrackIdRef = useRef<string | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const totalDur = Math.max(
    60,
    ...tracks.flatMap((t) => t.clips.map((c) => c.start + c.duration)),
  );

  const getCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  /* -------- Transport -------- */

  const play = async () => {
    const ctx = getCtx();
    if (ctx.state === "suspended") await ctx.resume();
    await Tone.start();
    Tone.getTransport().bpm.value = bpm;

    const anySolo = tracks.some((t) => t.solo);
    const now = ctx.currentTime + 0.05;
    playStartRef.current = now;
    posStartRef.current = position;
    activeNodesRef.current = [];

    for (const track of tracks) {
      if (track.mute) continue;
      if (anySolo && !track.solo) continue;

      const gain = ctx.createGain();
      gain.gain.value = track.volume;
      const panner = ctx.createStereoPanner();
      panner.pan.value = track.pan;

      // FX chain
      let head: AudioNode = gain;
      for (const fx of track.fx) {
        if (fx.bypass) continue;
        const node = buildFxNode(ctx, fx);
        if (node) {
          head.connect(node.input);
          head = node.output;
        }
      }
      head.connect(panner);
      panner.connect(ctx.destination);

      for (const clip of track.clips) {
        const clipStart = clip.start;
        const clipEnd = clip.start + clip.duration;
        if (clipEnd <= position) continue;
        const offsetInClip = Math.max(0, position - clipStart);
        const whenOffset = Math.max(0, clipStart - position);

        if (clip.kind === "audio") {
          const src = ctx.createBufferSource();
          src.buffer = clip.buffer;
          src.connect(gain);
          src.start(now + whenOffset, offsetInClip);
          activeNodesRef.current.push(src);
        } else {
          // MIDI: agendar notas via oscilador simples
          for (const n of clip.notes) {
            const noteStart = n.time;
            if (noteStart + n.duration < offsetInClip) continue;
            const startAt = now + whenOffset + Math.max(0, noteStart - offsetInClip);
            const dur = Math.max(0.05, n.duration - Math.max(0, offsetInClip - noteStart));
            scheduleSynthNote(ctx, gain, track.instrument ?? "arturia-mini", n.midi, n.velocity, startAt, dur);
          }
        }
      }
    }

    setPlaying(true);
    tick();
  };

  const tick = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const elapsed = ctx.currentTime - playStartRef.current;
    const p = posStartRef.current + elapsed;
    if (loopEnabled && p >= totalDur) {
      stop();
      setPosition(0);
      setTimeout(() => play(), 30);
      return;
    }
    setPosition(p);
    rafRef.current = requestAnimationFrame(tick);
  };

  const stop = () => {
    activeNodesRef.current.forEach((n) => {
      try {
        n.stop();
      } catch {
        // ignore
      }
    });
    activeNodesRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaying(false);
  };

  const rewind = () => {
    stop();
    setPosition(0);
  };

  /* -------- Track ops -------- */

  const updateTrack = (id: string, patch: Partial<Track>) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const addAudioTrack = () => {
    setTracks((prev) => [
      ...prev,
      makeTrack(prev.length, "audio"),
    ]);
  };

  const addMidiTrack = (instrument: InstrumentKind = "arturia-mini") => {
    setTracks((prev) => [
      ...prev,
      { ...makeTrack(prev.length, "midi"), instrument, name: instrumentLabel(instrument) },
    ]);
  };

  const removeTrack = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  /* -------- Import audio (drop) -------- */

  const importAudioFiles = async (files: File[], trackId?: string) => {
    const ctx = getCtx();
    for (const file of files) {
      const arrayBuf = await file.arrayBuffer();
      try {
        const buffer = await ctx.decodeAudioData(arrayBuf.slice(0));
        const url = URL.createObjectURL(file);
        const clip: AudioClip = {
          kind: "audio",
          id: nid(),
          name: file.name.replace(/\.[^.]+$/, ""),
          start: position,
          duration: buffer.duration,
          buffer,
          waveform: computeWaveform(buffer),
          url,
        };
        if (trackId) {
          setTracks((prev) =>
            prev.map((t) => (t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t)),
          );
        } else {
          setTracks((prev) => [
            ...prev,
            { ...makeTrack(prev.length, "audio"), name: clip.name, clips: [clip] },
          ]);
        }
      } catch (e) {
        console.error("decode error", e);
      }
    }
  };

  const importMidiFile = async (file: File) => {
    const buf = await file.arrayBuffer();
    const midi = new Midi(buf);
    setTracks((prev) => {
      const next = [...prev];
      midi.tracks.forEach((mtrack, idx) => {
        if (mtrack.notes.length === 0) return;
        const notes: MidiNote[] = mtrack.notes.map((n) => ({
          midi: n.midi,
          time: n.time,
          duration: n.duration,
          velocity: n.velocity,
        }));
        const dur = Math.max(...notes.map((n) => n.time + n.duration));
        const clip: MidiClip = {
          kind: "midi",
          id: nid(),
          name: mtrack.name || file.name.replace(/\.[^.]+$/, "") + " " + (idx + 1),
          start: position,
          duration: dur,
          notes,
        };
        const inst: InstrumentKind =
          /drum|kit|808/i.test(mtrack.name) ? "808-drums" : "arturia-mini";
        next.push({
          ...makeTrack(next.length, "midi"),
          name: clip.name,
          instrument: inst,
          clips: [clip],
        });
      });
      return next;
    });
  };

  /* -------- Recording (mic) -------- */

  const startRecording = async () => {
    const armed = tracks.find((t) => t.arm && t.type === "audio");
    if (!armed) {
      alert("Ative o botão R (arm) de uma track de áudio antes de gravar.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      recChunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      rec.ondataavailable = (e) => e.data.size && recChunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recChunksRef.current, { type: mime });
        const ctx = getCtx();
        try {
          const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
          const url = URL.createObjectURL(blob);
          const clip: AudioClip = {
            kind: "audio",
            id: nid(),
            name: `Rec ${new Date().toLocaleTimeString()}`,
            start: posStartRef.current,
            duration: buf.duration,
            buffer: buf,
            waveform: computeWaveform(buf),
            url,
          };
          if (recTrackIdRef.current) {
            const tid = recTrackIdRef.current;
            setTracks((prev) =>
              prev.map((t) => (t.id === tid ? { ...t, clips: [...t.clips, clip] } : t)),
            );
          }
        } catch (err) {
          console.error(err);
        }
      };
      recTrackIdRef.current = armed.id;
      rec.start();
      mediaRecRef.current = rec;
      setRecording(true);
      posStartRef.current = position;
      await play();
    } catch (err) {
      alert("Erro ao acessar microfone: " + (err as Error).message);
    }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    mediaRecRef.current = null;
    setRecording(false);
    stop();
  };

  /* -------- Cleanup -------- */

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  /* -------- Timeline click -------- */

  const seekFromEvent = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const sec = Math.max(0, x / zoom);
    setPosition(sec);
    if (playing) {
      stop();
      setTimeout(() => play(), 20);
    }
  };

  /* -------- Render -------- */

  return (
    <div
      className="rounded-md overflow-hidden border shadow-2xl select-none"
      style={{ background: R.bg, borderColor: R.border, color: R.text, fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      {/* MENU BAR */}
      <div
        className="flex items-center gap-4 px-3 py-1 text-[11px]"
        style={{ background: R.panelDark, borderBottom: `1px solid ${R.border}` }}
      >
        <div className="font-bold text-[13px]" style={{ color: R.accent }}>
          SOLANDO DAW
        </div>
        {["File", "Edit", "View", "Insert", "Track", "Options", "Actions", "Help"].map((m) => (
          <button
            key={m}
            className="px-2 py-0.5 hover:bg-white/10 rounded"
            style={{ color: R.text }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* TRANSPORT BAR */}
      <div
        className="flex flex-wrap items-center gap-2 px-3 py-2"
        style={{ background: R.panel, borderBottom: `1px solid ${R.border}` }}
      >
        <div className="flex items-center gap-1">
          <TransportBtn onClick={rewind} title="Rewind">
            <SkipBack className="w-4 h-4" />
          </TransportBtn>
          {playing ? (
            <TransportBtn onClick={stop} title="Stop" color={R.play}>
              <Square className="w-4 h-4 fill-current" />
            </TransportBtn>
          ) : (
            <TransportBtn onClick={play} title="Play" color={R.play}>
              <Play className="w-4 h-4 fill-current" />
            </TransportBtn>
          )}
          {recording ? (
            <TransportBtn onClick={stopRecording} title="Stop Rec" color={R.rec} active>
              <Square className="w-4 h-4 fill-current" />
            </TransportBtn>
          ) : (
            <TransportBtn onClick={startRecording} title="Record" color={R.rec}>
              <Circle className="w-4 h-4 fill-current" />
            </TransportBtn>
          )}
          <TransportBtn
            onClick={() => setLoopEnabled((v) => !v)}
            title="Loop"
            active={loopEnabled}
          >
            <Repeat className="w-4 h-4" />
          </TransportBtn>
        </div>

        {/* Position display */}
        <div
          className="px-3 py-1 rounded font-mono text-lg tabular-nums"
          style={{ background: R.panelDark, border: `1px solid ${R.border}`, color: R.meter1, minWidth: 160, textAlign: "center" }}
        >
          {fmtTime(position)}
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span style={{ color: R.textDim }}>BPM</span>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value) || 120)}
            className="w-14 px-1 py-0.5 rounded text-center font-mono"
            style={{ background: R.panelDark, border: `1px solid ${R.border}`, color: R.text }}
          />
        </div>

        <button
          onClick={() => setMetronome((v) => !v)}
          className="px-2 py-1 text-xs rounded"
          style={{
            background: metronome ? R.accent : R.panelDark,
            border: `1px solid ${R.border}`,
            color: metronome ? "#fff" : R.text,
          }}
        >
          Metronome
        </button>

        <div className="flex items-center gap-1 text-xs ml-2">
          <span style={{ color: R.textDim }}>Zoom</span>
          <input
            type="range"
            min={20}
            max={200}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24"
          />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <label
            className="px-2 py-1 text-xs rounded cursor-pointer flex items-center gap-1"
            style={{ background: R.panelDark, border: `1px solid ${R.border}` }}
          >
            <Upload className="w-3 h-3" /> Importar Áudio
            <input
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && importAudioFiles(Array.from(e.target.files))}
            />
          </label>
          <label
            className="px-2 py-1 text-xs rounded cursor-pointer flex items-center gap-1"
            style={{ background: R.panelDark, border: `1px solid ${R.border}` }}
          >
            <Music2 className="w-3 h-3" /> Importar MIDI
            <input
              type="file"
              accept=".mid,.midi"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importMidiFile(e.target.files[0])}
            />
          </label>
          <button
            onClick={() => setShowMixer((v) => !v)}
            className="px-2 py-1 text-xs rounded flex items-center gap-1"
            style={{ background: showMixer ? R.accent : R.panelDark, border: `1px solid ${R.border}`, color: showMixer ? "#fff" : R.text }}
          >
            <Sliders className="w-3 h-3" /> Mixer
          </button>
        </div>
      </div>

      {/* MAIN AREA: TCP + Arrange */}
      <div className="flex" style={{ height: 460, background: R.bg }}>
        {/* TCP - Track Control Panels */}
        <div
          className="overflow-y-auto"
          style={{
            width: 260,
            background: R.panel,
            borderRight: `2px solid ${R.border}`,
            flexShrink: 0,
          }}
        >
          {tracks.map((t) => (
            <TrackControlPanel
              key={t.id}
              track={t}
              selected={selectedTrack === t.id}
              onSelect={() => setSelectedTrack(t.id)}
              onChange={(p) => updateTrack(t.id, p)}
              onRemove={() => removeTrack(t.id)}
              onOpenFx={() => setOpenFxTrack(t.id)}
              onOpenInstrument={() => setOpenInstrumentTrack(t.id)}
            />
          ))}

          {/* Add track buttons */}
          <div className="p-2 space-y-1" style={{ borderTop: `1px solid ${R.border}` }}>
            <button
              onClick={addAudioTrack}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-xs rounded hover:opacity-80"
              style={{ background: R.panelDark, border: `1px solid ${R.borderLight}` }}
            >
              <Plus className="w-3 h-3" /> Áudio
            </button>
            <button
              onClick={() => addMidiTrack("arturia-mini")}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-xs rounded hover:opacity-80"
              style={{ background: R.panelDark, border: `1px solid ${R.borderLight}` }}
            >
              <Piano className="w-3 h-3" /> MIDI / Instrumento
            </button>
          </div>
        </div>

        {/* Arrange view */}
        <div
          ref={timelineRef}
          className="flex-1 overflow-auto relative"
          onClick={seekFromEvent}
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            const audio = files.filter((f) => f.type.startsWith("audio/"));
            const midi = files.filter((f) => /\.midi?$/i.test(f.name));
            if (audio.length) await importAudioFiles(audio);
            for (const m of midi) await importMidiFile(m);
          }}
        >
          <div style={{ width: Math.max(800, totalDur * zoom), position: "relative" }}>
            {/* Ruler */}
            <div
              className="sticky top-0 z-10"
              style={{
                height: 24,
                background: R.panelDark,
                borderBottom: `1px solid ${R.border}`,
              }}
            >
              <TimelineRuler duration={totalDur} zoom={zoom} bpm={bpm} />
            </div>
            {/* Track lanes */}
            {tracks.map((t) => (
              <TrackLane
                key={t.id}
                track={t}
                zoom={zoom}
                totalDur={totalDur}
                onImportToTrack={(files) => importAudioFiles(files, t.id)}
              />
            ))}
            {/* Playhead */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: position * zoom,
                width: 2,
                background: R.rec,
                pointerEvents: "none",
                boxShadow: `0 0 4px ${R.rec}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* MIXER */}
      {showMixer && (
        <div
          className="overflow-x-auto"
          style={{
            background: R.panelDark,
            borderTop: `2px solid ${R.border}`,
            height: 260,
          }}
        >
          <div className="flex gap-1 p-2 h-full">
            {tracks.map((t) => (
              <MixerStrip key={t.id} track={t} onChange={(p) => updateTrack(t.id, p)} />
            ))}
            <MasterStrip />
          </div>
        </div>
      )}

      {/* FX Panel */}
      {openFxTrack && (
        <FxPanel
          track={tracks.find((t) => t.id === openFxTrack)!}
          onChange={(p) => updateTrack(openFxTrack, p)}
          onClose={() => setOpenFxTrack(null)}
        />
      )}

      {/* Instrument Rack */}
      {openInstrumentTrack && (
        <InstrumentRackPanel
          track={tracks.find((t) => t.id === openInstrumentTrack)!}
          onChange={(p) => updateTrack(openInstrumentTrack, p)}
          onClose={() => setOpenInstrumentTrack(null)}
        />
      )}
    </div>
  );
}

/* ============================================================
   MAKE DEFAULT TRACKS
============================================================ */

function makeDefaultTracks(): Track[] {
  return [
    makeTrack(0, "audio", "Vocal"),
    makeTrack(1, "audio", "Guitar"),
    { ...makeTrack(2, "midi", "Piano"), instrument: "kontakt-piano" },
    { ...makeTrack(3, "midi", "Drums"), instrument: "808-drums" },
  ];
}

function makeTrack(idx: number, type: "audio" | "midi", name?: string): Track {
  return {
    id: nid(),
    name: name ?? (type === "audio" ? `Audio ${idx + 1}` : `MIDI ${idx + 1}`),
    color: CLIP_COLORS[idx % CLIP_COLORS.length],
    type,
    volume: 0.85,
    pan: 0,
    mute: false,
    solo: false,
    arm: false,
    height: 72,
    clips: [],
    fx: [],
    meterL: 0,
    meterR: 0,
  };
}

/* ============================================================
   TRANSPORT BUTTON
============================================================ */

function TransportBtn({
  children,
  onClick,
  title,
  color,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  color?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 rounded flex items-center justify-center transition-colors"
      style={{
        background: active ? color ?? R.accent : R.panelDark,
        border: `1px solid ${R.border}`,
        color: active ? "#fff" : color ?? R.text,
      }}
    >
      {children}
    </button>
  );
}

/* ============================================================
   TIMELINE RULER
============================================================ */

function TimelineRuler({ duration, zoom, bpm }: { duration: number; zoom: number; bpm: number }) {
  const marks: React.ReactNode[] = [];
  const secPerBeat = 60 / bpm;
  const step = zoom < 40 ? 4 : zoom < 80 ? 2 : 1; // sec
  for (let s = 0; s <= duration; s += step) {
    marks.push(
      <div
        key={s}
        style={{
          position: "absolute",
          left: s * zoom,
          top: 0,
          height: "100%",
          borderLeft: `1px solid ${R.borderLight}`,
          paddingLeft: 4,
          fontSize: 10,
          color: R.textDim,
          fontFamily: "monospace",
        }}
      >
        {fmtTime(s).slice(0, 5)}
      </div>,
    );
  }
  // beats
  const beatCount = Math.ceil(duration / secPerBeat);
  for (let b = 0; b <= beatCount; b++) {
    if (b % 4 === 0) continue;
    marks.push(
      <div
        key={`b${b}`}
        style={{
          position: "absolute",
          left: b * secPerBeat * zoom,
          bottom: 0,
          height: 6,
          borderLeft: `1px solid ${R.border}`,
        }}
      />,
    );
  }
  return <div style={{ position: "relative", height: "100%" }}>{marks}</div>;
}

/* ============================================================
   TRACK CONTROL PANEL (TCP)
============================================================ */

function TrackControlPanel({
  track,
  selected,
  onSelect,
  onChange,
  onRemove,
  onOpenFx,
  onOpenInstrument,
}: {
  track: Track;
  selected: boolean;
  onSelect: () => void;
  onChange: (p: Partial<Track>) => void;
  onRemove: () => void;
  onOpenFx: () => void;
  onOpenInstrument: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        height: track.height,
        background: selected ? "#454545" : R.panel,
        borderBottom: `1px solid ${R.border}`,
        borderLeft: `4px solid ${track.color}`,
        padding: "4px 6px",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <div className="flex items-center gap-1">
        <input
          value={track.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="flex-1 min-w-0 bg-transparent text-xs font-bold outline-none"
          style={{ color: R.text }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-40 hover:opacity-100"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <MiniBtn
          active={track.mute}
          onClick={() => onChange({ mute: !track.mute })}
          color={R.textDim}
          activeColor="#e0d155"
        >
          M
        </MiniBtn>
        <MiniBtn
          active={track.solo}
          onClick={() => onChange({ solo: !track.solo })}
          color={R.textDim}
          activeColor="#7cc47c"
        >
          S
        </MiniBtn>
        <MiniBtn
          active={track.arm}
          onClick={() => onChange({ arm: !track.arm })}
          color={R.textDim}
          activeColor={R.rec}
        >
          R
        </MiniBtn>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenFx();
          }}
          className="text-[10px] px-1.5 py-0.5 rounded"
          style={{ background: R.panelDark, border: `1px solid ${R.border}`, color: R.text }}
          title="Efeitos"
        >
          FX {track.fx.length > 0 && `(${track.fx.length})`}
        </button>
        {track.type === "midi" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenInstrument();
            }}
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: R.panelDark, border: `1px solid ${R.accent}`, color: R.accent }}
            title="Instrumento virtual"
          >
            {instrumentShortName(track.instrument)}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Volume2 className="w-3 h-3 opacity-50" />
        <input
          type="range"
          min={0}
          max={1.2}
          step={0.01}
          value={track.volume}
          onChange={(e) => onChange({ volume: Number(e.target.value) })}
          className="flex-1"
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-[10px] font-mono w-8 text-right" style={{ color: R.textDim }}>
          {Math.round(track.volume * 100)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px]" style={{ color: R.textDim }}>PAN</span>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={track.pan}
          onChange={(e) => onChange({ pan: Number(e.target.value) })}
          className="flex-1"
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-[10px] font-mono w-8 text-right" style={{ color: R.textDim }}>
          {track.pan === 0 ? "C" : (track.pan > 0 ? "R" : "L") + Math.round(Math.abs(track.pan) * 100)}
        </span>
      </div>
    </div>
  );
}

function MiniBtn({
  children,
  active,
  onClick,
  color,
  activeColor,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  color: string;
  activeColor: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="w-5 h-5 text-[10px] font-bold rounded"
      style={{
        background: active ? activeColor : R.panelDark,
        border: `1px solid ${R.border}`,
        color: active ? "#000" : color,
      }}
    >
      {children}
    </button>
  );
}

/* ============================================================
   TRACK LANE (arrange)
============================================================ */

function TrackLane({
  track,
  zoom,
  totalDur,
  onImportToTrack,
}: {
  track: Track;
  zoom: number;
  totalDur: number;
  onImportToTrack: (files: File[]) => void;
}) {
  return (
    <div
      style={{
        height: track.height,
        borderBottom: `1px solid ${R.border}`,
        background: "#202020",
        position: "relative",
        width: totalDur * zoom,
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("audio/"));
        if (files.length) onImportToTrack(files);
      }}
    >
      {track.clips.map((c) =>
        c.kind === "audio" ? (
          <AudioClipView key={c.id} clip={c} track={track} zoom={zoom} />
        ) : (
          <MidiClipView key={c.id} clip={c} track={track} zoom={zoom} />
        ),
      )}
    </div>
  );
}

function AudioClipView({ clip, track, zoom }: { clip: AudioClip; track: Track; zoom: number }) {
  const w = clip.duration * zoom;
  return (
    <div
      style={{
        position: "absolute",
        left: clip.start * zoom,
        top: 4,
        bottom: 4,
        width: w,
        background: `linear-gradient(180deg, ${track.color}dd, ${track.color}88)`,
        border: `1px solid ${track.color}`,
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          padding: "1px 4px",
          background: "rgba(0,0,0,0.4)",
          color: "#fff",
          fontWeight: 600,
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {clip.name}
      </div>
      <WaveformSvg peaks={clip.waveform} width={w} height={track.height - 22} color="#00000088" />
    </div>
  );
}

function WaveformSvg({
  peaks,
  width,
  height,
  color,
}: {
  peaks: number[];
  width: number;
  height: number;
  color: string;
}) {
  const step = width / peaks.length;
  const mid = height / 2;
  const points = peaks
    .map((p, i) => {
      const x = i * step;
      const y = p * mid;
      return `M${x},${mid - y}L${x},${mid + y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={points} stroke={color} strokeWidth={1} />
    </svg>
  );
}

function MidiClipView({ clip, track, zoom }: { clip: MidiClip; track: Track; zoom: number }) {
  const w = clip.duration * zoom;
  const h = track.height - 8;
  const minMidi = Math.min(...clip.notes.map((n) => n.midi), 60) - 2;
  const maxMidi = Math.max(...clip.notes.map((n) => n.midi), 72) + 2;
  const range = Math.max(1, maxMidi - minMidi);
  return (
    <div
      style={{
        position: "absolute",
        left: clip.start * zoom,
        top: 4,
        bottom: 4,
        width: w,
        background: `linear-gradient(180deg, ${track.color}aa, ${track.color}44)`,
        border: `1px solid ${track.color}`,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontSize: 10,
          padding: "1px 4px",
          background: "rgba(0,0,0,0.4)",
          color: "#fff",
          fontWeight: 600,
        }}
      >
        ♪ {clip.name}
      </div>
      <svg width={w} height={h - 14} style={{ display: "block" }}>
        {clip.notes.map((n, i) => {
          const x = (n.time / clip.duration) * w;
          const nw = Math.max(1, (n.duration / clip.duration) * w);
          const y = ((maxMidi - n.midi) / range) * (h - 16);
          return <rect key={i} x={x} y={y} width={nw} height={2} fill="#fff" opacity={0.85} />;
        })}
      </svg>
    </div>
  );
}

/* ============================================================
   MIXER STRIPS
============================================================ */

function MixerStrip({ track, onChange }: { track: Track; onChange: (p: Partial<Track>) => void }) {
  return (
    <div
      style={{
        width: 72,
        background: R.panel,
        border: `1px solid ${R.border}`,
        borderTop: `3px solid ${track.color}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: 4,
        gap: 4,
        flexShrink: 0,
      }}
    >
      <div className="text-[10px] font-bold text-center truncate" style={{ color: R.text }}>
        {track.name}
      </div>
      <div className="flex justify-center gap-1">
        <MiniBtn
          active={track.mute}
          onClick={() => onChange({ mute: !track.mute })}
          color={R.textDim}
          activeColor="#e0d155"
        >
          M
        </MiniBtn>
        <MiniBtn
          active={track.solo}
          onClick={() => onChange({ solo: !track.solo })}
          color={R.textDim}
          activeColor="#7cc47c"
        >
          S
        </MiniBtn>
      </div>
      <div className="text-[9px] text-center" style={{ color: R.textDim }}>
        PAN {track.pan === 0 ? "C" : (track.pan > 0 ? "R" : "L") + Math.round(Math.abs(track.pan) * 100)}
      </div>
      <input
        type="range"
        min={-1}
        max={1}
        step={0.01}
        value={track.pan}
        onChange={(e) => onChange({ pan: Number(e.target.value) })}
      />

      {/* Vertical fader */}
      <div
        style={{
          flex: 1,
          background: R.panelDark,
          border: `1px solid ${R.border}`,
          borderRadius: 2,
          position: "relative",
          minHeight: 100,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          padding: 4,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 4,
            right: 20,
            top: 4,
            bottom: 4,
            background: "linear-gradient(180deg,#e05555 0%,#e0d155 20%,#4ec14e 40%,#4ec14e 100%)",
            opacity: 0.15,
            borderRadius: 2,
          }}
        />
        <input
          type="range"
          min={0}
          max={1.2}
          step={0.01}
          value={track.volume}
          onChange={(e) => onChange({ volume: Number(e.target.value) })}
          style={{
            position: "absolute",
            width: 100,
            transform: "rotate(-90deg)",
            transformOrigin: "center",
            top: "50%",
            left: "50%",
            marginLeft: -50,
            marginTop: -8,
          }}
        />
      </div>
      <div className="text-[10px] font-mono text-center" style={{ color: R.text }}>
        {(20 * Math.log10(track.volume || 0.0001)).toFixed(1)}dB
      </div>
    </div>
  );
}

function MasterStrip() {
  const [vol, setVol] = useState(0.9);
  return (
    <div
      style={{
        width: 84,
        background: R.panel,
        border: `2px solid ${R.accent}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: 4,
        gap: 4,
        marginLeft: 8,
        flexShrink: 0,
      }}
    >
      <div className="text-[11px] font-bold text-center" style={{ color: R.accent }}>
        MASTER
      </div>
      <div
        style={{
          flex: 1,
          background: R.panelDark,
          border: `1px solid ${R.border}`,
          position: "relative",
          minHeight: 100,
        }}
      >
        <input
          type="range"
          min={0}
          max={1.2}
          step={0.01}
          value={vol}
          onChange={(e) => setVol(Number(e.target.value))}
          style={{
            position: "absolute",
            width: 100,
            transform: "rotate(-90deg)",
            top: "50%",
            left: "50%",
            marginLeft: -50,
            marginTop: -8,
          }}
        />
      </div>
      <div className="text-[10px] font-mono text-center" style={{ color: R.text }}>
        {(20 * Math.log10(vol || 0.0001)).toFixed(1)}dB
      </div>
    </div>
  );
}

/* ============================================================
   FX PANEL
============================================================ */

function FxPanel({
  track,
  onChange,
  onClose,
}: {
  track: Track;
  onChange: (p: Partial<Track>) => void;
  onClose: () => void;
}) {
  const addFx = (type: FxSlot["type"]) => {
    const slot: FxSlot = {
      id: nid(),
      type,
      bypass: false,
      label: fxLabel(type),
      params: defaultFxParams(type),
    };
    onChange({ fx: [...track.fx, slot] });
  };
  const removeFx = (id: string) => {
    onChange({ fx: track.fx.filter((f) => f.id !== id) });
  };
  const updateParam = (id: string, key: string, value: number) => {
    onChange({
      fx: track.fx.map((f) =>
        f.id === id ? { ...f, params: { ...f.params, [key]: value } } : f,
      ),
    });
  };
  const toggleBypass = (id: string) => {
    onChange({ fx: track.fx.map((f) => (f.id === id ? { ...f, bypass: !f.bypass } : f)) });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className="rounded-md shadow-2xl overflow-hidden"
        style={{
          background: R.panel,
          border: `1px solid ${R.border}`,
          width: 720,
          maxHeight: "90vh",
          color: R.text,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ background: R.panelDark, borderBottom: `1px solid ${R.border}` }}
        >
          <div className="flex items-center gap-2 text-sm">
            <Cpu className="w-4 h-4" style={{ color: R.accent }} />
            <b>FX Chain — {track.name}</b>
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100 text-xs">
            ✕
          </button>
        </div>

        <div className="p-3">
          <div className="flex flex-wrap gap-1 mb-3">
            {(["eq3", "comp", "reverb", "delay", "wam"] as const).map((t) => (
              <button
                key={t}
                onClick={() => addFx(t)}
                className="px-2 py-1 text-xs rounded flex items-center gap-1"
                style={{ background: R.panelDark, border: `1px solid ${R.borderLight}` }}
              >
                <Plus className="w-3 h-3" /> {fxLabel(t)}
              </button>
            ))}
          </div>

          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "55vh" }}>
            {track.fx.length === 0 && (
              <div className="text-xs opacity-60 text-center py-8">
                Nenhum plugin. Adicione EQ, Compressor, Reverb, Delay ou carregue um WAM externo.
              </div>
            )}
            {track.fx.map((fx) => (
              <FxUnit
                key={fx.id}
                fx={fx}
                onParam={(k, v) => updateParam(fx.id, k, v)}
                onRemove={() => removeFx(fx.id)}
                onBypass={() => toggleBypass(fx.id)}
                onWamUrl={(url) =>
                  onChange({
                    fx: track.fx.map((f) => (f.id === fx.id ? { ...f, wamUrl: url } : f)),
                  })
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FxUnit({
  fx,
  onParam,
  onRemove,
  onBypass,
  onWamUrl,
}: {
  fx: FxSlot;
  onParam: (k: string, v: number) => void;
  onRemove: () => void;
  onBypass: () => void;
  onWamUrl: (url: string) => void;
}) {
  return (
    <div
      className="rounded"
      style={{
        background: R.panelDark,
        border: `1px solid ${fx.bypass ? R.border : R.accent}`,
        padding: 8,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold flex items-center gap-2">
          <button
            onClick={onBypass}
            className="w-4 h-4 rounded-full"
            style={{ background: fx.bypass ? R.textDim : R.play, border: `1px solid ${R.border}` }}
            title={fx.bypass ? "Bypass ON" : "Ativo"}
          />
          {fx.label}
        </div>
        <button onClick={onRemove} className="opacity-60 hover:opacity-100">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        {fx.type === "wam" ? (
          <div className="flex-1">
            <div className="text-[10px] opacity-70 mb-1">URL do WAM v2 (bundle .js exportando plugin)</div>
            <input
              value={fx.wamUrl ?? ""}
              onChange={(e) => onWamUrl(e.target.value)}
              placeholder="https://.../my-wam-plugin/index.js"
              className="w-full px-2 py-1 text-xs rounded"
              style={{ background: R.bg, border: `1px solid ${R.border}`, color: R.text }}
            />
            <div className="text-[10px] opacity-60 mt-1">
              Ex.: OB-Xd, Dexed, BigMuff em <a className="underline" href="https://www.webaudiomodules.com" target="_blank" rel="noreferrer">webaudiomodules.com</a>.
            </div>
          </div>
        ) : (
          Object.entries(fx.params).map(([k, v]) => (
            <ParamKnob key={k} label={k} value={v} onChange={(nv) => onParam(k, nv)} range={paramRange(fx.type, k)} />
          ))
        )}
      </div>
    </div>
  );
}

function ParamKnob({
  label,
  value,
  onChange,
  range,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  range: { min: number; max: number; step?: number; unit?: string };
}) {
  const pct = (value - range.min) / (range.max - range.min);
  const angle = -135 + pct * 270;
  return (
    <div className="flex flex-col items-center gap-1" style={{ width: 56 }}>
      <div
        className="relative rounded-full"
        style={{
          width: 40,
          height: 40,
          background: `radial-gradient(circle at 30% 30%, #666, #222)`,
          border: `2px solid ${R.border}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 3,
            width: 2,
            height: 14,
            background: R.accent,
            transformOrigin: "1px 17px",
            transform: `rotate(${angle}deg)`,
          }}
        />
      </div>
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step ?? 0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="text-[9px] opacity-70 uppercase">{label}</div>
      <div className="text-[10px] font-mono">
        {value.toFixed(1)}
        {range.unit ?? ""}
      </div>
    </div>
  );
}

/* ============================================================
   INSTRUMENT RACK PANEL (Kontakt/Arturia/Korg styling)
============================================================ */

const INSTRUMENTS: { id: InstrumentKind; brand: string; name: string; color: string; accent: string; icon: React.ReactNode }[] = [
  { id: "kontakt-piano", brand: "SolandoSampler", name: "Grand Piano", color: "#3b2c1e", accent: "#d4a373", icon: <Piano className="w-5 h-5" /> },
  { id: "arturia-mini", brand: "SolandoMini V", name: "Analog Mono", color: "#1a1a1a", accent: "#f4b400", icon: <Waves className="w-5 h-5" /> },
  { id: "arturia-jup", brand: "SolandoJup-8V", name: "Poly Analog", color: "#0d3b66", accent: "#faf0ca", icon: <Waves className="w-5 h-5" /> },
  { id: "korg-m1-pad", brand: "SolandoM1", name: "Universe Pad", color: "#242424", accent: "#00b3b3", icon: <Radio className="w-5 h-5" /> },
  { id: "808-drums", brand: "SolandoDrum", name: "808 Kit", color: "#2b1a1a", accent: "#e05555", icon: <Drum className="w-5 h-5" /> },
];

function InstrumentRackPanel({
  track,
  onChange,
  onClose,
}: {
  track: Track;
  onChange: (p: Partial<Track>) => void;
  onClose: () => void;
}) {
  const inst = INSTRUMENTS.find((i) => i.id === track.instrument) ?? INSTRUMENTS[0];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-2xl overflow-hidden"
        style={{
          background: inst.color,
          border: `2px solid ${inst.accent}`,
          width: 780,
          maxHeight: "90vh",
          color: "#fff",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            background: `linear-gradient(180deg, ${inst.accent}22, transparent)`,
            borderBottom: `1px solid ${inst.accent}55`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded flex items-center justify-center"
              style={{ background: inst.accent + "22", color: inst.accent }}
            >
              {inst.icon}
            </div>
            <div>
              <div className="text-xs opacity-70 tracking-widest uppercase">{inst.brand}</div>
              <div className="text-xl font-bold" style={{ color: inst.accent }}>
                {inst.name}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>

        <div className="p-4">
          <div className="text-xs opacity-70 mb-2">Escolha o instrumento virtual</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {INSTRUMENTS.map((i) => (
              <button
                key={i.id}
                onClick={() => onChange({ instrument: i.id, name: instrumentLabel(i.id) })}
                className="rounded p-3 text-left transition-all"
                style={{
                  background: track.instrument === i.id ? i.accent + "33" : "#00000055",
                  border: `1px solid ${track.instrument === i.id ? i.accent : "#ffffff22"}`,
                }}
              >
                <div className="flex items-center gap-2 text-xs opacity-70">{i.icon} {i.brand}</div>
                <div className="text-sm font-bold mt-1" style={{ color: i.accent }}>
                  {i.name}
                </div>
              </button>
            ))}
          </div>

          {/* Fake VST controls */}
          <div
            className="rounded p-4 grid grid-cols-6 gap-3"
            style={{ background: "#00000066", border: `1px solid ${inst.accent}33` }}
          >
            {["CUTOFF", "RESO", "ATTACK", "DECAY", "SUSTAIN", "RELEASE"].map((k) => (
              <div key={k} className="flex flex-col items-center gap-1">
                <div
                  className="relative rounded-full"
                  style={{
                    width: 50,
                    height: 50,
                    background: `radial-gradient(circle at 30% 30%, ${inst.accent}66, #000)`,
                    border: `2px solid ${inst.accent}88`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 4,
                      width: 2,
                      height: 18,
                      background: inst.accent,
                      transformOrigin: "1px 21px",
                      transform: `rotate(${-90 + Math.random() * 180}deg)`,
                    }}
                  />
                </div>
                <div className="text-[9px] opacity-70">{k}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-[11px] opacity-60">
            Sons por SoundFont interno. Para carregar VSTs reais no navegador, abra o painel FX de uma track e cole a URL de um plugin <b>WAM v2</b>.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FX build & label helpers
============================================================ */

function fxLabel(t: FxSlot["type"]) {
  return t === "eq3"
    ? "EQ 3 Bandas"
    : t === "comp"
    ? "Compressor"
    : t === "reverb"
    ? "Reverb"
    : t === "delay"
    ? "Delay"
    : "WAM Plugin";
}

function defaultFxParams(t: FxSlot["type"]): Record<string, number> {
  switch (t) {
    case "eq3":
      return { low: 0, mid: 0, high: 0 };
    case "comp":
      return { threshold: -18, ratio: 4, attack: 10, release: 100 };
    case "reverb":
      return { mix: 0.25, decay: 2 };
    case "delay":
      return { time: 0.25, feedback: 0.3, mix: 0.2 };
    default:
      return {};
  }
}

function paramRange(_type: FxSlot["type"], key: string) {
  if (key === "low" || key === "mid" || key === "high")
    return { min: -12, max: 12, step: 0.1, unit: "dB" };
  if (key === "threshold") return { min: -60, max: 0, step: 0.1, unit: "dB" };
  if (key === "ratio") return { min: 1, max: 20, step: 0.1 };
  if (key === "attack" || key === "release") return { min: 1, max: 500, step: 1, unit: "ms" };
  if (key === "time") return { min: 0.05, max: 1, step: 0.01, unit: "s" };
  if (key === "feedback" || key === "mix" || key === "decay")
    return { min: 0, max: key === "decay" ? 6 : 1, step: 0.01 };
  return { min: 0, max: 1, step: 0.01 };
}

function buildFxNode(ctx: AudioContext, fx: FxSlot): { input: AudioNode; output: AudioNode } | null {
  if (fx.type === "eq3") {
    const low = ctx.createBiquadFilter();
    low.type = "lowshelf";
    low.frequency.value = 200;
    low.gain.value = fx.params.low;
    const mid = ctx.createBiquadFilter();
    mid.type = "peaking";
    mid.frequency.value = 1000;
    mid.Q.value = 1;
    mid.gain.value = fx.params.mid;
    const high = ctx.createBiquadFilter();
    high.type = "highshelf";
    high.frequency.value = 6000;
    high.gain.value = fx.params.high;
    low.connect(mid);
    mid.connect(high);
    return { input: low, output: high };
  }
  if (fx.type === "comp") {
    const c = ctx.createDynamicsCompressor();
    c.threshold.value = fx.params.threshold;
    c.ratio.value = fx.params.ratio;
    c.attack.value = fx.params.attack / 1000;
    c.release.value = fx.params.release / 1000;
    return { input: c, output: c };
  }
  if (fx.type === "reverb") {
    const conv = ctx.createConvolver();
    conv.buffer = makeIR(ctx, fx.params.decay);
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    wet.gain.value = fx.params.mix;
    dry.gain.value = 1 - fx.params.mix;
    const inNode = ctx.createGain();
    const out = ctx.createGain();
    inNode.connect(dry);
    inNode.connect(conv);
    conv.connect(wet);
    dry.connect(out);
    wet.connect(out);
    return { input: inNode, output: out };
  }
  if (fx.type === "delay") {
    const d = ctx.createDelay(2);
    d.delayTime.value = fx.params.time;
    const fb = ctx.createGain();
    fb.gain.value = fx.params.feedback;
    const wet = ctx.createGain();
    wet.gain.value = fx.params.mix;
    const dry = ctx.createGain();
    dry.gain.value = 1;
    const inNode = ctx.createGain();
    const out = ctx.createGain();
    inNode.connect(dry);
    inNode.connect(d);
    d.connect(fb);
    fb.connect(d);
    d.connect(wet);
    dry.connect(out);
    wet.connect(out);
    return { input: inNode, output: out };
  }
  return null;
}

function makeIR(ctx: AudioContext, decay: number): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * decay));
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
  }
  return buf;
}

/* ============================================================
   INSTRUMENT NOTE PLAYBACK (simple synth)
============================================================ */

function scheduleSynthNote(
  ctx: AudioContext,
  dest: AudioNode,
  inst: InstrumentKind,
  midi: number,
  velocity: number,
  when: number,
  dur: number,
) {
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const type: OscillatorType =
    inst === "kontakt-piano"
      ? "triangle"
      : inst === "korg-m1-pad"
      ? "sine"
      : inst === "808-drums"
      ? "sine"
      : "sawtooth";
  osc.type = type;
  osc.frequency.value = inst === "808-drums" ? 60 : freq;

  const peak = Math.min(0.6, velocity * 0.6);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(peak, when + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.05);
}

function instrumentLabel(k?: InstrumentKind) {
  const i = INSTRUMENTS.find((x) => x.id === k);
  return i ? `${i.brand} — ${i.name}` : "Instrument";
}

function instrumentShortName(k?: InstrumentKind) {
  const i = INSTRUMENTS.find((x) => x.id === k);
  return i ? i.brand : "INST";
}
