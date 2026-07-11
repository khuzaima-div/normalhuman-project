import { useMailNavigation } from "./use-mail-navigation";
import { api } from "@/trpc/react";
import { useAccountSelection } from "./use-account-selection";

export const useThreads = () => {
  const { accounts, accountId, setAccountId, loading: accountsLoading } =
    useAccountSelection();
  const account =
    accounts.find((acc) => String(acc.id) === String(accountId)) ?? null;
  const { view, done, setView, setInboxFilter, inboxFilter } =
    useMailNavigation();

  const { data: threads, isLoading: threadsLoading, refetch } =
    api.account.getThreads.useQuery(
      {
        accountId,
        view: view ?? "inbox",
        done: done ?? false,
      },
      {
        enabled: !!accountId,
      },
    );

  const isLoading = accountsLoading || threadsLoading;

  return {
    threads: threads ?? [],
    accounts,
    account,
    accountId,
    setAccountId,
    view,
    inboxFilter,
    done,
    setView,
    setInboxFilter,
    tab: view,
    setTab: setView,
    loading: isLoading,
    isLoading,
    refetch,
  };
};
