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

  // Helper function to extract move name from different structures
  const getMoveName = (move) => {
    if (!move) return null;
    return move.name || (move.move && move.move.name) || 'Unknown';
  };

  // Helper function to normalize move object for saving
  const normalizeMoveForSave = (move) => {
    if (!move) return null;
    // If move has a nested structure, flatten it for saving
    if (move.move && move.move.name) {
      return {
        name: move.move.name,
        originalData: move // Keep original data if needed
      };
    }
    return move; // Already flattened
  };

  const handleMoveAssignment = async (move) => {
    if (!currentUser || !selectedTeamPokemon) return;

    // Create a copy of the moves array
    const currentMoves = [...(selectedTeamPokemon.selectedMoves || [null, null, null, null])];

    // Extract move name using helper
    const moveName = getMoveName(move);
    if (!moveName) {
      alert('Invalid move data');
      return;
    }

    // Check for duplicates by name
    const isAlreadySelected = currentMoves.some(m => {
      if (!m) return false;
      const existingMoveName = getMoveName(m);
      return existingMoveName === moveName;
    });
    
    if (isAlreadySelected) {
        alert(`${moveName.toUpperCase()} is already selected!`);
        return;
    }

    // Normalize move for consistent storage
    const normalizedMove = normalizeMoveForSave(move);
    
    // Assign move to the active slot
    currentMoves[activeMoveSlotIndex] = normalizedMove;

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

  // Function to render moves list (handles different data structures)
  const renderMovesList = () => {
    if (!selectedTeamPokemon?.moves || selectedTeamPokemon.moves.length === 0) {
      return (
        <p style={{ color: 'white', textAlign: 'center', padding: '10px' }}>
          No moves available for this Pokémon.
          <br />
          <small>This might be because moves weren't saved when adding the Pokémon.</small>
        </p>
      );
    }

    // Debug log to see what moves data looks like
    console.log("Moves data:", selectedTeamPokemon.moves);

    return selectedTeamPokemon.moves
      .filter(moveItem => {
        // Filter out null/undefined items
        if (!moveItem) return false;
        
        // Check if this item has any move data
        const hasMoveData = moveItem.name || 
                          (moveItem.move && moveItem.move.name) ||
                          (typeof moveItem === 'string');
        return hasMoveData;
      })
      .map((moveItem, index) => {
        // Extract move name based on structure
        let moveName = '';
        let moveObject = moveItem;
        
        if (typeof moveItem === 'string') {
          moveName = moveItem;
          moveObject = { name: moveItem };
        } else if (moveItem.move && moveItem.move.name) {
          // PokeAPI nested structure: { move: { name: "tackle", url: "..." } }
          moveName = moveItem.move.name;
          moveObject = moveItem;
        } else if (moveItem.name) {
          // Flat structure: { name: "tackle" }
          moveName = moveItem.name;
          moveObject = moveItem;
        } else {
          return null; // Skip if no recognizable structure
        }

        // Check if move is already selected
        const isAlreadySelected = (selectedTeamPokemon.selectedMoves || [])
          .some(selectedMove => {
            if (!selectedMove) return false;
            const selectedMoveName = getMoveName(selectedMove);
            return selectedMoveName === moveName;
          });

        return (
          <button 
            key={`${moveName}-${index}`}
            onClick={() => handleMoveAssignment(moveObject)}
            disabled={isAlreadySelected}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px',
              margin: '4px 0',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: isAlreadySelected ? 'not-allowed' : 'pointer',
              backgroundColor: isAlreadySelected ? '#4a5568' : 'white',
              color: isAlreadySelected ? '#a0aec0' : 'black',
              fontWeight: 'normal',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isAlreadySelected) {
                e.target.style.backgroundColor = '#e2e8f0';
              }
            }}
            onMouseLeave={(e) => {
              if (!isAlreadySelected) {
                e.target.style.backgroundColor = 'white';
              }
            }}
          >
            <strong>{moveName.toUpperCase()}</strong>
            {isAlreadySelected && <span style={{ float: 'right', color: '#ff6b6b' }}>✓ TAKEN</span>}
          </button>
        );
      });
  };

  // --- 3. RENDERING ---
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f0f4f8', minHeight: '100vh' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#2d3748',
        color: 'white',
        borderRadius: '10px',
        marginBottom: '30px'
      }}>
        <h1 style={{ margin: 0 }}>Welcome, Trainer {currentUser?.email}!</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e53e3e',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Log Out
        </button>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', marginTop: '30px' }}>
        
        {/* LEFT COLUMN: TEAM LIST */}
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ color: '#2d3748' }}>My Current Team ({savedTeam.length} / 6)</h2>
          </div>
          {teamLoading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <p>Loading your team...</p>
            </div>
          ) : savedTeam.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontSize: '18px', color: '#4a5568' }}>Your team is empty. Search to add Pokémon.</p>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              {savedTeam.filter(Boolean).map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => handleTeamPokemonClick(p)} 
                  style={{ 
                      padding: '15px', 
                      border: selectedTeamPokemon?.id === p.id ? '3px solid #48bb78' : '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedTeamPokemon?.id === p.id ? '#4299e1' : '#f7fafc', 
                      color: selectedTeamPokemon?.id === p.id ? 'white' : '#2d3748',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      transition: 'all 0.3s',
                      transform: selectedTeamPokemon?.id === p.id ? 'translateX(5px)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTeamPokemon?.id !== p.id) {
                      e.currentTarget.style.backgroundColor = '#edf2f7';
                      e.currentTarget.style.transform = 'translateX(5px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTeamPokemon?.id !== p.id) {
                      e.currentTarget.style.backgroundColor = '#f7fafc';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <img 
                    src={p?.sprite} 
                    alt={p?.name} 
                    style={{ 
                      width: '60px', 
                      height: '60px',
                      backgroundColor: selectedTeamPokemon?.id === p.id ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                      borderRadius: '8px',
                      padding: '5px'
                    }}
                  />
                  <div>
                    <strong style={{ fontSize: '18px' }}>{p?.name?.toUpperCase()}</strong>
                    <div style={{ fontSize: '14px', color: selectedTeamPokemon?.id === p.id ? '#cbd5e0' : '#718096' }}>
                      Click to view details
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILS OR SEARCH */}
        <div>
          {selectedTeamPokemon ? (
            <div style={{ 
                border: '2px solid #4299e1', 
                padding: '25px', 
                borderRadius: '12px',
                backgroundColor: '#2d3748', 
                color: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              
              <button 
                onClick={() => setSelectedTeamPokemon(null)} 
                style={{ 
                  float: 'right', 
                  cursor: 'pointer', 
                  border: 'none', 
                  background: '#4a5568',
                  fontWeight: 'bold', 
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  fontSize: '20px'
                }}
              >
                ×
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
                <img 
                  src={selectedTeamPokemon.sprite} 
                  alt={selectedTeamPokemon.name} 
                  style={{ 
                    width: '120px', 
                    height: '120px',
                    backgroundColor: '#4a5568',
                    borderRadius: '12px',
                    padding: '10px'
                  }}
                />
                <div>
                  <h3 style={{ fontSize: '28px', margin: '0 0 10px 0', color: '#63b3ed' }}>
                    {selectedTeamPokemon.name?.toUpperCase() || 'UNKNOWN POKÉMON'}
                  </h3>
                  <div style={{ color: '#a0aec0' }}>
                    ID: {selectedTeamPokemon.id}
                  </div>
                </div>
              </div>

              {/* BASE STATS SECTION */}
              <h4 style={{ color: '#68d391', marginBottom: '15px' }}>Base Stats:</h4>
              <ul style={{ 
                listStyleType: 'none', 
                padding: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                marginBottom: '25px'
              }}>
                {(selectedTeamPokemon.stats || [])
                  .filter(stat => stat && stat.stat)
                  .map((s, index) => {
                    const statName = s.stat?.name || 'unknown';
                    const baseStat = s.base_stat || 0;
                    return (
                      <li 
                        key={index}
                        style={{
                          backgroundColor: '#4a5568',
                          padding: '12px',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}
                      >
                        <strong style={{ color: '#cbd5e0' }}>{statName.toUpperCase()}:</strong>
                        <span style={{ 
                          color: baseStat >= 100 ? '#68d391' : baseStat >= 50 ? '#f6e05e' : '#fc8181',
                          fontWeight: 'bold'
                        }}>
                          {baseStat}
                        </span>
                      </li>
                    );
                  })}
              </ul>
              
              {/* MOVESET SECTION */}
              <h4 style={{ color: '#68d391', marginBottom: '15px' }}>Current Moveset:</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '12px', 
                marginBottom: '25px' 
              }}>
                  {(selectedTeamPokemon.selectedMoves || [null, null, null, null]).map((move, index) => {
                    const moveName = getMoveName(move);
                    const isActiveSlot = activeMoveSlotIndex === index;
                    
                    return (
                      <div 
                          key={index} 
                          style={{ 
                              padding: '15px', 
                              border: isActiveSlot ? '2px solid #f6e05e' : '1px solid #4a5568',
                              borderRadius: '8px', 
                              backgroundColor: move ? '#4299e1' : '#4a5568', 
                              color: 'white', 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              transform: isActiveSlot ? 'scale(1.02)' : 'none'
                          }}
                          onClick={() => handleSlotSelect(index)}
                      >
                          <div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: move ? '#cbd5e0' : '#a0aec0',
                              marginBottom: '5px'
                            }}>
                              SLOT {index + 1}
                            </div>
                            <strong style={{ 
                              fontWeight: isActiveSlot ? 'bold' : 'normal',
                              fontSize: '16px'
                            }}>
                              {moveName ? moveName.toUpperCase() : 'EMPTY'}
                            </strong>
                          </div>
                          {move && (
                              <button 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveRemoval(index);
                                  }}
                                  style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: '#fc8181', 
                                    cursor: 'pointer', 
                                    fontSize: '24px',
                                    padding: '0',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Remove this move"
                              >
                                  &times;
                              </button>
                          )}
                      </div>
                    );
                  })}
              </div>

              {/* MOVE SELECTION DROPDOWN */}
              <details 
                style={{ 
                  marginTop: '20px', 
                  border: '1px solid #4a5568', 
                  padding: '0',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
                open // Keep it open by default for debugging
              >
                  <summary style={{ 
                    cursor: 'pointer', 
                    fontWeight: 'bold',
                    padding: '15px',
                    backgroundColor: '#4a5568',
                    color: 'white',
                    listStyle: 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Select a Move (Assign to Slot {activeMoveSlotIndex + 1})</span>
                      <span style={{ fontSize: '12px', color: '#a0aec0' }}>▼</span>
                    </div>
                  </summary>
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto', 
                    padding: '15px',
                    backgroundColor: '#2d3748'
                  }}>
                      {renderMovesList()}
                  </div>
              </details>
              
              {/* ACTION BUTTONS */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginTop: '30px',
                gap: '15px'
              }}>
                <button 
                  onClick={handleDeletePokemon} 
                  style={{ 
                    flex: 1,
                    backgroundColor: '#fc8181', 
                    color: 'white', 
                    border: 'none', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  🗑️ Remove Pokémon
                </button>

                <button 
                  onClick={() => setSelectedTeamPokemon(null)} 
                  style={{ 
                    flex: 1,
                    backgroundColor: '#4a5568', 
                    color: 'white', 
                    border: 'none',
                    padding: '15px', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  Close Details
                </button>
              </div>

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