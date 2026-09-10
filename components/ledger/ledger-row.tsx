import type { ReactNode } from "react";

type LedgerRowProps = { metadata: ReactNode; title: ReactNode; subline?: ReactNode };

export function LedgerRow({ metadata, title, subline }: LedgerRowProps) {
  return <article><div>{metadata}</div><div><strong className="font-semibold tracking-[-0.012em]">{title}</strong>{subline ? <div>{subline}</div> : null}</div></article>;
}
