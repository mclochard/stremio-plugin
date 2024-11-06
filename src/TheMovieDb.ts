import MovieDB from "node-themoviedb";
const dotenv = require("dotenv");
dotenv.config();

const mdb = new MovieDB(process.env.TMDB_API_KEY || "");

class TheMovieDb {
  private _tmbd_id: string | undefined;
  constructor(private id: string) {}

  async init() {
    this._tmbd_id = await this.getId();
  }

  get tmdbId() {
    if (!this._tmbd_id) throw new Error("You should call init() first");
    return this._tmbd_id;
  }

  async getId() {
    const response = await mdb.find.byExternalID({
      query: { external_source: "imdb_id" },
      pathParameters: { external_id: this.id },
    });

    if (
      "movie_results" in response.data &&
      response.data.movie_results.length > 0
    ) {
      return response.data.movie_results[0].id.toString();
    }
    if ("tv_results" in response.data && response.data.tv_results.length > 0) {
      return response.data.tv_results[0].id.toString();
    }
    return undefined;
  }

  async getShowDetails() {
    const { data } = await mdb.tv.getDetails({
      pathParameters: { tv_id: Number(this.tmdbId) },
    });

    return { data };
  }
}

export { TheMovieDb };
