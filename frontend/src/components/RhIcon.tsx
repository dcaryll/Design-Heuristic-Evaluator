import React from 'react';
import { 
  Upload, GitCompare, Sparkles, CheckCircle, AlertTriangle, 
  TrendingUp, Info, ChevronDown, ChevronUp, X, Image as ImageIcon,
  AlertCircle, Trophy, Target, Crown, ExternalLink, BarChart3, Download, Share
} from 'lucide-react';

// Extend HTMLElement to include the rh-icon properties
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'rh-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          icon?: string;
          set?: string;
          'accessible-label'?: string;
          loading?: 'eager' | 'idle' | 'lazy';
        },
        HTMLElement
      >;
    }
  }
}

interface RhIconProps {
  icon: string;
  set?: string;
  accessibleLabel?: string;
  loading?: 'eager' | 'idle' | 'lazy';
  className?: string;
  size?: 'small' | 'medium' | 'large';
  lucideFallback?: string; // Add fallback prop
}

// Lucide icon mapping for fallback
const lucideIcons: Record<string, React.ComponentType<any>> = {
  'upload': Upload,
  'chart-line': TrendingUp, // Using TrendingUp as fallback for chart-line/analysis
  'branch': GitCompare,
  'star': Sparkles,
  'check-circle': CheckCircle,
  'exclamation-triangle': AlertTriangle,
  'arrow-up': TrendingUp,
  'info-circle': Info,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'close': X,
  'image': ImageIcon,
  'exclamation-circle': AlertCircle,
  'trophy': Trophy,
  'bullseye': Target,
  'crown': Crown,
  'external-link': ExternalLink,
  'analysis': BarChart3,
  'download': Download,
  'share': Share,
};

const RhIcon: React.FC<RhIconProps> = ({
  icon,
  set = 'standard',
  accessibleLabel,
  loading = 'lazy',
  className = '',
  size = 'medium',
  lucideFallback
}) => {
  // Map size to CSS classes for Lucide fallback
  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'h-4 w-4';
      case 'large':
        return 'h-8 w-8';
      default:
        return 'h-5 w-5';
    }
  };

  // Use Lucide fallback for now while we debug Red Hat icons
  const LucideIcon = lucideIcons[icon];
  if (LucideIcon) {
    return (
      <LucideIcon 
        className={`${getSizeClass(size)} ${className}`}
        aria-label={accessibleLabel}
      />
    );
  }

  // Fallback to Red Hat icon (when working)
  const getSizeStyle = (size: string) => {
    switch (size) {
      case 'small':
        return { '--rh-icon-size': 'var(--rh-size-icon-01, 16px)' };
      case 'large':
        return { '--rh-icon-size': 'var(--rh-size-icon-04, 40px)' };
      default:
        return { '--rh-icon-size': '24px' };
    }
  };

  return (
    <rh-icon
      icon={icon}
      set={set}
      accessible-label={accessibleLabel}
      loading={loading}
      className={className}
      style={getSizeStyle(size) as React.CSSProperties}
    />
  );
};

export default RhIcon;