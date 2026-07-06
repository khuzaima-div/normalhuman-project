'use client'

import * as React from "react";
import { KBarResults, useKBar, Priority } from "kbar";
import Fuse from "fuse.js";
import ResultItem from "./ResultItem";

const fuseOptions = {
    keys: [
        {
            name: "name",
            weight: 0.5,
        },
        {
            name: "keywords",
            getFn: (item: any) => (item.keywords ?? "").split(","),
            weight: 0.5,
        },
        "subtitle",
    ],
    ignoreLocation: true,
    includeScore: true,
    includeMatches: true,
    threshold: 0.2,
    minMatchCharLength: 1,
};

function getRootActions(actions: Record<string, any>, rootActionId?: string | null) {
    return Object.keys(actions)
        .reduce((acc: any[], actionId) => {
            const action = actions[actionId];
            if (!action.parent && !rootActionId) {
                acc.push(action);
            }
            if (action.id === rootActionId) {
                for (let i = 0; i < action.children.length; i++) {
                    acc.push(action.children[i]);
                }
            }
            return acc;
        }, [])
        .sort((a, b) => b.priority - a.priority);
}

function flattenActions(actions: any[]) {
    const all = [...actions];

    function collect(items: any[]) {
        for (let i = 0; i < items.length; i++) {
            const action = items[i];
            if (action.children?.length > 0) {
                for (let j = 0; j < action.children.length; j++) {
                    all.push(action.children[j]);
                }
                collect(action.children);
            }
        }
    }

    collect(actions);
    return all;
}

function useImmediateMatches() {
    const { searchQuery: search, actions, currentRootActionId: rootActionId } = useKBar((state) => ({
        searchQuery: state.searchQuery,
        actions: state.actions,
        currentRootActionId: state.currentRootActionId,
    }));

    const rootResults = React.useMemo(
        () => getRootActions(actions, rootActionId),
        [actions, rootActionId]
    );

    const filtered = React.useMemo(
        () => (search?.trim() ? flattenActions(rootResults) : rootResults),
        [rootResults, search]
    );

    const fuse = React.useMemo(() => new Fuse(filtered, fuseOptions), [filtered]);

    const matches = React.useMemo(() => {
        if (!search?.trim()) {
            return filtered.map((action) => ({ score: 0, action }));
        }

        return fuse.search(search).map(({ item, score }) => ({
            score: 1 / ((score ?? 0) + 1),
            action: item,
        }));
    }, [filtered, fuse, search]);

    return React.useMemo(() => {
        const sectionMap: Record<string, { priority: number; action: any }[]> = {};
        const sectionList: { name: string; priority: number }[] = [];

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i]!;
            const action = match.action;
            const score = match.score || Priority.NORMAL;

            const sectionName = typeof action.section === "string"
                ? action.section
                : action.section?.name || "none";

            const sectionPriority = typeof action.section === "string"
                ? score
                : action.section?.priority ?? 0 + score;

            if (!sectionMap[sectionName]) {
                sectionMap[sectionName] = [];
                sectionList.push({ name: sectionName, priority: sectionPriority });
            }

            sectionMap[sectionName].push({
                priority: action.priority + score,
                action,
            });
        }

        const results = sectionList
            .sort((a, b) => b.priority - a.priority)
            .flatMap((group) => {
                const items = sectionMap[group.name];
                if (!items) return [];
                return group.name !== "none"
                    ? [group.name, ...items.sort((a, b) => b.priority - a.priority).map((item) => item.action)]
                    : items.sort((a, b) => b.priority - a.priority).map((item) => item.action);
            });

        return {
            results,
            rootActionId,
        };
    }, [matches, rootActionId]);
}

export default function RenderResults() {
    const { results, rootActionId } = useImmediateMatches();

    return (
        <KBarResults
            items={results}
            onRender={({ item, active }) =>
                typeof item === "string" ? (
                    <div className="px-5 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        {item}
                    </div>
                ) : (
                    <ResultItem
                        action={item}
                        active={active}
                        currentRootActionId={rootActionId ?? ""}
                    />
                )
            }
        />
    );
}