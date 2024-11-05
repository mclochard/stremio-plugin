import MovieDB from "node-themoviedb";
const dotenv = require("dotenv");
dotenv.config();

const mdb = new MovieDB(process.env.TMDB_API_KEY || "");

const getTmdbIdFromImdbId = async (imdb_id: string) => {
  const response = await mdb.find.byExternalID({
    query: { external_source: "imdb_id" },
    pathParameters: { external_id: imdb_id },
  });

  if (
    "movie_results" in response.data &&
    response.data.movie_results.length > 0
  ) {
    return response.data.movie_results[0].id;
  }
  if ("tv_results" in response.data && response.data.tv_results.length > 0) {
    return response.data.tv_results[0].id;
  }
  return false;
};

const getShowName = async (imdb_id: string) => {
  const tmdb_id = await getTmdbIdFromImdbId(imdb_id);
  if (!tmdb_id) return false;

  const { data } = await mdb.tv.getDetails({
    pathParameters: { tv_id: tmdb_id },
  });

  return { name: data.name, date: data.first_air_date.split("-")[0] };
};
const getMovieName = async (imdb_id: string) => {
  const tmdb_id = await getTmdbIdFromImdbId(imdb_id);
  if (!tmdb_id) return false;

  return false;
};

export { getShowName };
