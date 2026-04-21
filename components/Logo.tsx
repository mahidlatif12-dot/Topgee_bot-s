import Image from 'next/image'
import Link from 'next/link'

interface Props {
  size?: number
  showText?: boolean
  href?: string
  textSize?: string
}

export default function Logo({ size = 36, showText = true, href = '/', textSize = '18px' }: Props) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <Image
        src="/logo.jpeg"
        alt="Topgee Capital"
        width={size}
        height={size}
        style={{ borderRadius: '8px', objectFit: 'cover' }}
      />
      {showText && (
        <span style={{
          fontSize: textSize,
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.3px',
        }}>
          Topgee<span style={{ color: 'var(--accent-green)' }}>.</span>Capital
        </span>
      )}
    </Link>
  )
}
