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
                className="px-5 py-2.5 flex items-center justify-between cursor-pointer relative z-10 select-none transition-colors"
            >
                {active && (
                    <motion.div 
                        layoutId="kbar-result-item"
                        className="bg-zinc-100 dark:bg-zinc-800/80 border-l-2 border-zinc-900 dark:border-zinc-100 absolute inset-0 z-[-1]!"
                        transition={{
                            duration: 0.12,
                            type: 'spring',
                            stiffness: 400,
                            damping: 30,
                        }}
                    />
                )}
                
                <div className="flex gap-3 items-center relative z-10 min-w-0">
                    {action.icon && <div className="text-zinc-400 shrink-0">{action.icon}</div>}
                    <div className="flex flex-col min-w-0">
                        <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {ancestors.length > 0 &&
                                ancestors.map((ancestor) => (
                                    <React.Fragment key={ancestor.id}>
                                        <span className="opacity-40 mr-1">{ancestor.name}</span>
                                        <span className="opacity-30 mr-1">&rsaquo;</span>
                                    </React.Fragment>
                                ))}
                            <span>{action.name}</span>
                        </div>
                        {action.subtitle && (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-105">
                                {action.subtitle}
                            </span>
                        )}
                    </div>
                </div>
                
                {action.shortcut?.length ? (
                    <div className="grid grid-flow-col gap-1 relative z-10 shrink-0 ml-4">
                        {action.shortcut.map((sc) => (
                            <kbd
                                key={sc}
                                className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-700/80 shadow-sm font-sans font-medium rounded-md text-[10px] uppercase flex items-center justify-center min-w-4.5"
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