import { GoogleTaskList } from "../auth/context/AuthProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type TaskListSelectorProps = {
  taskLists: GoogleTaskList[];
  value: string;
  onValueChange: (taskListId: string) => void;
};

function TaskListSelector({
  taskLists,
  value,
  onValueChange,
}: TaskListSelectorProps) {
  if (taskLists.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-sm">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          tabIndex={-1}
          style={{ boxShadow: "none" }}
          className="bg-transparent text-slate-100 h-auto py-0 px-0 border-0 border-b border-white/30 rounded-none outline-none ring-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <SelectValue placeholder="Select task list" />
        </SelectTrigger>
        <SelectContent
          position="popper"
          sideOffset={4}
          avoidCollisions={false}
          className="bg-slate-950 border border-white/10 text-slate-100 rounded-none w-[--radix-select-trigger-width]"
        >
          {taskLists.map((taskList) => (
            <SelectItem
              key={taskList.id}
              value={taskList.id}
              className="cursor-pointer rounded-none"
              onSelect={() => onValueChange(taskList.id)}
            >
              {taskList.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default TaskListSelector;
