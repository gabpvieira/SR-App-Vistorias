import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function WelcomeGreeting() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  const firstName = user.name.split(' ')[0];
  
  const dateString = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const timeString = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Olá, {firstName}!
      </h2>
      <p className="text-muted-foreground">
        Hoje é {dateString}, {timeString}
      </p>
    </div>
  );
}
