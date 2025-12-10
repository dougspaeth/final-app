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
          <PokemonSearch />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;