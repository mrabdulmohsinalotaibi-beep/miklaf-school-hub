import { createFileRoute } from "@tanstack/react-router";
import { RoleWorkspace } from "@/components/app/RoleWorkspace";

export const Route = createFileRoute("/_authenticated/teacher")({
  component: () => <RoleWorkspace kind="teacher" />,
});
