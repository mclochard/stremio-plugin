import { addonBuilder, serveHTTP } from "stremio-addon-sdk";
import { getStreamingCommunityUrl } from "./getStreamingCommunityUrl";

const builder = new addonBuilder({
  id: "org.myexampleaddon",
  description: "Sample addon",
  version: "1.0.0",

  name: "simple example",

  catalogs: [],
  resources: ["stream"],
  types: ["series", "movie"],
  idPrefixes: ["tt"],
});

// takes function(args)
builder.defineStreamHandler(async function (args) {
  const { type, id } = args;
  const stream = await getStreamingCommunityUrl(id);
  if (stream) {
    return Promise.resolve({ streams: [{ url: stream }] });
  }
  return Promise.resolve({ streams: [] });
});

serveHTTP(builder.getInterface(), {
  port: process.env.PORT ? Number(process.env.PORT) : 7000,
});
