'use client'

import { motion } from 'framer-motion'
import * as React from "react";
import type { ActionImpl, ActionId } from "kbar";

const ResultItem = React.forwardRef(
    (
        {
            action,
            active,
            currentRootActionId,
        }: {
            action: ActionImpl;
            active: boolean;
            currentRootActionId: ActionId;
        },
        ref: React.Ref<HTMLDivElement>
    ) => {
        const ancestors = React.useMemo(() => {
            if (!currentRootActionId) return action.ancestors;
            const index = action.ancestors.findIndex(
                (ancestor) => ancestor.id === currentRootActionId
            );
            return action.ancestors.slice(index + 1);
        }, [action.ancestors, currentRootActionId]);

        return (
            <div
                ref={ref}
                className="relative flex cursor-pointer select-none items-center justify-between px-4 py-2.5 transition-colors duration-150"
            >
                {active && (
                    <motion.div 
                        layoutId="kbar-result-item"
                        className="absolute inset-x-2 inset-y-0.5 rounded-lg bg-accent"
                        transition={{
                            duration: 0.12,
                            type: 'spring',
                            stiffness: 400,
                            damping: 30,
                        }}
                    />
                )}
                
                <div className="relative z-10 flex min-w-0 items-center gap-3">
                    {action.icon && <div className="shrink-0 text-muted-foreground">{action.icon}</div>}
                    <div className="flex min-w-0 flex-col">
                        <div className="text-body font-medium text-foreground">
                            {ancestors.length > 0 &&
                                ancestors.map((ancestor) => (
                                    <React.Fragment key={ancestor.id}>
                                        <span className="mr-1 opacity-40">{ancestor.name}</span>
                                        <span className="mr-1 opacity-30">&rsaquo;</span>
                                    </React.Fragment>
                                ))}
                            <span>{action.name}</span>
                        </div>
                        {action.subtitle && (
                            <span className="truncate text-caption text-muted-foreground max-w-105">
                                {action.subtitle}
                            </span>
                        )}
                    </div>
                </div>
                
                {action.shortcut?.length ? (
                    <div className="relative z-10 ml-4 grid shrink-0 grid-flow-col gap-1">
                        {action.shortcut.map((sc) => (
                            <kbd
                                key={sc}
                                className="kbd-hint min-w-4.5"
                            >
                                {sc}
                            </kbd>
                        ))}
                    </div>
                ) : null}
            </div>
        );
    }
);

ResultItem.displayName = "ResultItem";
export default ResultItem;
