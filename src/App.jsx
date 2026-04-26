import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import MotorForm from './components/MotorForm';
import DesignReport from './components/DesignReport';
import { generateMotorDesign } from './utils/aiEngine';

function App() {
  const [designData, setDesignData] = useState(null);
  const [userInputs, setUserInputs] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleGenerate = async (inputs) => {
    setIsGenerating(true);
    try {
      const result = await generateMotorDesign(inputs);
      setDesignData(result);
      setUserInputs(inputs);
    } catch (error) {
      console.error("Failed to generate design", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            boxShadow: '0 4px 15px rgba(0, 210, 255, 0.3)'
          }}>
            <img src="/logo.png" alt="MotorMorph AI Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', letterSpacing: '-0.03em' }}>MotorMorph <span className="text-gradient">AI</span></h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Intelligent EV Powertrain Design
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              padding: '0.4rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'all 0.2s'
            }}
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            <span style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          </button>
        </div>
      </header>

      <main className="main-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: 1.1 }}>
              Design the <span className="text-gradient">Future</span> of Mobility.
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Input your vehicle's core requirements, and our advanced physics-based AI engine will formulate the optimal electric motor architecture, estimating performance, efficiency, and physical parameters in seconds.
            </p>
          </motion.div>
          
          <MotorForm onSubmit={handleGenerate} isGenerating={isGenerating} />
        </div>

        <div style={{ height: '100%' }}>
          <DesignReport data={designData} inputs={userInputs} />
        </div>
      </main>
    </div>
  );
}

export default App;
