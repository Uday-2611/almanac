import Link from "next/link";

export default function NotFound() {
  return <main><h1>Not found</h1><p>This page does not exist.</p><Link href="/">Return to Almanac</Link></main>;
}
