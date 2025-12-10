// src/services/pokeapi.js
import { db } from '../components/firebase-config';

const BASE_URL = 'https://pokeapi.co/api/v2/pokemon/';

/**
 * Fetches data for a single Pokémon.
 * @param {string} name - The name (or ID) of the Pokémon.
 * @returns {Promise<object>} The Pokémon data object.
 */
export const fetchPokemonData = async (name) => {
  if (!name) return null;
  const lowercaseName = name.toLowerCase().trim();

  try {
    const response = await fetch(`${BASE_URL}${lowercaseName}`);

    if (!response.ok) {
      // Graceful error handling is required
      throw new Error(`Pokémon "${name}" not found! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("PokéAPI Error:", error);
    throw error; // Propagate the error to the calling component
  }
};