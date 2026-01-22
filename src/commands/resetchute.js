const { SlashCommandBuilder, PermissionFlagsBits} = require("discord.js");
const { getGameDay } = require("../utils/gameday.js");


const path = require("node:path");
const fs = require("node:fs");

const chutesPath = path.join(__dirname,"../data/chutes.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resetchute')
		.setDescription('Reseta o chute do dia de todos ou de um usuário')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addUserOption(opt =>
			opt
				.setName("usuario")
				.setDescription("@usuário (opcional)")
				.setRequired(false)
		)
	,

	async execute(interaction) {
		if(!interaction.memberPermissions.has(PermissionFlagsBits.Administrator))
            return interaction.reply({
                content: "❌ Você não tem permissão para usar este comando.",
                ephemeral: true
        });

		const usuario = interaction.options.getUser("usuario");

		let chutes = {};

		try{
			//parse converte texto(json) em objeto
			chutes = JSON.parse(fs.readFileSync(chutesPath,"utf-8")); 
		} catch{
			return interaction.reply({
				content: "❌ Erro ao ler os chutes.",
				ephemeral: true
			});
		}
		
		const hoje = getGameDay();

		if (!usuario) {
			for (const userID in chutes) {
				chutes[userID] = chutes[userID].filter(
					c => c.gameDay !== hoje
				);

				if (chutes[userID].length === 0) {
					delete chutes[userID];
				}
			}

			fs.writeFileSync(chutesPath, JSON.stringify(chutes, null, 2));

			return interaction.reply(
				"♻️ Todos os chutes de hoje foram resetados."
			);
		}


		if(!chutes[usuario.id]){
			return interaction.reply({
				content: `O usuário ${usuario} ainda não possui um chute registrado`,
				ephemeral: true
			})
		}

		const antes = chutes[usuario.id].length;

		chutes[usuario.id] = chutes[usuario.id].filter( 
			c => c.gameDay !== hoje
		);

		if(antes === chutes[usuario.id].length){
			return interaction.reply({
				content: `ℹ️ ${usuario} não possui chute registrado hoje.`,
        		ephemeral: true
			});
		}

		// se sobrar vazio, remove a chave
		if (chutes[usuario.id].length === 0) {
			delete chutes[usuario.id];
		}

		fs.writeFileSync(chutesPath, JSON.stringify(chutes, null, 2));

		return interaction.reply(
			`♻️ O chute de ${usuario} foi resetado com sucesso.`
		);

	},
};