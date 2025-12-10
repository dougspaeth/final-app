// src/components/PokemonSearch.jsx
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { savePokemonToTeam } from '../services/firestore'; 

const PokemonSearch = () => {
  const [query, setQuery] = useState('');
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const searchPokemon = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setPokemon(null);

    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`);
      if (!response.ok) {
        throw new Error('Pokémon not found');
      }
      const data = await response.json();
      
      // We format the data immediately so it's ready to display AND save
      setPokemon({
        id: crypto.randomUUID(), // Generate a unique ID for the database
        name: data.name,
        sprite: data.sprites.front_default,
        stats: data.stats,
        // 👇 CRITICAL FIX: We must capture the moves list here!
        moves: data.moves.map(m => ({ 
            name: m.move.name, 
            url: m.move.url 
        })),
        selectedMoves: [null, null, null, null] // Initialize empty slots
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTeam = async () => {
    if (!pokemon || !currentUser) return;

    try {
      // Pass the ENTIRE pokemon object, which now includes the 'moves' array
      await savePokemonToTeam(currentUser.uid, pokemon);
      alert(`${pokemon.name.toUpperCase()} added to your team!`);
      setPokemon(null); // Clear search after adding
      setQuery('');
    } catch (error) {
      console.error("Error adding to team:", error);
      alert("Failed to add Pokémon. Check console.");
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', color: 'white' }}>
      <h2>Pokémon Search & Team Builder</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Enter Pokémon Name (e.g. pikachu)" 
          style={{ padding: '10px', width: '200px', marginRight: '10px' }}
        />
        <button onClick={searchPokemon} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Search Pokémon
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {pokemon && (
        <div style={{ 
            backgroundColor: 'white', 
            color: 'black', 
            padding: '20px', 
            borderRadius: '8px', 
            maxWidth: '400px', 
            margin: '0 auto' 
        }}>
          <h3>{pokemon.name.toUpperCase()}</h3>
          <img src={pokemon.sprite} alt={pokemon.name} width="100" />
          
          <h4>Base Stats:</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {pokemon.stats.map((s) => (
              <li key={s.stat.name}>
                <strong>{s.stat.name.toUpperCase()}:</strong> {s.base_stat}
              </li>
            ))}
          </ul>

          <button 
            onClick={handleAddToTeam}
            style={{ 
                marginTop: '15px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                padding: '10px 20px', 
                fontSize: '16px', 
                cursor: 'pointer',
                borderRadius: '5px'
            }}
          >
            Add to Team Sheet
          </button>
        </div>
      )}
    </div>
  );
};

export default PokemonSearch;