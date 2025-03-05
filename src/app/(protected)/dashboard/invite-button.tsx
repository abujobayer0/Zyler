"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useProject from "@/hooks/use-project";
import { Copy } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const InviteButton = () => {
  const { projectId } = useProject();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Ask them to copy and paste this link
          </p>
          <div className="flex items-center justify-between gap-2">
            <Input
              readOnly
              className="cursor-copy"
              onClick={() =>
                navigator.clipboard
                  .writeText(`${window.location.origin}/join/${projectId}`)
                  .then(() => toast.success("Link copied"))
              }
              value={`${window.location.origin}/join/${projectId}`}
            />
            <Button
              size={"sm"}
              onClick={() =>
                navigator.clipboard
                  .writeText(`${window.location.origin}/join/${projectId}`)
                  .then(() => toast.success("Link copied"))
              }
            >
              <Copy />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Button size={"sm"} onClick={() => setOpen(true)}>
        Invite Members
      </Button>
    </>
  );
};

export default InviteButton;
