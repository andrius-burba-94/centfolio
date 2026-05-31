"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createReceiptFromText } from "@/lib/receipts/actions";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ReceiptEntrySheet({ open, onClose }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!text.trim()) {
      toast.error("Paste the body of the receipt email to get started.");
      return;
    }
    startTransition(async () => {
      const result = await createReceiptFromText({ text: text.trim() });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setText("");
      router.push(`/receipts/${result.data?.id}`);
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next && !isPending) onClose();
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-md"
        data-testid="receipt-entry-sheet"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-title">
            Add receipt
          </SheetTitle>
          <SheetDescription className="sr-only">
            Paste the body of an emailed receipt to extract its line items.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 px-4">
          <Label htmlFor="receipt-text">Paste an emailed receipt</Label>
          <Textarea
            id="receipt-text"
            data-testid="receipt-text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the body of the receipt email here. The merchant, date, total, and line items will be extracted automatically."
            className="min-h-[280px] resize-y font-mono text-label leading-relaxed"
            disabled={isPending}
          />
          <p className="text-label text-muted-foreground">
            Pasted text is sent to Google&rsquo;s Gemini service to extract
            line items.{" "}
            <a
              href="/about/privacy"
              className="text-foreground underline underline-offset-2"
            >
              Learn more
            </a>
            .
          </p>
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
            data-testid="receipt-entry-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            data-testid="receipt-entry-save"
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
