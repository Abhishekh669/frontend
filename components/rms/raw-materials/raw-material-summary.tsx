import React from "react";

interface RawMaterialSummaryProps {
  total_materials ?: number;
  total_quantity ?: number;
  total_price ?: number;
  recent_price ?: number;
}

const RawMaterialSummary: React.FC<RawMaterialSummaryProps> = ({
  total_materials = 0,
  total_quantity = 0,
  total_price = 0,
  recent_price = 0,
}) => {
  const stats = [
    { title: "Total Materials", value: total_materials },
    { title: "Total Quantity", value: total_quantity },
    { title: "Total Price (Rs)", value: total_price },
    {title : "Recent Price (Rs)", value : recent_price}
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-md p-5 flex flex-col items-center justify-center hover:shadow-md transition-shadow duration-300"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};


export default RawMaterialSummary;
