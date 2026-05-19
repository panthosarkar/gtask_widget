import { useTitlebar } from "./context/useTitlebar";
const drag = {
  WebkitAppRegion: "drag",
} as React.CSSProperties;

const noDrag = {
  WebkitAppRegion: "no-drag",
} as React.CSSProperties;

function Titlebar() {
  const {
    windowState,
    handlePinnedToggle,
    handleAlwaysOnTopToggle,
    handleMinimize,
    handleMaximize,
    handleClose,
  } = useTitlebar();

  return (
    <section
      className="flex items-center justify-end gap-4 p-3 bg-white/5 rounded-md shadow-xl"
      style={drag}
    >
      <div className="flex items-center gap-2" style={noDrag}>
        <button
          onClick={handlePinnedToggle}
          aria-label={windowState.pinned ? "Unpin window" : "Pin window"}
          title={windowState.pinned ? "Unpin window" : "Pin window"}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-white/5 text-white ${
            windowState.pinned ? "bg-amber-500! text-black" : ""
          }`}
        >
          📌
        </button>

        <button
          onClick={handleAlwaysOnTopToggle}
          aria-label={
            windowState.alwaysOnTop
              ? "Disable always on top"
              : "Enable always on top"
          }
          title={
            windowState.alwaysOnTop
              ? "Disable always on top"
              : "Enable always on top"
          }
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-white/5 text-white ${
            windowState.alwaysOnTop ? "bg-amber-500! text-black" : ""
          }`}
        >
          ⬆
        </button>

        <button
          onClick={handleMinimize}
          disabled={windowState.pinned}
          aria-label="Minimize"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-white/5 text-white disabled:opacity-40"
        >
          −
        </button>

        <button
          onClick={handleMaximize}
          disabled={windowState.pinned}
          aria-label="Maximize or restore"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-white/5 text-white disabled:opacity-40"
        >
          {windowState.maximized ? "❐" : "▢"}
        </button>

        <button
          onClick={handleClose}
          aria-label="Close"
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-red-600/30 text-white"
        >
          ×
        </button>
      </div>
    </section>
  );
}
export default Titlebar;
