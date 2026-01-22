const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle 
} = require("discord.js");
const { getGameDay } = require("../utils/gameday.js");
const fs = require("node:fs");
const path = require("node:path")

const chutesPath = path.join(__dirname, "../data/chutes.json");
const filmePath = path.join(__dirname,"../data/filme-atual.json");
const PAGE_SIZE = 20;

module.exports = {
	data: new SlashCommandBuilder().setName('status')
                .setDescription('Retorna todos os chutes feitos para esse filme')
    ,
	async execute(interaction) {
        if (!fs.existsSync(chutesPath)) {
            return interaction.reply({
                content: "📭 Nenhum chute registrado ainda.",
                ephemeral: true
            });
        }

        let filme = null;
        
        if(fs.existsSync(filmePath)){
            filme = JSON.parse(fs.readFileSync(filmePath,"utf-8"));
        }
        else{
            return interaction.reply({
                content: "Filme ainda não foi setado!",
                ephemeral: true
            })
        }
        
        const chutes = JSON.parse(fs.readFileSync(chutesPath,"utf-8"));
        const lista = [];
        const { titleCase } = require("../utils/format.js");

        for(const userID in chutes){
            if (!Array.isArray(chutes[userID])) continue;
             for (const c of chutes[userID]) {
                lista.push({ filme: titleCase(c.title), userID });
             }
        }

        if(lista.length === 0){
            return interaction.reply({
                content: "📭 Nenhum chute foi registrado ainda!",
                ephemeral: true
            })
        }

        await enviarPagina(interaction, lista, 0);
    }
}

async function enviarPagina(interaction, lista, pagina) {

  const inicio = pagina * PAGE_SIZE;
  const fim = inicio + PAGE_SIZE;
  const paginaItens = lista.slice(inicio, fim);

  const filmes = paginaItens.map(i => i.filme).join("\n");
  const usuarios = paginaItens.map(i => `<@${i.userID}>`).join("\n");

  const embed = new EmbedBuilder()
    .setTitle("🎬 Histórico de Chutes")
    .setColor(0x5865F2)
    .addFields(
      { name: "🎥 Filme", value: filmes, inline: true },
      { name: "👤 Jogador", value: usuarios, inline: true }
    )
    .setFooter({ text: `Página ${pagina + 1} de ${Math.ceil(lista.length / PAGE_SIZE)}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`chutes_prev_${pagina}`)
      .setLabel("◀")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pagina === 0),

    new ButtonBuilder()
      .setCustomId(`chutes_next_${pagina}`)
      .setLabel("▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(fim >= lista.length)
  );

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({ embeds: [embed], components: [row] });
  } else {
    await interaction.reply({ embeds: [embed], components: [row] });
  }
}