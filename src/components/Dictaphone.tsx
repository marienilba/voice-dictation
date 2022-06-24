import React, { useCallback, useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

export const Dictaphone = () => {
  const [message, setMessage] = useState("");
  const [retranscriptions, setRetranscriptions] = useState<string[]>([]);

  const commands = [
    {
      command: "Reset",
      callback: () => resetTranscript(),
    },
    {
      command: "Stop",
      callback: () => setMessage("Stop"),
    },
    {
      command: "Dictaphone",
      callback: () => setMessage("Dictaphone"),
    },
  ];
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    resetTranscript,
    listening,
  } = useSpeechRecognition({ commands });
  useEffect(() => {
    if (finalTranscript !== "") {
      setRetranscriptions((prev) => [...prev, finalTranscript]);
      resetTranscript();
    }
  }, [interimTranscript, finalTranscript, resetTranscript]);

  const listenContinuously = async () => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      return null;
    }

    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      console.warn(
        "Your browser does not support speech recognition software! Try Chrome desktop, maybe?"
      );
      return;
    }
    await SpeechRecognition.startListening({
      continuous: true,
      language: "fr-FR",
    });
  };

  return (
    <div className="flex flex-col w-full px-4">
      <div className="flex flex-col w-full items-center">
        <span>listening: {listening ? "on" : "off"}</span>
        <div className="flex flex-row space-x-4">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
            type="button"
            onClick={resetTranscript}
          >
            Reset
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
            type="button"
            onClick={listenContinuously}
          >
            Listen
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
            type="button"
            onClick={SpeechRecognition.stopListening}
          >
            Stop
          </button>
        </div>
      </div>
      <ul className="flex flex-col">
        {retranscriptions.map((retranscription, index) => {
          return (
            <li key={index}>
              <input
                value={`${retranscription}`}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </li>
          );
        })}
        <span>{transcript}</span>
      </ul>
    </div>
  );
};
