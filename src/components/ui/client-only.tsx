"use client";

import { useSyncExternalStore, ReactNode } from "react";

const emptySubscribe = () => () => {};

export function ClientOnly({ children }: { children: ReactNode }) {
    const mounted = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false
    );

    if (!mounted) return null;

    return <>{children}</>;
}
