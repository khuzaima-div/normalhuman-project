import { api } from "@/trpc/react";
import { useAccountSelection } from "@/hooks/use-account-selection";

export const useThreads = (tab: string | null | undefined, done: boolean | null | undefined) => {
  const { accounts, accountId } = useAccountSelection();

  const cleanTab = tab ?? "inbox";
  const cleanDone = done ?? false;

  const { data: threads, isLoading: threadsLoading, refetch } = api.account.getThreads.useQuery(
    {
      accountId,
      tab: cleanTab,
      done: cleanDone,
    },
    {
      enabled: !!accountId && typeof cleanTab === "string" && typeof cleanDone === "boolean",
    }
  );

  return {
    threads,
    accounts,
    accountId,
    isLoading: threadsLoading,
    refetch,
  };
};