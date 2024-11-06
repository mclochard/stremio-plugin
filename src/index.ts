import { addonBuilder, serveHTTP } from "stremio-addon-sdk";
import { StreamingCommunity } from "./StreamingCommunity";

const builder = new addonBuilder({
  id: "org.stremio.streamingcommunity",
  description: "StreamingCommunity Addon",
  version: "1.0.0",
  logo: "https://i.imgur.com/EyOi4Jz.png",

  name: "StreamingCommunity Addon",
  background: "https://i.imgur.com/pY9R0s2.jpeg",
  catalogs: [],
  resources: ["stream"],
  types: ["series"],
  idPrefixes: ["tt"],
});

// takes function(args)
builder.defineStreamHandler(async function (args) {
  const { type, id } = args;
  const sc = new StreamingCommunity(id);
  const stream = await sc.getStream();

  if (stream) {
    return Promise.resolve({ streams: [stream] });
  }
  return Promise.resolve({ streams: [] });
});

serveHTTP(builder.getInterface(), {
  port: process.env.PORT ? Number(process.env.PORT) : 7000,
});
