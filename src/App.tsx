import { FC } from "react";
import { useAuth } from "./components/auth/context/useAuth";
import TitlebarProvider from "./components/titlebar/context/TitlebarProvider";
import Titlebar from "./components/titlebar/Titlebar";

export const AuthenticatedApp: FC<{
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => void;
}> = ({ loading, error, signInWithGoogle }) => {
  return (
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 mt-20 shadow-2xl backdrop-blur-md">
      <div className="mb-6 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Google Tasks
        </p>
        <h1 className="text-3xl font-semibold">Login with Google</h1>
        <p className="text-sm leading-6 text-slate-300">
          App opens with one action only. Login, then Google Tasks loads.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="text-lg">G</span>
        {loading ? "Signing in..." : "Login with Google"}
      </button>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </section>
  );
};

function App() {
  const {
    authenticated,
    loading,
    error,
    tasksError,
    taskLists,
    tasksByList,
    signInWithGoogle,
  } = useAuth();

  return (
    <main className="min-h-screen bg-black p-6 text-slate-100">
      <TitlebarProvider>
        <Titlebar />
      </TitlebarProvider>
      {!authenticated ? (
        <AuthenticatedApp
          loading={loading}
          error={error}
          signInWithGoogle={signInWithGoogle}
        />
      ) : (
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 mt-15">
          <header className="flex justify-end gap-2">
            {tasksError ? (
              <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                {tasksError}
              </p>
            ) : null}
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {taskLists.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                No task lists found.
              </div>
            ) : null}

            {taskLists.map((taskList) => {
              const tasks = tasksByList[taskList.id] ?? [];

              return (
                <article
                  key={taskList.id}
                  //   className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-md"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {taskList.title}
                      </h2>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        {tasks.length} tasks
                      </p>
                    </div>
                  </div>

                  {tasks.length === 0 ? (
                    <p className="text-sm text-slate-300">
                      No tasks in this list.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {tasks.map((task) => (
                        <li
                          key={task.id}
                          className="rounded-2xl border border-white/10 bg-slate-950/40 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-slate-100">
                              {task.title}
                            </span>
                            {task.status ? (
                              <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                                {task.status}
                              </span>
                            ) : null}
                          </div>
                          {task.notes ? (
                            <p className="mt-2 text-sm text-slate-300">
                              {task.notes}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </section>
        </section>
      )}
    </main>
  );
}

export default App;
