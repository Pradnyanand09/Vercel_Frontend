import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { PlayIcon, HeartIcon, MusicalNoteIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { PlayIcon as PlaySolid, HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

const SongList = ({ songs, setCurrentSongIndex }) => {
  const [hoveredSong, setHoveredSong] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Log songs data to check if notes exist
    if (songs && songs.length > 0) {
      console.log("Songs with notes:", songs.map(song => ({ title: song.title, hasNote: !!song.note })));
    }
  }, [songs]);

  // Check if we're coming from the detail page with preserved audio state
  useEffect(() => {
    // Check location state for preserved audio
    if (location.state?.preserveAudio && location.state?.songIndex !== undefined) {
      console.log("Preserving audio state from detail page, song index:", location.state.songIndex);
      
      if (location.state.wasPlaying) {
        // No need to set current song index since it's already set in the parent
        console.log("Audio was playing, continuing playback");
      }
    } else {
      // Check session storage as a fallback
      const continuePlaying = sessionStorage.getItem('continuePlaying');
      const storedIndex = sessionStorage.getItem('currentSongIndex');
      
      if (continuePlaying === 'true' && storedIndex !== null) {
        console.log("Restoring playback from session storage, index:", storedIndex);
        const index = parseInt(storedIndex, 10);
        if (!isNaN(index) && index >= 0 && index < songs.length) {
          setCurrentSongIndex(index);
        }
        
        // Clear session storage
        sessionStorage.removeItem('continuePlaying');
        sessionStorage.removeItem('currentSongIndex');
      } else if (songs && songs.length > 0) {
        // Auto start the first song only if we're not preserving state
        const timer = setTimeout(() => {
          setCurrentSongIndex(0);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [songs, location.state, setCurrentSongIndex]);

  const handleLike = (songId) => {
    // This should be handled at the App level
    console.log("Like functionality should be handled at App level");
  };

  const handlePlay = (songId) => {
    const songIndex = songs.findIndex(song => song._id === songId);
    if (songIndex !== -1) {
      console.log("Playing song at index:", songIndex);
      setCurrentSongIndex(songIndex);
    }
  };

  const viewSongDetails = (songId) => {
    console.log("Viewing details for song ID:", songId);
    // Ensure songId is valid before navigation
    if (songId) {
      navigate(`/song/${songId}`);
    } else {
      console.error("Invalid song ID for navigation:", songId);
    }
  };

  return (
    <div className="bg-[#121212] min-h-screen text-white p-6">
      <style>{`
        @keyframes cardEntrance {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .animate-card {
          animation: cardEntrance 0.5s ease forwards;
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(29, 185, 84, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(29, 185, 84, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(29, 185, 84, 0); }
        }
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0); }
        }
      `}</style>

      <header className="sticky top-0 bg-gradient-to-b from-[#121212]/95 to-[#121212]/50 backdrop-blur-sm py-6 z-10">
        <h2 className="text-3xl font-bold tracking-tight">Songs Dedicated to You 💗
        </h2>
        {/* <p className="text-gray-300 mt-2">Click any song to play • Click "View Details" to see song notes</p> */}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 py-8">
        {songs.map((song, index) => (
          <div
            key={song._id}
            className="relative bg-[#181818] rounded-xl p-4 transition-all duration-300 hover:bg-[#282828] hover:shadow-2xl hover:-translate-y-2 animate-card"
            style={{
              animationDelay: `${index * 50}ms`,
              opacity: 1,
            }}
            onMouseEnter={() => setHoveredSong(song._id)}
            onMouseLeave={() => setHoveredSong(null)}
          >
            <div>
              <div 
                className="relative overflow-hidden rounded-lg aspect-square cursor-pointer"
                onClick={() => handlePlay(song._id)}
              >
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-80" />
                
                {/* Play button */}
                <div className="absolute bottom-3 right-3">
                  <button 
                    className="p-3 bg-green-500 rounded-full hover:scale-110 transition-transform shadow-lg"
                    onClick={() => viewSongDetails(song._id)}
                  >
                    <PlaySolid className="w-6 h-6 text-white pl-0.5" />
                  </button>
                </div>
                
                {/* Note indicator */}
                {song.note && (
                  <div 
                    className="absolute bottom-3 left-3 bg-black/70 p-2 rounded-full flex items-center gap-1"
                    style={{ animation: hoveredSong === song._id ? 'float 2s infinite ease-in-out' : 'none' }}
                  >
                    <MusicalNoteIcon className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-sm">Notes</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 space-y-1">
                <h3 className="text-lg font-bold truncate">{song.title}</h3>
                <p className="text-sm text-gray-300/80 font-medium">{song.artist}</p>
              </div>
              
              {/* View Details Button */}
              <Link
                to={`/song/${song._id}`}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-transparent hover:bg-white/10 text-white py-2 px-3 rounded-md transition-colors border border-white/20"
                onClick={(e) => {
                  e.preventDefault();
                  viewSongDetails(song._id);
                }}
              >
                <InformationCircleIcon className="w-5 h-5" />
                <span>View Details{song.note ? " & Notes" : ""}</span>
              </Link>
            </div>
            
            <button 
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50"
              onClick={(e) => {
                e.stopPropagation();
                handleLike(song._id);
              }}
            >
              {song.isLiked ? (
                <HeartSolid className="w-5 h-5 text-green-500 animate-bounce-once" />
              ) : (
                <HeartIcon className="w-5 h-5 text-white/90" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SongList;
