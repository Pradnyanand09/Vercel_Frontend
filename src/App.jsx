import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import SongList from './components/SongList';
import SongDetail from './components/SongDetail';
import UploadSongForm from './components/UploadSongForm';
import AudioPlayer from './components/AudioPlayer';
import BirthdayLanding from './components/BirthdayLanding';
import BestieBirthdayLanding from './components/BestieBirthdayLanding';

// Create a wrapper component to use the useLocation hook
const AppContent = ({ songs, currentSongIndex, setCurrentSongIndex }) => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isSongsPage = location.pathname === '/songs';

  // When landing on songs page directly, ensure audio player is visible
  useEffect(() => {
    if (isSongsPage && songs.length > 0) {
      // Set a small delay to ensure everything is ready
      const timer = setTimeout(() => {
        setCurrentSongIndex(0); // Auto start the first song
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isSongsPage, songs, setCurrentSongIndex]);

  return (
    <>
      <div className="pb-24"> {/* Add padding to bottom to make room for player */}
        <Routes>
          <Route 
            path="/" 
            element={<BestieBirthdayLanding />} 
          />
          <Route 
            path="/birthday" 
            element={<BirthdayLanding />} 
          />
          <Route 
            path="/songs" 
            element={
              <SongList 
                songs={songs} 
                setCurrentSongIndex={setCurrentSongIndex} 
              />
            } 
          />
          <Route 
            path="/upload" 
            element={<UploadSongForm />} 
          />
          <Route 
            path="/song/:id" 
            element={
              <SongDetail 
                songs={songs}
                setCurrentSongIndex={setCurrentSongIndex} 
              />
            } 
          />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      
      {/* AudioPlayer will be visible on all routes except the landing page */}
      {songs.length > 0 && !isLandingPage && (
        <AudioPlayer 
          songs={songs} 
          currentSongIndex={currentSongIndex} 
          setCurrentSongIndex={setCurrentSongIndex} 
        />
      )}
    </>
  );
};

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/songs");
        console.log("API response:", res.data);
        
        // Check if notes exist in the data
        const notesPresent = res.data.some(song => song.note);
        console.log("Notes present in data:", notesPresent);
        
        // Add isLiked property to songs
        const songsWithLiked = res.data.map(song => ({ 
          ...song, 
          isLiked: false,
          // Ensure note is always a string (fix in case it's null)
          note: song.note || ""
        }));
        
        setSongs(songsWithLiked);
      } catch (error) {
        console.error("Error fetching songs:", error);
      }
    };
    fetchSongs();
  }, []);

  return (
    <Router>
      <AppContent 
        songs={songs} 
        currentSongIndex={currentSongIndex} 
        setCurrentSongIndex={setCurrentSongIndex} 
      />
    </Router>
  );
}

export default App;