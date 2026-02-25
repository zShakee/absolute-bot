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
                )
                .addIntegerOption(option =>
                    option.setName("ano")
                    .setDescription("Ano de lançamento do filme (opcional)")
                    .setMinValue(1888) // O primeiro filme da história foi em 1888!
                    .setMaxValue(new Date().getFullYear() + 1) // Limita ao ano atual ou próximo
                )
                ,

	async execute(interaction) {

        //const { checkGameChannel } = require("../utils/checkChannel.js")

        //if(!checkGameChannel(interaction)) return;

        const chute = interaction.options.getString("filme").trim().toLowerCase();
        const ano = interaction.options.getInteger("ano");
        const userID = interaction.user.id;
        const hoje = getGameDay();

        const { searchMovie } = require("../services/tmdb.js");
        const filmes = await searchMovie(chute, ano);

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

        const thumbnail = chuteIMDB.poster_path 
            ? `https://image.tmdb.org/t/p/original${chuteIMDB.poster_path}` 
            : null;


        const banner = chuteIMDB.backdrop_path 
            ? `https://image.tmdb.org/t/p/w1280${chuteIMDB.backdrop_path}` 
            : null;
        
        chutes[userID].push({
            id: chuteIMDB.id,
            title: chuteIMDB.title,
            banner,
            gameDay: hoje
        });

        fs.writeFileSync(chutesPath, JSON.stringify(chutes, null, 2))
        const luas = gerarFasesDaLua(chuteIMDB.vote_average);
        const notaFormatada = (chuteIMDB.vote_average/2).toFixed(1);
        
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
                .setTitle(`🎉 TEMOS UM VENCEDOR!!`)
                .setDescription(
                    `Parabéns ${interaction.user}! Você acertou em cheio.\n\n` + 
                        `O filme da semana era **${chuteIMDB.title}**`
                )
                .setColor(0x57F287)
                .setTimestamp()
                .setThumbnail(thumbnail)
                .addFields(
                    { 
                        name: "📅 Ano de lançamento", 
                        value: chuteIMDB.release_date?.split("-")[0] || "N/A", 
                        inline: true 
                    },
                    { 
                        name: "⭐ Avaliação dos usuários", 
                        value: `${luas} ${notaFormatada}`, inline: true 
                    },
                )
                .setImage(banner)
                .setFooter({ text: "Uma nova rodada começará em breve!" })
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
         }



        const embed = new EmbedBuilder()
            .setTitle("❌ Filme errado!")
            //.setThumbnail(thumbnail) //cartaz vertical
            .setDescription(`Você achou que era **${chuteIMDB.title}** mas a busca continua`)
            .setImage(thumbnail) //o fundo
            .setFooter({
                text: `Chutado por ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .addFields(
                { name: "📅 Ano de lançamento", value: chuteIMDB.release_date?.split("-")[0] || "N/A", inline: true },
                { name: "⭐ Avaliação dos usuários", value: `${luas} ${notaFormatada}`, inline: true }
            )
            .setColor(0x992D22)
            .setTimestamp()

        return interaction.reply({
            embeds: [embed]
        });
    }
};

function gerarFasesDaLua(nota) {
    // 1. Convertemos a escala de 10 para 5
    const notaCinco = nota / 2; 
    
    const cheias = Math.floor(notaCinco); // Quantas luas cheias
    const resto = notaCinco - cheias;    // O que sobrou (ex: 0.7)
    
    let resultado = "★".repeat(cheias);

    // 2. Lógica para a Meia Lua
    // Se o resto for entre 0.25 e 0.75, colocamos uma meia lua
    // Se for maior que 0.75, arredondamos para uma cheia
    if (resto >= 0.25 && resto <= 0.75) {
        resultado += "⯪";
    } else if (resto > 0.75) {
        resultado += "★";
    }

    // 3. Preenche o restante com Luas Novas (vazias) até completar 5 ícones
    const totalIcones = resultado.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g)?.length || resultado.length;
    const vazias = 5 - totalIcones;
    
    if (vazias > 0) {
        resultado += "☆".repeat(vazias);
    }

    return resultado;
}