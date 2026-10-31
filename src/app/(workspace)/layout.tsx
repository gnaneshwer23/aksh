import { AppShell } from "@/components/app-shell"
import { SelectionPanel } from "@/components/selection-panel"
import { WorkspaceProvider } from "@/components/workspace-context"

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WorkspaceProvider>
      {/* Route segments exist so URLs resolve; shell reads pathname. */}
      {children}
      <AppShell />
      <SelectionPanel />
    </WorkspaceProvider>
  )
}
