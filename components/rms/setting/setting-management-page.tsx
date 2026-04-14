"use client"
import { useGetRestaurantInformation } from '@/utils/hooks/tanstack-query/query-hook/setting/use-get-restaurant-information';
import { User } from '@/utils/types/user.types';
import { hasPermission } from '@/utils/helper/check-permission';
import SettingPrivacyRelatedPage from './setting-privacy-related';
import SettingRestaurantInfoPage from './setting-restaruant-info';

function SettingManagementPage({ user }: { user: User }) {
  if (!user) return null;
  const { data, isLoading, isError } = useGetRestaurantInformation();
  const info = data?.info;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-medium text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage restaurant details and account security</p>
      </div>

      {hasPermission(user.role, 'view:restaurant_information') && (
        <SettingRestaurantInfoPage  info={info} isLoading={isLoading} isError={isError} user={user} />
      )}

      <SettingPrivacyRelatedPage user={user} />
    </div>
  );
}

export default SettingManagementPage;