"use client"

import * as React from "react"

import { DashboardNav } from "@/components/dashboard/nav"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav currentPath="/settings" />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your workspace profile and danger zone actions.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workspace profile</CardTitle>
            <CardDescription>This information is shown on shared reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="workspace-name" className="text-sm font-medium text-foreground">
                  Workspace name
                </label>
                <Input id="workspace-name" name="workspaceName" defaultValue="Snapline Ops" />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="contact-email" className="text-sm font-medium text-foreground">
                  Contact email
                </label>
                <Input
                  id="contact-email"
                  name="contactEmail"
                  type="email"
                  defaultValue="ops@example.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="repo-url" className="text-sm font-medium text-foreground">
                  Repository URL
                </label>
                <Input
                  id="repo-url"
                  name="repoUrl"
                  type="url"
                  placeholder="https://github.com/acme/app"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="gap-2">
            <Button>Save changes</Button>
            <Button variant="ghost">Cancel</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>Destructive actions that cannot be undone.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              Delete workspace
            </Button>
          </CardFooter>
        </Card>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete workspace?</DialogTitle>
              <DialogDescription>
                This permanently removes the workspace, its projects, and all repair history.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => setConfirmOpen(false)}>
                Delete workspace
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
