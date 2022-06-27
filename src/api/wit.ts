// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};
// @ts-ignore
import { Wit, log } from "node-wit";

const client = new Wit({
  accessToken: "PUYD6M5SKSFRWNBX3A2FFHMDG23QGJTF",
  logger: new log.Logger(log.DEBUG), // optional
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // https://wit.ai/docs/http/20220622/#post__speech_link
  // const json = await client.speech('audio/wav','body',)
  res.status(200).json({ name: "John Doe" });
}
