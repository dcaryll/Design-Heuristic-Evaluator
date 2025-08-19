// Mapping from Lucide icons to Red Hat Design System icons
// Visit https://red-hat-icons.netlify.app/ to browse all available icons
export const iconMapping: Record<string, string> = {
  // Main navigation icons
  'Upload': 'upload',
  'Analysis': 'analysis', // Using the official 'analysis' icon from Red Hat Design System
  'GitCompare': 'branch', // or 'swap-horizontal' if available
  'Sparkles': 'star', // closest equivalent for sparkles/magic concept
  
  // Status and feedback icons
  'CheckCircle': 'check-circle',
  'AlertTriangle': 'exclamation-triangle',
  'AlertCircle': 'exclamation-circle',
  'Info': 'info-circle',
  
  // Action icons
  'X': 'close',
  'TrendingUp': 'arrow-up', // or 'trending-up' if available
  
  // Navigation icons
  'ChevronDown': 'chevron-down',
  'ChevronUp': 'chevron-up',
  
  // Awards and achievements
  'Trophy': 'trophy',
  'Crown': 'crown', // might need to use 'star' or 'badge' as alternative
  'Target': 'bullseye', // or 'target' if available
  
  // Generic icons
  'Image': 'image',
  
  // PDF and sharing icons
  'download': 'download',
  'share': 'share',

  // Add more icons here as needed
  // Examples you might want:
  // 'Settings': 'cog',
  // 'Download': 'download', 
  // 'Search': 'search',
  // 'User': 'user',
  // 'Calendar': 'calendar',
  // 'Mail': 'mail',
  'arrow-up-right': 'external-link', // External link icon
};

// Fallback mapping for icons that might not have exact equivalents
export const getRedHatIcon = (lucideIcon: string): string => {
  return iconMapping[lucideIcon] || 'info-circle'; // default fallback
};

// Size mapping for different use cases
export const getIconSize = (context: string): 'small' | 'medium' | 'large' => {
  switch (context) {
    case 'button':
      return 'small';
    case 'heading':
      return 'medium';
    case 'hero':
      return 'large';
    default:
      return 'medium';
  }
};

// Helper function to easily add new icons
export const addIcon = (friendlyName: string, redHatIconName: string) => {
  iconMapping[friendlyName] = redHatIconName;
  console.log(`✅ Added icon: ${friendlyName} → ${redHatIconName}`);
};

// Usage example:
// addIcon('Settings', 'cog');
// addIcon('Download', 'download');