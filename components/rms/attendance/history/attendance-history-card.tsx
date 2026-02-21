import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

interface AttendanceHistoryCardProps {
  text: string;
  value: number;
  icon?: React.ReactNode;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  color?: 'default' | 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'orange';
  isLoading?: boolean;
}

const colorClasses = {
  default: 'bg-primary/10 text-primary',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
};

function AttendnaceHistoryCard({ 
  text, 
  value, 
  icon, 
  className,
  prefix = '',
  suffix = '',
  duration = 2,
  color = 'default',
  isLoading = false
}: AttendanceHistoryCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [inView]);

  const iconColorClass = colorClasses[color];

  if (isLoading) {
    return (
      <Card className={`p-4 min-h-[100px] ${className || ''}`}>
        <div className="flex items-center justify-between h-full">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      ref={ref}
      className={`p-4 flex items-center justify-between hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-default min-h-[100px] ${className || ''}`}
    >
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {text}
        </p>
        <p className="text-2xl md:text-3xl font-bold text-foreground">
          {isVisible ? (
            <CountUp
              end={value}
              duration={duration}
              separator=","
              delay={0}
              useEasing={true}
              start={0}
              prefix={prefix}
              suffix={suffix}
            />
          ) : (
            <span>0</span>
          )}
        </p>
      </div>
      {icon && (
        <div className={`p-2.5 rounded-full ${iconColorClass}`}>
          {icon}
        </div>
      )}
    </Card>
  );
}

export default AttendnaceHistoryCard;