import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function createToolInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result" | "partial-call" = "result"
): ToolInvocation {
  return {
    toolCallId: "test-id",
    toolName,
    args,
    state,
    ...(state === "result" ? { result: "Success" } : {}),
  } as ToolInvocation;
}

test("renders 'Creating {filename}' for str_replace_editor with create command", () => {
  const tool = createToolInvocation("str_replace_editor", {
    command: "create",
    path: "/components/Button.tsx",
  });

  render(<ToolInvocationBadge tool={tool} />);

  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("renders 'Editing {filename}' for str_replace_editor with str_replace command", () => {
  const tool = createToolInvocation("str_replace_editor", {
    command: "str_replace",
    path: "/components/Card.tsx",
  });

  render(<ToolInvocationBadge tool={tool} />);

  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

test("renders 'Updating {filename}' for str_replace_editor with insert command", () => {
  const tool = createToolInvocation("str_replace_editor", {
    command: "insert",
    path: "/App.tsx",
  });

  render(<ToolInvocationBadge tool={tool} />);

  expect(screen.getByText("Updating App.tsx")).toBeDefined();
});

test("renders 'Reading {filename}' for str_replace_editor with view command", () => {
  const tool = createToolInvocation("str_replace_editor", {
    command: "view",
    path: "/utils/helpers.ts",
  });

  render(<ToolInvocationBadge tool={tool} />);

  expect(screen.getByText("Reading helpers.ts")).toBeDefined();
});

test("renders 'Undoing {filename}' for str_replace_editor with undo_edit command", () => {
  const tool = createToolInvocation("str_replace_editor", {
    command: "undo_edit",
    path: "/index.tsx",
  });

  render(<ToolInvocationBadge tool={tool} />);

  expect(screen.getByText("Undoing index.tsx")).toBeDefined();
});

test("renders 'Renaming {old} → {new}' for file_manager with rename command", () => {
  const tool = createToolInvocation("file_manager", {
    command: "rename",
    path: "/old-file.tsx",
    new_path: "/new-file.tsx",
  });

  render(<ToolInvocationBadge tool={tool} />);

  expect(screen.getByText("Renaming old-file.tsx → new-file.tsx")).toBeDefined();
});

test("renders 'Deleting {filename}' for file_manager with delete command", () => {
  const tool = createToolInvocation("file_manager", {
    command: "delete",
    path: "/unused-component.tsx",
  });

  render(<ToolInvocationBadge tool={tool} />);

  expect(screen.getByText("Deleting unused-component.tsx")).toBeDefined();
});

test("shows spinner when state is 'call'", () => {
  const tool = createToolInvocation(
    "str_replace_editor",
    { command: "create", path: "/test.tsx" },
    "call"
  );

  const { container } = render(<ToolInvocationBadge tool={tool} />);

  // Check for the animate-spin class on the loader
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeDefined();
  expect(spinner).not.toBeNull();
});

test("shows green dot when state is 'result'", () => {
  const tool = createToolInvocation(
    "str_replace_editor",
    { command: "create", path: "/test.tsx" },
    "result"
  );

  const { container } = render(<ToolInvocationBadge tool={tool} />);

  // Check for the green dot
  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).toBeDefined();
  expect(greenDot).not.toBeNull();
});

test("falls back to tool name when args are missing", () => {
  const tool = createToolInvocation("str_replace_editor", {});

  render(<ToolInvocationBadge tool={tool} />);

  expect(screen.getByText("str_replace_editor")).toBeDefined();
});

test("falls back to tool name for unknown tool", () => {
  const tool = createToolInvocation("unknown_tool", {
    command: "something",
    path: "/test.tsx",
  });

  render(<ToolInvocationBadge tool={tool} />);

  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("handles path without directory", () => {
  const tool = createToolInvocation("str_replace_editor", {
    command: "create",
    path: "App.tsx",
  });

  render(<ToolInvocationBadge tool={tool} />);

  expect(screen.getByText("Creating App.tsx")).toBeDefined();
});

test("shows fallback message when path is missing", () => {
  const tool = createToolInvocation("str_replace_editor", {
    command: "create",
  });

  render(<ToolInvocationBadge tool={tool} />);

  expect(screen.getByText("Creating file")).toBeDefined();
});
