const { Client, Events, GatewayIntentBits, Collection } = require("discord.js");

//dot env 
const dotenv = require("dotenv");

dotenv.config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot de Filmes está Online! 🎬');
});

app.listen(port, () => {
  console.log(`📡 Servidor de monitoramento rodando na porta ${port}`);
});

const { TOKEN } = process.env;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

//importa comandos

const fs = require("node:fs");
const path = require("node:path");

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));


for(const file of commandFiles){
    const filePath = path.join(commandsPath, file)
    const command = require(filePath)
    if("data" in command && "execute" in command){
        client.commands.set(command.data.name, command);
    }
    else {
			console.log(`[AVISO] Comando em ${filePath} não possui "data" ou "execute"dc`);
		}
}

const iniciarScheduler = require("./scheduler/dicas");

client.once(Events.ClientReady, (readyClient) => {
    iniciarScheduler(client);
    console.log(`🤖 Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(TOKEN);

//listener das interações

client.on(Events.InteractionCreate, async (interaction) => {
    if(interaction.isChatInputCommand()){
        const command = interaction.client.commands.get(interaction.commandName)
        if(!command){
          console.error("Comando não encontrado!");
          return;
        }
        try{
          await command.execute(interaction);
        }catch (error) {
            console.error(error);
            
            // Se o comando já respondeu (replied) ou está esperando (deferred), 
            // usamos followUp para não causar o erro 40060
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Houve um erro ao executar o comando!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Houve um erro ao executar o comando!', ephemeral: true });
            }
        return;
        }
    }

    const { atualizarPaginaStatus } = require("./commands/status.js");

    if(interaction.isButton()){
        if (!interaction.customId.startsWith("chutes_")) return;

        const [_, direcao, paginaAtual] = interaction.customId.split("_");
        const pagina = parseInt(paginaAtual, 10);

        const novaPagina = direcao === "next"
            ? pagina + 1
            : pagina - 1;

        // Aqui você chama a função que renderiza a página
        await atualizarPaginaStatus(interaction, novaPagina, true);
        return;
    }
})