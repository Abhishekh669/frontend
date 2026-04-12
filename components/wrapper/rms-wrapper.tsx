"use client";
import { useGetUserFromToken } from '@/utils/hooks/tanstack-query/query-hook/user/use-get-user-from-token';
import React, { useEffect, useState } from 'react'
import { AppSidebar } from '../rms/app-sidebar';
import { cn } from '@/lib/utils';
import { Role } from '@/utils/types/user.types';
import { useRouter } from 'next/navigation';

export interface UserPropsTypes {
    id: string;
    name: string;
    image: string;
    email: string;
    role: Role;
}

function RMSWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { data, isLoading, isError } = useGetUserFromToken(true);
    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isLoading && (isError || !data?.user)) {
            router.replace("/login");
        }
    }, [isLoading, isError, data, router]);

    if (!mounted || isLoading) {
        return <LoadingSkeleton />;
    }

    if (isError || !data?.user) {
        return null;
    }

    const user: UserPropsTypes = {
        id: data.user.id,
        name: data.user.name,
        image: data.user.image || "",
        email: data.user.email,
        role: data.user.role,
    };

    return (
        <div className="min-h-screen">
            <AppSidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
                user={user}
            />
            <main
                className={cn(
                    "transition-all duration-300 ease-in-out min-h-screen p-8",
                    collapsed ? "ml-18" : "ml-65"
                )}
            >
                {children}
            </main>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="min-h-screen flex">
            <div className="w-65 min-h-screen bg-white border-r border-gray-100 flex flex-col gap-4 p-4 shrink-0">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="space-y-2 mt-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
                    ))}
                </div>
            </div>
            <main className="flex-1 p-8 space-y-4">
                <div className="h-7 bg-gray-200 rounded animate-pulse w-1/4" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" />
                <div className="grid grid-cols-3 gap-4 mt-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="h-64 bg-gray-100 rounded-xl animate-pulse mt-4" />
            </main>
        </div>
    );
}

export default RMSWrapper;