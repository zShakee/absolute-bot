const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path")
const filmePath = path.join(__dirname, "../data/filme-atual.json");

module.exports = {
	data: new SlashCommandBuilder()
            .setName('forcardica')
            .setDescription('Libera a próxima dica em caso de erro')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            ,
	async execute(interaction) {
        let filme;
        try{
           filme = JSON.parse(fs.readFileSync(filmePath,"utf-8"))
        }
        catch(error){
            return interaction.reply({
                content: "❌ Nenhum filme foi definido ainda.",
                ephemeral: true
            });
        }

        const proximaIndex = filme.ultimaDicaLiberada + 1
        const dica = filme.dicas[proximaIndex];

        if (!dica) {
                    console.log("🏁 Todas as dicas já foram liberadas");
                    return;
                }
         const embed = new EmbedBuilder()
                            .setTitle("🧩 Nova dica liberada!")
                            .setDescription(`Dica #${proximaIndex + 1}`)
                            .setImage(dica)
                            .setColor(0x3498DB)
                            .setTimestamp();
        
        filme.ultimaDicaLiberada = proximaIndex;
        fs.writeFileSync(filmePath,JSON.stringify(filme,null,2));
        console.log(`✅ Dica ${proximaIndex + 1} enviada`);
        const canal = interaction.client.channels.cache.get(process.env.CHANNEL_ID);
        await canal.send({ embeds: [embed] });
	},
};