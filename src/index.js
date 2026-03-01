/*const { Client, Events, GatewayIntentBits, Collection } = require("discord.js");
const dotenv = require("dotenv");
const express = require('express');
const fs = require("node:fs");
const path = require("node:path");

dotenv.config();

// --- Servidor de Monitoramento (Para o Render não dormir) ---
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot de Filmes está Online! 🎬'));
app.listen(port, () => console.log(`📡 Servidor Express na porta ${port}`));

// --- Configuração do Bot ---
const { TOKEN } = process.env;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// --- Carregamento de Comandos ---
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[AVISO] Comando em ${filePath} inválido.`);
    }
}

// --- Eventos ---
const iniciarScheduler = require("./scheduler/dicas");

client.once(Events.ClientReady, (readyClient) => {
    try {
        iniciarScheduler(client);
        console.log(`🤖 Ready! Logged in as ${readyClient.user.tag}`);
    } catch (e) {
        console.error("⚠️ Erro ao iniciar Scheduler:", e);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const msg = { content: 'Houve um erro ao executar o comando!', ephemeral: true };
            if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
            else await interaction.reply(msg);
        }
    }

    if (interaction.isButton() && interaction.customId.startsWith("chutes_")) {
        const { atualizarPaginaStatus } = require("./commands/status.js");
        const [_, direcao, paginaAtual] = interaction.customId.split("_");
        const novaPagina = direcao === "next" ? parseInt(paginaAtual) + 1 : parseInt(paginaAtual) - 1;
        await atualizarPaginaStatus(interaction, novaPagina, true);
    }
});

// --- Login (Uma única vez com tratamento de erro) ---
console.log("Tentando logar no Discord...");
if (!TOKEN) {
    console.error("❌ ERRO: Variável TOKEN não encontrada no Environment!");
} else {
    client.login(TOKEN).catch(err => {
        console.error("❌ FALHA CRÍTICA NO LOGIN:");
        console.error(err.message);
    });
}*/

const { Client, Events, GatewayIntentBits, Collection } = require("discord.js");
const express = require('express');
const fs = require("node:fs");
const path = require("node:path");

// 1. Servidor Express (Obrigatório para o Render)
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Ativo'));
app.listen(port, () => console.log(`📡 Servidor na porta ${port}`));

// 2. Verificação de Variáveis (Debug)
console.log("--- DEBUG DE AMBIENTE ---");
console.log("Variável TOKEN existe?", !!process.env.TOKEN);
if (process.env.TOKEN) {
    console.log("Comprimento do TOKEN:", process.env.TOKEN.length);
    console.log("Primeiros 5 caracteres:", process.env.TOKEN.substring(0, 5));
}
console.log("-----------------------");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// 3. Carregar Comandos (Com try/catch para não travar o bot)
const commandsPath = path.join(__dirname, "commands");
try {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        }
    }
} catch (err) {
    console.error("❌ Erro ao carrerar comandos:", err.message);
}

// 4. Evento Ready
client.once(Events.ClientReady, c => {
    console.log(`✅ Logado com sucesso como ${c.user.tag}`);
});

// 5. Login Único
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
    console.error("❌ ERRO FATAL: TOKEN não encontrado no process.env!");
} else {
    console.log("Tentando login...");
    client.login(TOKEN).catch(err => {
        console.error("❌ ERRO NO LOGIN DO DISCORD:");
        console.error(err.message);
    });
}