const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const filmePath = path.join(__dirname, "../data/filme-atual.json");

module.exports = {
	data: new SlashCommandBuilder()
            .setName('forcardica')
            .setDescription('Libera a próxima dica em caso de erro')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        let filme;
        try {
           filme = JSON.parse(fs.readFileSync(filmePath, "utf-8"));
        } catch(error) {
            return interaction.editReply({ content: "❌ Erro ao ler o arquivo de filmes ou nenhum filme definido." });
        }

        const proximaIndex = (filme.ultimaDicaLiberada || -1) + 1;
        const dica = filme.dicas[proximaIndex];

        if (!dica) {
            return interaction.editReply({ content: "🏁 Todas as dicas já foram liberadas para este filme." });
        }

        const embed = new EmbedBuilder()
            .setTitle("🧩 Nova dica liberada!")
            .setDescription(`Dica #${proximaIndex + 1}`)
            .setImage(dica)
            .setColor(0x3498DB)
            .setTimestamp();
        
        filme.ultimaDicaLiberada = proximaIndex;
        fs.writeFileSync(filmePath, JSON.stringify(filme, null, 2));

        const canal = interaction.client.channels.cache.get(process.env.CHANNEL_ID);
        
        if (!canal) {
            return interaction.editReply({ content: "❌ Erro: Canal de dicas não encontrado. Verifique o CHANNEL_ID no Render." });
        }

        await canal.send({ embeds: [embed] });
        return interaction.editReply({ content: `✅ Dica #${proximaIndex + 1} enviada com sucesso!` });
	},
};