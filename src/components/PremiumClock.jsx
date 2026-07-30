import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

const PremiumClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return { hours, minutes, ampm };
  };

  const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const { hours, minutes, ampm } = formatTime(time);

  return (
    <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-theme-surface/80 backdrop-blur-md border border-theme-border-soft rounded-2xl shadow-sm hover:shadow-lg hover:border-theme-accent/50 transition-all duration-500 group relative overflow-hidden">
      {/* Animated Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-accent/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
      
      <div className="relative z-10 w-9 h-9 rounded-xl bg-theme-app/60 flex items-center justify-center text-theme-accent border border-theme-accent/10 group-hover:bg-[image:var(--accent-gradient)] group-hover:text-white group-hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] transition-all duration-500">
        <Clock className="w-4 h-4" />
      </div>
      
      <div className="relative z-10 flex flex-col justify-center border-l border-theme-border-soft pl-3">
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-black text-theme-primary tracking-tight leading-none">
            {hours}:{minutes}
          </span>
          <span className="text-[9px] font-extrabold text-theme-accent uppercase tracking-widest leading-none">
            {ampm}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
          <Calendar className="w-2.5 h-2.5 text-theme-muted" />
          <span className="text-[9px] font-semibold text-theme-muted uppercase tracking-widest leading-none">
            {formatDate(time)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PremiumClock;
