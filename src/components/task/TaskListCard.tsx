import { FC, FormEvent, useState } from "react";
import { GoogleTask, GoogleTaskList } from "../auth/context/AuthProvider";

const taskIsCompleted = (task: GoogleTask) =>
  task.status === "completed" || Boolean(task.completed);

const formatDueDate = (due?: string) => {
  if (!due) return null;

  const date = new Date(due);
  if (Number.isNaN(date.getTime())) return due;

  return date.toLocaleString();
};
const TaskListCard: FC<{
  taskList: GoogleTaskList;
  tasks: GoogleTask[];
  loading: boolean;
  onAddTask: (input: {
    taskListId: string;
    title: string;
    notes?: string;
    due?: string;
  }) => Promise<void>;
  onToggleTask: (input: {
    taskListId: string;
    taskId: string;
    completed: boolean;
  }) => Promise<void>;
  onUpdateTask: (input: {
    taskListId: string;
    taskId: string;
    title: string;
    notes?: string;
    due?: string;
  }) => Promise<void>;
  onDeleteTask: (input: {
    taskListId: string;
    taskId: string;
  }) => Promise<void>;
}> = ({
  taskList,
  tasks,
  loading,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [savingNew, setSavingNew] = useState(false);

  const startEdit = (task: GoogleTask) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditNotes(task.notes ?? "");
  };

  const submitNewTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newTitle.trim();

    if (!title) return;

    setSavingNew(true);
    try {
      await onAddTask({
        taskListId: taskList.id,
        title,
        notes: newNotes.trim() || undefined,
      });
      setNewTitle("");
      setNewNotes("");
    } finally {
      setSavingNew(false);
    }
  };

  const submitEditTask = async (taskId: string) => {
    const title = editTitle.trim();

    if (!title) return;

    setBusyTaskId(taskId);
    try {
      await onUpdateTask({
        taskListId: taskList.id,
        taskId,
        title,
        notes: editNotes.trim() || undefined,
      });
      setEditingTaskId(null);
      setEditTitle("");
      setEditNotes("");
    } finally {
      setBusyTaskId(null);
    }
  };

  const toggleTask = async (task: GoogleTask) => {
    setBusyTaskId(task.id);
    try {
      await onToggleTask({
        taskListId: taskList.id,
        taskId: task.id,
        completed: !taskIsCompleted(task),
      });
    } finally {
      setBusyTaskId(null);
    }
  };

  const deleteTask = async (taskId: string) => {
    setBusyTaskId(taskId);
    try {
      await onDeleteTask({ taskListId: taskList.id, taskId });
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <article className="px-5 top-14 w-full max-w-[95%]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{taskList.title}</h2>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            {tasks.length} tasks
          </p>
        </div>
      </div>

      {/* <form className="mb-4 space-y-3" onSubmit={submitNewTask}>
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a task"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/60"
        />
        <textarea
          value={newNotes}
          onChange={(event) => setNewNotes(event.target.value)}
          placeholder="Notes"
          rows={2}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/60"
        />
        <button
          type="submit"
          disabled={loading || savingNew || !newTitle.trim()}
          className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {savingNew ? "Adding..." : "Add task"}
        </button>
      </form> */}

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-300">No tasks in this list.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => {
            const completed = taskIsCompleted(task);
            const isEditing = editingTaskId === task.id;
            const isBusy = busyTaskId === task.id;
            const due = formatDueDate(task.due);

            return (
              <li
                key={task.id}
                className="p-2.5 border-b border-white/15 last:border-0"
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={() => void toggleTask(task)}
                    disabled={loading || isBusy}
                    className="mt-1 h-4 w-4 rounded-full border-white/30 bg-slate-900 text-sky-500 focus:ring-sky-400"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`font-medium ${
                          completed
                            ? "text-slate-500 line-through"
                            : "text-slate-100"
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            isEditing ? setEditingTaskId(null) : startEdit(task)
                          }
                          disabled={loading || isBusy}
                          className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                        >
                          {isEditing ? "Close" : "Edit"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteTask(task.id)}
                          disabled={loading || isBusy}
                          //   className="rounded-full border border-red-500/20 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {due ? (
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                        Due {due}
                      </p>
                    ) : null}

                    {task.notes ? (
                      <p className="mt-2 text-sm text-slate-300">
                        {task.notes}
                      </p>
                    ) : null}

                    {isEditing ? (
                      <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                        <input
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/60"
                          placeholder="Task title"
                        />
                        <textarea
                          value={editNotes}
                          onChange={(event) => setEditNotes(event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/60"
                          placeholder="Task notes"
                          rows={2}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void submitEditTask(task.id)}
                            disabled={loading || isBusy || !editTitle.trim()}
                            className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTaskId(null)}
                            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
};
export default TaskListCard;
