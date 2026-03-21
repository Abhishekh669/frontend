"use client";

import React from "react";
import CountUp from "react-countup";
import { CurrentAttendanceStats } from "@/utils/types/attendance.types";
import { Users, UserCheck, UserX, CalendarClock } from "lucide-react";

function AttendanceCard({ stats }: { stats: CurrentAttendanceStats }) {
  const data = [
    {
      title: "Total Employees",
      value: stats.total_employees,
      icon: Users,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10 dark:bg-blue-500/15",
      glow: "from-blue-500/5",
    },
    {
      title: "Present",
      value: stats.present_employees,
      icon: UserCheck,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      glow: "from-emerald-500/5",
    },
    {
      title: "Absent",
      value: stats.absent_employees,
      icon: UserX,
      iconColor: "text-rose-500",
      iconBg: "bg-rose-500/10 dark:bg-rose-500/15",
      glow: "from-rose-500/5",
    },
    {
      title: "On Leave",
      value: stats.leave_employees,
      icon: CalendarClock,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
      glow: "from-amber-500/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className="group relative rounded-2xl border border-border bg-card px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-default"
          >
            {/* Corner glow */}
            <div className={`pointer-events-none absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.12_85_/_0.08),transparent_70%)]`} />
            {/* Top accent line on hover */}
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/0 to-transparent group-hover:via-accent/40 transition-all duration-300" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {item.title}
                </p>
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  <CountUp
                    end={item.value}
                    duration={1.5}
                    separator=","
                    enableScrollSpy
                    scrollSpyOnce
                  />
                </p>
              </div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${item.iconBg} shrink-0`}>
                <Icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AttendanceCard;