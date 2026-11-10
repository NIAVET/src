import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [level, setLevel] = useState(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentLetter, setCurrentLetter] = useState('b');
  const [choices, setChoices] = useState([]);
  const [message, setMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Pour le chronomètre et le suivi
  const startTime = useRef(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [history, setHistory] = useState([]);

  // Charger l'historique au démarrage
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('dystrack_history')) || [];
    setHistory(savedHistory);
  }, []);

    const levelsConfig = {
    CP: { title: "Niveau CP (Lettres)", pool: ['b', 'd', 'p', 'q'] },
    CE1: { title: "Niveau CE1 (Syllabes)", pool: ['ba', 'da', 'pa', 'qa', 'bo', 'do', 'po', 'qo'] },
    CM2: { title: "Niveau CM2 (Mots)", pool: ['bateau', 'dateau', 'pateau', 'qateau', 'balle', 'dalle', 'palle', 'qalle', 'barre', 'darre', 'parre', 'qarre'] }
  };

  const playSound = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      if (text.length <= 3) utterance.text = `La syllabe ${text}`;
      if (text.length === 1) utterance.text = `La lettre ${text}`;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startGame = (selectedLevel) => {
    setLevel(selectedLevel);
    setScore(0);
    setQuestionCount(0);
    setReactionTimes([]);
    setIsPlaying(true);
    setShowDashboard(false);
    generateQuestion(selectedLevel, 1);
  };

  const generateQuestion = (currentLevel = level, nextCount = questionCount + 1) => {
    if (nextCount > 10) {
      endGame();
      return;
    }

    const config = levelsConfig[currentLevel];
    const target = config.pool[Math.floor(Math.random() * config.pool.length)];
    setCurrentLetter(target);
    
    let options = [target];
    while (options.length < 3) {
      const randomOption = config.pool[Math.floor(Math.random() * config.pool.length)];
      if (!options.includes(randomOption)) {
        options.push(randomOption);
      }
    }
    
    options.sort(() => Math.random() - 0.5);
    setChoices(options);
    setMessage('');
    setQuestionCount(nextCount);
    
    startTime.current = Date.now(); 
  };

  const handleChoice = (choice) => {
    const reactionTime = (Date.now() - startTime.current) / 1000;
    setReactionTimes(prev => [...prev, reactionTime]);
    
    if (choice === currentLetter) {
      setScore(score + 1);
      setMessage(`Bravo ! 🎉 (Temps : ${reactionTime.toFixed(1)}s)`);
      playSound('Bravo !');
    } else {
      setMessage(`Oups... (Temps : ${reactionTime.toFixed(1)}s)`);
      playSound('Oups, réessaie.');
    }
  };

  // --- SAUVEGARDER ET AFFICHER LE BILAN ---
  const endGame = () => {
    setIsPlaying(false);
    
    const averageTime = reactionTimes.length > 0 
      ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(2) 
      : 0;

    const newSession = {
      date: new Date().toLocaleDateString('fr-FR'),
      level: level,
      score: score,
      avgTime: averageTime
    };

    const updatedHistory = [newSession, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('dystrack_history', JSON.stringify(updatedHistory));
    
    setShowDashboard(true);
  };

  // --- ÉCRAN 1 : MENU PRINCIPAL ---
  if (!isPlaying && !showDashboard) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>DysTrack</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>Choisis ton niveau :</p>
        <div style={styles.menuGrid}>
          <button style={styles.menuButton} onClick={() => startGame('CP')}>CP</button>
          <button style={styles.menuButton} onClick={() => startGame('CE1')}>CE1</button>
          <button style={styles.menuButton} onClick={() => startGame('CM2')}>CM2</button>
        </div>
        
        <button style={styles.dashboardButton} onClick={() => setShowDashboard(true)}>
          📊 Voir mes progrès
        </button>
      </div>
    );
  }

  // --- ÉCRAN 2 : TABLEAU DE BORD (SUIVI) ---
  if (showDashboard) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Mes Progrès 📊</h1>
        
        <div style={styles.gameArea}>
          {history.length === 0 ? (
            <p>Tu n'as pas encore joué !</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Niveau</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Temps Moy.</th>
                </tr>
              </thead>
              <tbody>
                {history.map((session, index) => (
                  <tr key={index} style={index % 2 === 0 ? styles.trEven : {}}>
                    <td style={styles.td}>{session.date}</td>
                    <td style={styles.td}>{session.level}</td>
                    <td style={styles.td}><strong>{session.score}/10</strong></td>
                    <td style={styles.td}>{session.avgTime}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button style={styles.backButton} onClick={() => setShowDashboard(false)}>
          ⬅️ Retour au menu
        </button>
      </div>
    );
  }

  // --- ÉCRAN 3 : LE JEU ---
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>{levelsConfig[level].title}</h1>
      
      <div style={styles.scoreBoard}>
        Note : {score} ⭐ | Question : {questionCount} / 10
      </div>

      <div style={styles.gameArea}>
        <div style={styles.instructionZone}>
          <p style={styles.instruction}>
            Clique sur : <strong>{currentLetter}</strong>
          </p>
          <button style={styles.audioButton} onClick={() => playSound(`Clique sur ${currentLetter}`)}>
            🔊 Écouter
          </button>
        </div>
        
        <div style={styles.choicesContainer}>
          {choices.map((choice) => (
            <button 
              key={choice} 
              style={{...styles.button, fontSize: choice.length > 2 ? '1.5rem' : '3rem'}}
              onClick={() => handleChoice(choice)}
            >
              {choice}
            </button>
          ))}
        </div>

        {message && <p style={styles.message}>{message}</p>}
        
        <button style={styles.nextButton} onClick={() => generateQuestion()}>
          Question suivante ➡️
        </button>
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#fdf6e3',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: { color: '#333', fontSize: '2rem', marginBottom: '20px' },
  scoreBoard: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#ff8c00',
    marginBottom: '20px',
  },
  menuGrid: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '40px',
  },
  menuButton: {
    fontSize: '2rem',
    padding: '30px 50px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  dashboardButton: {
    fontSize: '1.2rem',
    padding: '15px 30px',
    backgroundColor: '#fff',
    color: '#2196F3',
    border: '2px solid #2196F3',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  gameArea: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    width: '90%',
    maxWidth: '600px',
    marginBottom: '20px',
  },
  instructionZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
  },
  instruction: { fontSize: '1.8rem', marginBottom: '10px' },
  audioButton: {
    fontSize: '1.2rem',
    padding: '10px 20px',
    backgroundColor: '#ffeb3b',
    border: '2px solid #fbc02d',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  choicesContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  button: {
    width: '120px',
    height: '100px',
    borderRadius: '15px',
    border: '3px solid #4CAF50',
    backgroundColor: '#e8f5e9',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  message: {
    fontSize: '1.5rem',
    color: '#4CAF50',
    height: '40px',
    fontWeight: 'bold',
  },
  nextButton: {
    padding: '15px 30px',
    fontSize: '1.2rem',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  backButton: {
    padding: '10px 20px',
    fontSize: '1.2rem',
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
  },
  th: {
    borderBottom: '2px solid #ddd',
    padding: '10px',
    backgroundColor: '#f4f4f4',
  },
  td: {
    borderBottom: '1px solid #ddd',
    padding: '10px',
  },
  trEven: {
    backgroundColor: '#fafafa',
  }
};

export default App;