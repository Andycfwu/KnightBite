import Link from "next/link";

export function KnightBiteBrand() {
  return <Link href="/" className="livi-brand" aria-label="KnightBite home">
    <span className="livi-brandMark">K<span>•</span></span>
    <span className="livi-wordmark">KnightBite<small>RUTGERS DINING</small></span>
  </Link>;
}
