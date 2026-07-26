import { useEffect, useState } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';

const useWindowSize = () => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
};

const WelcomeBoard = () => {
  const { nextStep } = useOnboarding();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowConfetti(false), 2500);
    const timer2 = setTimeout(() => nextStep(), 3500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [nextStep]);

  return (
    <div className="flex items-center justify-center p-4 min-h-[60vh]">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} />}
      
      <motion.div 
        className="text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-500" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black text-theme-primary tracking-tight mb-4">
          🎉 Congratulations!
        </h1>
        <p className="text-xl text-theme-muted font-bold">
          Your shop is ready.
        </p>
        <div className="mt-8">
          <div className="w-8 h-8 border-4 border-theme-accent/30 border-t-theme-accent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-theme-muted font-semibold mt-3 uppercase tracking-widest">Preparing your workspace...</p>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeBoard;
