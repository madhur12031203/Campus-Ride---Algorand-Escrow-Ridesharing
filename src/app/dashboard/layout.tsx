import Workspace from "@/components/workspace/Workspace";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Workspace>{children}</Workspace>;
}
