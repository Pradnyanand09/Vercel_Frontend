import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  ForwardIcon, 
  BackwardIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon 
} from '@heroicons/react/24/solid';

// Throttle function for performance optimization
const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return function(...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

const AudioPlayer = ({ songs, currentSongIndex, setCurrentSongIndex }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem('audioPlayer-volume');
    return savedVolume !== null ? parseFloat(savedVolume) : 0.7;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const savedIsMuted = localStorage.getItem('audioPlayer-isMuted');
    return savedIsMuted === 'true';
  });
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null); // 'next' or 'prev'
  
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const animationRef = useRef(null);

  const currentSong = songs && songs.length > 0 ? songs[currentSongIndex] : null;

  // Sync isPlaying ref with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Handle audio source changes and loading
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    audio.src = currentSong.url;
    audio.load();

    const handleCanPlay = () => {
      if (isPlayingRef.current) {
        audio.play().catch(error => {
          console.error("Playback failed:", error);
          setIsPlaying(false);
        });
      }
    };

    audio.addEventListener('canplay', handleCanPlay);
    return () => audio.removeEventListener('canplay', handleCanPlay);
  }, [currentSong?.url]);

  // Listen for force-play and force-pause events
  useEffect(() => {
    const handleForcePlay = (event) => {
      const { index } = event.detail;
      console.log("Force play event received for index:", index);
      
      if (index !== undefined) {
        // Change the song if needed
        if (index !== currentSongIndex) {
          setCurrentSongIndex(index);
        }
        
        // Only attempt to play if explicitly requested
        setIsPlaying(true);
        if (audioRef.current) {
          audioRef.current.play().catch(error => {
            console.error("Force-play prevented:", error);
            setIsPlaying(false);
          });
        }
      }
    };
    
    const handleForcePause = () => {
      console.log("Force pause event received");
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    
    const handleForceNext = (evt) => {
      console.log("Force next song event received");
      const { index } = evt.detail;
      
      // Update the current song index
      if (index !== undefined) {
        setCurrentSongIndex(index);
      } else {
        // If no index provided, calculate the next index
        const nextIndex = (currentSongIndex + 1) % songs.length;
        setCurrentSongIndex(nextIndex);
      }
      
      // Ensure we start playing automatically
      setIsPlaying(true);
      isPlayingRef.current = true;
      
      // Increase timeout to ensure the audio source is fully updated
      setTimeout(() => {
        if (audioRef.current) {
          console.log("Starting playback after force-next");
          audioRef.current.play()
            .then(() => {
              console.log("Playback started successfully");
              // Extra confirmation that we're playing
              if (!isPlaying) setIsPlaying(true);
              // Emit event after successful playback start
              emitPlaybackChangeEvent(true);
            })
            .catch(error => {
              console.error("Playback failed:", error);
              setIsPlaying(false);
              emitPlaybackChangeEvent(false);
            });
        }
      }, 100);
      
      // Emit an event to notify that the song changed
      const newIndex = index !== undefined ? index : (currentSongIndex + 1) % songs.length;
      const songChangedEvent = new CustomEvent('song-changed', { 
        detail: { 
          index: newIndex,
          autoPlay: true,
          timestamp: Date.now() // Add timestamp for better sync
        }
      });
      window.dispatchEvent(songChangedEvent);
    };
    
    const handleForcePrev = (evt) => {
      console.log("Force previous song event received");
      const { index } = evt.detail;
      
      // Update the current song index
      if (index !== undefined) {
        setCurrentSongIndex(index);
      } else {
        // If no index provided, calculate the previous index
        const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        setCurrentSongIndex(prevIndex);
      }
      
      // Ensure we start playing automatically
      setIsPlaying(true);
      isPlayingRef.current = true;
      
      // Increase timeout to ensure the audio source is fully updated
      setTimeout(() => {
        if (audioRef.current) {
          console.log("Starting playback after force-prev");
          audioRef.current.play()
            .then(() => {
              console.log("Playback started successfully");
              // Extra confirmation that we're playing
              if (!isPlaying) setIsPlaying(true);
              // Emit event after successful playback start
              emitPlaybackChangeEvent(true);
            })
            .catch(error => {
              console.error("Playback failed:", error);
              setIsPlaying(false);
              emitPlaybackChangeEvent(false);
            });
        }
      }, 100);
      
      // Emit an event to notify that the song changed
      const newIndex = index !== undefined ? index : (currentSongIndex - 1 + songs.length) % songs.length;
      const songChangedEvent = new CustomEvent('song-changed', { 
        detail: { 
          index: newIndex,
          autoPlay: true,
          timestamp: Date.now() // Add timestamp for better sync
        }
      });
      window.dispatchEvent(songChangedEvent);
    };
    
    window.addEventListener('force-play-song', handleForcePlay);
    window.addEventListener('force-pause-song', handleForcePause);
    window.addEventListener('force-next-song', handleForceNext);
    window.addEventListener('force-prev-song', handleForcePrev);
    
    return () => {
      window.removeEventListener('force-play-song', handleForcePlay);
      window.removeEventListener('force-pause-song', handleForcePause);
      window.removeEventListener('force-next-song', handleForceNext);
      window.removeEventListener('force-prev-song', handleForcePrev);
    };
  }, [currentSongIndex, setCurrentSongIndex, songs.length]);

  // Emit playback state changes to other components
  const emitPlaybackChangeEvent = useCallback((playing) => {
    const event = new CustomEvent('audio-playback-change', { 
      detail: { 
        isPlaying: playing,
        songIndex: currentSongIndex,
        timestamp: Date.now() // Add timestamp for better sync
      }
    });
    window.dispatchEvent(event);
  }, [currentSongIndex]);

  // Play/pause handling with event emission
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(error => {
        console.error("Playback failed:", error);
        setIsPlaying(false);
      });
      emitPlaybackChangeEvent(true);
    } else {
      audio.pause();
      emitPlaybackChangeEvent(false);
    }
  }, [isPlaying, emitPlaybackChangeEvent]);

  // Emit playback change on mount and unmount
  useEffect(() => {
    emitPlaybackChangeEvent(isPlaying);
    return () => emitPlaybackChangeEvent(false);
  }, [emitPlaybackChangeEvent, isPlaying]);

  // Volume and mute handling
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Time update throttling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = throttle(() => {
      setCurrentTime(audio.currentTime);
    }, 250);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  // LocalStorage persistence
  useEffect(() => {
    localStorage.setItem('audioPlayer-volume', volume);
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('audioPlayer-isMuted', isMuted);
  }, [isMuted]);

  // Drag handling for progress bar
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingProgress) handleProgressChange(e);
    };
    const handleMouseUp = () => setIsDraggingProgress(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingProgress]);

  // Drag handling for volume bar
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingVolume) handleVolumeChange(e);
    };
    const handleMouseUp = () => setIsDraggingVolume(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingVolume]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  }, []);

  const handlePlayPause = useCallback(() => setIsPlaying(prev => !prev), []);

  const handlePrevious = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Start transition animation
    setTransitionDirection('prev');
    setIsTransitioning(true);

    setTimeout(() => {
      if (audio.currentTime > 3) {
        // If more than 3 seconds into the song, restart this song
        audio.currentTime = 0;
        setCurrentTime(0);
      } else {
        // Go to previous song
        const newIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
        setCurrentSongIndex(newIndex);
        
        // Start playing the previous song automatically
        setIsPlaying(true);
        isPlayingRef.current = true;
        
        // Small delay to ensure the audio source is updated before playing
        setTimeout(() => {
      if (audioRef.current) {
            audioRef.current.play()
              .then(() => console.log("Previous song started playing"))
              .catch(err => {
                console.error("Failed to play previous song:", err);
                setIsPlaying(false);
              });
          }
        }, 100);
        
        // Update other components
        const songChangedEvent = new CustomEvent('song-changed', { 
          detail: { 
            index: newIndex,
            autoPlay: true
          }
        });
        window.dispatchEvent(songChangedEvent);
      }
      
      // End transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 300); // Wait for fade out animation
  }, [songs.length, currentSongIndex, setCurrentSongIndex]);

  const handleNext = useCallback(() => {
    // Start transition animation
    setTransitionDirection('next');
    setIsTransitioning(true);

    setTimeout(() => {
      const newIndex = currentSongIndex === songs.length - 1 ? 0 : currentSongIndex + 1;
      setCurrentSongIndex(newIndex);
      
      // Start playing the next song automatically
      setIsPlaying(true);
      isPlayingRef.current = true;
      
      // Small delay to ensure the audio source is updated before playing
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => console.log("Next song started playing"))
            .catch(err => {
              console.error("Failed to play next song:", err);
              setIsPlaying(false);
            });
        }
      }, 100);
      
      // Update other components
      const songChangedEvent = new CustomEvent('song-changed', { 
        detail: { 
          index: newIndex,
          autoPlay: true
        }
      });
      window.dispatchEvent(songChangedEvent);
      
      // End transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 300); // Wait for fade out animation
  }, [songs.length, currentSongIndex, setCurrentSongIndex]);

  const handleEnded = useCallback(() => handleNext(), [handleNext]);

  const handleProgressChange = useCallback((e) => {
    const rect = progressBarRef.current.getBoundingClientRect();
    const seekTime = ((e.clientX - rect.left) / rect.width) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  }, [duration]);

  const handleVolumeChange = useCallback((e) => {
    const rect = volumeBarRef.current.getBoundingClientRect();
    const newVolume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);

  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Update audio player when currentSongIndex changes
  useEffect(() => {
    if (songs.length > 0 && currentSongIndex >= 0 && currentSongIndex < songs.length) {
      const audioElement = audioRef.current;
      if (audioElement) {
        audioElement.src = songs[currentSongIndex].url;
        audioElement.load();
        
        // If was playing before, continue playing the new song
        if (isPlayingRef.current) {
          audioElement.play()
            .then(() => {
              setIsPlaying(true);
              emitPlaybackChangeEvent(true);
            })
            .catch(error => {
              console.error("Playback failed on song change:", error);
              setIsPlaying(false);
              emitPlaybackChangeEvent(false);
            });
        }
      }
    }
  }, [currentSongIndex, songs, emitPlaybackChangeEvent]);

  // Update time and progress
  const whilePlaying = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(whilePlaying);
    }
  };

  // Toggle play/pause - consolidated with handlePlayPause
  const togglePlayPause = useCallback(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
        // State update is handled by the 'pause' event listener
      } else {
        audioElement.play().catch(error => {
          console.error("Playback failed:", error);
          setIsPlaying(false);
          emitPlaybackChangeEvent(false);
        });
        // State update is handled by the 'play' event listener
      }
    }
  }, [isPlaying, emitPlaybackChangeEvent]);

  // Handle playback events
  useEffect(() => {
    const audioElement = audioRef.current;
    
    if (audioElement) {
      const handlePlay = () => {
        setIsPlaying(true);
        animationRef.current = requestAnimationFrame(whilePlaying);
        emitPlaybackChangeEvent(true);
      };
      
      const handlePause = () => {
        setIsPlaying(false);
        cancelAnimationFrame(animationRef.current);
        emitPlaybackChangeEvent(false);
      };
      
      const handleLoadedMetadata = () => {
        setDuration(audioElement.duration);
      };
      
      const handleEnded = () => {
        // Play next song when current one ends
        handleNext();
      };
      
      audioElement.addEventListener('play', handlePlay);
      audioElement.addEventListener('pause', handlePause);
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.addEventListener('ended', handleEnded);
      
      return () => {
        audioElement.removeEventListener('play', handlePlay);
        audioElement.removeEventListener('pause', handlePause);
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioElement.removeEventListener('ended', handleEnded);
        cancelAnimationFrame(animationRef.current);
      };
    }
  }, [emitPlaybackChangeEvent, handleNext]);

  // Persist audio state between route changes
  useEffect(() => {
    // Emit event on component mount to synchronize UI with audio state
    emitPlaybackChangeEvent(isPlaying);
    
    // Fix for audio stopping on route changes
    const handleBeforeUnload = (e) => {
      if (isPlaying) {
        // Store the current state before page changes
        sessionStorage.setItem('audioWasPlaying', 'true');
        sessionStorage.setItem('audioCurrentTime', audioRef.current?.currentTime || 0);
        sessionStorage.setItem('audioCurrentIndex', currentSongIndex);
      }
    };
    
    // Check if we need to restore state on mount
    const wasPlaying = sessionStorage.getItem('audioWasPlaying') === 'true';
    const storedTime = parseFloat(sessionStorage.getItem('audioCurrentTime') || '0');
    const storedIndex = parseInt(sessionStorage.getItem('audioCurrentIndex') || '-1', 10);
    
    if (wasPlaying && storedIndex === currentSongIndex && audioRef.current) {
      console.log("Restoring audio state after navigation");
      if (storedTime > 0) {
        audioRef.current.currentTime = storedTime;
      }
      
      // Slight delay to ensure the audio element is ready
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
              emitPlaybackChangeEvent(true);
            })
            .catch(err => console.error("Failed to restore playback:", err));
        }
      }, 100);
      
      // Clear the stored state
      sessionStorage.removeItem('audioWasPlaying');
      sessionStorage.removeItem('audioCurrentTime');
      sessionStorage.removeItem('audioCurrentIndex');
    }
    
    // Listen for page navigation
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentSongIndex, isPlaying, emitPlaybackChangeEvent]);

  if (!currentSong) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 flex justify-center items-center">
        No songs available
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-[#181818] text-white border-t border-gray-800 p-4 z-50 transform ${isTransitioning ? (transitionDirection === 'next' ? 'animate-slide-left-out' : 'animate-slide-right-out') : 'animate-slide-in'}`}>
      <style jsx>
        {`
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideLeftOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(-30px); }
          }
          
          @keyframes slideRightOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(30px); }
          }
          
          @keyframes slideLeftIn {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          
          @keyframes slideRightIn {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          
          .animate-slide-in {
            animation: slideIn 0.3s ease forwards;
          }
          
          .animate-slide-left-out {
            animation: slideLeftOut 0.3s ease forwards;
          }
          
          .animate-slide-right-out {
            animation: slideRightOut 0.3s ease forwards;
          }
          
          .animate-slide-left-in {
            animation: slideLeftIn 0.3s ease forwards;
          }
          
          .animate-slide-right-in {
            animation: slideRightIn 0.3s ease forwards;
          }
          
          /* Spotify-like glow effect for controls */
          .spotify-glow:hover {
            filter: drop-shadow(0 0 5px rgba(29, 185, 84, 0.6));
            transform: scale(1.05);
            transition: all 0.2s ease;
          }
          
          /* Progress bar customization */
          .progress-bar {
            height: 4px;
            border-radius: 2px;
            background: #5e5e5e;
            cursor: pointer;
            position: relative;
            transition: height 0.2s ease;
          }
          
          .progress-bar:hover {
            height: 6px;
          }
          
          .progress-fill {
            height: 100%;
            background: #1DB954;
            border-radius: 2px;
            position: relative;
          }
          
          .progress-fill::after {
            content: '';
            position: absolute;
            right: -6px;
            top: 50%;
            transform: translateY(-50%) scale(0);
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            transition: transform 0.2s ease;
          }
          
          .progress-bar:hover .progress-fill::after {
            transform: translateY(-50%) scale(1);
          }
        `}
      </style>
      
      <audio
        ref={audioRef}
        onTimeUpdate={throttle(() => {
          if (!isDraggingProgress && audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }, 300)} // Throttle time updates for better performance
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={handleEnded}
      />
      
      <div className="flex items-center flex-wrap">
        {/* Song Info */}
        <div className={`flex items-center w-full md:w-1/4 mb-4 md:mb-0 ${isTransitioning ? (transitionDirection === 'next' ? 'animate-slide-right-in' : 'animate-slide-left-in') : ''}`}>
          {currentSong && (
            <>
              <div className="mr-4 h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
          <img 
            src={currentSong.coverUrl} 
            alt={currentSong.title} 
                  className="h-full w-full object-cover transition-transform hover:scale-110 duration-500"
          />
              </div>
          <div className="truncate">
                <div className="text-base font-medium">{currentSong.title}</div>
                <div className="text-xs text-gray-400">{currentSong.artist}</div>
          </div>
            </>
          )}
        </div>
        
        {/* Player Controls */}
        <div className="flex flex-col w-full md:w-2/4 justify-center items-center">
          <div className="flex space-x-6 items-center mb-4">
            <button 
              onClick={handlePrevious}
              className="spotify-glow text-white hover:text-green-400"
              aria-label="Previous"
            >
              <BackwardIcon className="h-5 w-5" />
            </button>
            
            <button 
              onClick={togglePlayPause}
              className="spotify-glow bg-white text-black rounded-full p-2 hover:bg-green-400 hover:text-white"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6" />
              )}
            </button>
            
            <button 
              onClick={handleNext}
              className="spotify-glow text-white hover:text-green-400"
              aria-label="Next"
            >
              <ForwardIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full flex items-center space-x-2">
            <span className="text-xs text-gray-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            
            <div 
              ref={progressBarRef}
              className="progress-bar flex-grow"
              onClick={handleProgressChange}
              onMouseDown={(e) => {
                setIsDraggingProgress(true);
                handleProgressChange(e);
              }}
              onMouseMove={(e) => {
                if (isDraggingProgress) {
                  handleProgressChange(e);
                }
              }}
              onMouseUp={() => setIsDraggingProgress(false)}
              onMouseLeave={() => setIsDraggingProgress(false)}
            >
              <div 
                className="progress-fill"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              ></div>
            </div>
            
            <span className="text-xs text-gray-400 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>
        
        {/* Volume Controls */}
        <div className="hidden md:flex w-full md:w-1/4 justify-end items-center space-x-2">
          <button 
            onClick={toggleMute}
            className="spotify-glow text-white hover:text-green-400"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <SpeakerXMarkIcon className="h-5 w-5" />
            ) : (
              <SpeakerWaveIcon className="h-5 w-5" />
            )}
          </button>
          
          <div 
            ref={volumeBarRef}
            className="progress-bar w-24"
            onClick={handleVolumeChange}
            onMouseDown={(e) => {
              setIsDraggingVolume(true);
              handleVolumeChange(e);
            }}
            onMouseMove={(e) => {
              if (isDraggingVolume) {
                handleVolumeChange(e);
              }
            }}
            onMouseUp={() => setIsDraggingVolume(false)}
            onMouseLeave={() => setIsDraggingVolume(false)}
          >
            <div 
              className="progress-fill"
              style={{ width: `${isMuted ? 0 : volume * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;