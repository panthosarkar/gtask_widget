import { useEffect, useState } from "react";
import "./App.css";

type WindowState = {
  pinned: boolean;
  alwaysOnTop: boolean;
  maximized: boolean;
};

function App() {
  const [windowState, setWindowState] = useState<WindowState>({
    pinned: false,
    alwaysOnTop: false,
    maximized: false,
  });

  useEffect(() => {
    window.windowControls
      .getState()
      .then(setWindowState)
      .catch(() => undefined);
  }, []);

  const updateWindowState = async (nextState: Partial<WindowState>) => {
    setWindowState((current) => ({ ...current, ...nextState }));
  };

  const handlePinnedToggle = async () => {
    const nextPinned = !windowState.pinned;
    await window.windowControls.setPinned(nextPinned);
    await updateWindowState({ pinned: nextPinned });
  };

  const handleAlwaysOnTopToggle = async () => {
    const nextAlwaysOnTop = !windowState.alwaysOnTop;
    await window.windowControls.setAlwaysOnTop(nextAlwaysOnTop);
    await updateWindowState({ alwaysOnTop: nextAlwaysOnTop });
  };

  const handleMinimize = async () => {
    await window.windowControls.minimize();
  };

  const handleMaximize = async () => {
    const result = await window.windowControls.toggleMaximize();
    await updateWindowState({ maximized: result.maximized });
  };

  const handleClose = async () => {
    await window.windowControls.close();
  };

  return (
    <main className="window-shell">
      <section className="titlebar">
        <div className="titlecopy">
          <span className="eyebrow">Task widget</span>
          <h1>Window controls</h1>
          <p>Drag title area. Resize from edges. Pin locks window in place.</p>
        </div>

        <div className="titlebar-actions">
          <button
            className={`toggle ${windowState.pinned ? "active" : ""}`}
            onClick={handlePinnedToggle}
          >
            {windowState.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            className={`toggle ${windowState.alwaysOnTop ? "active" : ""}`}
            onClick={handleAlwaysOnTopToggle}
          >
            {windowState.alwaysOnTop ? "Top on" : "Top off"}
          </button>
          <button
            className="window-btn"
            onClick={handleMinimize}
            disabled={windowState.pinned}
            aria-label="Minimize"
          >
            _
          </button>
          <button
            className="window-btn"
            onClick={handleMaximize}
            disabled={windowState.pinned}
            aria-label="Maximize or restore"
          >
            {windowState.maximized ? "▢" : "□"}
          </button>
          <button
            className="window-btn close"
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </section>

      <section className="content-card">
        <div>
          <span className="label">Pinned</span>
          <strong>{windowState.pinned ? "Active" : "Inactive"}</strong>
        </div>
        <div>
          <span className="label">Always on top</span>
          <strong>{windowState.alwaysOnTop ? "Enabled" : "Disabled"}</strong>
        </div>
        <div>
          <span className="label">Window mode</span>
          <strong>{windowState.maximized ? "Maximized" : "Windowed"}</strong>
        </div>
      </section>
    </main>
  );
}

export default App;
