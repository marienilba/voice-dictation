import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isParagraphNode,
} from "lexical";
import { UserAgent } from "next-useragent";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Model, KaldiRecognizer, createModel } from "vosk-browser";
import { models } from "./models/models";

interface VoskResult {
  result: Array<{
    conf: number;
    start: number;
    end: number;
    word: string;
  }>;
  text: string;
}

const Word: React.FC<{ confidence: number; children: ReactNode }> = ({
  confidence,
  children,
}) => {
  const color = Math.max(255 * (1 - confidence) - 20, 0);

  return (
    <span
      style={{
        color: `rgb(${color},${color},${color})`,
        whiteSpace: "normal",
      }}
    >
      {children}
    </span>
  );
};

const AudioTranscribePlugin: React.FC<{ ua: UserAgent }> = ({ ua }) => {
  const allowedBrowser = useMemo(() => !ua.isSafari, [ua]);
  const [editor] = useLexicalComposerContext();
  const [partial, setPartial] = useState("");
  const [loadedModel, setLoadedModel] = useState<{
    model: Model;
    path: string;
  }>();
  const [recognizer, setRecognizer] = useState<KaldiRecognizer>();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const node = useRef<string | null>(null);

  const loadModel = async (path: string) => {
    if (!allowedBrowser) return;
    setLoading(true);
    loadedModel?.model.terminate();

    const model = await createModel("/models/" + path);

    setLoadedModel({ model, path });
    const recognizer = new model.KaldiRecognizer(48000);
    recognizer.setWords(true);
    // editor.update(() => {
    //   if (!node.current) {
    //     const root = $getRoot();
    //     const paragraphNode = $createParagraphNode();
    //     const textNode = $createTextNode("empty");
    //     node.current = textNode.__key;
    //     paragraphNode.append(textNode);
    //     root.append(paragraphNode);
    //     // console.log(node.current);
    //   }
    // });

    recognizer.on("result", (message: any) => {
      const result: VoskResult = message.result;
      console.log("volk-result:", result);
      if (!editor) return;
      editor.update(() => {
        // if (!node.current) return;
        const root = $getRoot();
        const paragraphNode =
          // $getNodeByKey(node.current)
          // ||
          $createParagraphNode();
        const textNode = $createTextNode(result.text);
        paragraphNode.append(textNode);
        root.append(paragraphNode);

        // const newParagraphNode = $createParagraphNode();
        // node.current = newParagraphNode.__key;
        // root.append(newParagraphNode);
      });
      // setUtterances((utt: VoskResult[]) => [...utt, result]);
    });

    recognizer.on("partialresult", (message: any) => {
      // console.log(message);
      // editor.update(() => {
      //   if (!node.current) return;
      //   console.log(node.current);
      //   const paragraphNode = $getNodeByKey(node.current);
      //   const textNode = $createTextNode(message.result.partial);
      //   console.log(paragraphNode);
      //   // paragraphNode?.insertAfter(textNode);
      //   // paragraphNode.;
      // });
      setPartial(message.result.partial);
    });

    recognizer.on("error", (message: any) => {
      console.warn(message);
    });

    setRecognizer(() => {
      setLoading(false);
      setReady(true);
      return recognizer;
    });
  };
  return (
    <div className="flex flex-col space-y-4 ">
      <div
        className={`bg-gray-200 w-full p-4 rounded-md shadow-lg mb-3 ${
          allowedBrowser && "hidden"
        }`}
      >
        This browser do not support the audio file transcription, please use{" "}
        <b>Firefox</b> or <b>Chrome</b> instead.
      </div>
      <div
        className={`flex flex-row justify-between items-end mb-3 px-4  ${
          !allowedBrowser && "hidden"
        }`}
      >
        <ModelLoader
          onModelSelect={async (path) => {
            if (loadedModel?.path !== path) {
              await loadModel(path);
              setReady(true);
            }
          }}
          loading={loading}
        />
        <FileUpload
          ua={ua}
          recognizer={recognizer}
          loading={loading}
          ready={ready}
        />
      </div>
    </div>
  );
};

interface ModelLoaderProps {
  onModelSelect: (value: string) => void;
  loading: boolean;
}

const ModelLoader: React.FunctionComponent<ModelLoaderProps> = ({
  onModelSelect,
  loading,
}) => {
  const langModel = useMemo(
    () =>
      models.find((model) =>
        typeof navigator === "undefined"
          ? undefined
          : model.lang === navigator.language
      ),
    []
  );
  useEffect(() => {
    onModelSelect(langModel?.path || models[4]!.path);
  }, []);
  return (
    <div>
      <select
        className=" border-0 flex bg-none rounded-xl p-2 cursor-pointer  disabled:cursor-not-allowed active:bg-gray-300 active:opacity-100 hover:enabled:bg-gray-200 "
        disabled={loading}
        defaultValue={langModel?.path || models[7]!.path}
        onChange={(e: any) => {
          const value = e.target.value;
          onModelSelect(value);
        }}
      >
        {models.map((model, index) => (
          <option value={model.path} key={index}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );
};

interface FileUploadProps {
  ua: UserAgent;
  recognizer: KaldiRecognizer | undefined;
  ready: boolean;
  loading: boolean;
}

const FileUpload: React.FunctionComponent<FileUploadProps> = ({
  ua,
  recognizer,
  ready,
  loading,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const soundRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode>();
  const [audioContext, setAudioContext] = useState<AudioContext>();
  const [fileName, setFileName] = useState<string>();

  const onChange = (e: any) => {
    if (recognizer && audioRef.current && soundRef.current) {
      if (!e.target.files.length) return;
      const file = e.target.files[0];
      const fileUrl = URL.createObjectURL(file);
      const audioPlayer = audioRef.current;
      audioPlayer.src = fileUrl;
      // Doubled audio player because the recognizer take the stream and the audio is not sending to the user
      soundRef.current.src = fileUrl;

      const _audioContext = audioContext ?? new AudioContext();

      const recognizerNode = _audioContext.createScriptProcessor(4096, 1, 1);
      recognizerNode.onaudioprocess = (event) => {
        try {
          if (
            audioPlayer.currentTime < audioPlayer.duration &&
            !audioPlayer.paused
          ) {
            recognizer.acceptWaveform(event.inputBuffer);
          }
        } catch (error) {
          console.error("acceptWaveform failed", error);
        }
      };

      const _audioSource =
        audioSource ?? _audioContext.createMediaElementSource(audioPlayer);

      _audioSource.disconnect();
      _audioSource.connect(recognizerNode);

      if (ua.isChrome) recognizerNode.connect(_audioContext.destination);

      setFileName(file?.name);
      setAudioSource(_audioSource);
      setAudioContext(_audioContext);
    }
  };

  return (
    <div className="flex flex-row w-full justify-around items-end ">
      <button
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.click();
          }
        }}
        disabled={!ready || loading}
        className="bg-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
      >
        <div className="flex ">
          {!audioContext ? (
            <span className="bg-[url(/images/icons/plus-rounded.svg)] mr-1 h-5 w-5 "></span>
          ) : (
            <span className="bg-[url(/images/icons/cross-rounded.svg)]  mr-1 h-5 w-5 "></span>
          )}
          <span>{!audioContext ? "Import" : "Remove"}</span>
        </div>
      </button>
      <input
        ref={inputRef}
        onChange={onChange}
        disabled={!ready || loading}
        accept="audio/*"
        type="file"
        style={{ contentVisibility: "hidden", width: "0px" }}
      />
      <figure className={`${!audioContext && "hidden"}`}>
        <figcaption className="text-xs font-bold">{fileName}</figcaption>
        <audio
          ref={audioRef}
          controls
          onVolumeChange={(e) => {
            if (!soundRef.current) return;
            const target = e.target as HTMLAudioElement;
            soundRef.current.muted = target.muted;
            soundRef.current.volume = target.volume;
          }}
          onPlay={() => {
            if (!soundRef.current) return;
            soundRef.current.play();
          }}
          onPause={() => {
            if (!soundRef.current) return;
            soundRef.current.pause();
          }}
          onRateChange={(e: any) => {
            if (!soundRef.current) return;
            const target = e.target as HTMLAudioElement;
            soundRef.current.playbackRate = target.defaultPlaybackRate || 1;
          }}
          onSeeked={(e) => {
            if (!soundRef.current) return;
            const target = e.target as HTMLAudioElement;
            soundRef.current.currentTime = target.currentTime;
          }}
        ></audio>
      </figure>
      <audio ref={soundRef} className="hidden h-0 border-none" controls></audio>
    </div>
  );
};

export default AudioTranscribePlugin;
