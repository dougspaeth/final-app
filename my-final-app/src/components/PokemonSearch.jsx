// src/components/PokemonSearch.jsx

import React, { useState } from 'react';
import { fetchPokemonData } from '../services/pokeapi';
import { savePokemonToTeam } from '../services/firestore'; // Will create this next
import { useAuth } from './AuthContext'; // To get the user's ID

const PokemonSearch = () => {
  const { currentUser } = useAuth(); // Needed to associate the team sheet with the user
  const [pokemonName, setPokemonName] = useState('');
  const [pokemonData, setPokemonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // 1. Function to handle the API call
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPokemonData(null);
    setSaveMessage('');

    try {
      const data = await fetchPokemonData(pokemonName);
      setPokemonData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch Pokémon data.');
    } finally {
      setLoading(false); // Helpful feedback is required
    }
  };

  // 2. Function to handle saving to Firestore
  const handleSave = async () => {
    if (!currentUser || !pokemonData) return;

    try {
      // We only save the essential data, not the massive API response
      const pokemonToSave = {
        name: pokemonData.name,
        stats: pokemonData.stats.map(s => ({ 
            name: s.stat.name, 
            base_stat: s.base_stat 
        })),
        sprite: pokemonData.sprites.front_default,
        timestamp: new Date()
      };
      
      await savePokemonToTeam(currentUser.uid, pokemonToSave);
      setSaveMessage(`Successfully added ${pokemonData.name} to your team sheet!`);
    } catch (err) {
      setSaveMessage(`Failed to save: ${err.message}`);
    }
  };

  return (
    <div>
      <h2>Pokémon Search & Team Builder</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={pokemonName}
          onChange={(e) => setPokemonName(e.target.value)}
          placeholder="Enter Pokémon name or ID"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search Pokémon'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {pokemonData && (
        <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
          <h3>{pokemonData.name.toUpperCase()}</h3>
          <img src={pokemonData.sprites.front_default} alt={pokemonData.name} />
          
          <h4>Base Stats:</h4>
          <ul>
            {pokemonData.stats.map((s, index) => (
              <li key={index}>
                **{s.stat.name}:** {s.base_stat}
              </li>
            ))}
          </ul>
          
          <button onClick={handleSave} disabled={!currentUser}>
            Add to Team Sheet
          </button>
          {saveMessage && <p style={{ color: 'green', marginTop: '10px' }}>{saveMessage}</p>}
        </div>
      )}
    </div>
  );
};

export default PokemonSearch;