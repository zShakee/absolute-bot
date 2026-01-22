function getGameDay() {
  const now = new Date();

  // 14h BRT = 17h UTC
  const utcHour = now.getUTCHours();

  const gameDate = new Date(now);

  if (utcHour < 17) {
    // Antes das 14h BRT → ainda é o dia anterior
    gameDate.setUTCDate(gameDate.getUTCDate() - 1);
  }

  return gameDate.toISOString().slice(0, 10);
}

module.exports = { getGameDay };