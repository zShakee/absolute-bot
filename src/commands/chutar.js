const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getGameDay } = require("../utils/gameday.js");
const fs = require("node:fs");
const path = require("node:path")

const filmePath = path.join(__dirname, "../data/filme-atual.json");
const chutesPath = path.join(__dirname, "../data/chutes.json");

module.exports = {
	data: new SlashCommandBuilder().setName('chutar')
                .setDescription('Digite o nome do filme que deseja chutar')
                .addStringOption(opt =>
                    opt.setName("filme")
                        .setDescription("nome do filme")
                        .setRequired(true)
                ),

	async execute(interaction) {

        const chute = interaction.options.getString("filme").trim().toLowerCase();
        const userID = interaction.user.id;
        const hoje = getGameDay();

        const { searchMovie } = require("../services/tmdb.js");
        const filmes = await searchMovie(chute);

        if(filmes.length === 0){
            return interaction.reply({
                content: "Filme não encontrado no TMDB!",
                ephemeral: true
            })
        }

        let filme;

        try{
            filme = JSON.parse(fs.readFileSync(filmePath, "utf8"));
        }
        catch(error){
            return interaction.reply({
                content: "❌ Nenhum filme foi definido ainda.",
                ephemeral: true
            });
        }

        const chuteIMDB = filmes[0];

        let chutes = {};

        try{
            if (fs.existsSync(chutesPath)) {
                chutes = JSON.parse(fs.readFileSync(chutesPath, "utf8"));
            }
        }
        catch{
            chutes = {};
        }

        if (!chutes[userID]) {
            chutes[userID] = [];
        }

        
        const jaChutouHoje = chutes[userID]?.some(
            c => c.gameDay === hoje
        );

        
        if(jaChutouHoje){
            return interaction.reply({
                content:"❌ Você já chutou hoje. Novo chute libera às 14h 🇧🇷",
                ephemeral: true
            });
        }

        const filmeJaChutado = Object.values(chutes).some(lista => {
            if (!Array.isArray(lista)) return false;
            return lista.some(c => c.id === chuteIMDB.id);
        });

        if(filmeJaChutado){
            return interaction.reply({
                content: "🚫 Esse filme já foi chutado por outro jogador. Escolha outro!",
                ephemeral: true
            });
        }

        const banner = chuteIMDB.poster_path
        ? `https://image.tmdb.org/t/p/w500${chuteIMDB.poster_path}`
        : null;
        
        chutes[userID].push({
            id: chuteIMDB.id,
            title: chuteIMDB.title,
            banner,
            gameDay: hoje
        });

        fs.writeFileSync(chutesPath, JSON.stringify(chutes, null, 2))
        
        if(chuteIMDB.id === filme.id){

            fs.unlinkSync(filmePath);

             let ganhadores = {};

            const ganhadoresPath = path.join(__dirname,"../data/ganhadores.json");
            try{
                ganhadores = JSON.parse(fs.readFileSync(ganhadoresPath,"utf-8"));
            }
            catch{
                ganhadores = {};
            }

            if(!ganhadores[userID]){
                ganhadores[userID] = {
                    username: interaction.user.username,
                    vitorias: 0
                };
            }

            ganhadores[userID].vitorias++;

            fs.writeFileSync(ganhadoresPath,JSON.stringify(ganhadores, null, 2))

            const embed = new EmbedBuilder()
                .setTitle("🎉 Temos um vencedor!")
                .setDescription(
                    `${interaction.user} acertou o filme da semana!\n\n🎬 **${filme.titulo}**`
                )
                .setColor(0x57F287)
                .setTimestamp()
                .setImage(banner)

            return interaction.reply({
                embeds: [embed]
            });
         }


        const embed = new EmbedBuilder()
            .setTitle("❌ Filme errado!")
            .setDescription(chuteIMDB.title)
            .setFooter({
                text: `Chutado por ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setColor(0xFF0000)
            .setTimestamp()
            .setImage(banner)

        return interaction.reply({
            embeds: [embed]
        });
    }
};