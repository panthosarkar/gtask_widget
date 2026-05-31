import React, { FC, useState } from "react";
import TaskModal from "../TaskModal";
import { useAuth } from "../../auth/context/useAuth";
import { TaskModalContext } from "./taskModalContext";

type IpcRendererBridge = {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
};

const getIpcRenderer = () =>
  (window as Window & { ipcRenderer?: IpcRendererBridge }).ipcRenderer;

const TaskModalProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [taskListId, setTaskListId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [due, setDue] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const openAdd = (tlId: string) => {
    const ipc = getIpcRenderer();
    if (ipc?.invoke) {
      void ipc.invoke("open-task-window", { mode: "add", taskListId: tlId });
      return;
    }

    setMode("add");
    setTaskListId(tlId);
    setTaskId(null);
    setTitle("");
    setNotes("");
    setDue(undefined);
    setOpen(true);
  };

  const openEdit = (
    tlId: string,
    tId: string,
    tTitle = "",
    tNotes = "",
    tDue: string | undefined = undefined,
  ) => {
    const ipc = getIpcRenderer();
    if (ipc?.invoke) {
      void ipc.invoke("open-task-window", {
        mode: "edit",
        taskListId: tlId,
        taskId: tId,
      });
      return;
    }

    setMode("edit");
    setTaskListId(tlId);
    setTaskId(tId);
    setTitle(tTitle);
    setNotes(tNotes);
    setDue(tDue);
    setOpen(true);
  };

  const close = () => setOpen(false);

  const handleSubmit = async (payload: {
    title: string;
    notes?: string;
    due?: string;
  }) => {
    if (!taskListId) return;
    setSaving(true);
    try {
      if (mode === "add") {
        await auth.createTask({
          taskListId,
          title: payload.title,
          notes: payload.notes,
          due: payload.due,
        });
      } else if (mode === "edit" && taskId) {
        await auth.updateTask({
          taskListId,
          taskId,
          title: payload.title,
          notes: payload.notes,
          due: payload.due,
        });
      }
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TaskModalContext.Provider value={{ openAdd, openEdit }}>
      {children}
      <TaskModal
        open={open}
        initialTitle={title}
        initialNotes={notes}
        initialDue={due}
        title={mode === "add" ? "Add task" : "Edit task"}
        saving={saving}
        onClose={close}
        onSubmit={handleSubmit}
      />
    </TaskModalContext.Provider>
  );
};

export default TaskModalProvider;
