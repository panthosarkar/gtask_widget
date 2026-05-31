import { useContext } from "react";
import { TaskModalContext } from "./taskModalContext";

export const useTaskModal = () => {
  const ctx = useContext(TaskModalContext);
  if (!ctx) {
    throw new Error("useTaskModal must be used inside TaskModalProvider");
  }

  return ctx;
};
