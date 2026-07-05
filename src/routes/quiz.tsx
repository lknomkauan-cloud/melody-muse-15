import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { Trophy, RotateCcw, Volume2, Check, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz de Notas — Notes for Life" },
      { name: "description", content: "Teste seus conhecimentos em teoria musical com quizzes interativos de notas, intervalos e acordes." },
      { property: "og:title", content: "Quiz de Notas — Notes for Life" },
      { property: "og:description", content: "Teste seus conhecimentos em teoria musical com quizzes interativos." },
    ],
  }),
  component: QuizPage,
});

const NOTES = [
  { name: "Dó", alt: "C", freq: 261.63 },
  { name: "Ré", alt: "D", freq: 293.66 },
  { name: "Mi", alt: "E", freq: 329.63 },
  { name: "Fá", alt: "F", freq: 349.23 },
  { name: "Sol", alt: "G", freq: 392.00 },
  { name: "Lá", alt: "A", freq: 440.00 },
  { name: "Si", alt: "B", freq: 493.88 },
];

type QuestionType = "note-name" | "interval";

interface Question {
  type: QuestionType;
  note: { name: string; alt: string; freq: number };
  options: string[];
  correctIndex: number;
}

function generateQuestion(type: QuestionType): Question {
  const note = NOTES[Math.floor(Math.random() * NOTES.length)];
  const wrong = NOTES.filter((n) => n.name !== note.name);
  const shuffled = wrong.sort(() => 0.5 - Math.random()).slice(0, 3);
  const options = [...shuffled.map((n) => n.name), note.name].sort(() => 0.5 - Math.random());
  return { type, note, options, correctIndex: options.indexOf(note.name) };
}

function playNote(freq: number) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1);
  } catch {
    // Audio not available
  }
}

function QuizPage() {
  const [question, setQuestion] = useState<Question>(() => generateQuestion("note-name"));
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);

  const handleAnswer = useCallback(
    (index: number) => {
      if (answered) return;
      setSelected(index);
      setAnswered(true);
      setTotal((t) => t + 1);
      if (index === question.correctIndex) {
        setScore((s) => s + 1);
        setStreak((st) => st + 1);
      } else {
        setStreak(0);
      }
      playNote(question.note.freq);
    },
    [answered, question],
  );

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion("note-name"));
    setSelected(null);
    setAnswered(false);
  }, []);

  const resetQuiz = useCallback(() => {
    setQuestion(generateQuestion("note-name"));
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setTotal(0);
    setStreak(0);
  }, []);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Quiz de Notas</h1>
            <p className="mt-1 text-sm text-muted-foreground">Identifique a nota que você ouve.</p>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-bold text-gradient-primary">{score}</div>
            <div className="text-xs text-muted-foreground">{total > 0 ? `${Math.round((score / total) * 100)}%` : "0%"}</div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="h-4 w-4 text-primary" />
            Sequência: <span className="font-bold text-foreground">{streak}</span>
          </div>
          <button
            onClick={resetQuiz}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reiniciar
          </button>
        </div>

        {/* Card da pergunta */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-6 text-center sm:p-10">
          <div className="mb-4 inline-flex rounded-full bg-primary/10 p-4">
            <Volume2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold sm:text-2xl">Qual nota é essa?</h2>
          <p className="mt-2 text-muted-foreground">Pressione o botão abaixo para ouvir a nota e escolha a resposta correta.</p>

          <button
            onClick={() => playNote(question.note.freq)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-display font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:glow-primary"
          >
            <Volume2 className="h-5 w-5" />
            Tocar Nota
          </button>
        </div>

        {/* Opções */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {question.options.map((opt, i) => (
            <button
              key={`${opt}-${i}`}
              onClick={() => handleAnswer(i)}
              disabled={answered}
              className={cn(
                "rounded-xl border px-4 py-5 font-display text-lg font-semibold transition-all",
                !answered && "border-border bg-card hover:border-primary/50 hover:bg-muted",
                answered && i === question.correctIndex && "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
                answered && selected === i && i !== question.correctIndex && "border-rose-500/50 bg-rose-500/10 text-rose-400",
                answered && selected !== i && i !== question.correctIndex && "border-border bg-card/50 text-muted-foreground opacity-60",
              )}
            >
              <div className="flex items-center justify-center gap-2">
                {answered && i === question.correctIndex && <Check className="h-5 w-5" />}
                {answered && selected === i && i !== question.correctIndex && <XIcon className="h-5 w-5" />}
                {opt}
              </div>
            </button>
          ))}
        </div>

        {/* Feedback */}
        {answered && (
          <div className="mt-6 text-center">
            {selected === question.correctIndex ? (
              <p className="text-lg font-semibold text-emerald-400">Correto! A nota era {question.note.name}.</p>
            ) : (
              <p className="text-lg font-semibold text-rose-400">Quase! A nota correta era {question.note.name}.</p>
            )}
            <button
              onClick={nextQuestion}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-display font-semibold text-primary-foreground transition-all hover:bg-primary/90"
            >
              Próxima Nota
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
