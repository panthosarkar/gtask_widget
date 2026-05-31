import { FC, useState } from "react";
import { GoogleTask, GoogleTaskList } from "../auth/context/AuthProvider";
import { Edit, PlusCircle, Trash } from "lucide-react";
import { useTaskModal } from "./context/useTaskModal";
import TaskListSelector from "./TaskListSelector";

const taskIsCompleted = (task: GoogleTask) =>
  task.status === "completed" || Boolean(task.completed);

const formatDueDate = (due?: string) => {
  if (!due) return null;

  const date = new Date(due);
  if (Number.isNaN(date.getTime())) return due;

  return date.toLocaleString();
};
const TaskListCard: FC<{
  taskLists: GoogleTaskList[];
  selectedTaskList: GoogleTaskList | null;
  setSelectedTaskListId: (id: string) => void;
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
  taskLists,
  selectedTaskList,
  setSelectedTaskListId,
  // onAddTask,
  onToggleTask,
  // onUpdateTask,
  onDeleteTask,
}) => {
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const { openAdd, openEdit } = useTaskModal();

  const openAddModal = () => {
    openAdd(taskList.id);
  };

  const openEditModal = (task: GoogleTask) => {
    openEdit(
      taskList.id,
      task.id,
      task.title,
      task.notes ?? "",
      task.due ?? undefined,
    );
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
      <div className="flex items-center justify-between border-b border-white/10 py-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <TaskListSelector
              taskLists={taskLists}
              value={selectedTaskList?.id ?? ""}
              onValueChange={(taskListId) => {
                setSelectedTaskListId(taskListId);
                try {
                  localStorage.setItem("gtask_selected_task_list", taskListId);
                } catch {
                  // ignore storage failures
                }
              }}
            />
            {/* <h2 className="text-lg font-semibold text-white">
              {taskList.title}
            </h2> */}
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400 mt-1">
              {tasks.length} tasks
            </p>
          </div>
        </div>
        <div className="">
          <button
            type="button"
            onClick={openAddModal}
            className="rounded-full border border-white/20 bg-green-500/5 text-white cursor-pointer *:hover:bg-green-500"
          >
            <PlusCircle className="rounded-full w-8 h-8 p-2" />
          </button>
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
            // const isEditing = editingTaskId === task.id;
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
                          onClick={() => openEditModal(task)}
                          disabled={loading || isBusy}
                          className="rounded-full border border-white/20 bg-red-500/5 text-white cursor-pointer *:hover:bg-red-500/10"
                        >
                          <Edit className="rounded-full w-8 h-8 p-2" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteTask(task.id)}
                          disabled={loading || isBusy}
                          className="rounded-full border border-white/20 bg-red-500/5 text-white cursor-pointer *:hover:bg-red-900/10"
                        >
                          <Trash className="rounded-full w-8 h-8 p-2" />
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

                    {null}
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal handled by TaskModalProvider */}
    </article>
  );
};
export default TaskListCard;
