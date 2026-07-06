import { useState } from "react";
import { api } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";
import { useAccountSelection } from "./use-account-selection";

export const useThreads = () => {
  const { accounts, accountId, setAccountId, loading: accountsLoading } = useAccountSelection();
  const account = accounts.find((acc) => String(acc.id) === String(accountId)) ?? null;
  const [tab, setTab] = useLocalStorage<string>("normalhuman-tab", "inbox");
  const [done] = useLocalStorage<boolean>("done", false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const { data: threads, isLoading: threadsLoading, refetch } = api.account.getThreads.useQuery(
    {
      accountId,
      tab: tab || "inbox",
      done: done ?? false,
    },
    {
      enabled: !!accountId,
    }
  );

  const isLoading = accountsLoading || threadsLoading;

  return {
    threads: threads || [],
    accounts,
    account,
    accountId,
    setAccountId,
    tab,
    setTab,
    selectedThreadId,
    setSelectedThreadId,
    loading: isLoading,
    isLoading,
    refetch,
  };
};