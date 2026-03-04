"use client";
import React from "react";
import CountUp from "react-countup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Briefcase
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

interface DashboardSummaryProps {
  data?: DashboardCounts;
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ data }) => {
  const inactiveUsers = (data?.total_users || 0) - (data?.active_users || 0);
  const activePercentage = data?.total_users ? Math.round((data.active_users / data.total_users) * 100) : 0;

  // Main stats cards configuration
  const mainStats = [
    {
      title: "Total Users",
      value: data?.total_users || 0,
      icon: Users,
      color: "bg-blue-500",
      description: "All registered users",
    },
    {
      title: "Active Users",
      value: data?.active_users || 0,
      icon: UserCheck,
      color: "bg-green-500",
      description: `${activePercentage}% of total`,
    },
    {
      title: "Inactive Users",
      value: inactiveUsers,
      icon: UserX,
      color: "bg-orange-500",
      description: "Currently not active",
    },
    {
      title: "New Users (7d)",
      value: data?.recent_users_weekly || 0,
      icon: UserPlus,
      color: "bg-purple-500",
      description: "Last 7 days",
    },
  ];

  // Calculate totals
  const totalStaff = (data?.admin_count || 0) + 
    (data?.manager_count || 0) + 
    (data?.chef_count || 0) + 
    (data?.waiter_count || 0) + 
    (data?.cashier_count || 0) + 
    (data?.delivery_staff_count || 0);

  const genderData = [
    { label: "Male", count: data?.male_count || 0, color: "bg-blue-500", percentage: data?.total_users ? Math.round((data.male_count / data.total_users) * 100) : 0 },
    { label: "Female", count: data?.female_count || 0, color: "bg-pink-500", percentage: data?.total_users ? Math.round((data.female_count / data.total_users) * 100) : 0 },
    { label: "Other", count: data?.other_count || 0, color: "bg-purple-500", percentage: data?.total_users ? Math.round((data.other_count / data.total_users) * 100) : 0 },
  ];

  const roleData = [
    { label: "Admin", count: data?.admin_count || 0, icon: Shield, color: "bg-red-500" },
    { label: "Manager", count: data?.manager_count || 0, icon: Crown, color: "bg-yellow-500" },
    { label: "Chef", count: data?.chef_count || 0, icon: ChefHat, color: "bg-orange-500" },
    { label: "Waiter", count: data?.waiter_count || 0, icon: Utensils, color: "bg-green-500" },
    { label: "Cashier", count: data?.cashier_count || 0, icon: CreditCard, color: "bg-blue-500" },
    { label: "Delivery", count: data?.delivery_staff_count || 0, icon: Bike, color: "bg-purple-500" },
    { label: "Customer", count: data?.customer_count || 0, icon: Smile, color: "bg-teal-500" },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.color} p-2 rounded-lg text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CountUp end={stat.value} duration={1.5} separator="," />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gender Distribution - Single Card */}
      <div className="flex gap-x-6">
        <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Gender Distribution</CardTitle>
            </div>
            <Badge variant="outline">{data?.total_users || 0} Total</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {genderData.map((gender, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{gender.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      <CountUp end={gender.count} duration={1} />
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {gender.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress value={gender.percentage} className={`h-2 ${gender.color}`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Distribution - Single Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Role Distribution</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Staff: {totalStaff}</Badge>
              <Badge variant="outline">Customers: {data?.customer_count || 0}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roleData.map((role, idx) => {
              const Icon = role.icon;
              const percentage = data?.total_users 
                ? Math.round((role.count / data.total_users) * 100) 
                : 0;
              
              return (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`p-2 rounded-lg ${role.color} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{role.label}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold">
                        <CountUp end={role.count} duration={1} />
                      </p>
                      <span className="text-xs text-muted-foreground">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Stats Row */}
          <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Active Rate</p>
                <p className="text-sm font-semibold">{activePercentage}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Male:Female</p>
                <p className="text-sm font-semibold">
                  {Math.round((data?.male_count || 0) / Math.max(1, (data?.female_count || 1)) * 10) / 10}:1
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Staff:Customer</p>
                <p className="text-sm font-semibold">
                  1:{Math.round((data?.customer_count || 0) / Math.max(1, totalStaff))}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Staff</p>
                <p className="text-sm font-semibold">{totalStaff}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default DashboardSummary;