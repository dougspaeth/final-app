// src/services/firestore.js

import { db } from '../components/firebase-config'; 
import { collection, addDoc, query, onSnapshot } from 'firebase/firestore'; // <-- Ensure these are imported

// -----------------------------------------------------
// 1. SAVE/WRITE DATA FUNCTION (Already Correct)
// -----------------------------------------------------
/**
 * Saves a Pokémon object to the user's team sheet in Firestore.
 */
export const savePokemonToTeam = async (userId, pokemonData) => {
  if (!userId) {
    throw new Error("User must be logged in to save a team.");
  }
  
  const teamsheetCollectionRef = collection(db, 'users', userId, 'teamsheet');
  
  try {
    const docRef = await addDoc(teamsheetCollectionRef, pokemonData);
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw new Error("Failed to save data to the database."); // Graceful error handling
  }
};


// -----------------------------------------------------
// 2. FETCH/LISTEN DATA FUNCTION (MISSING PIECE)
// -----------------------------------------------------
/**
 * Sets up a real-time listener for the user's saved Pokémon team sheet.
 * @param {string} userId - The UID of the authenticated user.
 * @param {function} callback - Function to run with the new team data.
 * @returns {function} The unsubscribe function to stop listening.
 */
export const listenForTeam = (userId, callback) => {
  if (!userId) return () => {}; 
  
  const q = query(collection(db, 'users', userId, 'teamsheet'));

  // onSnapshot sets up the real-time listener
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const team = [];
    snapshot.forEach((doc) => {
      // Add the document ID to the data so we can reference it later
      team.push({ id: doc.id, ...doc.data() }); 
    });
    callback(team); 
  }, (error) => {
    console.error("Error listening to team sheet:", error);
  });

  return unsubscribe; // Return the function to stop the listener
};