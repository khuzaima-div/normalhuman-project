"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mail = Mail;
var React = require("react");
var react_resizable_panels_1 = require("react-resizable-panels");
var utils_1 = require("@/lib/utils");
var resizable_1 = require("@/components/ui/resizable");
var separator_1 = require("@/components/ui/separator");
var tabs_1 = require("@/components/ui/tabs");
var tooltip_1 = require("@/components/ui/tooltip");
var account_switcher_1 = require("@/app/mail/components/account-switcher");
var sidebar_1 = require("@/app/mail/components/sidebar");
var DEFAULT_LAYOUT = [20, 32, 48];
var layoutValue = function (layout, index) {
    var value = layout === null || layout === void 0 ? void 0 : layout[index];
    if (typeof value !== "number" || Number.isNaN(value)) {
        return DEFAULT_LAYOUT[index];
    }
    return value;
};
var makePanelSize = function (value) {
    if (typeof value === "number") {
        return value > 0 && value <= 100 ? "".concat(value, "%") : value;
    }
    return value;
};
function Mail(_a) {
    var _b;
    var defaultLayout = _a.defaultLayout, _c = _a.defaultCollapsed, defaultCollapsed = _c === void 0 ? false : _c, _d = _a.navCollapsedSize, navCollapsedSize = _d === void 0 ? 4 : _d;
    var _e = React.useState(false), done = _e[0], setDone = _e[1];
    var _f = React.useState(false), isMounted = _f[0], setIsMounted = _f[1];
    var _g = React.useState(false), isCollapsed = _g[0], setIsCollapsed = _g[1];
    var sidebarRef = (0, react_resizable_panels_1.usePanelRef)();
    React.useEffect(function () {
        setIsMounted(true);
    }, []);
    React.useEffect(function () {
        var _a, _b, _c;
        if (!isMounted)
            return;
        if (defaultCollapsed) {
            (_a = sidebarRef.current) === null || _a === void 0 ? void 0 : _a.collapse();
        }
        setIsCollapsed((_c = (_b = sidebarRef.current) === null || _b === void 0 ? void 0 : _b.isCollapsed()) !== null && _c !== void 0 ? _c : false);
    }, [defaultCollapsed, isMounted, sidebarRef]);
    var safeLayout = [
        layoutValue(defaultLayout, 0),
        layoutValue(defaultLayout, 1),
        layoutValue(defaultLayout, 2),
    ];
    var defaultGroupLayout = React.useMemo(function () { return ({
        sidebar: safeLayout[0],
        threads: safeLayout[1],
        preview: safeLayout[2],
    }); }, [safeLayout[0], safeLayout[1], safeLayout[2]]);
    var panelDefaultSizes = {
        sidebar: makePanelSize(safeLayout[0]),
        threads: makePanelSize(safeLayout[1]),
        preview: makePanelSize(safeLayout[2]),
    };
    var collapsedSize = (_b = makePanelSize(navCollapsedSize)) !== null && _b !== void 0 ? _b : "4%";
    if (!isMounted)
        return null;
    return (<tooltip_1.TooltipProvider delayDuration={0}>
      <div className="fixed inset-0 flex h-screen w-screen items-stretch overflow-hidden bg-white select-none">
        <resizable_1.ResizablePanelGroup direction="horizontal" defaultLayout={defaultGroupLayout} onLayoutChanged={function (layout) {
            var layoutValues = Object.values(layout);
            document.cookie = "react-resizable-panels:layout:mail=".concat(JSON.stringify(layoutValues), "; path=/");
        }} className="items-stretch h-full w-full">
          <resizable_1.ResizablePanel id="sidebar" panelRef={sidebarRef} defaultSize={panelDefaultSizes.sidebar} collapsedSize={collapsedSize} collapsible minSize="15%" maxSize="25%" onResize={function () {
            var _a, _b;
            setIsCollapsed((_b = (_a = sidebarRef.current) === null || _a === void 0 ? void 0 : _a.isCollapsed()) !== null && _b !== void 0 ? _b : false);
        }} className="border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out">
            <div className="flex h-full w-full flex-col bg-white">
              <div className={(0, utils_1.cn)("flex h-13 items-center justify-center bg-white shrink-0", isCollapsed ? "px-0" : "px-4")}>
                <account_switcher_1.AccountSwitcher isCollapsed={isCollapsed}/>
              </div>
              <separator_1.Separator />
              <div className="flex-1 overflow-y-auto p-2 bg-white">
                <sidebar_1.SideBar isCollapsed={isCollapsed}/>
              </div>
            </div>
          </resizable_1.ResizablePanel>

          <resizable_1.ResizableHandle withHandle className="bg-slate-200 w-px"/>

          <resizable_1.ResizablePanel id="threads" defaultSize={panelDefaultSizes.threads} minSize="25%" maxSize="40%" className="bg-white">
            <tabs_1.Tabs value={done ? "done" : "inbox"} onValueChange={function (tab) { return setDone(tab === "done"); }} defaultValue="inbox">
              <div className="flex h-13 items-center justify-between bg-white px-4 py-2 shrink-0">
                <h1 className="text-xl font-bold text-slate-800">Inbox</h1>
                <tabs_1.TabsList className="ml-auto">
                  <tabs_1.TabsTrigger value="inbox" className="text-zinc-600 text-xs">
                    Inbox
                  </tabs_1.TabsTrigger>
                  <tabs_1.TabsTrigger value="done" className="text-zinc-600 text-xs">
                    Done
                  </tabs_1.TabsTrigger>
                </tabs_1.TabsList>
              </div>
              <separator_1.Separator />

              <div className="bg-white flex flex-col gap-2 p-4">
                <div className="flex h-9 w-full items-center rounded-md bg-slate-100 px-3 text-xs text-slate-400">
                  Search bar placeholder...
                </div>
              </div>

              <tabs_1.TabsContent value="inbox" className="m-0 p-4">
                <p className="text-xs italic text-slate-400">Threads list will render here...</p>
              </tabs_1.TabsContent>
              <tabs_1.TabsContent value="done" className="m-0 p-4">
                <p className="text-xs italic text-slate-400">Done threads will render here...</p>
              </tabs_1.TabsContent>
            </tabs_1.Tabs>
          </resizable_1.ResizablePanel>

          <resizable_1.ResizableHandle withHandle className="bg-slate-200 w-px"/>

          <resizable_1.ResizablePanel id="preview" defaultSize={panelDefaultSizes.preview} minSize="30%" className="bg-white">
            <div className="flex min-w-0 h-full flex-col bg-white">
              <div className="flex h-13 items-center justify-between bg-white border-b border-slate-200 px-6 shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Preview Mode
                </span>
              </div>
              <div className="flex h-full flex-1 flex-col items-center justify-center bg-white p-6 text-center">
                <div className="space-y-2 max-w-xs">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-700">Select an email to read</p>
                  <p className="text-xs leading-relaxed text-slate-400">Thread display module placeholder.</p>
                </div>
              </div>
            </div>
          </resizable_1.ResizablePanel>
        </resizable_1.ResizablePanelGroup>
      </div>
    </tooltip_1.TooltipProvider>);
}
exports.default = Mail;
