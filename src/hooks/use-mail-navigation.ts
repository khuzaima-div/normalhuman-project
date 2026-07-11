import { useLocalStorage } from "usehooks-ts";

export type MailView = "inbox" | "draft" | "sent";
export type InboxFilter = "active" | "done";

const VIEW_KEY = "normalhuman-view";
const INBOX_FILTER_KEY = "normalhuman-inbox-filter";

export function useMailNavigation() {
  const [view, setViewRaw] = useLocalStorage<MailView>(VIEW_KEY, "inbox");
  const [inboxFilter, setInboxFilterRaw] = useLocalStorage<InboxFilter>(
    INBOX_FILTER_KEY,
    "active",
  );

  const setView = (next: MailView) => {
    setViewRaw(next);
    setInboxFilterRaw("active");
  };

  const setInboxFilter = (next: InboxFilter) => {
    setInboxFilterRaw(next);
    setViewRaw("inbox");
  };

  const done = view === "inbox" && inboxFilter === "done";

  return {
    view,
    inboxFilter,
    done,
    setView,
    setInboxFilter,
    /** @deprecated use view */
    tab: view,
    /** @deprecated use setView */
    setTab: setView,
  };
}
