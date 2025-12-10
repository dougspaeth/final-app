// src/components/Dashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase-config';
import { useAuth } from './AuthContext';
import { listenForTeam, updatePokemonFields, deletePokemon } from '../services/firestore';
import PokemonSearch from './PokemonSearch';

const Dashboard = () => {
  const { currentUser } = useAuth();
  
  // State variables
  const [savedTeam, setSavedTeam] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [selectedTeamPokemon, setSelectedTeamPokemon] = useState(null); 
  const [activeMoveSlotIndex, setActiveMoveSlotIndex] = useState(0); 

  // REF: Tracks the ID of the selected Pokémon to prevent infinite re-render loops
  const selectedPokemonIdRef = useRef(null);

  // Sync the ref whenever the user manually selects a Pokémon
  useEffect(() => {
    selectedPokemonIdRef.current = selectedTeamPokemon?.id;
  }, [selectedTeamPokemon]);

  // --- 1. REAL-TIME LISTENER ---
  useEffect(() => {
    if (currentUser?.uid) {
      setTeamLoading(true);
      
      const unsubscribe = listenForTeam(currentUser.uid, (newTeam) => {
        setSavedTeam(newTeam);
        setTeamLoading(false);
        
        // SYNC LOGIC: Check the REF to find the currently selected ID in the new data
        const currentSelectedId = selectedPokemonIdRef.current;
        if (currentSelectedId) {
            const updatedPokemon = newTeam.find(p => p.id === currentSelectedId);
            
            if (updatedPokemon) {
                // OPTIMIZATION: Only update state if the data ACTUALLY changed
                setSelectedTeamPokemon(prev => {
                    if (JSON.stringify(prev) === JSON.stringify(updatedPokemon)) return prev;
                    return updatedPokemon;
                });
            } else {
                // If Pokémon was deleted remotely, close the details panel
                setSelectedTeamPokemon(null);
            }
        }
      });
      return () => unsubscribe(); 
    }
  }, [currentUser]); 

  // --- 2. HANDLERS ---

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error.message);
      alert("Failed to log out. Please try again.");
    }
  };
  
  const handleTeamPokemonClick = (pokemon) => {
    setSelectedTeamPokemon(pokemon);
    // Ensure movesArray exists, even for old data
    const movesArray = pokemon.selectedMoves || [null, null, null, null];
    // Find the first empty slot to be helpful
    const firstEmptySlot = movesArray.findIndex(m => m === null);
    setActiveMoveSlotIndex(firstEmptySlot !== -1 ? firstEmptySlot : 0);
  };

  const handleSlotSelect = (index) => {
    setActiveMoveSlotIndex(index);
  };

  const handleMoveAssignment = async (move) => {
    if (!currentUser || !selectedTeamPokemon) return;

    // Create a copy of the moves array
    const currentMoves = [...(selectedTeamPokemon.selectedMoves || [null, null, null, null])];

    // Check for duplicates
    const isAlreadySelected = currentMoves.some(m => m && m.name === move.name);
    if (isAlreadySelected) {
        alert(`${move.name.toUpperCase()} is already selected!`);
        return;
    }

    // Assign move to the active slot
    currentMoves[activeMoveSlotIndex] = move;

    try {
        await updatePokemonFields(
            currentUser.uid, 
            selectedTeamPokemon.id, 
            { selectedMoves: currentMoves }
        );
        // Automatically advance to the next slot
        setActiveMoveSlotIndex((activeMoveSlotIndex + 1) % 4); 
    } catch (error) {
        console.error("Error assigning move:", error);
        alert("Failed to assign move. Check console.");
    }
  };

  const handleMoveRemoval = async (index) => {
    if (!currentUser || !selectedTeamPokemon) return;
    
    const currentMoves = [...(selectedTeamPokemon.selectedMoves || [null, null, null, null])];
    currentMoves[index] = null;
    
    try {
        await updatePokemonFields(
            currentUser.uid, 
            selectedTeamPokemon.id, 
            { selectedMoves: currentMoves }
        );
        setActiveMoveSlotIndex(index); 
    } catch (error) {
        console.error("Error removing move:", error);
        alert("Failed to remove move. Check console.");
    }
  };

  const handleDeletePokemon = async () => {
    if (!currentUser || !selectedTeamPokemon) return;
    const confirmDelete = window.confirm(`Remove ${selectedTeamPokemon.name.toUpperCase()}?`);
    if (confirmDelete) {
        try {
            await deletePokemon(currentUser.uid, selectedTeamPokemon.id); 
            setSelectedTeamPokemon(null); 
        } catch (error) {
            console.error("Error deleting Pokémon:", error);
            alert("Failed to remove Pokémon."); 
        }
    }
  };


  // --- 3. RENDERING ---
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Welcome, Trainer {currentUser?.email}!</h1>
        <button onClick={handleLogout}>Log Out</button>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', marginTop: '30px' }}>
        
        {/* LEFT COLUMN: TEAM LIST */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>My Current Team ({savedTeam.length} / 6)</h2>
          </div>
          {teamLoading ? (
            <p>Loading...</p>
          ) : savedTeam.length === 0 ? (
            <p>Your team is empty. Search to add Pokémon.</p>
          ) : (
            <div>
              {savedTeam.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => handleTeamPokemonClick(p)} 
                  style={{ 
                      padding: '10px', 
                      border: selectedTeamPokemon?.id === p.id ? '2px solid #28a745' : '1px solid #ccc', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      // Highlight active pokemon with Blue, others white
                      backgroundColor: selectedTeamPokemon?.id === p.id ? '#7393B3' : '#fff', 
                      color: selectedTeamPokemon?.id === p.id ? 'white' : 'black',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                  }}
                >
                  <img src={p.sprite} alt={p.name} width="50"/>
                  <strong>{p.name.toUpperCase()}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILS OR SEARCH */}
        <div>
          {selectedTeamPokemon ? (
            <div style={{ 
                border: '1px solid #ccc', 
                padding: '15px', 
                marginTop: '20px', 
                // Dark Theme Background & Text
                backgroundColor: '#36454F', 
                color: 'white' 
            }}>
              
              <button 
                onClick={() => setSelectedTeamPokemon(null)} 
                style={{ float: 'right', cursor: 'pointer', border: 'none', background: 'transparent', fontWeight: 'bold', color: 'white' }}
              >
                X
              </button>

              <h3>{selectedTeamPokemon.name.toUpperCase()}</h3>
              <img src={selectedTeamPokemon.sprite} alt={selectedTeamPokemon.name} />

              <h4>Base Stats:</h4>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {/* SAFE CHECK: (stats || []) to prevent crashing if data is missing */}
                {(selectedTeamPokemon.stats || []).map((s, index) => (
                  <li key={index}>
                    <strong>{s.stat.name.toUpperCase()}:</strong> {s.base_stat}
                  </li>
                ))}
              </ul>
              
              <h4 style={{ marginTop: '20px' }}>Current Moveset:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  {/* SAFE CHECK: (selectedMoves || [null...]) */}
                  {(selectedTeamPokemon.selectedMoves || [null, null, null, null]).map((move, index) => (
                      <div 
                          key={index} 
                          style={{ 
                              padding: '10px', 
                              border: activeMoveSlotIndex === index ? '2px solid #ffc107' : '1px solid #ccc',
                              borderRadius: '4px', 
                              // Slot colors for dark mode
                              backgroundColor: move ? '#7393B3' : '#818589', 
                              color: 'white', 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              cursor: 'pointer'
                          }}
                          onClick={() => handleSlotSelect(index)}
                      >
                          <strong style={{ fontWeight: activeMoveSlotIndex === index ? 'bold' : 'normal' }}>
                              SLOT {index + 1}: {move?.name.toUpperCase() || 'EMPTY'}
                          </strong>
                          {move && (
                              <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveRemoval(index);
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#ffcccb', cursor: 'pointer', fontSize: '1.2em', marginLeft: '10px' }}
                              >
                                  &times;
                              </button>
                          )}
                      </div>
                  ))}
              </div>

              <details style={{ marginTop: '20px', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                      Select a Move (Assign to Slot {activeMoveSlotIndex + 1})
                  </summary>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '10px' }}>
                      {/* SAFE CHECK: (moves || []) */}
                      {(selectedTeamPokemon.moves || []).map((m) => {
                          const isAlreadySelected = (selectedTeamPokemon.selectedMoves || [])
                                                      .some(sm => sm?.name === m.name);

                          return (
                              <button 
                                  key={m.name} 
                                  onClick={() => handleMoveAssignment(m)} 
                                  disabled={isAlreadySelected}
                                  style={{
                                      display: 'block',
                                      width: '100%',
                                      textAlign: 'left',
                                      padding: '5px',
                                      margin: '2px 0',
                                      border: '1px solid transparent',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      backgroundColor: isAlreadySelected ? '#007bff' : 'white',
                                      color: isAlreadySelected ? 'white' : 'black',
                                      fontWeight: isAlreadySelected ? 'bold' : 'normal'
                                  }}
                              >
                                  {m.name.toUpperCase()} {isAlreadySelected ? '(TAKEN)' : ''}
                              </button>
                          );
                      })}
                  </div>
              </details>
              
              <button 
                onClick={handleDeletePokemon} 
                style={{ marginTop: '20px', backgroundColor: '#f44336', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Remove Pokémon 🗑️
              </button>

              <button 
                onClick={() => setSelectedTeamPokemon(null)} 
                style={{ marginTop: '20px', marginLeft: '10px', padding: '10px 20px', cursor: 'pointer', color: 'black' }}
              >
                Close Details
              </button>

            </div>
          ) : (
            <PokemonSearch />
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;