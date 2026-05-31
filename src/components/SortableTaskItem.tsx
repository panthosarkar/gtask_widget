import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { ReactNode } from "react";

type SortableTaskItemProps = {
  id: string;
  children: ReactNode;
};

function SortableTaskItem({ id, children }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      className={`p-2.5 border-b border-white/15 last:border-0 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-60" : ""
      }`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </li>
  );
}

export default SortableTaskItem;
