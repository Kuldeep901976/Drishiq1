declare module 'lucide-react' {
  import * as React from 'react';
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    color?: string;
    size?: string | number;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  }
  export type Icon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  // Available icons
  export const Briefcase: Icon;
  export const Compass: Icon;
  export const LineChart: Icon;
  export const GraduationCap: Icon;
  export const Megaphone: Icon;
  export const RefreshCcw: Icon;
  export const Users: Icon;
  export const Target: Icon;
  export const Headset: Icon;
  export const Heart: Icon;
  export const Map: Icon;
  export const Mic: Icon;
  export const Rocket: Icon;
  export const Brain: Icon;
  
  // Additional commonly used icons
  export const ArrowRight: Icon;
  export const CheckCircle: Icon;
  export const Phone: Icon;
  export const Mail: Icon;
  export const Calendar: Icon;
  export const Star: Icon;
  export const Gift: Icon;
  export const Shield: Icon;
  export const Clock: Icon;
  export const Zap: Icon;
  export const Award: Icon;
  export const Link: Icon;
  export const Eye: Icon;
  export const Waves: Icon;
  export const MessageCircle: Icon;
  export const Globe2: Icon;
  export const Music: Icon;
  export const Sparkles: Icon;
  export const RefreshCw: Icon;
  export const BarChart3: Icon;
  export const TrendingUp: Icon;
  export const Lightbulb: Icon;
  export const Share2: Icon;
  export const Volume2: Icon;
  export const Send: Icon;
  export const CreditCard: Icon;
  export const Smartphone: Icon;
  export const XCircle: Icon;
  export const DollarSign: Icon;
  export const User: Icon;
  export const Code: Icon;
  export const Link2: Icon;
  export const Leaf: Icon;
  export const Palette: Icon;
  export const Camera: Icon;
  export const Laptop: Icon;
  export const BookOpen: Icon;
  export const FileText: Icon;
  export const Globe: Icon;
  export const Wallet: Icon;
}




