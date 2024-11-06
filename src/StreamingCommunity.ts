import * as cheerio from "cheerio";
import CloudflareBypasser from "cloudflare-bypasser";
import { StreamRetriever } from "./StreamRetriever";

const cf = new CloudflareBypasser();

class StreamingCommunity extends StreamRetriever {
  private async getShowData(): Promise<
    false | { showId: string; episodeId: string }
  > {
    const show = await this.getShowName();

    if (!show) return false;

    const { name, date } = show;

    const response = await cf.request(
      `https://streamingcommunity.computer/api/search?q=${name}`
    );

    if (response.statusCode !== 200) return false;

    const { data } = JSON.parse(response.body);

    if (!data || data.length === 0) return false;

    const showsData = data.filter((x: any) => x.name === name);

    if (showsData.length === 0) return false;

    const showData =
      showsData.length === 1
        ? showsData[0]
        : showsData.find((x: any) => x.last_air_date.split("-")[0] === date);

    if (!showData) return false;

    const { id: showId, slug } = showData;

    const episodeId = await this.getEpisodeId(showId, slug);

    if (!episodeId) return false;

    return { showId: showData.id, episodeId };
  }

  private async getEpisodeId(
    showId: string,
    slug: string
  ): Promise<string | false> {
    const response = await cf.request(
      `https://streamingcommunity.computer/titles/${showId}-${slug}/stagione-${this.season}`
    );

    if (response.statusCode !== 200) return false;

    const $ = cheerio.load(response.body);

    const dataPage = $("#app").attr("data-page");

    if (!dataPage) return false;

    const episodes = JSON.parse(dataPage).props.loadedSeason.episodes;

    const episodeData = episodes.find(
      (x: any) => x.number === parseInt(this.episode || "")
    );

    if (!episodeData) return false;

    return episodeData.id;
  }

  private async getVideoData(tid: string, episodeId: string) {
    const iframeResponse = await cf.request(
      `https://streamingcommunity.computer/iframe/${tid}?episode_id=${episodeId}&next_episode=1`
    );

    if (!iframeResponse) return false;

    const $iframe = cheerio.load(iframeResponse.body);

    const iframeSrc = $iframe("iframe").attr("src");

    if (!iframeSrc) return false;

    const $iframeContent = await cf.request(iframeSrc);

    if ($iframeContent.statusCode !== 200) return false;

    const data = extractVideoData($iframeContent.body);
    if (!data) return false;

    const parsedIframeSrc = new URL(iframeSrc);
    return {
      ...data,
      fhd: parsedIframeSrc.searchParams.has("canPlayFHD"),
      b: parsedIframeSrc.searchParams.has("b"),
    };
  }

  public async getName() {
    return `📺 StreamingCommunity - ${await super.getName()}`;
  }

  public async getUrl() {
    if (this.isMovie) {
      return false;
    }

    const showData = await this.getShowData();

    if (!showData) return false;

    const { showId, episodeId } = showData;

    const videoData = await this.getVideoData(showId, episodeId);

    if (!videoData) return false;

    const { token, expires, url, fhd, b } = videoData;

    return `${url}.m3u8?token=${token}&expires=${expires}${fhd ? "&h=1" : ""}${
      b ? "&b=1" : ""
    }`;
  }
}

function extractVideoData(
  html: string
): { token: string; expires: string; url: string } | null {
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

  if (!token || !expires || !url) return null;

  return { token, expires, url };
}
export { StreamingCommunity };
