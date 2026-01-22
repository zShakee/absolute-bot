const axios = require("axios")

require("dotenv").config();
const TMDB_KEY = process.env.TMDB_API_KEY;

async function searchMovie(title){
    const response = await axios.get("https://api.themoviedb.org/3/search/movie", {
            params: {
                api_key: TMDB_KEY,
                query: title,
                language: "pt-BR"
            }
    });

    const results = response.data.results || [];

    return results.sort((a, b) => b.popularity - a.popularity);
}

module.exports = {
    searchMovie
};

