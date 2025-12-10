// src/components/Dashboard.jsx
// This is the actual React component the router needs

import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase-config'; // Service import
import { useAuth } from './AuthContext'; 
import { listenForTeam } from '../services/firestore'; // Import the function you just moved
import PokemonSearch from './PokemonSearch'; // Your API component

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [savedTeam, setSavedTeam] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);

  // Effect to listen for real-time team changes from Firestore
  useEffect(() => {
    if (currentUser?.uid) {
      setTeamLoading(true);
      // Calls the function you moved into src/services/firestore.js
      const unsubscribe = listenForTeam(currentUser.uid, (newTeam) => {
        setSavedTeam(newTeam);
        setTeamLoading(false);
      });

      return () => unsubscribe(); // Cleanup
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // AuthContext handles redirection automatically
    } catch (error) {
      console.error("Logout Error:", error.message);
      alert("Failed to log out. Please try again."); // Graceful error handling
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Welcome,  {currentUser?.email}!</h1>
        <button onClick={handleLogout}>
          Log Out
        </button>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px', marginTop: '30px' }}>
        
        {/* === TEAM SHEET (Database Requirement) === */}
        <div>
          <h2>My Current Team</h2>
          {teamLoading ? (
            <p>Loading your team...</p> // Helpful feedback
          ) : savedTeam.length === 0 ? (
            <p>Your team sheet is empty! Use the search to add some Pokémon.</p>
          ) : (
            <div>
              {savedTeam.map((p) => (
                <div key={p.id} style={{ padding: '10px', border: '1px solid #ccc' }}>
                  <img src={p.sprite} alt={p.name} width="50"/>
                  <strong>{p.name.toUpperCase()}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === SEARCH AREA (API Requirement) === */}
        <div>
          {selectedTeamPokemon ? (
            <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px', backgroundColor: '#36454F' }}>
              <button 
                onClick={() => setSelectedTeamPokemon(null)} 
                style={{ float: 'right', cursor: 'pointer', border: 'none', background: 'transparent', fontWeight: 'bold' }}
              >
                X
              </button>
              <h3>{selectedTeamPokemon.name.toUpperCase()}</h3>
              <img src={selectedTeamPokemon.sprite} alt={selectedTeamPokemon.name} />
              
              {/* MOVE SLOTS DISPLAY */}
              <h4 style={{ marginTop: '20px' }}>Current Moveset:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  {/* Defensive Check: Use || to provide fallback array */}
                  {(selectedTeamPokemon.selectedMoves || [null, null, null, null]).map((move, index) => (
                      <div 
                          key={index} 
                          style={{ 
                              padding: '10px', 
                              border: activeMoveSlotIndex === index ? '2px solid #ffc107' : '1px solid #ccc',
                              borderRadius: '4px', 
                              backgroundColor: move ? '#36454F' : '#818589', 
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
                                  style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '1.2em', marginLeft: '10px' }}
                              >
                                  &times;
                              </button>
                          )}
                      </div>
                  ))}
              </div>

              {/* MOVE SELECTION DROPDOWN */}
              <details style={{ marginTop: '20px', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                      Select a Move (Assign to Slot {activeMoveSlotIndex + 1})
                  </summary>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '10px' }}>
                      {selectedTeamPokemon.moves.map((m) => {
                          // Defensive Check: Ensure array exists and use optional chaining on 'sm'
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