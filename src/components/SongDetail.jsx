import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { HeartIcon, XMarkIcon, MusicalNoteIcon, ArrowLeftIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { PlayIcon as PlaySolid, PauseIcon as PauseSolid, HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

// Custom hook to get window size
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount
  
  return windowSize;
};

const SongDetail = ({ songs, setCurrentSongIndex }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedSong, setSelectedSong] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const noteContentRef = React.useRef(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  // Get window size for responsive design
  const { width } = useWindowSize();

  useEffect(() => {
    if (songs && songs.length > 0) {
      setIsLoading(false);
      // Find the song by ID from the URL parameters
      if (id) {
        const foundSong = songs.find(song => song._id === id);
        const foundIndex = songs.findIndex(song => song._id === id);
        
        if (foundSong) {
          console.log("Found song:", foundSong);
          console.log("Note data:", foundSong.note);
          setSelectedSong(foundSong);
          setCurrentIndex(foundIndex);
        } else {
          console.log("Song not found with ID:", id);
          console.log("Available songs:", songs);
        }
      }
    }
  }, [songs, id]);

  // Listen for global playback changes from AudioPlayer
  useEffect(() => {
    const handlePlaybackChange = (event) => {
      const { isPlaying: audioIsPlaying, currentIndex: audioIndex, timestamp } = event.detail;
      
      // Check if the current song is the one playing
      if (currentIndex === audioIndex) {
        setIsPlaying(audioIsPlaying);
      } else if (isPlaying && currentIndex !== audioIndex) {
        setIsPlaying(false);
      }
    };
    
    // Listen for song changed events
    const handleSongChanged = (event) => {
      const { index, autoPlay, timestamp } = event.detail;
      console.log("Song changed event received for index:", index);
      
      // Update current index to match the player
      setCurrentIndex(index);
      
      // If we're on a detail page, redirect to the new song's detail page
      const songId = songs && songs[index] ? songs[index]._id : null;
      if (songId && id && id !== songId) {
        // Use window.location to navigate to maintain proper state
        window.location.href = `/song/${songId}`;
      }
    };
    
    window.addEventListener('audio-playback-change', handlePlaybackChange);
    window.addEventListener('song-changed', handleSongChanged);
    
    return () => {
      window.removeEventListener('audio-playback-change', handlePlaybackChange);
      window.removeEventListener('song-changed', handleSongChanged);
    };
  }, [currentIndex, isPlaying, songs, id]);

  // Force the audio player to play this song when play is clicked
  const handlePlay = useCallback((songId) => {
    const songIndex = songs.findIndex(song => song._id === songId);
    if (songIndex !== -1) {
      console.log("Playing song at index:", songIndex);
      
      // This ensures the audio player knows which song to play
      setCurrentSongIndex(songIndex);
      setCurrentIndex(songIndex);
      
      // Update local playing state
      setIsPlaying(true);
      
      // Force the AudioPlayer to play by dispatching a custom event
      const playEvent = new CustomEvent('force-play-song', { 
        detail: { 
          index: songIndex,
          timestamp: Date.now() // Add timestamp for better sync
        }
      });
      window.dispatchEvent(playEvent);
    }
  }, [songs, setCurrentSongIndex]);

  // Toggle play/pause
  const handleTogglePlay = useCallback(() => {
    if (selectedSong) {
      if (isPlaying) {
        console.log("Pausing song");
        setIsPlaying(false);
        
        // Dispatch event to pause in the AudioPlayer
        const pauseEvent = new CustomEvent('force-pause-song', {
          detail: { timestamp: Date.now() } // Add timestamp for better sync
        });
        window.dispatchEvent(pauseEvent);
      } else {
        console.log("Playing song");
        handlePlay(selectedSong._id);
      }
    }
  }, [selectedSong, isPlaying, handlePlay]);
  
  // Handle like button click
  const handleLike = useCallback((songId) => {
    console.log("Like button clicked for song:", songId);
    // Find the song and toggle its liked status
    const songIndex = songs.findIndex(song => song._id === songId);
    if (songIndex !== -1) {
      // Create a copy of the song with toggled isLiked property
      const updatedSong = {
        ...songs[songIndex],
        isLiked: !songs[songIndex].isLiked
      };
      
      // Update the local state for immediate UI feedback
      if (selectedSong && selectedSong._id === songId) {
        setSelectedSong(updatedSong);
      }
      
      // In a real app, you would call an API to update the like status in the backend
      console.log("Song liked status updated:", updatedSong.isLiked);
    }
  }, [songs, selectedSong]);
  
  // Auto-scroll through lyrics with improved timing and transitions
  useEffect(() => {
    if (selectedSong?.note && isPlaying) {
      const lines = selectedSong.note.split('\n');
      const interval = setInterval(() => {
        setActiveLineIndex(prevIndex => {
          const newIndex = prevIndex < lines.length - 1 ? prevIndex + 1 : prevIndex;
          
          // Auto-scroll to the active line with smooth animation
          if (noteContentRef.current) {
            const lineElements = noteContentRef.current.querySelectorAll('.note-line');
            if (lineElements[newIndex]) {
              // Scroll the element to center with a smooth animation
              lineElements[newIndex].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center'
              });
            }
          }
          
          return newIndex;
        });
      }, 3000); // Change line every 3 seconds (more frequent)
      
      return () => clearInterval(interval);
    } else {
      setActiveLineIndex(0);
    }
  }, [selectedSong, isPlaying]);
  
  // Reset active line when song changes
  useEffect(() => {
    setActiveLineIndex(0);
  }, [selectedSong]);

  // Custom navigation handler that preserves playback state
  const handleBackToPlaylist = (e) => {
    e.preventDefault();
    console.log("Navigating back to playlist while preserving playback state");
    
    // Dispatch a custom event before navigation to ensure audio state is captured
    const event = new CustomEvent('preserve-audio-state', {
      detail: {
        isPlaying,
        currentIndex,
        currentTime: document.querySelector('audio')?.currentTime || 0
      }
    });
    window.dispatchEvent(event);
    
    // Use the navigate function with replace: true to ensure cleaner history
    navigate('/songs', { 
      state: { 
        preserveAudio: true,
        wasPlaying: isPlaying,
        songIndex: currentIndex,
        timestamp: Date.now() // Add timestamp to ensure state is fresh
      },
      replace: false 
    });
  };

  // Replace existing handleNext and handlePrevious functions
  const handleNext = () => {
    // Set UI state to show transition
    setIsPlaying(true);
    
    // Get the next song index with wraparound
    const nextIndex = (currentIndex + 1) % songs.length;
    
    // Create a fancy transition effect using a custom event
    const transitionEvent = new CustomEvent('force-next-song', {
      detail: { index: nextIndex }
    });
    window.dispatchEvent(transitionEvent);
    
    // Update the URL to reflect the new song
    navigate(`/song/${songs[nextIndex]._id}`);
  };

  const handlePrevious = () => {
    // Set UI state to show transition
    setIsPlaying(true);
    
    // Get the previous song index with wraparound
    const prevIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
    
    // Create a fancy transition effect using a custom event
    const transitionEvent = new CustomEvent('force-prev-song', {
      detail: { index: prevIndex }
    });
    window.dispatchEvent(transitionEvent);
    
    // Update the URL to reflect the new song
    navigate(`/song/${songs[prevIndex]._id}`);
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading your song...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button 
            style={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!selectedSong) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>Song not found</p>
          <Link to="/songs" style={styles.backLink}>
            Back to Playlist
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeInLeft {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes fadeInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(29, 185, 84, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(29, 185, 84, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(29, 185, 84, 0); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes noteReveal {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0); }
          }
          @keyframes bgGlow {
            0%, 100% { background-color: rgba(29, 185, 84, 0.03); }
            50% { background-color: rgba(29, 185, 84, 0.08); }
          }
          @keyframes highlightPulse {
            0% { background-color: rgba(29, 185, 84, 0.1); }
            50% { background-color: rgba(29, 185, 84, 0.2); }
            100% { background-color: rgba(29, 185, 84, 0.1); }
          }
          @keyframes textFocus {
            0% { color: rgba(255, 255, 255, 0.8); text-shadow: 0 0 0 rgba(29, 185, 84, 0); }
            50% { color: rgba(255, 255, 255, 1); text-shadow: 0 0 8px rgba(29, 185, 84, 0.5); }
            100% { color: rgba(255, 255, 255, 0.8); text-shadow: 0 0 0 rgba(29, 185, 84, 0); }
          }
          .note-line {
            transition: all 0.3s ease;
            position: relative;
            border-radius: 12px;
            padding: 16px 20px;
            margin: 8px 0;
            text-align: center;
            border-left: 4px solid transparent;
          }
          .note-line:hover {
            background-color: rgba(255, 255, 255, 0.05);
            transform: translateX(5px);
          }
          .note-line.active {
            background-color: rgba(29, 185, 84, 0.1);
            animation: highlightPulse 2s infinite;
            border-left: 4px solid #1db954 !important;
            font-weight: 500;
            color: white;
          }
          .note-line.active p {
            animation: textFocus 2s infinite;
            font-size: 20px !important;
          }
          .note-line p {
            transition: all 0.3s ease;
          }
          .lyrics-scroller {
            scrollbar-width: thin;
            scrollbar-color: rgba(29, 185, 84, 0.5) rgba(0, 0, 0, 0.2);
          }
          .lyrics-scroller::-webkit-scrollbar {
            width: 6px;
          }
          .lyrics-scroller::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
          }
          .lyrics-scroller::-webkit-scrollbar-thumb {
            background: rgba(29, 185, 84, 0.5);
            border-radius: 10px;
          }
          .lyrics-scroller::-webkit-scrollbar-thumb:hover {
            background: rgba(29, 185, 84, 0.7);
          }
          
          /* Mobile-specific styles */
          @media (max-width: 768px) {
            .note-line {
              padding: 14px 16px;
              margin: 6px 0;
            }
            .note-line.active p {
              font-size: 18px !important;
            }
            .note-line:hover {
              transform: translateX(0);
            }
          }
          
          @media (max-width: 480px) {
            .note-line {
              padding: 12px;
              margin: 4px 0;
            }
            .note-line.active p {
              font-size: 16px !important;
            }
          }
          
          @keyframes buttonPulse {
            0% { transform: scale(1); background-color: rgba(29, 185, 84, 0.2); }
            50% { transform: scale(1.1); background-color: rgba(29, 185, 84, 0.4); }
            100% { transform: scale(1); background-color: rgba(29, 185, 84, 0.2); }
          }
          
          .spotify-button-next:active, .spotify-button-prev:active {
            animation: buttonPulse 0.3s ease forwards;
          }
          
          @keyframes slideTransition {
            0% { transform: translateX(0); opacity: 1; }
            50% { transform: translateX(-30px); opacity: 0; }
            51% { transform: translateX(30px); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
      
      {/* Fixed header with back button */}
      <header style={{
        ...styles.header,
        padding: width <= 480 ? '12px 0' : undefined,
      }}>
        <div style={{
          ...styles.headerContent,
          padding: width <= 480 ? '12px 16px' : '20px 32px',
        }}>
          <a 
            href="/songs" 
            style={{
              ...styles.backButton,
              padding: width <= 480 ? '8px 10px' : '8px 12px',
            }}
            onClick={handleBackToPlaylist}
            role="button"
            aria-label="Back to playlist"
          >
            <ArrowLeftIcon style={styles.backIcon} />
            <span>Back to Playlist</span>
          </a>
          
          <div style={styles.nowPlayingIndicator}>
            {isPlaying && (
              <>
                <div style={styles.soundBars}>
                  <div style={styles.bar}></div>
                  <div style={styles.bar}></div>
                  <div style={styles.bar}></div>
                  <div style={styles.bar}></div>
                </div>
                <span>Now Playing</span>
              </>
            )}
          </div>
        </div>
      </header>

      <div style={{
        ...styles.pageWrapper,
        padding: width <= 480 ? '70px 16px 16px 16px' : '80px 32px 32px 32px',
      }}>
        <div style={styles.content}>
          {/* Song Navigation Controls */}
          <div style={{
            ...styles.songNavigationControls,
            width: width <= 480 ? '90%' : 'fit-content',
            padding: width <= 480 ? '10px 16px' : '12px 24px',
          }}>
            <button 
              style={{
                ...styles.songNavButton,
                width: width <= 480 ? '40px' : '44px',
                height: width <= 480 ? '40px' : '44px',
              }}
              onClick={handlePrevious}
              aria-label="Previous song"
              title="Play previous song"
              className="spotify-button-prev"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ 
                width: width <= 480 ? "18px" : "20px", 
                height: width <= 480 ? "18px" : "20px"
              }}>
                <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629v-2.34l6.945 3.968c1.25.714 2.805-.188 2.805-1.628v-8.622c0-1.44-1.555-2.342-2.805-1.628L12 9.53v-2.34c0-1.44-1.555-2.343-2.805-1.629l-7.108 4.062c-1.26.72-1.26 2.536 0 3.256l7.108 4.061z" />
              </svg>
            </button>
            <div style={styles.songNavInfo}>
              <span 
                style={{
                  ...styles.songNavText,
                  color: isPlaying ? "#1db954" : "#ffffff",
                  animation: isPlaying ? "pulse 1.5s infinite" : "none",
                  fontSize: width <= 480 ? "13px" : "15px",
                }}
              >
                {isPlaying ? 'Now Playing' : 'Play a Song'}
              </span>
            </div>
            <button 
              style={{
                ...styles.songNavButton,
                width: width <= 480 ? '40px' : '44px',
                height: width <= 480 ? '40px' : '44px',
              }}
              onClick={handleNext}
              aria-label="Next song"
              title="Play next song"
              className="spotify-button-next"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ 
                width: width <= 480 ? "18px" : "20px", 
                height: width <= 480 ? "18px" : "20px"
              }}>
                <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v8.123c0 1.44 1.555 2.342 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256L14.805 7.06C13.555 6.346 12 7.25 12 8.688v2.34L5.055 7.06z" />
              </svg>
            </button>
          </div>

          {/* Top section with song info */}
          <div style={{
            ...styles.songHeader,
            gap: width <= 768 ? '32px' : '48px',
          }}>
            <div style={styles.coverWrapper}>
              <div style={styles.coverContainer}>
                <img
                  src={selectedSong.coverUrl}
                  alt={selectedSong.title}
                  style={{
                    ...styles.albumArt,
                    width: width <= 480 ? "280px" : "320px",
                    height: width <= 480 ? "280px" : "320px",
                  }}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
                  }}
                />
                <div style={styles.coverGlow}></div>
              </div>
              <button 
                style={{
                  ...styles.playButton,
                  width: width <= 480 ? "56px" : "64px",
                  height: width <= 480 ? "56px" : "64px",
                }}
                onClick={handleTogglePlay}
                aria-label={isPlaying ? "Pause song" : "Play song"}
              >
                {isPlaying ? (
                  <PauseSolid style={{
                    ...styles.playIcon,
                    width: width <= 480 ? "28px" : "32px",
                    height: width <= 480 ? "28px" : "32px",
                  }} />
                ) : (
                  <PlaySolid style={{
                    ...styles.playIcon,
                    width: width <= 480 ? "28px" : "32px",
                    height: width <= 480 ? "28px" : "32px",
                  }} />
                )}
              </button>
            </div>

            <div style={{
              ...styles.songInfo,
              width: width <= 768 ? "100%" : undefined,
              alignItems: width <= 768 ? "center" : undefined,
              textAlign: width <= 768 ? "center" : undefined,
            }}>
                  <div style={{
                ...styles.songTitleWrapper,
                justifyContent: width <= 768 ? "center" : "flex-start",
              }}>
                <h1 style={{
                  ...styles.songTitle,
                  fontSize: width <= 480 ? "36px" : "48px",
                }}>{selectedSong.title}</h1>
                {selectedSong.note && (
                  <div style={styles.hasNotesTag}>
                    <MusicalNoteIcon style={styles.miniNoteIcon} />
                    <span>Has Notes</span>
                  </div>
                )}
              </div>
              
              <p style={{
                ...styles.artist,
                fontSize: width <= 480 ? "20px" : "24px",
                marginBottom: width <= 480 ? "24px" : "32px",
              }}>{selectedSong.artist}</p>
              
              <div style={{
                ...styles.songMeta,
                flexDirection: width <= 480 ? "column" : "row",
                gap: width <= 480 ? "12px" : "20px",
                marginBottom: width <= 480 ? "24px" : "32px",
                alignItems: width <= 480 ? "center" : undefined,
              }}>
                <div style={styles.metaItem}>
                  <ClockIcon style={styles.metaIcon} />
                  <span>Added to your playlist</span>
                </div>
                <div style={styles.metaItem}>
                  <CalendarIcon style={styles.metaIcon} />
                  <span>Special Memory</span>
                </div>
              </div>
              
              <div style={styles.actions}>
                <button 
                  style={{
                    ...styles.actionButton,
                    backgroundColor: isPlaying ? 'rgba(29, 185, 84, 0.2)' : '#1db954',
                    padding: width <= 480 ? "12px 28px" : "14px 36px",
                    fontSize: width <= 480 ? "14px" : "16px",
                  }}
                  onClick={handleTogglePlay}
                >
                  {isPlaying ? "Now Playing" : "Play Song"}
                </button>
                
            <button 
                  style={{
                    ...styles.likeButton,
                    width: width <= 480 ? "44px" : "48px",
                    height: width <= 480 ? "44px" : "48px",
                  }}
                  onClick={() => handleLike(selectedSong._id)}
                >
                  {selectedSong.isLiked ? (
                <HeartSolid style={{
                  ...styles.likeIconSolid,
                      width: width <= 480 ? "22px" : "24px",
                      height: width <= 480 ? "22px" : "24px",
                }} />
              ) : (
                    <HeartIcon style={{
                      ...styles.likeIcon,
                      width: width <= 480 ? "22px" : "24px",
                      height: width <= 480 ? "22px" : "24px",
                    }} />
              )}
            </button>
              </div>
            </div>
          </div>

          {/* Note section with improved design */}
          {selectedSong && (
            <div style={styles.noteSection}>
              {selectedSong.note ? (
                <div style={{
                  ...styles.noteContainer,
                  padding: width <= 480 ? "24px 20px" : "40px",
                }}>
                  <div style={{
                    ...styles.noteHeader,
                    flexDirection: width <= 480 ? "column" : "row",
                    alignItems: width <= 480 ? "flex-start" : "center",
                    gap: width <= 480 ? "12px" : "16px",
                  }}>
                    <div style={{
                      ...styles.noteIconContainer,
                      width: width <= 480 ? "40px" : "48px",
                      height: width <= 480 ? "40px" : "48px",
                    }}>
                      <MusicalNoteIcon style={{
                        ...styles.noteIcon,
                        width: width <= 480 ? "24px" : "28px",
                        height: width <= 480 ? "24px" : "28px",
                      }} />
                    </div>
                    <div>
                      <h3 style={{
                        ...styles.noteTitle,
                        fontSize: width <= 480 ? "20px" : "24px",
                      }}>Notes & Lyrics</h3>
                      <p style={styles.noteSubTitle}>Special memories with this song</p>
                    </div>
                    
                    <div style={{
                      ...styles.playbackControls,
                      flexDirection: width <= 480 ? "row" : "column",
                      marginLeft: width <= 480 ? "0" : "auto",
                      marginTop: width <= 480 ? "12px" : "0",
                      alignSelf: width <= 480 ? "center" : undefined,
                      width: width <= 480 ? "100%" : "auto",
                      justifyContent: width <= 480 ? "center" : undefined,
                    }}>
                      <button 
                        style={{
                          ...styles.playbackButton,
                          opacity: activeLineIndex === 0 ? 0.5 : 1,
                          width: width <= 480 ? "36px" : "32px",
                          height: width <= 480 ? "36px" : "32px",
                        }}
                        onClick={() => setActiveLineIndex(Math.max(0, activeLineIndex - 1))}
                        disabled={activeLineIndex === 0}
                        aria-label="Previous line"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button 
                        style={{
                          ...styles.playbackButton,
                          opacity: activeLineIndex >= selectedSong.note.split('\n').length - 1 ? 0.5 : 1,
                          width: width <= 480 ? "36px" : "32px",
                          height: width <= 480 ? "36px" : "32px",
                        }}
                        onClick={() => setActiveLineIndex(Math.min(selectedSong.note.split('\n').length - 1, activeLineIndex + 1))}
                        disabled={activeLineIndex >= selectedSong.note.split('\n').length - 1}
                        aria-label="Next line"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div style={styles.divider}></div>
                  
                  <div style={styles.noteContentWrapper}>
                    <div 
                      style={{
                        ...styles.noteContentScroller,
                        maxHeight: width <= 480 ? "300px" : "400px",
                      }} 
                      className="lyrics-scroller" 
                      ref={noteContentRef}
                    >
                      {selectedSong.note.split('\n').map((line, index) => (
                        <div 
                          key={index}
                          className={`note-line ${index === activeLineIndex ? 'active' : ''}`}
                          style={{
                            opacity: 1,
                            animation: `noteReveal 0.5s ease ${index * 0.05}s forwards`,
                            backgroundColor: index === activeLineIndex 
                              ? 'rgba(29, 185, 84, 0.1)' 
                              : (Math.abs(index - activeLineIndex) < 3 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'),
                            transform: `scale(${index === activeLineIndex ? 1 : Math.abs(index - activeLineIndex) < 3 ? 0.95 - Math.abs(index - activeLineIndex) * 0.03 : 0.9})`,
                            padding: index === activeLineIndex ? '16px 20px' : '14px 20px',
                          }}
                          onClick={() => setActiveLineIndex(index)}
                        >
                          <p 
                            style={{
                              ...styles.noteText,
                              margin: 0,
                              opacity: 1,
                              fontSize: index === activeLineIndex ? '20px' : 
                                       (Math.abs(index - activeLineIndex) === 1 ? '18px' : 
                                       (Math.abs(index - activeLineIndex) === 2 ? '16px' : '14px')),
                              color: index === activeLineIndex ? '#ffffff' : 
                                    (Math.abs(index - activeLineIndex) === 1 ? '#e1e1e1' : 
                                    (Math.abs(index - activeLineIndex) === 2 ? '#b0b0b0' : '#808080')),
                              fontWeight: index === activeLineIndex ? '600' : 
                                          (Math.abs(index - activeLineIndex) < 2 ? '500' : '400'),
                            }}
                          >
                            {line || '\u00A0'}
                          </p>
          </div>
        ))}
                    </div>
                    
                    <div style={styles.noteContentOverlay}></div>
                  </div>
                  
                  <div style={styles.lyricsProgress}>
                    <div 
                      style={{
                        ...styles.lyricsProgressBar,
                        width: `${(activeLineIndex / Math.max(1, selectedSong.note.split('\n').length - 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                  
                  <div style={styles.noteFooter}>
                    <p style={styles.noteFooterText}>
                      {isPlaying 
                        ? "Lyrics auto-sync with playback" 
                        : "Play the song to see synchronized lyrics"}
                    </p>
                    {isPlaying && (
                      <p style={{
                        ...styles.noteFooterText,
                        fontSize: "12px",
                        marginTop: "5px",
                        color: "#707070"
                      }}>
                        Lines advance automatically as the song plays
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div style={styles.noNotesContainer}>
                  <div style={styles.noNotesBg}></div>
                  <MusicalNoteIcon style={styles.noNotesIcon} />
                  <p style={styles.noNotesText}>No notes available for this song</p>
                  <p style={styles.noNotesSubText}>This song doesn't have any notes or lyrics added yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#121212",
    backgroundImage: "radial-gradient(circle at top right, rgba(29, 185, 84, 0.1), transparent 800px), radial-gradient(circle at bottom left, rgba(78, 185, 245, 0.05), transparent 600px)",
    minHeight: "100vh",
    color: "white",
    padding: "0 0 80px 0",
  },
  pageWrapper: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "80px 32px 32px 32px",
  },
  header: {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    background: "linear-gradient(180deg, rgba(18,18,18,0.95) 0%, rgba(18,18,18,0.7) 100%)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    zIndex: 100,
  },
  headerContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "20px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    color: "#b3b3b3",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: "600",
    transition: "color 0.2s ease",
    padding: "8px 12px",
    borderRadius: "8px",
    backgroundColor: "rgba(255,255,255,0.05)",
    "&:hover": {
      backgroundColor: "rgba(255,255,255,0.1)",
      color: "white",
    }
  },
  backIcon: {
    width: "20px",
    height: "20px",
    marginRight: "8px",
  },
  nowPlayingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#1db954",
    fontSize: "14px",
    fontWeight: "600",
    animation: "fadeIn 0.5s ease",
  },
  soundBars: {
    display: "flex",
    alignItems: "flex-end",
    height: "16px",
    gap: "2px",
  },
  bar: {
    width: "3px",
    backgroundColor: "#1db954",
    borderRadius: "1.5px",
    animation: "fadeIn 0.5s ease",
    height: "10px",
    animationName: "float",
    animationDuration: "1.2s",
    animationIterationCount: "infinite",
    animationDelay: (index) => `${index * 0.2}s`,
  },
  content: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "60px",
  },
  songHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "48px",
    animation: "fadeIn 0.8s ease forwards",
    flexWrap: "wrap",
    justifyContent: "center",
    
    "@media (max-width: 768px)": {
      flexDirection: "column",
      alignItems: "center",
      gap: "24px",
    },
  },
  coverWrapper: {
    position: "relative",
    animation: "fadeInLeft 0.8s ease forwards",
  },
  coverContainer: {
    position: "relative",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
  },
  albumArt: {
    width: "320px",
    height: "320px",
    objectFit: "cover",
    borderRadius: "16px",
    transition: "transform 0.3s ease",
    "&:hover": {
      transform: "scale(1.02)",
    },
  },
  coverGlow: {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    backgroundImage: "radial-gradient(circle at center, rgba(29, 185, 84, 0.2), transparent 70%)",
    opacity: "0.7",
    animation: "pulse 4s infinite",
  },
  playButton: {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    backgroundColor: "#1db954",
    borderRadius: "50%",
    width: "64px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(29, 185, 84, 0.3)",
    border: "none",
    cursor: "pointer",
    animation: "pulse 3s infinite",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      transform: "scale(1.05)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 30px rgba(29, 185, 84, 0.4)",
    },
  },
  playIcon: {
    width: "32px",
    height: "32px",
    color: "white",
    marginLeft: "4px",
  },
  songInfo: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    animation: "fadeInRight 0.8s ease forwards",
    maxWidth: "600px",
    
    "@media (max-width: 768px)": {
      textAlign: "center",
      alignItems: "center",
      maxWidth: "100%",
    },
  },
  songTitleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  songTitle: {
    fontSize: "48px",
    fontWeight: "800",
    marginBottom: "12px",
    background: "linear-gradient(90deg, #1DB954, #4EB9F5)",
    backgroundSize: "200% 200%",
    animation: "gradientMove 4s ease infinite",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 2px 10px rgba(29, 185, 84, 0.3)",
    letterSpacing: "-0.02em",
  },
  hasNotesTag: {
    display: "flex",
    alignItems: "center", 
    gap: "6px",
    backgroundColor: "rgba(29, 185, 84, 0.15)",
    borderRadius: "20px",
    padding: "6px 12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1db954",
    marginBottom: "14px",
    animation: "bgGlow 3s infinite",
  },
  miniNoteIcon: {
    width: "14px",
    height: "14px",
  },
  artist: {
    fontSize: "24px",
    color: "#c0c0c0",
    marginBottom: "32px",
    fontWeight: "500",
    letterSpacing: "0.02em",
  },
  songMeta: {
    marginBottom: "32px",
    display: "flex",
    gap: "20px",
    color: "#909090",
    fontSize: "14px",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  metaIcon: {
    width: "16px",
    height: "16px",
    color: "#909090",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  actionButton: {
    backgroundColor: "#1db954",
    color: "white",
    border: "none",
    padding: "14px 36px",
    borderRadius: "30px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 4px 12px rgba(29, 185, 84, 0.3)",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 18px rgba(29, 185, 84, 0.4)",
    },
  },
  likeButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
    transition: "transform 0.2s ease, background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(255,255,255,0.15)",
      transform: "translateY(-2px)",
    },
  },
  likeIcon: {
    width: "24px",
    height: "24px",
    color: "white",
  },
  likeIconSolid: {
    width: "24px",
    height: "24px",
    color: "#1db954",
  },
  noteSection: {
    width: "100%",
    animation: "fadeIn 1s ease 0.3s forwards",
    opacity: 0,
  },
  noteContainer: {
    backgroundColor: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "40px",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
    overflow: "hidden",
    position: "relative",
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto",
  },
  noteHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "8px",
    position: "relative",
  },
  playbackControls: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginLeft: "auto",
  },
  playbackButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    border: "none",
    color: "white",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "16px",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(29, 185, 84, 0.2)",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    }
  },
  noteContentWrapper: {
    position: "relative",
  },
  noteContentScroller: {
    maxHeight: "400px", // Taller container for lyrics
    overflowY: "auto",
    paddingRight: "15px",
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center", // Center lyrics horizontally
  },
  noteContentOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: "15px", // Account for scrollbar
    height: "50px",
    background: "linear-gradient(to top, rgba(0,0,0,0.25), transparent)",
    pointerEvents: "none",
    zIndex: 3,
  },
  lyricsProgress: {
    height: "4px",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: "2px",
    marginTop: "20px",
    overflow: "hidden",
  },
  lyricsProgressBar: {
    height: "100%",
    backgroundColor: "#1db954",
    borderRadius: "2px",
    transition: "width 0.5s ease",
  },
  noteFooter: {
    marginTop: "15px",
    textAlign: "center",
  },
  noteFooterText: {
    fontSize: "14px",
    color: "#909090",
    margin: 0,
  },
  noteIconContainer: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "rgba(29, 185, 84, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "bgGlow 3s infinite",
  },
  noteIcon: {
    width: "28px",
    height: "28px",
    color: "#1db954",
  },
  noteTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1db954",
    margin: "0 0 4px 0",
  },
  noteSubTitle: {
    fontSize: "14px",
    color: "#909090",
    margin: 0,
  },
  divider: {
    height: "1px",
    backgroundColor: "rgba(255,255,255,0.1)",
    margin: "24px 0",
    width: "100%",
  },
  noteText: {
    fontSize: "18px",
    color: "#ffffff",
    lineHeight: "1.7",
    margin: 0,
    opacity: 0,
    position: "relative",
    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
    textAlign: "center",
    transition: "all 0.3s ease",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    letterSpacing: "0.01em",
  },
  noNotesContainer: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: "20px",
    padding: "60px 40px",
    border: "1px solid rgba(255,255,255,0.05)",
    animation: "fadeIn 0.8s ease forwards",
    boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    minHeight: "200px",
    position: "relative",
    overflow: "hidden",
  },
  noNotesBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "linear-gradient(45deg, transparent 0%, rgba(29, 185, 84, 0.03) 50%, transparent 100%)",
    backgroundSize: "200% 200%",
    animation: "shimmer 3s infinite linear",
    zIndex: 0,
  },
  noNotesIcon: {
    width: "64px",
    height: "64px",
    color: "rgba(255,255,255,0.2)",
    marginBottom: "24px",
    position: "relative",
    zIndex: 1,
  },
  noNotesText: {
    fontSize: "22px",
    color: "#a0a0a0",
    maxWidth: "400px",
    lineHeight: "1.6",
    fontWeight: "600",
    marginBottom: "8px",
    position: "relative",
    zIndex: 1,
  },
  noNotesSubText: {
    fontSize: "16px",
    color: "#707070",
    maxWidth: "400px",
    lineHeight: "1.6",
    position: "relative",
    zIndex: 1,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
  loadingSpinner: {
    width: "60px",
    height: "60px",
    border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #1db954",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "24px",
  },
  loadingText: {
    fontSize: "18px",
    color: "#b3b3b3",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    textAlign: "center",
  },
  errorText: {
    fontSize: "18px",
    color: "#ff4444",
    marginBottom: "20px",
  },
  retryButton: {
    backgroundColor: "#1db954",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "24px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s ease",
  },
  backLink: {
    backgroundColor: "#1db954",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "24px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },
  songNavigationControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center", 
    gap: "24px",
    marginBottom: "40px",
    backgroundColor: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(10px)",
    borderRadius: "50px",
    padding: "12px 24px",
    width: "fit-content",
    margin: "0 auto 40px auto",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
    animation: "fadeIn 0.5s ease",
  },
  songNavButton: {
    backgroundColor: "rgba(29, 185, 84, 0.1)",
    borderRadius: "50%",
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
    color: "#ffffff",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#1db954",
      transform: "scale(1.05)",
      boxShadow: "0 0 20px rgba(29, 185, 84, 0.3)",
    },
  },
  songNavInfo: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minWidth: "120px",
  },
  songNavText: {
    fontSize: "15px",
    fontWeight: "600",
    opacity: 0.9,
    transition: "color 0.3s ease",
  },
};

export default SongDetail;