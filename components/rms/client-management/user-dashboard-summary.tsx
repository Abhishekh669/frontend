import React from "react";

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

  // Gender stats (neutral colors for light/dark mode)
  const genderStats = [
    { name: "Male", count: data?.male_count || 0 },
    { name: "Female", count: data?.female_count || 0 },
    { name: "Other", count: data?.other_count || 0 },
  ];

  // Role stats (neutral colors for light/dark mode)
  const roleStats = [
    { name: "Admin", count: data?.admin_count || 0 },
    { name: "Manager", count: data?.manager_count || 0 },
    { name: "Chef", count: data?.chef_count || 0 },
    { name: "Waiter", count: data?.waiter_count || 0 },
    { name: "Cashier", count: data?.cashier_count || 0 },
    { name: "Delivery Staff", count: data?.delivery_staff_count || 0 },
    { name: "Customer", count: data?.customer_count || 0 },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={data?.total_users || 0} />
        <StatCard title="Active Users" value={data?.active_users || 0} />
        <StatCard title="Inactive Users" value={inactiveUsers} />
        <StatCard title="Recent Users (7d)" value={data?.recent_users_weekly || 0} />
      </div>

      {/* Gender + Role Stats */}
      <div className="flex flex-col md:flex-row md:gap-x-12">
        {/* Gender */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Gender Distribution</h3>
          <div className="flex flex-wrap gap-3">
            {genderStats.map((gender, idx) => (
              <div
                key={idx}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium transition-transform transform hover:scale-105"
              >
                {gender.name}: {gender.count}
              </div>
            ))}
          </div>
        </div>

        {/* Role */}
        <div className="flex-1 mt-6 md:mt-0">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Role Distribution</h3>
          <div className="grid grid-cols-2 gap-3">
            {roleStats.map((role, idx) => (
              <div
                key={idx}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium transition-transform transform hover:scale-105"
              >
                {role.name}: {role.count}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => (
  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-md p-5 flex flex-col items-center justify-center hover:shadow-md transition-shadow duration-300">
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString()}</p>
  </div>
);

export default DashboardSummary;
