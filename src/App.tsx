import { FC, useEffect, useMemo, useState } from "react";
import { useAuth } from "./components/auth/context/useAuth";
import TitlebarProvider from "./components/titlebar/context/TitlebarProvider";
import Titlebar from "./components/titlebar/Titlebar";
import TaskListCard from "./components/task/TaskListCard";
import TaskModal from "./components/task/TaskModal";

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

  const [selectedTaskListId, setSelectedTaskListId] = useState<string>(() => {
    if (typeof window === "undefined") return "";

    return localStorage.getItem("gtask_selected_task_list") ?? "";
  });

  const selectedTaskList = useMemo(() => {
    if (taskLists.length === 0) return null;

    return (
      taskLists.find((taskList) => taskList.id === selectedTaskListId) ??
      taskLists[0] ??
      null
    );
  }, [selectedTaskListId, taskLists]);

  useEffect(() => {
    if (!selectedTaskList) return;

    if (selectedTaskList.id !== selectedTaskListId) {
      setSelectedTaskListId(selectedTaskList.id);
      return;
    }

    try {
      localStorage.setItem("gtask_selected_task_list", selectedTaskList.id);
    } catch {
      // ignore storage failures
    }
  }, [selectedTaskList, selectedTaskListId]);

  useEffect(() => {
    if (!taskLists.length) return;

    const stored = localStorage.getItem("gtask_selected_task_list");
    const nextId =
      stored && taskLists.some((taskList) => taskList.id === stored)
        ? stored
        : (taskLists[0]?.id ?? "");

    if (nextId && nextId !== selectedTaskListId) {
      setSelectedTaskListId(nextId);
    }
  }, [selectedTaskListId, taskLists]);

  return (
    <main className="min-h-screen max-w-full mx-0 my-auto flex items-center justify-center bg-black text-slate-100">
      <TitlebarProvider>
        <Titlebar />
      </TitlebarProvider>
      {/* task modal window mode */}
      {new URLSearchParams(window.location.search).get("taskModal") === "1" ? (
        (() => {
          const params = new URLSearchParams(window.location.search);
          const mode = params.get("mode") ?? "add";
          const taskListId = params.get("taskListId") ?? undefined;
          const taskId = params.get("taskId") ?? undefined;

          if (!taskListId) {
            return <div className="p-6 text-slate-300">Missing taskListId</div>;
          }

          const tasks = tasksByList[taskListId] ?? [];
          const task = taskId ? tasks.find((t) => t.id === taskId) : undefined;

          return (
            <TaskModal
              open={true}
              initialTitle={task?.title ?? ""}
              initialNotes={task?.notes ?? ""}
              initialDue={task?.due ?? undefined}
              title={mode === "add" ? "Add task" : "Edit task"}
              saving={false}
              onClose={() => window.close()}
              onSubmit={async (payload) => {
                if (mode === "add") {
                  await createTask({
                    taskListId: taskListId,
                    title: payload.title,
                    notes: payload.notes,
                    due: payload.due,
                  });
                } else if (mode === "edit" && taskId) {
                  await updateTask({
                    taskListId: taskListId,
                    taskId,
                    title: payload.title,
                    notes: payload.notes,
                    due: payload.due,
                  });
                }
                window.close();
              }}
            />
          );
        })()
      ) : !authenticated ? (
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

          {/* <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Active list
            </p>
          </div> */}

          {selectedTaskList ? (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <TaskListCard
                key={selectedTaskList.id}
                taskList={selectedTaskList}
                tasks={tasksByList[selectedTaskList.id] ?? []}
                loading={loading}
                onAddTask={createTask}
                onToggleTask={toggleTaskStatus}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                taskLists={taskLists}
                setSelectedTaskListId={setSelectedTaskListId}
                selectedTaskList={selectedTaskList}
              />
            </section>
          ) : null}
        </section>
      )}
    </main>
  );
}

export default App;
