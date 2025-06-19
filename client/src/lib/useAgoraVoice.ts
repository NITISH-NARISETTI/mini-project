import { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC, { IAgoraRTCClient, ILocalAudioTrack } from "agora-rtc-sdk-ng";

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID as string;

export function useAgoraVoice(roomId: string, userId: string) {
  const clientRef = useRef<IAgoraRTCClient>();
  const localAudioTrackRef = useRef<ILocalAudioTrack>();
  const [isMuted, setIsMuted] = useState(false);
  const [micVolume, setMicVolume] = useState(0); // 0-100

  useEffect(() => {
    if (!roomId || !userId || !AGORA_APP_ID) return;

    let analyser: AnalyserNode | null = null;
    let audioCtx: AudioContext | null = null;
    let animationId: number;

    const joinVoice = async () => {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;
      const token = null;
      await client.join(AGORA_APP_ID, roomId, token, userId);
      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localAudioTrackRef.current = localAudioTrack;
      await client.publish([localAudioTrack]);
      // Mic volume indicator setup
      audioCtx = new window.AudioContext();
      const mediaStream = new MediaStream([localAudioTrack.getMediaStreamTrack()]);
      const source = audioCtx.createMediaStreamSource(mediaStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (analyser) {
          analyser.getByteTimeDomainData(dataArray);
          // Calculate RMS
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const val = (dataArray[i] - 128) / 128;
            sum += val * val;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          setMicVolume(Math.min(100, Math.floor(rms * 200)));
        }
        animationId = requestAnimationFrame(updateVolume);
      };
      updateVolume();
      client.on("user-published", async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === "audio") {
          remoteUser.audioTrack?.play();
        }
      });
    };
    joinVoice();
    return () => {
      localAudioTrackRef.current?.close();
      clientRef.current?.leave();
      if (analyser) {
        analyser.disconnect();
      }
      if (audioCtx) {
        audioCtx.close();
      }
      cancelAnimationFrame(animationId);
    };
  }, [roomId, userId]);

  const mute = useCallback(() => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(false);
      setIsMuted(true);
    }
  }, []);

  const unmute = useCallback(() => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(true);
      setIsMuted(false);
    }
  }, []);

  return { isMuted, mute, unmute, micVolume };
}
