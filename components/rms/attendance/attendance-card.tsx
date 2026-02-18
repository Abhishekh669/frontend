"use client";

import React from "react";
import CountUp from "react-countup";
import { CurrentAttendanceStats } from "@/utils/types/attendance.types";

function AttendanceCard({ stats }: { stats: CurrentAttendanceStats }) {
  const data = [
    {
      title: "Total Employees",
      value: stats.total_employees,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Present",
      value: stats.present_employees,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Absent",
      value: stats.absent_employees,
      color: "text-red-600 dark:text-red-400",
    },
    {
      title: "On Leave",
      value: stats.leave_employees,
      color: "text-yellow-600 dark:text-yellow-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((item, index) => (
        <div
          key={index}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-md p-5 flex flex-col items-center justify-center hover:shadow-md transition-all duration-300"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {item.title}
          </p>

          <p className={`text-2xl font-bold ${item.color}`}>
            <CountUp
              end={item.value}
              duration={1.5}
              separator=","
              enableScrollSpy
              scrollSpyOnce
            />
          </p>
        </div>
      ))}
    </div>
  );
}

export default AttendanceCard;
