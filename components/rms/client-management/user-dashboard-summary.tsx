"use client";
import React from "react";
import CountUp from "react-countup";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  TrendingUp,
  Award,
  ChefHat,
  Utensils,
  CreditCard,
  Bike,
  Shield,
  Crown,
  Smile,
  UsersRound,
  Briefcase,
} from "lucide-react";

export interface DashboardCounts {
  total_users: number;
  active_users: number;
  male_count: number;
  female_count: number;
  other_count: number;
  recent_users_weekly: number;
  admin_count: number;
  chef_count: number;
  waiter_count: number;
  cashier_count: number;
  delivery_staff_count: number;
  manager_count: number;
  customer_count: number;
}

interface Props {
  data?: DashboardCounts;
}

const DashboardSummary: React.FC<Props> = ({ data }) => {
  const inactiveUsers = (data?.total_users || 0) - (data?.active_users || 0);
  const activePercentage = data?.total_users
    ? Math.round((data.active_users / data.total_users) * 100)
    : 0;

  const totalStaff =
    (data?.admin_count || 0) +
    (data?.manager_count || 0) +
    (data?.chef_count || 0) +
    (data?.waiter_count || 0) +
    (data?.cashier_count || 0) +
    (data?.delivery_staff_count || 0);

  const mainStats = [
    {
      title: "Total Users",
      value: data?.total_users || 0,
      icon: Users,
      description: "All registered",
      accentClass: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/15",
    },
    {
      title: "Active",
      value: data?.active_users || 0,
      icon: UserCheck,
      description: `${activePercentage}% of total`,
      accentClass: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15",
    },
    {
      title: "Inactive",
      value: inactiveUsers,
      icon: UserX,
      description: "Currently offline",
      accentClass: "text-orange-500 bg-orange-500/10 dark:bg-orange-500/15",
    },
    {
      title: "New This Week",
      value: data?.recent_users_weekly || 0,
      icon: UserPlus,
      description: "Last 7 days",
      accentClass: "text-violet-500 bg-violet-500/10 dark:bg-violet-500/15",
    },
  ];

  const genderData = [
    {
      label: "Male",
      count: data?.male_count || 0,
      barColor: "bg-blue-500",
      percentage: data?.total_users
        ? Math.round((data.male_count / data.total_users) * 100)
        : 0,
    },
    {
      label: "Female",
      count: data?.female_count || 0,
      barColor: "bg-pink-500",
      percentage: data?.total_users
        ? Math.round((data.female_count / data.total_users) * 100)
        : 0,
    },
    {
      label: "Other",
      count: data?.other_count || 0,
      barColor: "bg-violet-500",
      percentage: data?.total_users
        ? Math.round((data.other_count / data.total_users) * 100)
        : 0,
    },
  ];

  const roleData = [
    { label: "Admin", count: data?.admin_count || 0, icon: Shield, dot: "bg-purple-500" },
    { label: "Manager", count: data?.manager_count || 0, icon: Crown, dot: "bg-amber-500" },
    { label: "Chef", count: data?.chef_count || 0, icon: ChefHat, dot: "bg-orange-500" },
    { label: "Waiter", count: data?.waiter_count || 0, icon: Utensils, dot: "bg-green-500" },
    { label: "Cashier", count: data?.cashier_count || 0, icon: CreditCard, dot: "bg-blue-500" },
    { label: "Delivery", count: data?.delivery_staff_count || 0, icon: Bike, dot: "bg-cyan-500" },
    { label: "Customer", count: data?.customer_count || 0, icon: Smile, dot: "bg-teal-500" },
  ];

  return (
    <div className="space-y-5">

      {/* ── Top KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="relative overflow-hidden rounded-2xl border border-border bg-card px-5 py-5 shadow-sm hover:shadow-md transition-shadow group"
            >
              {/* subtle corner glow */}
              <div className="pointer-events-none absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[radial-gradient(circle,var(--color-accent)/8%,transparent_70%)]" />

              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {stat.title}
                </p>
                <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${stat.accentClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl font-bold tracking-tight text-foreground">
                <CountUp end={stat.value} duration={1.5} separator="," />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{stat.description}</p>
            </div>
          );
        })}
      </div>

      {/* ── Distribution Row ── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Gender Distribution */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted">
                <UsersRound className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Gender Distribution</h3>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {data?.total_users || 0} total
            </span>
          </div>

          <div className="space-y-4">
            {genderData.map((g) => (
              <div key={g.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{g.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      <CountUp end={g.count} duration={1} />
                    </span>
                    <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                      {g.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${g.barColor}`}
                    style={{ width: `${g.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Active rate strip */}
          <div className="mt-5 pt-4 border-t border-border flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Active rate</span>
            <span className="ml-auto text-xs font-semibold text-foreground">{activePercentage}%</span>
          </div>
        </div>

        {/* Role Distribution */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Role Distribution</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Staff: {totalStaff}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Customers: {data?.customer_count || 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {roleData.map((role) => {
              const Icon = role.icon;
              const pct = data?.total_users
                ? Math.round((role.count / data.total_users) * 100)
                : 0;
              return (
                <div
                  key={role.label}
                  className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 hover:bg-muted/60 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${role.dot}`} />
                  <span className="text-xs font-medium text-foreground truncate flex-1">
                    {role.label}
                  </span>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-foreground">
                      <CountUp end={role.count} duration={1} />
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-muted-foreground">
              Staff to customer ratio
            </span>
            <span className="ml-auto text-xs font-semibold text-foreground">
              1 : {Math.round((data?.customer_count || 0) / Math.max(1, totalStaff))}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardSummary;



