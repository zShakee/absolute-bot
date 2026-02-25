const axios = require("axios")

require("dotenv").config();
const TMDB_KEY = process.env.TMDB_API_KEY;

async function searchMovie(title, ano = null){
    const params = {
                api_key: TMDB_KEY,
                query: title,
                language: "pt-BR",
    };
    if(ano) params.year = ano;

    const response = await axios.get("https://api.themoviedb.org/3/search/movie", {params})

    const results = response.data.results || [];

    return results.sort((a, b) => b.popularity - a.popularity);
}

module.exports = {
    searchMovie
};

