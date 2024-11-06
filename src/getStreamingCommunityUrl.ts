import * as cheerio from "cheerio";
import CloudflareBypasser from "cloudflare-bypasser";
import { getShowName } from "./getShowName";
const url = require("url");

const fs = require("fs");
const cf = new CloudflareBypasser();
const isMovie = (imdb_id: string) => {
  if (imdb_id.includes("tmdb:")) {
    imdb_id = imdb_id.replace("tmdb:", "");
  }
  if (imdb_id.includes(":")) {
    const season = imdb_id.split(":")[1];
    const episode = imdb_id.split(":").slice(-1)[0];
    const ismovie = 0;
    imdb_id = imdb_id.split(":")[0];
    return { ismovie, imdb_id, season, episode };
  } else {
    const ismovie = 1;
    return { ismovie, imdb_id };
  }
};

const getStreamingCommunityUrl = async (
  id: string
): Promise<string | false> => {
  const { ismovie, imdb_id, season, episode } = isMovie(id);
  if (ismovie) {
    return false;
  }

  const show = await getShowName(imdb_id);

  if (!show) return false;

  const response = await cf.request(
    `https://streamingcommunity.computer/api/search?q=${show.name}`
  );

  if (response.statusCode !== 200) return false;

  const { data } = JSON.parse(response.body);

  if (data.length === 0) return false;

  const showsData = data.filter((x: any) => x.name === show.name);

  if (showsData.length === 0) return false;

  const showData =
    showsData.length === 1
      ? showsData[0]
      : showsData.find((x: any) => x.last_air_date.split("-")[0] === show.date);

  if (!showData) return false;

  const { id: tid, slug } = showData;

  const a = await cf.request(
    `https://streamingcommunity.computer/titles/${tid}-${slug}/stagione-${season}`
  );

  if (a.statusCode !== 200) return false;

  const $ = cheerio.load(a.body);

  const dataPage = $("#app").attr("data-page");

  if (!dataPage) return false;

  const episodes = JSON.parse(dataPage).props.loadedSeason.episodes;

  const episodeData = episodes.find(
    (x: any) => x.number === parseInt(episode || "")
  );

  if (!episodeData) return false;

  const episodeId = episodeData.id;

  const iframeResponse = await cf.request(
    `https://streamingcommunity.computer/iframe/${tid}?episode_id=${episodeId}&next_episode=1`
  );

  if (!iframeResponse) return false;

  const $iframe = cheerio.load(iframeResponse.body);

  const iframeSrc = $iframe("iframe").attr("src");

  if (!iframeSrc) return false;

  const $iframeContent = await cf.request(iframeSrc);

  if ($iframeContent.statusCode !== 200) return false;

  const videoData = extractVideoData($iframeContent.body);

  if (!videoData) return false;

  const { token, expires, url } = videoData;

  const parsedIframeSrc = new URL(iframeSrc);

  return `${url}.m3u8?token=${token}&expires=${expires}${
    parsedIframeSrc.searchParams.has("canPlayFHD") ? "&h=1" : ""
  }${parsedIframeSrc.searchParams.has("b") ? "&b=1" : ""}`;
};

function extractVideoData(
  html: string
): { token?: string; expires?: string; url?: string } | null {
  // Match the content inside the <script> tag
  const scriptMatch = html.match(/<script>([\n\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    return null;
  }

  // Extract the JavaScript content
  const scriptContent = scriptMatch[1];

  // Use `eval` in a restricted context to avoid global variable pollution
  const sandbox: { window: any } = { window: {} };
  const evalScript = new Function("window", scriptContent);
  evalScript(sandbox.window);

  // Extract the needed values from sandbox
  const { token, expires } = sandbox.window.masterPlaylist?.params || {};
  const url = sandbox.window.masterPlaylist?.url;
  return { token, expires, url };
}

export { getStreamingCommunityUrl };
