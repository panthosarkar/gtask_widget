import { FC } from "react";
import { useAuth } from "./components/auth/context/useAuth";
import TitlebarProvider from "./components/titlebar/context/TitlebarProvider";
import Titlebar from "./components/titlebar/Titlebar";
import TaskListCard from "./components/task/TaskListCard";

export const AuthenticatedApp: FC<{
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
}> = ({ loading, error, signInWithGoogle }) => {
  return (
    <section className="w-full absolute max-w-[95%] top-14 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl ">
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
    createTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
  } = useAuth();

  return (
    <main className="min-h-screen max-w-full mx-0 my-auto flex items-center justify-center bg-black text-slate-100">
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
        <section className="mx-auto absolute top-14 pb-10">
          {tasksError ? (
            <p className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
              {tasksError}
            </p>
          ) : null}

          {taskLists.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
              No task lists found.
            </div>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {taskLists.map((taskList) => {
              const tasks = tasksByList[taskList.id] ?? [];

              return (
                <TaskListCard
                  key={taskList.id}
                  taskList={taskList}
                  tasks={tasks}
                  loading={loading}
                  onAddTask={createTask}
                  onToggleTask={toggleTaskStatus}
                  onUpdateTask={updateTask}
                  onDeleteTask={deleteTask}
                />
              );
            })}
          </section>
        </section>
      )}
    </main>
  );
}

export default App;
