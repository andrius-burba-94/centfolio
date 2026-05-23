"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { CategoryCombobox } from "@/components/feature/category-combobox";
import { TagCombobox } from "@/components/feature/tag-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Category } from "@/lib/categories/types";
import { formatMoney } from "@/lib/money/format";
import { parseMoney } from "@/lib/money/parse";
import type { Tag } from "@/lib/tags/types";
import {
  createTransaction,
  updateTransaction,
} from "@/lib/transactions/actions";
import type { Transaction } from "@/lib/transactions/types";
import { cn } from "@/lib/utils";

type Mode = "new" | "edit";

type SheetProps = {
  mode: Mode | null;
  transaction: Transaction | null;
  categories: Category[];
  tags: Tag[];
};

type FormState = {
  merchantName: string;
  amountInput: string;
  direction: "spent" | "earned";
  date: string;
  description: string;
  notes: string;
  categoryId: string | null;
  tagIds: string[];
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(): FormState {
  return {
    merchantName: "",
    amountInput: "",
    direction: "spent",
    date: todayIso(),
    description: "",
    notes: "",
    categoryId: null,
    tagIds: [],
  };
}

function formFromTransaction(tx: Transaction): FormState {
  return {
    merchantName: tx.merchantName,
    amountInput: formatMoney(Math.abs(tx.amount), { withCurrency: false }),
    direction: tx.amount < 0 ? "spent" : "earned",
    date: tx.date.slice(0, 10),
    description: tx.description,
    notes: tx.notes,
    categoryId: tx.categoryId,
    tagIds: tx.tagIds,
  };
}

export function TransactionSheet({
  mode,
  transaction,
  categories,
  tags,
}: SheetProps) {
  const router = useRouter();
  const open = mode !== null;

  function close() {
    router.replace("/transactions");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-md"
        data-testid="transaction-sheet"
      >
        {open ? (
          <TransactionForm
            key={transaction?.id ?? "new"}
            mode={mode}
            transaction={transaction}
            categories={categories}
            tags={tags}
            onDone={close}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function TransactionForm({
  mode,
  transaction,
  categories,
  tags,
  onDone,
}: {
  mode: Mode;
  transaction: Transaction | null;
  categories: Category[];
  tags: Tag[];
  onDone: () => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    transaction ? formFromTransaction(transaction) : emptyForm(),
  );
  const [amountError, setAmountError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setAmountError(null);

    const merchantName = form.merchantName.trim();
    if (!merchantName) return;

    const parsedAbs = parseMoney(form.amountInput);
    if (parsedAbs === null || parsedAbs <= 0) {
      setAmountError("Enter an amount like 34,27 or 1.250,00.");
      return;
    }
    const signedAmount =
      form.direction === "spent" ? -Math.abs(parsedAbs) : Math.abs(parsedAbs);

    startTransition(async () => {
      const payload = {
        merchantName,
        amount: signedAmount,
        date: form.date,
        description: form.description.trim(),
        notes: form.notes.trim(),
        categoryId: form.categoryId,
        tagIds: form.tagIds,
      };

      const result =
        mode === "edit" && transaction
          ? await updateTransaction({ id: transaction.id, ...payload })
          : await createTransaction(payload);

      if (result.ok) {
        toast.success(
          mode === "edit" ? "Transaction updated." : "Transaction saved.",
        );
        onDone();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-display text-headline">
          {mode === "edit" ? "Edit transaction" : "New transaction"}
        </SheetTitle>
        <SheetDescription>Record income or spending.</SheetDescription>
      </SheetHeader>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-4 px-4 pb-4"
        data-testid="transaction-form"
      >
        <div className="flex gap-3">
          <Field className="flex-1" id="tx-date" label="Date">
            <Input
              id="tx-date"
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((s) => ({ ...s, date: e.target.value }))
              }
              required
              data-testid="tx-date-input"
            />
          </Field>
          <Field className="flex-1" id="tx-merchant" label="Merchant">
            <Input
              id="tx-merchant"
              type="text"
              value={form.merchantName}
              onChange={(e) =>
                setForm((s) => ({ ...s, merchantName: e.target.value }))
              }
              placeholder="Maxima"
              maxLength={200}
              required
              data-testid="tx-merchant-input"
            />
          </Field>
        </div>

        <div className="flex gap-3">
          <Field className="flex-1" id="tx-direction" label="Direction">
            <SignToggle
              value={form.direction}
              onChange={(d) => setForm((s) => ({ ...s, direction: d }))}
            />
          </Field>
          <Field
            className="flex-1"
            id="tx-amount"
            label="Amount"
            error={amountError}
          >
            <Input
              id="tx-amount"
              type="text"
              inputMode="decimal"
              value={form.amountInput}
              onChange={(e) =>
                setForm((s) => ({ ...s, amountInput: e.target.value }))
              }
              placeholder="34,27"
              required
              data-testid="tx-amount-input"
            />
          </Field>
        </div>

        <Field id="tx-description" label="Description">
          <Input
            id="tx-description"
            type="text"
            value={form.description}
            onChange={(e) =>
              setForm((s) => ({ ...s, description: e.target.value }))
            }
            placeholder="weekly run"
            maxLength={200}
            data-testid="tx-description-input"
          />
        </Field>

        <Field id="tx-category" label="Category">
          <CategoryCombobox
            value={form.categoryId}
            onChange={(id) => setForm((s) => ({ ...s, categoryId: id }))}
            categories={categories}
          />
        </Field>

        <Field id="tx-tags" label="Tags">
          <TagCombobox
            value={form.tagIds}
            onChange={(ids) => setForm((s) => ({ ...s, tagIds: ids }))}
            tags={tags}
          />
        </Field>

        <Field id="tx-notes" label="Notes">
          <textarea
            id="tx-notes"
            value={form.notes}
            onChange={(e) =>
              setForm((s) => ({ ...s, notes: e.target.value }))
            }
            placeholder="Wine for friends, oat milk for the week."
            maxLength={1000}
            rows={3}
            className="resize-y rounded-sm border border-input bg-background px-[14px] py-[10px] text-body text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
            data-testid="tx-notes-input"
          />
        </Field>

        <SheetFooter className="px-0">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onDone}
              disabled={pending}
              data-testid="tx-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} data-testid="tx-save">
              {pending ? "Saving" : "Save"}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </>
  );
}

function Field({
  id,
  label,
  children,
  className,
  error,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
  error?: string | null;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-label text-destructive" data-testid={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SignToggle({
  value,
  onChange,
}: {
  value: "spent" | "earned";
  onChange: (v: "spent" | "earned") => void;
}) {
  return (
    <div
      className="inline-flex rounded-sm border border-input bg-background p-0.5"
      role="radiogroup"
      aria-label="Direction"
      data-testid="tx-direction-toggle"
    >
      <SignOption
        active={value === "spent"}
        onClick={() => onChange("spent")}
        tone="spent"
        testId="tx-direction-spent"
      >
        Spent
      </SignOption>
      <SignOption
        active={value === "earned"}
        onClick={() => onChange("earned")}
        tone="earned"
        testId="tx-direction-earned"
      >
        Earned
      </SignOption>
    </div>
  );
}

function SignOption({
  active,
  onClick,
  tone,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  tone: "spent" | "earned";
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "flex-1 rounded-sm px-3 py-1.5 text-label transition-colors",
        active
          ? tone === "spent"
            ? "bg-muted text-destructive"
            : "bg-muted text-positive"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
