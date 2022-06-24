import type { NextPage } from "next";
import Head from "next/head";
import { Dictaphone } from "./components/Dictaphone";
import { Editor } from "./components/Editor";

const Index: NextPage = () => {
  return (
    <div className="w-screen h-screen">
      <Head>
        <title>Next - Speech Recognition</title>
        <meta
          name="description"
          content="Next App Rich Editor Text + Speech Recognition"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="w-full h-full flex flex-col justify-center items-center">
        <Editor />
        {/* <Dictaphone /> */}
      </div>

      <footer></footer>
    </div>
  );
};

export default Index;
