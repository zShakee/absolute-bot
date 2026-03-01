const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const fs = require("node:fs");
const path = require("node:path");
const filmePath = path.join(__dirname, "../data/filme-atual.json");
const chutesPath = path.join(__dirname, "../data/chutes.json");

module.exports = {
	data: new SlashCommandBuilder().setName('setfilme')
                .setDescription('Define o nome do filme da semana')
                //.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addStringOption(opt =>
                    opt.setName("titulo")
                        .setDescription("Nome do filme")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("ano")
                    .setDescription("Ano de lançamento do filme")
                    .setMinValue(1888) // O primeiro filme da história foi em 1888!
                    .setMaxValue(new Date().getFullYear() + 1) // Limita ao ano atual ou próximo
                    .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName("dica1")
                    .setDescription("URL da dica 1")
                    .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName("dica2")
                    .setDescription("URL da dica 2")
                    .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName("dica3")
                    .setDescription("URL da dica 3")
                    .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName("dica4")
                    .setDescription("URL da dica 4")
                    .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName("dica5")
                    .setDescription("URL da dica 5")
                    .setRequired(true)
                )
                ,
	async execute(interaction) {

        if(!interaction.memberPermissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({
                content: "❌ Você não tem permissão para usar este comando.",
                ephemeral: true
        });
        

        const titulo = interaction.options.getString("titulo")
        const ano = interaction.options.getInteger("ano")
        const dicas = [
            interaction.options.getString("dica1"),
            interaction.options.getString("dica2"),
            interaction.options.getString("dica3"),
            interaction.options.getString("dica4"),
            interaction.options.getString("dica5")
        ]

        const {searchMovie} = require("../services/tmdb");
        const filmes = await searchMovie(titulo, ano);
        
        if(filmes.length === 0){
            return interaction.reply({
                content: "Filme não encontrado no TMDB!",
                ephemeral: true
            });
        }

        const filme = filmes[0];
        const banner = filme.poster_path
        ? `https://image.tmdb.org/t/p/w500${filme.poster_path}`
        : null;

        const novoFilme = {
            id: filme.id,
            titulo: filme.title,
            inicio: new Date().toISOString().slice(0, 10),
            dicas,
            banner,
            ultimaDicaLiberada: -1
        };

        fs.writeFileSync(
            filmePath,
            JSON.stringify(novoFilme, null, 2)
        );

        fs.writeFileSync(
            chutesPath,
            JSON.stringify({}, null, 2)
        );

        const embed = new EmbedBuilder()
            .setTitle("🎬 Filme definido!")
            .setDescription(`${filme.title}`)
            .setImage(banner)
            .setColor(0x57F287)
            .setFooter({
                text: `Definido por ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .addFields({
                name: "🧩 Dicas",
                value: `${dicas.length} dicas cadastradas`
            })
            .setTimestamp()

        await interaction.reply({
            embeds: [embed]
        });

    }
};