const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const path = require("node:path");
const fs = require("node:fs");
const ganhadoresPath = path.join(__dirname,"../data/ganhadores.json");

module.exports = {
	data: new SlashCommandBuilder().setName('rank')
        .setDescription('🏅Exibe o ranking atual do QSE'),
	async execute(interaction) {
        
         if (!fs.existsSync(ganhadoresPath)) {
            return interaction.reply({
                content: "📭 Ainda não há ganhadores registrados.",
                ephemeral: true
            });
        }

        let ganhadores;
        try{
            ganhadores = JSON.parse(fs.readFileSync(ganhadoresPath,"utf-8"));
        }
        catch{
            interaction.reply({
                content: "❌ Erro ao ler o ranking.",
                ephemeral: true
            })
        }

        const ranking = Object.values(ganhadores)
        .sort( (a, b) => b.vitorias - a.vitorias )
        .slice(0, 10);

        if (ranking.length === 0) {
            return interaction.reply({
                content: "📭 Ainda não há ganhadores registrados.",
                ephemeral: true
            });
        }

        const medalhas = ["🥇", "🥈", "🥉"];

        const descricao = ranking.map((g, index) => {
            const medalha = medalhas[index] || "🏅";
            return `${medalha} **${g.username}** — ${g.vitorias} vitória(s)`;
        }).join("\n");

        const embed = new EmbedBuilder()
            .setTitle("👑 Ranking do servidor")
            .setDescription(descricao)
            .setColor(0xffff00)
            .setFooter({
                text: "A cada semana, um novo filme 🎬"
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
	},
};