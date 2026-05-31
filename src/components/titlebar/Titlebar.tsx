import { useAuth } from "../auth/context/useAuth";
import { useTitlebar } from "./context/useTitlebar";
import { useState, useMemo } from "react";
import {
  PinIcon,
  Star,
  LogOut,
  RefreshCcw,
  User,
  Minus,
  Square,
  Plus,
} from "lucide-react";
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
  const {
    authenticated,
    signInWithGoogle,
    user,
    tasksLoading,
    signOut,
    refreshGoogleTasks,
  } = useAuth();

  function ProfileImage({
    src,
    name,
  }: {
    src?: string | null;
    name?: string | null;
  }) {
    const [errored, setErrored] = useState(false);

    const initials = useMemo(() => {
      if (!name) return "?";
      return name
        .split(" ")
        .map((s) => s[0] ?? "")
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }, [name]);

    if (!src || errored) {
      return (
        <div
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white"
          aria-hidden
        >
          {initials}
        </div>
      );
    }

    return (
      // keep onError handler to fall back to initials if remote image fails
      <img
        src={src}
        alt={name ?? "Profile"}
        className="w-8 h-8 rounded-full border border-white/20"
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <section
      className="fixed inset-x-0 top-0 w-full flex items-center justify-end gap-4 px-3 py-2 bg-black/50 shadow-xl border-b border-white/20 z-10"
      style={drag}
    >
      <div className="flex items-center gap-2" style={noDrag}>
        {authenticated ? (
          <ProfileImage src={user?.picture ?? null} name={user?.name ?? null} />
        ) : (
          <button
            onClick={signInWithGoogle}
            className="rounded-full border border-white/20 bg-white/5 text-white cursor-pointer"
          >
            <User className="rounded-full w-8 h-8 p-2" />
          </button>
        )}
        <button
          type="button"
          onClick={() => void refreshGoogleTasks()}
          disabled={tasksLoading}
          className="rounded-2xl border border-white/20 bg-white/5 text-white disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          <RefreshCcw className="rounded-full w-8 h-8 p-2" />
        </button>
        {authenticated ? (
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-2xl border border-red-500/30 bg-red-500/10  hover:bg-red-500/20 cursor-pointer"
          >
            <LogOut className="rounded-full w-8 h-8 p-2" />
          </button>
        ) : null}

        <button
          onClick={handlePinnedToggle}
          aria-label={windowState.pinned ? "Unpin window" : "Pin window"}
          title={windowState.pinned ? "Unpin window" : "Pin window"}
          className={`flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white cursor-pointer`}
        >
          <PinIcon
            className={`rounded-full w-8 h-8 p-2 ${windowState.pinned ? "bg-amber-500! text-black hover:bg-amber-500/80!" : ""}`}
          />
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
          className={`flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white cursor-pointer `}
        >
          <Star
            className={`rounded-full w-8 h-8 p-2 ${windowState.alwaysOnTop ? "bg-amber-500! text-black hover:bg-amber-500/80!" : ""}`}
          />
        </button>

        <button
          onClick={handleMinimize}
          disabled={windowState.pinned}
          aria-label="Minimize"
          className={`flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white cursor-pointer`}
        >
          <Minus className="rounded-full w-8 h-8 p-2" />
        </button>

        <button
          onClick={handleMaximize}
          disabled={windowState.pinned}
          aria-label="Maximize or restore"
          className={`flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white cursor-pointer`}
        >
          <Square className="rounded-full w-8 h-8 p-2" />
        </button>

        <button
          onClick={handleClose}
          aria-label="Close"
          className={`flex items-center justify-center rounded-full border border-white/20 bg-red-500 text-white cursor-pointer`}
        >
          <Plus className="rounded-full w-8 h-8 p-2 rotate-45 " />
        </button>
      </div>
    </section>
  );
}
export default Titlebar;
