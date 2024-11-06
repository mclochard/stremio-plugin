import CloudflareBypasser from "cloudflare-bypasser";
import { TheMovieDb } from "./TheMovieDb";

const cf = new CloudflareBypasser();

class StreamRetriever {
  private _showName: string | undefined;
  constructor(protected _id: string) {}

  get id() {
    if (this._id.includes("tmdb:")) {
      return this._id.replace("tmdb:", "");
    }
    return this._id;
  }

  get imdbId() {
    if (this.id.includes(":")) {
      return this.id.split(":")[0];
    }
    return this.id;
  }

  get isMovie() {
    return !this.id.includes(":");
  }

  get season() {
    if (this.isMovie) return undefined;
    return this.id.split(":")[1];
  }

  get episode() {
    if (this.isMovie) return undefined;
    return this.id.split(":")[2];
  }

  protected async getShowName() {
    const tmdb = new TheMovieDb(this.imdbId);
    await tmdb.init();
    if (!tmdb.tmdbId) return false;

    const { data } = await tmdb.getShowDetails();

    if (!this._showName) this._showName = data.name;

    return { name: data.name, date: data.first_air_date.split("-")[0] };
  }

  public async getUrl(): Promise<string | false> {
    return false;
  }

  public async getName(): Promise<string | false> {
    if (!this._showName) {
      await this.getShowName();
    }
    return this._showName || "Streaming";
  }

  public async getStream(): Promise<
    | {
        name: string;
        url: string;
      }
    | false
  > {
    const name = await this.getName();
    if (!name) return false;
    const url = await this.getUrl();
    if (!url) return false;
    return { name, url };
  }
}

export { StreamRetriever };
