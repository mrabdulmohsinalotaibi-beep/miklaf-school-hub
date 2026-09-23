import { createFileRoute } from "@tanstack/react-router";
import { RoleWorkspace } from "@/components/app/RoleWorkspace";

export const Route = createFileRoute("/_authenticated/student-affairs-deputy")({
  component: () => <RoleWorkspace kind="student_affairs_deputy" />,
});
