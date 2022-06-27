// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};
// @ts-ignore
import { Wit, log } from "node-wit";
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb", // Set desired value here
    },
  },
};
const client = new Wit({
  accessToken: "PUYD6M5SKSFRWNBX3A2FFHMDG23QGJTF",
  logger: new log.Logger(log.DEBUG), // optional
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { type, binary } = req.body;
  // console.log(type, binary);
  // https://wit.ai/docs/http/20220622/#post__speech_link
  // ;encoding=signed-integer;bits=16;rate=16k;endian=little
  const json = await client.speech(type, binary, {
    timezone: "Europe/Paris",
    locale: "fr_FR",
  });
  console.log(json);
  res.status(200).json({ name: "John Doe" });
}
