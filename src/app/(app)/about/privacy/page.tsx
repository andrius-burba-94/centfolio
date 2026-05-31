import Link from "next/link";

export const metadata = {
  title: "Privacy, Centfolio",
};

export default function PrivacyPage() {
  return (
    <article
      className="mx-auto max-w-prose px-8 pt-6 pb-12"
      data-testid="privacy-page"
    >
      <Link
        href="/dashboard"
        className="mb-2 inline-block text-label text-muted-foreground hover:text-foreground"
      >
        ← Back
      </Link>
      <h1 className="font-display text-headline text-foreground">
        Privacy
      </h1>

      <p className="mt-6 text-body text-foreground">
        Centfolio extracts line items from receipts by calling Google&rsquo;s
        Gemini service. Two pieces of receipt data leave Centfolio&rsquo;s
        server and reach Google during a parse:
      </p>

      <ul className="mt-4 list-disc space-y-2 pl-6 text-body text-foreground">
        <li>
          When you paste a receipt email body, the pasted text is sent
          to Gemini. This includes whatever the email contained,
          unredacted. Loyalty IDs, addresses, and other content
          present in the email body are part of that text.
        </li>
        <li>
          When you upload a receipt photo (later phase), the image is
          server-side normalized first (resized, EXIF stripped) and
          then sent to Gemini. The original photo also remains in
          Centfolio&rsquo;s own storage for audit.
        </li>
      </ul>

      <p className="mt-6 text-body text-foreground">
        The Gemini model is pinned to a specific version
        (currently the Gemini 3.5 Flash Stable channel) and is called
        from Centfolio&rsquo;s server, not from your browser. The
        underlying API is the Generative Language API on Google Cloud.
      </p>

      <p className="mt-6 text-body text-foreground">
        Centfolio never sells your data and never shares it with
        anyone besides the model provider above. Your receipts and
        line items live in Centfolio&rsquo;s database, scoped to your
        account, and are not used to train any model.
      </p>

      <p className="mt-6 text-label text-muted-foreground">
        Engineering detail and the rationale for choosing Gemini live
        in{" "}
        <a
          href="https://github.com/andrius-burba-94/centfolio/blob/main/docs/adr/0003-receipt-ocr.md"
          className="text-foreground underline underline-offset-2"
        >
          ADR-0003
        </a>.
      </p>
    </article>
  );
}
