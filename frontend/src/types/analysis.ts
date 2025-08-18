export interface HeuristicScores {
  // Nielsen's Classic Usability Heuristics
  visibility_of_system_status: number;
  match_system_real_world: number;
  user_control_freedom: number;
  consistency_standards: number;
  error_prevention: number;
  recognition_rather_than_recall: number;
  flexibility_efficiency: number;
  aesthetic_minimalist_design: number;
  error_recovery: number;
  help_documentation: number;
  
  // Design System Heuristics
  color_accessibility_usage: number;
  typography_hierarchy: number;
  design_token_consistency: number;
  brand_voice_expression: number;
  responsive_adaptability: number;
  interaction_feedback: number;
}

export interface DesignAnalysis {
  overall_score: number;
  heuristic_scores: HeuristicScores;
  heuristic_reasoning: Record<string, string>;
  recommendations: string[];
  strengths: string[];
  areas_for_improvement: string[];
  summary: string;
}

export interface ComparisonAnalysis {
  winner: 'design_a' | 'design_b' | 'tie';
  reasoning: string;
  design_a_score: number;
  design_b_score: number;
  recommendations: string[];
  design_a_analysis?: {
    heuristic_scores: HeuristicScores;
    heuristic_reasoning: Record<string, string>;
    strengths: string[];
    areas_for_improvement: string[];
    summary: string;
  };
  design_b_analysis?: {
    heuristic_scores: HeuristicScores;
    heuristic_reasoning: Record<string, string>;
    strengths: string[];
    areas_for_improvement: string[];
    summary: string;
  };
}

export interface UploadedImage {
  file: File;
  preview: string;
}

export const HEURISTIC_LABELS: Record<keyof HeuristicScores, string> = {
  // Nielsen's Classic Usability Heuristics
  visibility_of_system_status: 'Visibility of System Status',
  match_system_real_world: 'Match System & Real World',
  user_control_freedom: 'User Control & Freedom',
  consistency_standards: 'Consistency & Standards',
  error_prevention: 'Error Prevention',
  recognition_rather_than_recall: 'Recognition Rather Than Recall',
  flexibility_efficiency: 'Flexibility & Efficiency',
  aesthetic_minimalist_design: 'Aesthetic & Minimalist Design',
  error_recovery: 'Help Users Recognize & Recover from Errors',
  help_documentation: 'Help & Documentation',
  
  // Design System Heuristics
  color_accessibility_usage: 'Color & Accessibility',
  typography_hierarchy: 'Typography & Hierarchy',
  design_token_consistency: 'Design System Consistency',
  brand_voice_expression: 'Brand Voice & Expression',
  responsive_adaptability: 'Responsive & Adaptable',
  interaction_feedback: 'Interaction & Feedback'
};

export const HEURISTIC_DESCRIPTIONS: Record<keyof HeuristicScores, string> = {
  // Nielsen's Classic Usability Heuristics
  visibility_of_system_status: 'The system should keep users informed about what is happening through appropriate feedback within reasonable time.',
  match_system_real_world: 'The system should speak the users\' language, with words, phrases and concepts familiar to the user.',
  user_control_freedom: 'Users often choose system functions by mistake and need a clearly marked "emergency exit" to leave the unwanted state.',
  consistency_standards: 'Users should not have to wonder whether different words, situations, or actions mean the same thing.',
  error_prevention: 'Even better than good error messages is a careful design which prevents problems from occurring in the first place.',
  recognition_rather_than_recall: 'Minimize the user\'s memory load by making objects, actions, and options visible.',
  flexibility_efficiency: 'Accelerators may often speed up the interaction for expert users such that the system can cater to both inexperienced and experienced users.',
  aesthetic_minimalist_design: 'Dialogues should not contain information which is irrelevant or rarely needed.',
  error_recovery: 'Error messages should be expressed in plain language, precisely indicate the problem, and constructively suggest a solution.',
  help_documentation: 'Even though it is better if the system can be used without documentation, it may be necessary to provide help and documentation.',
  
  // Design System Heuristics (inspired by Red Hat Design System)
  color_accessibility_usage: 'Colors should meet WCAG accessibility standards, communicate meaning semantically, and follow consistent usage patterns throughout the interface.',
  typography_hierarchy: 'Text should establish clear information hierarchy using appropriate type scales, weights, spacing, and line heights to guide user attention.',
  design_token_consistency: 'Visual properties should follow systematic design tokens for spacing, sizing, colors, and typography to ensure scalable consistency.',
  brand_voice_expression: 'Design should authentically communicate brand personality, values, and voice while maintaining professional usability standards.',
  responsive_adaptability: 'Interface should work seamlessly across different devices, screen sizes, and contexts with flexible, mobile-first design principles.',
  interaction_feedback: 'User actions should provide immediate, clear, and appropriate feedback through visual states, transitions, and micro-interactions.'
};