import Image from "next/image"
import { cn } from "cn"
import type { Company } from "@/lib/content"

/**
 * A company's logo, square, at `size` pixels: its initial on a tile when the
 * logo's asset has been deleted. Decorative: the company's name is always
 * beside it.
 */
export function CompanyLogo({
  company,
  size = 48,
  className,
}: {
  company: Pick<Company, "name" | "logo">
  size?: number
  className?: string
}) {
  const shape = "shrink-0 rounded-xl outline -outline-offset-1 outline-black/8 dark:outline-white/10"
  if (!company.logo) {
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        className={cn(
          shape,
          "bg-muted text-muted-foreground grid place-items-center font-semibold",
          className
        )}
      >
        {Array.from(company.name)[0]}
      </span>
    )
  }
  return <Image src={company.logo} width={size} height={size} alt="" className={cn(shape, className)} />
}
