import { createContext } from "react";

export type TaskModalContextValue = {
  openAdd: (taskListId: string) => void;
  openEdit: (
    taskListId: string,
    taskId: string,
    title?: string,
    notes?: string,
    due?: string,
  ) => void;
};

export const TaskModalContext = createContext<
  TaskModalContextValue | undefined
>(undefined);
