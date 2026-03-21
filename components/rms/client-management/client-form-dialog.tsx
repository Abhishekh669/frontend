"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"

interface Props {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function ClientFormDialog({ open, setOpen }: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl border border-border bg-card p-0 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-border">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted">
                <UserPlus className="w-4 h-4 text-muted-foreground" />
              </div>
              <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
                Add Client
              </DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Fill in the details below to create a new client record.
            </p>
          </DialogHeader>
        </div>

        {/* Form Body */}
        <div className="px-6 py-5 space-y-4">

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Full Name</Label>
            <Input
              placeholder="e.g. John Doe"
              className="h-9 text-sm rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Email Address</Label>
            <Input
              type="email"
              placeholder="john@example.com"
              className="h-9 text-sm rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Phone Number</Label>
            <Input
              placeholder="98XXXXXXXX"
              className="h-9 text-sm rounded-xl border-border bg-muted/30 focus:bg-background transition-colors"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-9 rounded-xl text-sm"
            >
              Cancel
            </Button>
            <Button className="h-9 rounded-xl text-sm min-w-[80px]">
              Save
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}