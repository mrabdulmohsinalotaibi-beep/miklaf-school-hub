import { createFileRoute } from "@tanstack/react-router";
import { RoleWorkspace } from "@/components/app/RoleWorkspace";

export const Route = createFileRoute("/_authenticated/counselor")({
  component: () => <RoleWorkspace kind="counselor" />,
});
