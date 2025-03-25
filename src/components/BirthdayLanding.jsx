import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BirthdayLanding = () => {
  const [loaded, setLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  useEffect(() => {
    // Create staggered animations
    const timer1 = setTimeout(() => setLoaded(true), 500);
    const timer2 = setTimeout(() => setShowContent(true), 1200);
    
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
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Determine if mobile
  const isMobile = windowSize.width <= 768;
  
  return (
    <div style={styles.container}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;700&display=swap');
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @media (max-width: 768px) {
            .title {
              font-size: 32px !important;
            }
            
            .subtitle {
              font-size: 18px !important;
            }
            
            .button {
              font-size: 16px !important;
              padding: 14px 28px !important;
            }
          }
        `}
      </style>
      
      {/* Background */}
      <div style={styles.background}></div>
      
      {/* Content */}
      <div 
        style={{
          ...styles.content,
          opacity: loaded ? 1 : 0,
          transform: loaded ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div style={styles.imageContainer}>
          <div style={styles.imageWrapper}>
            <div style={styles.musicIcon}>🎵</div>
          </div>
        </div>
        
        <h1 className="title" style={styles.title}>Happy Birthday!</h1>
        
        <h2 className="subtitle" style={styles.subtitle}>
          Celebrate with a personalized music experience
        </h2>
        
        <div style={{
          ...styles.buttonContainer,
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(20px)',
        }}>
          <Link to="/birthday" style={styles.button}>
            Explore Playlist
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
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #4158D0, #C850C0, #FFCC70)',
    backgroundSize: '400% 400%',
    animation: 'gradientBG 15s ease infinite',
    zIndex: -1,
  },
  content: {
    maxWidth: '600px',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    transition: 'opacity 1s ease, transform 1s ease',
  },
  imageContainer: {
    marginBottom: '30px',
    animation: 'float 6s ease-in-out infinite',
  },
  imageWrapper: {
    width: '120px',
    height: '120px',
    backgroundColor: '#C850C0',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 20px rgba(200, 80, 192, 0.3)',
  },
  musicIcon: {
    fontSize: '60px',
  },
  title: {
    fontSize: '42px',
    color: '#333',
    marginBottom: '10px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
  },
  subtitle: {
    fontSize: '20px',
    color: '#666',
    marginBottom: '30px',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 300,
    lineHeight: 1.5,
  },
  buttonContainer: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    transition: 'opacity 1s ease, transform 1s ease',
  },
  button: {
    backgroundColor: '#4158D0',
    color: 'white',
    padding: '16px 32px',
    borderRadius: '30px',
    fontSize: '18px',
    fontWeight: 500,
    textDecoration: 'none',
    boxShadow: '0 5px 15px rgba(65, 88, 208, 0.4)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
    display: 'inline-block',
    fontFamily: "'Poppins', sans-serif",
    border: 'none',
    cursor: 'pointer',
    animation: 'pulse 2s infinite',
    '&:hover': {
      backgroundColor: '#3A4BBF',
      transform: 'translateY(-3px)',
      boxShadow: '0 8px 20px rgba(65, 88, 208, 0.6)',
    },
    '&:active': {
      transform: 'translateY(1px)',
      boxShadow: '0 2px 10px rgba(65, 88, 208, 0.4)',
    },
  },
  altButton: {
    backgroundColor: 'transparent',
    color: '#4158D0',
    padding: '16px 32px',
    borderRadius: '30px',
    fontSize: '18px',
    fontWeight: 500,
    textDecoration: 'none',
    border: '2px solid #4158D0',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, color 0.3s ease',
    display: 'inline-block',
    fontFamily: "'Poppins', sans-serif",
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#4158D0',
      color: 'white',
      transform: 'translateY(-3px)',
      boxShadow: '0 8px 20px rgba(65, 88, 208, 0.3)',
    },
    '&:active': {
      transform: 'translateY(1px)',
      boxShadow: '0 2px 10px rgba(65, 88, 208, 0.2)',
    },
  },
};

export default BirthdayLanding; 