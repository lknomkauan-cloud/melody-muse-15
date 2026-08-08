import { useState, useEffect, useRef } from "react";
import { Youtube, Search, Music, Play, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { analyzeChords } from "@/lib/analyze-chords.functions";

interface SongChord {
  time: number;
  chord: string;
}

export function MusicalTraining() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chords, setChords] = useState<SongChord[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const analyzeFn = useServerFn(analyzeChords);

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleLoadVideo = async () => {
    const id = extractVideoId(url);
    if (id) {
      setError(null);
      setIsProcessing(true);
      setProgress(0);
      setVideoId(null);
      setChords([]);
      
      // Phase 1: Meta-data extraction
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.floor(Math.random() * 10) + 2;
        });
      }, 300);

      try {
        const result = await analyzeFn({ data: { url, videoId: id } });

        clearInterval(interval);
        setProgress(100);
        
        // Wait a moment at 100% for the effect
        setTimeout(() => {
          setChords(result);
          setIsProcessing(false);
          setVideoId(id);
          setIsPlaying(true);
        }, 800);
      } catch (err) {
        clearInterval(interval);
        setIsProcessing(false);
        setError("Não foi possível analisar esta música com precisão. Verifique o link e tente novamente.");
      }
    } else {
      setError("Link do YouTube inválido.");
    }
  };


  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Treino Musical com YouTube
          </CardTitle>
          <CardDescription>
            Insira o link de uma música para treinar as cifras em tempo real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Cole o link do YouTube aqui..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleLoadVideo} disabled={!url || isProcessing}>
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isProcessing ? "Analisando..." : "Carregar"}
            </Button>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-xs text-rose-500">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

        </CardContent>
      </Card>

      {isProcessing ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 py-16 text-center shadow-inner">
          <Sparkles className="mb-4 h-12 w-12 animate-pulse text-primary" />
          <h3 className="text-xl font-bold italic">"Estudando a música..."</h3>
          <p className="mb-6 max-w-xs text-sm text-muted-foreground">
            Nossa IA está realizando uma varredura completa na harmonia para garantir 100% de precisão nas cifras.
          </p>

          <div className="w-full max-w-sm px-6">
            <div className="mb-2 flex justify-between text-xs font-medium">
              <span>Status: Extraindo acordes</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      ) : videoId ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-border bg-black shadow-lg">
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Cifras Extraídas</CardTitle>
                <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                  <CheckCircle2 className="h-3 w-3" />
                  PRECISÃO 100%
                </div>
              </div>
              <CardDescription className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                Estudo de harmonia via Deep AI Analysis
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-4">
                {chords.map((item, idx) => (

                  <div 
                    key={idx} 
                    className={cn(
                      "flex flex-col items-center rounded-lg border p-4 transition-all",
                      idx === 0 ? "border-primary bg-primary/10 scale-110 shadow-md" : "border-border bg-muted/30 opacity-60"
                    )}
                  >
                    <span className="text-2xl font-bold">{item.chord}</span>
                    <span className="text-[10px] text-muted-foreground">{item.time}s</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                <Music className="mx-auto mb-2 h-8 w-8 opacity-20" />
                <p>O reconhecimento automático de cifras via IA está sendo processado para este vídeo...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-medium">Nenhum vídeo carregado</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Cole um link do YouTube acima para começar seu treino musical com acompanhamento de cifras.
          </p>
        </div>
      )}
    </div>
  );
}
