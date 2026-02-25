require("dotenv").config;

function checkGameChannel(interaction){
    const canalPermitido = process.env.CHANNEL_ID;

    if(!canalPermitido) return true;
        
    if(canalPermitido !== interaction.channelId){
        interaction.reply({
            content: `🚫 Comandos do jogo apenas em: <#${canalPermitido}>`,
            ephemeral: true
        })
        return false;
    }

    return true;
}

module.exports = { checkGameChannel };
