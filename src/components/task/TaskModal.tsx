import { FC, FormEvent, useState, useEffect } from "react";

const TaskModal: FC<{
  open: boolean;
  initialTitle?: string;
  initialNotes?: string;
  initialDue?: string;
  title?: string;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    notes?: string;
    due?: string;
  }) => Promise<void> | void;
}> = ({
  open,
  initialTitle = "",
  initialNotes = "",
  initialDue = "",
  title = "",
  saving,
  onClose,
  onSubmit,
}) => {
  const [titleVal, setTitleVal] = useState(initialTitle);
  const [notesVal, setNotesVal] = useState(initialNotes);
  const [dueVal, setDueVal] = useState(initialDue ?? "");

  useEffect(() => {
    setTitleVal(initialTitle);
    setNotesVal(initialNotes);
    setDueVal(initialDue ?? "");
  }, [initialTitle, initialNotes, initialDue, open]);

  if (!open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const t = titleVal.trim();
    if (!t) return;
    await onSubmit({
      title: t,
      notes: notesVal.trim() || undefined,
      due: dueVal || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md rounded-xl bg-black p-5 shadow-lg"
      >
        <h3 className="mb-3 text-lg font-semibold text-white">
          {title || "Task"}
        </h3>

        <input
          value={titleVal}
          onChange={(e) => setTitleVal(e.target.value)}
          placeholder="Title"
          className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 mb-2"
        />
        <textarea
          value={notesVal}
          onChange={(e) => setNotesVal(e.target.value)}
          placeholder="Notes"
          rows={3}
          className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 mb-2"
        />
        <input
          type="datetime-local"
          value={dueVal}
          onChange={(e) => setDueVal(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskModal;
