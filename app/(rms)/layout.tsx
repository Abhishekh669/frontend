import RMSWrapper from '@/components/wrapper/rms-wrapper'
import React from 'react'

function RMSLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <RMSWrapper>
                {children}
            </RMSWrapper>
        </>
    )
}

export default RMSLayout
