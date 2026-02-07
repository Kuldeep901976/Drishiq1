import Image from 'next/image';
import Link from 'next/link';

interface LogoHeaderProps {
  showSubtitle?: boolean;
  className?: string;
}

export default function LogoHeader({ showSubtitle = true, className = '' }: LogoHeaderProps) {
  return (
    <div className={`logo-header ${className}`}>
      <Link href="/" className="logo-link">
        <Image
          src="/assets/logo/Logo.png"
          alt="DrishiQ Logo"
          width={191}
          height={77}
          className="logo-image"
          priority
        />
      </Link>
      </div>
  );
}
