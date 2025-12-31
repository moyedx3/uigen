import { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

interface ToolInvocationBadgeProps {
  tool: ToolInvocation;
}

export function ToolInvocationBadge({ tool }: ToolInvocationBadgeProps) {
  const isComplete = tool.state === "result";
  const message = getToolMessage(tool);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{message}</span>
    </div>
  );
}

function getToolMessage(tool: ToolInvocation): string {
  const args = tool.args as Record<string, unknown>;
  const command = args?.command as string;
  const path = args?.path as string;
  const filename = path ? path.split("/").pop() : undefined;

  if (tool.toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return filename ? `Creating ${filename}` : "Creating file";
      case "str_replace":
        return filename ? `Editing ${filename}` : "Editing file";
      case "insert":
        return filename ? `Updating ${filename}` : "Updating file";
      case "view":
        return filename ? `Reading ${filename}` : "Reading file";
      case "undo_edit":
        return filename ? `Undoing ${filename}` : "Undoing edit";
      default:
        return tool.toolName;
    }
  }

  if (tool.toolName === "file_manager") {
    const newPath = args?.new_path as string;
    const newFilename = newPath ? newPath.split("/").pop() : undefined;
    switch (command) {
      case "rename":
        return `Renaming ${filename} → ${newFilename}`;
      case "delete":
        return filename ? `Deleting ${filename}` : "Deleting file";
      default:
        return tool.toolName;
    }
  }

  return tool.toolName;
}
