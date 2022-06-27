import { ReactEventHandler, SyntheticEvent, useRef } from "react";

export default function AudioTranscribePlugin() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // function convert_audio(infile, outfile) {
  //   try {
  //     // read stereo audio file into signed 16 array
  //     const data = new Int16Array(fs.readFileSync(infile));
  //     // create new array for the mono audio data
  //     const ndata = new Int16Array(data.length / 2);
  //     // copy left audio data (skip the right part)
  //     for (let i = 0, j = 0; i < data.length; i += 4) {
  //       ndata[j++] = data[i]!;
  //       ndata[j++] = data[i + 1]!;
  //     }
  //     // save the mono audio file
  //     // fs.writeFileSync(outfile, Buffer.from(ndata), 'binary')
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  const handleInput = (e: any) => {
    if (!audioRef.current) return;
    if (!e.target.files.length) return;

    // Create a blob that we can use as an src for our audio element
    const urlObj = URL.createObjectURL(e.target.files[0]);
    //
    audioRef.current.src = urlObj;
    const audioType = e.target.files[0]?.type;
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!e.target) return;
      const binary = e.target?.result;
      const response = await fetch("/api/wit", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: audioType,
          binary: binary,
        }),
      });
      const json = await response.json();
      console.log(json);
    };
    reader.readAsBinaryString(e.target.files[0]);
  };
  return (
    <div className="flex flex-row justify-between items-center px-4 ">
      <div>
        <label
          className="block mb-2 text-sm font-medium text-gray-900 "
          htmlFor="file_input"
        >
          Upload Audio
        </label>
        <input
          className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer  focus:outline-none "
          aria-describedby="file_input_help"
          id="file_input"
          type="file"
          accept=".wav,.mp3,.mpeg3,.ogg,.ulaw,.raw"
          onChange={handleInput}
        />
        <p className="mt-1 text-sm text-gray-500 " id="file_input_help">
          WAV, MP3, OGG, ULAW or RAW.
        </p>
      </div>
      <audio ref={audioRef} controls />
    </div>
  );
}
