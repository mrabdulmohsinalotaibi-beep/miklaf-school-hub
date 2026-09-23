import { createFileRoute } from "@tanstack/react-router";
import { RoleWorkspace } from "@/components/app/RoleWorkspace";

export const Route = createFileRoute("/_authenticated/educational-deputy")({
  component: () => <RoleWorkspace kind="educational_deputy" />,
});
