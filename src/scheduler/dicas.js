const cron = require("node-cron");
const fs = require("node:fs");
const path = require("node:path");
const { EmbedBuilder } = require("discord.js");

const filmePath = path.join(__dirname, "../data/filme-atual.json");

module.exports = function iniciarScheduler(client) {

    cron.schedule(
         "0 14 * * *",
        async () => {
            try {
                console.log("⏰ Cron disparou");

                if (!fs.existsSync(filmePath)) return;

                const filme = JSON.parse(
                    fs.readFileSync(filmePath, "utf-8")
                );

                // inicializa se não existir
                if (typeof filme.ultimaDicaLiberada !== "number") {
                    filme.ultimaDicaLiberada = -1;
                }

                const proximaIndex = filme.ultimaDicaLiberada + 1;
                const dica = filme.dicas[proximaIndex];

                if (!dica) {
                    console.log("🏁 Todas as dicas já foram liberadas");
                    return;
                }

                const canal = client.channels.cache.get(
                    process.env.CHANNEL_ID
                );

                if (!canal) return;

                const embed = new EmbedBuilder()
                    .setTitle("🧩 Nova dica liberada!")
                    .setDescription(`Dica #${proximaIndex + 1}`)
                    .setImage(dica)
                    .setColor(0x3498DB)
                    .setTimestamp();

                await canal.send({ embeds: [embed] });

                // salva progresso
                filme.ultimaDicaLiberada = proximaIndex;

                fs.writeFileSync(
                    filmePath,
                    JSON.stringify(filme, null, 2)
                );

                console.log(`✅ Dica ${proximaIndex + 1} enviada`);

            } catch (err) {
                console.error("❌ Erro no cron de dicas:", err);
            }
        },
        {
            timezone: "America/Sao_Paulo"
        }
    );

    console.log("⏰ Scheduler de dicas iniciado (14h BR)");
};
