// src/components/PokemonSearch.jsx

import React, { useState } from 'react';
import { fetchPokemonData } from '../services/pokeapi';
import { savePokemonToTeam } from '../services/firestore'; 
import { useAuth } from './AuthContext'; 

const PokemonSearch = () => {
  const { currentUser } = useAuth();
  const [pokemonName, setPokemonName] = useState('');
  const [pokemonData, setPokemonData] = useState(null); // Holds the search result
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // 1. Function to handle the API call
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPokemonData(null); // Clear previous data on new search
    setSaveMessage('');

    try {
      const data = await fetchPokemonData(pokemonName);
      setPokemonData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch Pokémon data.');
    } finally {
      setLoading(false); 
    }
  };

  // 2. Function to handle saving to Firestore
  const handleSave = async () => {
    if (!currentUser || !pokemonData) return;

    try {
      const pokemonToSave = {
        name: pokemonData.name,
        sprite: pokemonData.sprites.front_default,
        stats: pokemonData.stats.map(s => ({ 
          name: s.stat.name, 
          base_stat: s.base_stat 
        })),
        // Initialize moves as an array of 4 nulls (representing empty slots)
        selectedMoves: [null, null, null, null], 
        // Keep the list of all available moves
        moves: pokemonData.moves.map(m => ({ name: m.move.name })),
      };

      await savePokemonToTeam(currentUser.uid, pokemonToSave);
      
      // 👇 THE FIX: Clear the displayed Pokémon data after a successful save
      setPokemonData(null); 
      setSaveMessage(`Successfully added ${pokemonData.name.toUpperCase()} to your team sheet! 🎉`);

    } catch (err) {
      setSaveMessage(`Failed to save: ${err.message}`);
    }
  };

  // ... (rest of the component's JSX remains the same)
  return (
    <div>
      <h2>Pokémon Search & Team Builder</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={pokemonName}
          onChange={(e) => setPokemonName(e.target.value)}
          placeholder="Enter Pokémon name or ID or (e.g., pikachu, 6)"
          required
          style={{ padding: '10px', marginRight: '10px' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search Pokémon'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {saveMessage && <p style={{ color: saveMessage.includes('Failed') ? 'red' : 'green', marginTop: '10px' }}>{saveMessage}</p>}

      {/* This section is only shown if pokemonData is NOT null */}
      {pokemonData && (
        <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px', backgroundColor: '#f9f9f9' }}>
          <h3>{pokemonData.name.toUpperCase()}</h3>
          <img src={pokemonData.sprites.front_default} alt={pokemonData.name} width="96" />
          
          <h4>Base Stats:</h4>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {pokemonData.stats.map((s, index) => (
              <li key={index}>
                **{s.stat.name.toUpperCase()}:** {s.base_stat}
              </li>
            ))}
          </ul>
          
          <button 
            onClick={handleSave} 
            disabled={!currentUser}
            style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add to Team Sheet
          </button>
        </div>
      )}
    </div>
  );
};

export default PokemonSearch;