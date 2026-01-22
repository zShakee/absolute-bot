function titleCase(text) {
  return text
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

module.exports = { titleCase };