import { useEffect, useRef } from "react";
import vad from "voice-activity-detection";

export function useVoiceDetector() {
  const audioContext = useRef<AudioContext | null>(null);
  const audioElement = useRef<MediaStream | null>(null);
  const requestMic = async (): Promise<MediaStream | null> => {
    let Stream: null | MediaStream = null;
    try {
      if (typeof window === "undefined") return null;
      audioContext.current = new AudioContext();
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioElement.current = s;
        Stream = s;
      } catch (error) {
        handleMicConnectError(error);
      }
    } catch (e) {
      handleUserMediaError();
    }
    return Stream;
  };

  function handleUserMediaError() {
    console.warn("Mic input is not supported by the browser.");
  }

  function handleMicConnectError(r: unknown) {
    console.warn(
      "Could not connect microphone. Possible rejected by the user or is blocked by the browser.",
      r
    );
  }

  const voiceDetector = async (options: {
    onVoiceStart: () => void;
    onVoiceStop: () => void;
    onUpdate?: () => void;
  }) => {
    let stream = null;
    if (!audioContext.current) {
      stream = await requestMic();
    }
    if (!audioElement.current) {
      if (stream) vad(audioContext.current!, stream, options);
      else {
        stream = await requestMic();
        if (!stream) {
          handleMicConnectError("");
          return;
        }
        vad(audioContext.current!, stream, options);
      }
      return;
    }
    vad(audioContext.current!, audioElement.current, options);
  };

  useEffect(() => {
    requestMic();
    return () => {
      audioContext.current?.close();
      audioElement.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    vad: voiceDetector,
  };
}
