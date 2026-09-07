import Link from "next/link";

export function AddNewLink({ href }: { href: string }) {
  return <Link href={href}>Add new +</Link>;
}
