"use client";
import { useGetUserFromToken } from '@/utils/hooks/tanstack-query/query-hook/user/use-get-user-from-token';
import React, { useEffect, useState } from 'react'
import { AppSidebar } from '../rms/app-sidebar';
import { cn } from '@/lib/utils';
import { Role } from '@/utils/types/user.types';

export interface UserPropsTypes {
    id: string;
    name: string;
    image: string;
    email: string;
    role: Role;
}

function RMSWrapper({ children }: { children: React.ReactNode }) {
    const { data, isLoading, isError } = useGetUserFromToken(true);
    const [collapsed, setCollapsed] = useState(false);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null; // or skeleton
    }


    if (isLoading) {
        return <div>Loading...</div>
    }
    if (isError || !data?.user) {
        return <div>Error loading user data</div>
    }

    const user: UserPropsTypes = {
        id: data.user.id,
        name: data.user.name,
        image: data.user.image || "",
        email: data.user.email,
        role: data.user.role
    }


    return (
        <div className='min-h-screen'>
            <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} user={user} />
            <main className={cn(
                "transition-all duration-300 ease-in-out min-h-screen p-8",
                collapsed ? "ml-18" : "ml-65"
            )}>

                {children}
            </main>
        </div>
    )
}

export default RMSWrapper
