import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://my-songs-qjye.vercel.app';

const BestieBirthdayLanding = () => {
  const [loaded, setLoaded] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  useEffect(() => {
    // Create staggered animations
    const timer1 = setTimeout(() => setLoaded(true), 500);
    const timer2 = setTimeout(() => setShowHearts(true), 1000);
    const timer3 = setTimeout(() => setShowMessage(true), 1500);
    const timer4 = setTimeout(() => setShowButton(true), 2500);
    
    // Handle window resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Determine if mobile
  const isMobile = windowSize.width <= 768;
  const isSmallMobile = windowSize.width <= 480;
  
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/songs`);
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
    <div style={styles.container}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;400;500;700&display=swap');
          
          /* Animations */
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes floatIn {
            0% { opacity: 0; transform: translateY(40px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes heartBeat {
            0% { transform: scale(1); }
            14% { transform: scale(1.3); }
            28% { transform: scale(1); }
            42% { transform: scale(1.3); }
            70% { transform: scale(1); }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(227, 100, 181, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(227, 100, 181, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(227, 100, 181, 0); }
          }
          
          @keyframes floatUpHeart {
            0% { opacity: 0; transform: translateY(20px); }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-100px) rotate(20deg); }
          }
          
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes slideLeftRight {
            0% { transform: translateX(-10px); }
            50% { transform: translateX(10px); }
            100% { transform: translateX(-10px); }
          }
          
          @keyframes shimmer {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
          }
          
          @keyframes moveGradient {
            0% { background-position: 0% 0%; }
            100% { background-position: 100% 100%; }
          }
          
          /* Fix for the extra space */
          html, body, #root {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow-x: hidden;
          }
          
          /* Mobile styles */
          @media (max-width: 768px) {
            .title {
              font-size: 48px !important;
            }
            
            .message {
              font-size: 18px !important;
              padding: 24px 20px !important;
            }
            
            .button {
              font-size: 18px !important;
              padding: 14px 28px !important;
            }
          }
          
          @media (max-width: 480px) {
            .title {
              font-size: 40px !important;
            }
            
            .message {
              font-size: 16px !important;
              padding: 20px 16px !important;
            }
            
            .button {
              font-size: 16px !important;
              padding: 12px 24px !important;
            }
            
            .photo-frame {
              width: 280px !important;
              height: 280px !important;
            }
          }
        `}
      </style>
      
      {/* Moving background */}
      <div style={styles.backgroundGradient}></div>
      
      {/* Floating hearts */}
      {showHearts && (
        <div style={styles.floatingHeartsContainer}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`floating-heart-${i}`}
              style={{
                ...styles.floatingHeart,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 30 + 15}px`,
                animationDuration: `${Math.random() * 10 + 5}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            >
              ❤️
            </div>
          ))}
        </div>
      )}
      
      {/* Content container */}
      <div style={styles.contentContainer}>
        {/* Title */}
        <h1 
          className="title"
          style={{
            ...styles.title,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          Happiest Birthday Cutiee!
        </h1>
        
        {/* Photo frame */}
        <div 
          className="photo-frame"
          style={{
            ...styles.photoFrame,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'scale(1)' : 'scale(0.9)',
          }}
        >
          <img 
            src="\Ps.jpg"
            alt="Best friends smiling together"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '15px',
            }}
          />
        </div>
        
        {/* Message */}
        <div 
          className="message"
          style={{
            ...styles.message,
            opacity: showMessage ? 1 : 0,
            transform: showMessage ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
<p>Wishing you the happiest birthday, Madam Ji (Gulabi Dil Gulabi Dil)! I know you are going to enjoy your day doing the best thing you can—happy studying! Sorry (hehe)</p>          
          <div style={styles.heartDivider}>
            <span>❤</span>
          </div>
          
          <p>Today is all about celebrating <strong>YOU</strong>! Our friendship is one of my life's  blessings 💗
          , and I  Love everything about Us specially our Late Night Calls ✨❤ </p>
          
          <p>May your special day be filled with love, laughter, and Lots of Chokieee Chokieee🍫. I was going to create a playlist of songs dedicated to you. Initially, I thought it would be easy, but as time passed, I realized it wasn't my cup of tea nither you. Still, I tried my best😭.</p>          
          <div style={styles.heartDivider}>
            <span>❤</span>
          </div>
          
          <p style={styles.signature}>With all my love,<br/>Your bestie</p>
        </div>
        
        {/* Button */}
        <div 
          style={{
            ...styles.buttonContainer,
            opacity: showButton ? 1 : 0,
            transform: showButton ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          <Link to="/songs" style={styles.button}>
            View Your Special Playlist
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    padding: '20px',
    background: '#1a0a1f',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, #1a0a1f, #3d1a4b, #1f0a2f, #3d1a4b)',
    backgroundSize: '400% 400%',
    animation: 'moveGradient 15s ease infinite',
    opacity: 0.8,
    zIndex: 1,
  },
  floatingHeartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 2,
  },
  floatingHeart: {
    position: 'absolute',
    animation: 'floatUpHeart 10s linear infinite',
    opacity: 0,
  },
  contentContainer: {
    maxWidth: '800px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 3,
    padding: '20px',
  },
  title: {
    fontFamily: "'Dancing Script', cursive",
    fontSize: '60px',
    color: '#fff',
    textAlign: 'center',
    marginBottom: '30px',
    background: 'linear-gradient(90deg, #ff79c6, #e364b5, #bd93f9)',
    backgroundSize: '200% 200%',
    animation: 'gradientMove 4s ease infinite',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 2px 10px rgba(227, 100, 181, 0.6)',
    transition: 'opacity 1s ease, transform 1s ease',
  },
  photoFrame: {
    width: '320px',
    height: '320px',
    borderRadius: '20px',
    padding: '15px',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
    backdropFilter: 'blur(5px)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
    position: 'relative',
    marginBottom: '40px',
    transition: 'opacity 1s ease, transform 1s ease',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: '10px',
    background: 'linear-gradient(145deg, #2a1635, #3d1a4b)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  photoEmoji: {
    fontSize: '80px',
    marginBottom: '20px',
    animation: 'pulse 3s infinite',
  },
  photoText: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '16px',
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
  },
  frameDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '20px',
    background: 'linear-gradient(45deg, rgba(227, 100, 181, 0.2), rgba(189, 147, 249, 0.2))',
    opacity: 0.5,
    zIndex: 1,
    pointerEvents: 'none',
  },
  message: {
    background: 'rgba(26, 10, 31, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '30px',
    color: '#fff',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '18px',
    lineHeight: 1.7,
    maxWidth: '600px',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    marginBottom: '40px',
    transition: 'opacity 1s ease, transform 1s ease',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  heartDivider: {
    display: 'flex',
    justifyContent: 'center',
    margin: '20px 0',
    color: '#e364b5',
    fontSize: '24px',
    animation: 'heartBeat 1.5s infinite',
  },
  signature: {
    fontFamily: "'Dancing Script', cursive",
    fontSize: '24px',
    color: '#e364b5',
    marginTop: '20px',
  },
  buttonContainer: {
    marginTop: '10px',
    position: 'relative',
    transition: 'opacity 1s ease, transform 1s ease',
  },
  button: {
    background: 'linear-gradient(45deg, #e364b5, #bd93f9)',
    color: '#fff',
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '18px',
    fontWeight: '600',
    padding: '16px 32px',
    borderRadius: '30px',
    textDecoration: 'none',
    display: 'inline-block',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 15px 25px rgba(0, 0, 0, 0.4)',
    },
    '&:active': {
      transform: 'translateY(1px)',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '-50%',
      left: '-50%',
      width: '200%',
      height: '200%',
      background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
      transform: 'rotate(30deg)',
      pointerEvents: 'none',
    },
  },
};

export default BestieBirthdayLanding; 