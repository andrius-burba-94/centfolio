"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
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
import {
  createReceiptFromPhoto,
  createReceiptFromText,
} from "@/lib/receipts/actions";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Mode = "text" | "photo";

export function ReceiptEntrySheet({ open, onClose }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setText("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSave() {
    if (mode === "text") {
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
        reset();
        router.push(`/receipts/${result.data?.id}`);
      });
      return;
    }

    if (!file) {
      toast.error("Choose a photo of the receipt to upload.");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("photo", file);
      const result = await createReceiptFromPhoto(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      reset();
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
            Paste an emailed receipt or upload a photo to extract its line items.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 px-4">
          <div
            className="flex gap-2 border-b border-border"
            role="tablist"
            data-testid="receipt-entry-tabs"
          >
            <TabButton
              active={mode === "text"}
              onClick={() => setMode("text")}
              testId="receipt-tab-text"
            >
              Text
            </TabButton>
            <TabButton
              active={mode === "photo"}
              onClick={() => setMode("photo")}
              testId="receipt-tab-photo"
            >
              Photo
            </TabButton>
          </div>

          {mode === "text"
            ? (
              <>
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
                  Pasted text is sent to Google&rsquo;s Gemini service to
                  extract line items.{" "}
                  <a
                    href="/about/privacy"
                    className="text-foreground underline underline-offset-2"
                  >
                    Learn more
                  </a>
                  .
                </p>
              </>
            )
            : (
              <>
                <Label htmlFor="receipt-photo">Photo of the receipt</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="receipt-photo"
                  data-testid="receipt-photo-input"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
                  capture="environment"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={isPending}
                  className="block w-full rounded-sm border border-input bg-background px-3 py-2 text-label text-foreground file:mr-3 file:rounded-sm file:border-0 file:bg-muted file:px-3 file:py-1 file:text-label file:text-foreground"
                />
                <p className="text-label text-muted-foreground">
                  {file
                    ? `Selected: ${file.name}`
                    : "Take a photo with your phone camera, or pick an existing image."}
                </p>
                <p className="text-label text-muted-foreground">
                  The photo is resized and stripped of EXIF metadata, then
                  sent to Google&rsquo;s Gemini service to extract line
                  items.{" "}
                  <a
                    href="/about/privacy"
                    className="text-foreground underline underline-offset-2"
                  >
                    Learn more
                  </a>
                  .
                </p>
              </>
            )}
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

function TabButton({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "border-b-2 px-2 pb-2 text-label transition-colors",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
