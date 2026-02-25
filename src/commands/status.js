const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { checkGameChannel } = require("../utils/checkChannel.js");
const { titleCase } = require("../utils/format.js"); // Supondo que esteja aqui

const chutesPath = path.join(__dirname, "../data/chutes.json");
const filmePath = path.join(__dirname, "../data/filme-atual.json");
const PAGE_SIZE = 20;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Retorna todos os chutes feitos para esse filme'),

    async execute(interaction) {
        //if (!checkGameChannel(interaction)) return;

        // Apenas chama a função compartilhada pedindo a página 0
        // false = não é update (é uma nova mensagem)
        await atualizarPaginaStatus(interaction, 0, false);
    },

    // Exportamos a função AQUI para o index.js poder usar
    atualizarPaginaStatus 
};

/**
 * Função agora é independente: ela busca os dados e monta a tela.
 * Pode ser chamada pelo comando (/status) ou pelo botão (index.js).
 */
async function atualizarPaginaStatus(interaction, pagina, isUpdate = true) {
    
    // 1. Verificações de Arquivo (Recarregamos para garantir dados frescos)
    if (!fs.existsSync(chutesPath) || !fs.existsSync(filmePath)) {
        const msg = { content: "📭 Nenhum dado encontrado ou jogo não iniciado.", ephemeral: true, components: [] };
        // Se for botão, remove os botões antigos. Se for comando, avisa.
        return isUpdate ? interaction.update(msg) : interaction.reply(msg);
    }

    // 2. Processar Dados
    const chutes = JSON.parse(fs.readFileSync(chutesPath, "utf-8"));
    const lista = [];

    // Lógica para varrer o JSON e montar a lista plana
    for (const userID in chutes) {
        if (!Array.isArray(chutes[userID])) continue;
        for (const c of chutes[userID]) {
            lista.push({ 
                // Garante que funciona com 'title' ou 'chute'
                filme: titleCase(c.title || c.chute), 
                userID 
            });
        }
    }

    if (lista.length === 0) {
        const msg = { content: "📭 Nenhum chute registrado.", ephemeral: true, components: [] };
        return isUpdate ? interaction.update(msg) : interaction.reply(msg);
    }

    // 3. Cálculos de Paginação
    const totalPages = Math.ceil(lista.length / PAGE_SIZE);
    
    // Proteção contra índices inválidos (caso deletem chutes enquanto alguém navega)
    if (pagina >= totalPages) pagina = totalPages - 1;
    if (pagina < 0) pagina = 0;

    const inicio = pagina * PAGE_SIZE;
    const fim = inicio + PAGE_SIZE;
    const paginaItens = lista.slice(inicio, fim);

    // 4. Montar Embed
    const listaFormatada = paginaItens.map((item, index) => {
    return `**🎥 ${item.filme}** <@${item.userID}>`;
}).join("\n\n"); // \n\n dá um espaçamento extra entre os itens

    const embed = new EmbedBuilder()
    .setTitle("🎬 Histórico de Chutes")
    .setColor(0x5865F2)
    .setDescription(listaFormatada || "Nenhum dado nesta página.") // Usamos Description ao invés de Fields
    .setFooter({ text: `Página ${pagina + 1} de ${totalPages} • Total de chutes: ${lista.length}` });

    // 5. Botões (Lógica mantida)
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`chutes_prev_${pagina}`) // ID que o index.js vai ler
            .setLabel("◀")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(pagina === 0),

        new ButtonBuilder()
            .setCustomId(`chutes_next_${pagina}`)
            .setLabel("▶")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(pagina >= totalPages - 1) // Desativa se for a última página
    );

    const payload = { embeds: [embed], components: [row] };

    // 6. Enviar
    if (isUpdate) {
        // Se veio do clique do botão, atualizamos a mensagem existente
        await interaction.update(payload);
    } else {
        // Se veio do comando /status, criamos uma nova resposta
        await interaction.reply(payload);
    }
}