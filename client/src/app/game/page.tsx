"use client";

import { useEffect, useRef, useState } from "react";
import { start } from "./game";
import { useRouter, useSearchParams } from "next/navigation";
import { ScoreBoard } from "./scoreboard";
import { Button } from "@/components/ui/button";
import { UnplugIcon } from "lucide-react";
import Link from "next/link";
import { useAgoraVoice } from "@/lib/useAgoraVoice";
import { useNickname } from "@/lib/useNickname";

export type Score = {
  kills: number;
  deaths: number;
  player: string;
  nickname: string;
};

export default function Game() {
  const params = useSearchParams();
  const [scores, setScores] = useState<Score[]>([]);
  const router = useRouter();
  const playerIdRef = useRef<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [latency, setLatency] = useState(0);
  const nickname = useNickname();
  const roomId = params.get("roomId") || "default";
  const { isMuted, mute, unmute, micVolume } = useAgoraVoice(roomId, nickname);

  useEffect(() => {
    const roomId = params.get("roomId");
    if (!roomId) return;

    const game = start({
      roomId,
      onScoresUpdated(newScores: Score[]) {
        setScores(newScores);
      },
      onGameOver(winner: string) {
        router.push(`/game-over?winner=${winner}`);
      },
      onDisconnect() {
        router.push(`/disconnect`);
      },
      onTimeLeft(newTimeLeft) {
        setTimeLeft(newTimeLeft);
      },
      setLatency,
      playerIdRef,
    });

    return () => {
      game.then(({ cleanup }) => {
        cleanup();
      });
    };
  }, [params]);

  return (
    <main className="relative">
      <canvas id="canvas" className="cursor-none"></canvas>
      <div className="absolute top-4 right-4 select-none">
        <ScoreBoard scores={scores} myPlayerId={playerIdRef.current} />
      </div>
      <div className="absolute top-4 left-4 flex gap-2">
        <Link href="/disconnect">
          <Button
            variant={"secondary"}
            className="flex gap-4 z-10 relative select-none"
          >
            <UnplugIcon /> Disconnect
          </Button>
        </Link>
        <div className="text-black bg-white border border-black rounded w-fit p-2 select-none">
          {latency} ms
        </div>
        <Button onClick={isMuted ? unmute : mute} variant="secondary">
          {isMuted ? "Unmute" : "Mute"} Mic
        </Button>
        <div className="flex items-center gap-1">
          <span className="text-xs">Mic</span>
          <div className="w-16 h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-green-500 rounded"
              style={{ width: `${micVolume}%` }}
            />
          </div>
        </div>
      </div>
      <div className="absolute top-4 flex justify-center w-full select-none">
        <div className="rounded-xl p-4 py-2 text-xs bg-gray-900 text-white">
          {Math.floor(timeLeft / 1000)} second remaining
        </div>
      </div>
    </main>
  );
}
