// src/services/firestore.js

import { db } from '../components/firebase-config'; 
// 👇 FIXED IMPORTS: All Firestore functions in one single line
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';

// -----------------------------------------------------
// 1. SAVE/WRITE DATA FUNCTION
// -----------------------------------------------------
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
    throw new Error("Failed to save data to the database.");
  }
};

// -----------------------------------------------------
// 2. FETCH/LISTEN DATA FUNCTION
// -----------------------------------------------------
export const listenForTeam = (userId, callback) => {
  if (!userId) return () => {}; 
  
  const q = query(collection(db, 'users', userId, 'teamsheet'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const team = [];
    snapshot.forEach((doc) => {
      team.push({ id: doc.id, ...doc.data() }); 
    });
    callback(team); 
  }, (error) => {
    console.error("Error listening to team sheet:", error);
  });

  return unsubscribe;
};

// -----------------------------------------------------
// 3. UPDATE POKÉMON FIELDS (Generic Update)
// -----------------------------------------------------
/**
 * Updates specific fields (like selectedMoves) for a Pokémon.
 * Replaces the old 'updatePokemonMove' to be more flexible.
 */
export const updatePokemonFields = async (userId, pokemonId, updates) => {
  if (!userId || !pokemonId) {
    throw new Error("User ID and Pokémon ID are required for update.");
  }

  const docRef = doc(db, 'users', userId, 'teamsheet', pokemonId);

  try {
    // updates is an object like { 'selectedMoves.0': {name: 'tackle'} }
    await updateDoc(docRef, updates);
    console.log(`Successfully updated fields for Pokémon ID: ${pokemonId}`);
  } catch (e) {
    console.error("Error updating document:", e);
    throw new Error("Failed to update data in the database.");
  }
};

// -----------------------------------------------------
// 4. DELETE POKÉMON FUNCTION
// -----------------------------------------------------
export const deletePokemon = async (userId, pokemonId) => {
  if (!userId || !pokemonId) {
    throw new Error("User ID and Pokémon ID are required for deletion.");
  }
  
  const docRef = doc(db, 'users', userId, 'teamsheet', pokemonId);

  try {
    await deleteDoc(docRef);
    console.log(`Successfully deleted Pokémon ID: ${pokemonId}`);
  } catch (e) {
    console.error("Error deleting document:", e);
    throw new Error("Failed to delete Pokémon from the database.");
  }
};