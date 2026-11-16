import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Upload({
  onFiles,
}: {
  onFiles: (files: FileList | File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => fileInput.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ")
          fileInput.current?.click();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        onFiles(event.dataTransfer.files);
      }}
      className={`mb-8 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition ${dragging ? "border-indigo-500 bg-indigo-50" : "border-indigo-200 bg-slate-50/70 hover:bg-indigo-50/50"}`}
    >
      <UploadCloud className="mb-3 h-11 w-11 text-indigo-600" />
      <p className="font-semibold">Drag and drop files here</p>
      <p className="my-1 text-sm">or</p>
      <Button
        type="button"
        className="bg-indigo-600 hover:bg-indigo-700"
        onClick={(event) => {
          event.stopPropagation();
          fileInput.current?.click();
        }}
      >
        Choose Files
      </Button>
      <p className="mt-2 text-xs text-slate-500">Supported formats: PDF, TXT</p>
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) onFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
