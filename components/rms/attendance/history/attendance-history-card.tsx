import React, { useEffect, useState } from 'react';
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

const colorConfig = {
  default: {
    iconBg: 'bg-primary/10',
    iconText: 'text-primary',
  },
  green: {
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    iconText: 'text-emerald-500',
  },
  red: {
    iconBg: 'bg-rose-500/10 dark:bg-rose-500/15',
    iconText: 'text-rose-500',
  },
  yellow: {
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    iconText: 'text-amber-500',
  },
  blue: {
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/15',
    iconText: 'text-blue-500',
  },
  purple: {
    iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',
    iconText: 'text-violet-500',
  },
  orange: {
    iconBg: 'bg-orange-500/10 dark:bg-orange-500/15',
    iconText: 'text-orange-500',
  },
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
  isLoading = false,
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

  const { iconBg, iconText } = colorConfig[color];

  if (isLoading) {
    return (
      <div className={`rounded-2xl border border-border bg-card px-5 py-5 shadow-sm min-h-[100px] ${className || ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-14 rounded-full bg-muted" />
            <Skeleton className="h-7 w-10 rounded-xl bg-muted" />
          </div>
          <Skeleton className="h-9 w-9 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`group relative rounded-2xl border border-border bg-card px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default overflow-hidden min-h-[100px] ${className || ''}`}
    >
      {/* Corner radial glow */}
      <div className="pointer-events-none absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.12_85_/_0.08),transparent_70%)]" />
      {/* Top accent line on hover */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/0 to-transparent group-hover:via-accent/40 transition-all duration-300" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {text}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
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
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${iconBg} shrink-0`}>
            <span className={iconText}>{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendnaceHistoryCard;