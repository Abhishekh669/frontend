"use client"

import {  QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { queryClient } from "../helper/tanstack-query/react-query"

export default function QueryProvider({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            {children}
        </QueryClientProvider>
    )
}