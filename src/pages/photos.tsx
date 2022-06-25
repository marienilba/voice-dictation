import type { NextPage } from "next";
import Head from "next/head";

const Index: NextPage = () => {
  return (
    <div className="w-screen h-screen flex flex-col">
      <Head>
        <title>Next - Voice Dictation</title>
        <meta
          name="description"
          content="Next App Rich Editor Text + Speech Recognition"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <input type="file" accept="image/*" capture="environment" multiple />
    </div>
  );
};

export default Index;
