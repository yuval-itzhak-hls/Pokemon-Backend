const fs = require('fs');
const path = require('path');

function transformRawPokemon(raw) {
  return {
    id: raw.id?.toString() ?? '',
    name: raw.name?.english ?? 'Unknown',
    description: raw.description ?? '',
    powerLevel: raw.base?.Attack ?? 0,
    hpLevel: raw.base?.HP ?? 0,
    image: raw.image?.hires ?? '',
    isMyPokemon: false,
    height: raw.profile?.height ?? '',
    weight: raw.profile?.weight ?? '',
    category: raw.species ?? '',
    abilities: Array.isArray(raw.profile?.ability)
      ? raw.profile.ability.map(([name]) => name)
      : [],
    defensePower: raw.base?.Defense ?? 0,
    spAttack: raw.base?.['Sp. Attack'] ?? 0,
    spDefense: raw.base?.['Sp. Defense'] ?? 0,
    speed: raw.base?.Speed ?? 0,
    type: raw.type ?? [],
  };
}

function main() {
  const inputPath = path.join(__dirname, '../data/pokemon.json');
  const outputPath = path.join(__dirname, '../data/cleanPokemons.json');

  const rawData = fs.readFileSync(inputPath, 'utf-8');
  const rawPokemons = JSON.parse(rawData);

  const cleaned = rawPokemons.map(transformRawPokemon);

  fs.writeFileSync(outputPath, JSON.stringify(cleaned, null, 2), 'utf-8');
  console.log(`✅ ${cleaned.length} pokemons transformed and saved to ${outputPath}`);
}

main();
