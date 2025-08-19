import React, { useState } from 'react';
import { ComparisonAnalysis, HeuristicScores, UploadedImage, HEURISTIC_LABELS, HEURISTIC_SOURCES } from '../types/analysis';
import RhIcon from './RhIcon';
import { getRedHatIcon } from '../utils/iconMapping';
import { generateComparisonPDF, downloadPDF, sharePDF } from '../utils/pdfGenerator';

interface ComparisonResultProps {
  comparison: ComparisonAnalysis;
  images?: UploadedImage[];
}

interface DesignAnalysisCardProps {
  title: string;
  analysis: {
    heuristic_scores: HeuristicScores;
    heuristic_reasoning: Record<string, string>;
    strengths: string[];
    areas_for_improvement: string[];
    summary: string;
  };
  score: number;
  isWinner: boolean;
}

const DesignAnalysisCard: React.FC<DesignAnalysisCardProps> = ({ title, analysis, score, isWinner }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedHeuristic, setExpandedHeuristic] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-rh-status-success';
    if (score >= 6) return 'text-rh-yellow-50';
    return 'text-rh-status-danger';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-rh-status-success/20';
    if (score >= 6) return 'bg-rh-status-warning/20';
    return 'bg-rh-status-danger/20';
  };

  const getAnalysisBgColor = (score: number) => {
    if (score >= 8) return 'bg-rh-status-success/10';
    if (score >= 6) return 'bg-rh-status-warning/10';
    return 'bg-rh-status-danger/10';
  };

  const getAnalysisBorderColor = (score: number) => {
    if (score >= 8) return 'border-rh-status-success/30';
    if (score >= 6) return 'border-rh-status-warning/30';
    return 'border-rh-status-danger/30';
  };

  const getAnalysisTextColor = (score: number) => {
    if (score >= 8) return 'text-rh-status-success';
    if (score >= 6) return 'text-rh-yellow-50';
    return 'text-rh-status-danger';
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${isWinner ? 'border-rh-status-success bg-rh-status-success/10' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-semibold text-gray-900 font-heading">{title}</h4>
        {isWinner && <RhIcon 
          icon={getRedHatIcon('Trophy')} 
          size="small" 
                        className="text-rh-yellow-50" 
          accessibleLabel="Winner"
        />}
      </div>

      {/* Overall Score */}
      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-gray-900">{score.toFixed(0)}/100</div>
        <p className="text-sm text-gray-600">Overall Score</p>
      </div>

      {/* Heuristic Scores */}
      <div className="mb-4">
        <button
          onClick={() => setExpandedSection(expandedSection === 'heuristics' ? null : 'heuristics')}
          className="w-full flex items-center justify-between p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          <span className="font-medium">Heuristic Scores</span>
          {expandedSection === 'heuristics' ? 
            <RhIcon 
          icon={getRedHatIcon('ChevronUp')} 
          size="small" 
          accessibleLabel="Collapse"
        /> : 
            <RhIcon 
          icon={getRedHatIcon('ChevronDown')} 
          size="small" 
          accessibleLabel="Expand"
        />
          }
        </button>
        
        {expandedSection === 'heuristics' && (
          <div className="mt-2 space-y-2">
            {Object.entries(analysis.heuristic_scores as unknown as Record<string, number>).map(([key, score]) => (
              <div key={key} className="border border-gray-200 rounded">
                <button
                  onClick={() => setExpandedHeuristic(expandedHeuristic === key ? null : key)}
                  className="w-full flex items-center justify-between text-sm p-2 hover:bg-gray-50"
                >
                  <span className="flex-1 text-left">{HEURISTIC_LABELS[key as keyof typeof HEURISTIC_LABELS] || key}</span>
                  <div className="flex items-center ml-2">
                    <div className={`w-8 h-8 rounded-lg ${getScoreBgColor(score)} border ${getAnalysisBorderColor(score)} shadow-sm flex items-center justify-center mr-2`}>
                      <span className={`text-xs font-bold ${getScoreColor(score)}`}>
                        {score.toFixed(1)}
                      </span>
                    </div>
                    {expandedHeuristic === key ? 
                      <RhIcon 
            icon={getRedHatIcon('ChevronUp')} 
            size="small" 
            className="text-gray-400" 
            accessibleLabel="Collapse"
          /> : 
                      <RhIcon 
            icon={getRedHatIcon('ChevronDown')} 
            size="small" 
            className="text-gray-400" 
            accessibleLabel="Expand"
          />
                    }
                  </div>
                </button>
                
                {expandedHeuristic === key && analysis.heuristic_reasoning && analysis.heuristic_reasoning[key] && (
                  <div className="px-2 pb-2 border-t border-gray-200 bg-rh-surface-lightest">
                    <div className={`p-4 mt-2 ${getAnalysisBgColor(score)} border-2 ${getAnalysisBorderColor(score)} rounded-lg shadow-sm`}>
                      <div className="flex items-start justify-between">
                        <p className={`text-xs font-bold ${getAnalysisTextColor(score)} leading-relaxed flex-1`}>
                          {analysis.heuristic_reasoning[key]}
                        </p>
                        <a 
                          href={HEURISTIC_SOURCES[key as keyof typeof HEURISTIC_SOURCES]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-rh-accent-base hover:text-rh-interactive-blue-hover text-xs font-medium transition-colors flex items-center ml-2 flex-shrink-0"
                        >
                          Read about this heuristic
                          <RhIcon 
                            icon="arrow-up-right" 
                            size="small" 
                            className="ml-1" 
                            accessibleLabel="Opens in new tab"
                          />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strengths */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
                      <RhIcon 
              icon={getRedHatIcon('CheckCircle')} 
              size="small" 
              className="text-rh-status-success mr-2" 
              accessibleLabel="Strength"
            />
                      <span className="font-medium text-rh-status-success">Strengths</span>
        </div>
        <ul className="space-y-1">
          {analysis.strengths.slice(0, 3).map((strength, index) => (
            <li key={index} className="text-sm text-gray-700 flex items-start">
              <div className="w-1 h-1 bg-rh-status-success rounded-full mt-2 mr-2 flex-shrink-0" />
              {strength}
            </li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
                      <RhIcon 
              icon={getRedHatIcon('TrendingUp')} 
              size="small" 
              className="text-rh-yellow-50 mr-2" 
              accessibleLabel="Improvement area"
            />
                        <span className="font-medium text-rh-yellow-50">Areas for improvement</span>
        </div>
        <ul className="space-y-1">
          {analysis.areas_for_improvement.slice(0, 3).map((area, index) => (
            <li key={index} className="text-sm text-gray-700 flex items-start">
              <div className="w-1 h-1 bg-rh-status-warning rounded-full mt-2 mr-2 flex-shrink-0" />
              {area}
            </li>
          ))}
        </ul>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600 italic border-t pt-3">
        "{analysis.summary}"
      </div>
    </div>
  );
};

const ComparisonResult: React.FC<ComparisonResultProps> = ({ comparison, images }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const getWinnerDisplay = () => {
    switch (comparison.winner) {
      case 'design_a':
        return { label: 'Design A', color: 'text-rh-status-success', bgColor: 'bg-rh-status-success/20' };
      case 'design_b':
        return { label: 'Design B', color: 'text-rh-accent-base', bgColor: 'bg-rh-surface-lighter' };
      default:
        return { label: 'Tie', color: 'text-rh-text-primary', bgColor: 'bg-rh-surface-lighter' };
    }
  };

  const winner = getWinnerDisplay();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-rh-status-success';
    if (score >= 60) return 'text-rh-yellow-50';
    return 'text-rh-status-danger';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-rh-status-success/10 border-rh-status-success/30';
    if (score >= 60) return 'bg-rh-status-warning/10 border-rh-status-warning/30';
    return 'bg-rh-status-danger/10 border-rh-status-danger/30';
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdfBlob = await generateComparisonPDF(comparison, {
        title: 'Design Comparison Analysis',
        subtitle: `Generated on ${new Date().toLocaleDateString()}`,
        images: images
      });
      const filename = `design-comparison-${Date.now()}.pdf`;
      downloadPDF(pdfBlob, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSharePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdfBlob = await generateComparisonPDF(comparison, {
        title: 'Design Comparison Analysis',
        subtitle: `Generated on ${new Date().toLocaleDateString()}`,
        images: images
      });
      const filename = `design-comparison-${Date.now()}.pdf`;
      const shared = await sharePDF(pdfBlob, filename, 'Design Comparison Analysis');
      if (!shared) {
        // Fallback message if sharing wasn't supported
        console.log('PDF downloaded as sharing is not supported on this device');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      alert('Failed to share PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Winner Announcement */}
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className={`p-3 rounded-full ${winner.bgColor} mr-4`}>
            {comparison.winner === 'tie' ? (
              <RhIcon 
              icon={getRedHatIcon('Target')} 
              size="large" 
              className={winner.color} 
              accessibleLabel="Target"
            />
            ) : (
              <RhIcon 
              icon={getRedHatIcon('Crown')} 
              size="large" 
              className={winner.color} 
              accessibleLabel="Winner"
            />
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 font-heading">
              {comparison.winner === 'tie' ? 'It\'s a Tie!' : `${winner.label} Wins!`}
            </h2>
            <p className="text-lg text-gray-600">
              {comparison.winner === 'tie' 
                ? 'Both designs have similar strengths' 
                : `${winner.label} performs better overall`}
            </p>
          </div>
        </div>
        
        {/* PDF Export Actions */}
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center px-4 py-2 bg-rh-accent-base text-white rounded-lg hover:bg-rh-interactive-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RhIcon 
              icon="download"
              size="small"
              className="mr-2"
              accessibleLabel="Download"
            />
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </button>
          
          <button
            onClick={handleSharePDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center px-4 py-2 bg-rh-surface-lighter text-rh-text-primary border border-rh-accent-base rounded-lg hover:bg-rh-surface-lightest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RhIcon 
              icon="share"
              size="small"
              className="mr-2"
              accessibleLabel="Share"
            />
            {isGeneratingPDF ? 'Generating...' : 'Share PDF'}
          </button>
        </div>
      </div>

      {/* Score Comparison */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center font-heading">Score Comparison</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Design A Score */}
          <div className={`p-6 rounded-xl border-2 ${getScoreBgColor(comparison.design_a_score)} shadow-lg ${comparison.winner === 'design_a' ? 'ring-2 ring-rh-status-success ring-opacity-50' : ''}`}>
            <div className="text-center">
              <h4 className="text-xl font-semibold text-gray-900 mb-2 font-heading">Design A</h4>
              <div className="text-4xl font-bold mb-2">
                <span className={getScoreColor(comparison.design_a_score)}>
                  {comparison.design_a_score.toFixed(0)}
                </span>
                <span className="text-gray-400 text-2xl">/100</span>
              </div>
              {comparison.winner === 'design_a' && (
                <div className="flex items-center justify-center">
                  <RhIcon 
              icon={getRedHatIcon('Trophy')} 
              size="small" 
              className="text-rh-yellow-50 mr-2" 
              accessibleLabel="Winner"
            />
                  <span className="text-rh-status-success font-medium">Winner</span>
                </div>
              )}
            </div>
          </div>

          {/* Design B Score */}
          <div className={`p-6 rounded-xl border-2 ${getScoreBgColor(comparison.design_b_score)} shadow-lg ${comparison.winner === 'design_b' ? 'ring-2 ring-rh-accent-base ring-opacity-50' : ''}`}>
            <div className="text-center">
              <h4 className="text-xl font-semibold text-gray-900 mb-2 font-heading">Design B</h4>
              <div className="text-4xl font-bold mb-2">
                <span className={getScoreColor(comparison.design_b_score)}>
                  {comparison.design_b_score.toFixed(0)}
                </span>
                <span className="text-gray-400 text-2xl">/100</span>
              </div>
              {comparison.winner === 'design_b' && (
                <div className="flex items-center justify-center">
                  <RhIcon 
              icon={getRedHatIcon('Trophy')} 
              size="small" 
              className="text-rh-yellow-50 mr-2" 
              accessibleLabel="Winner"
            />
                  <span className="text-rh-accent-base font-medium">Winner</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Score Difference */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center bg-gray-100 rounded-full px-4 py-2">
            <RhIcon 
            icon={getRedHatIcon('TrendingUp')} 
            size="small" 
            className="text-gray-600 mr-2" 
            accessibleLabel="Analysis"
          />
            <span className="text-sm text-gray-700">
              Score difference: {Math.abs(comparison.design_a_score - comparison.design_b_score).toFixed(1)} points
            </span>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center mb-6">
          <RhIcon 
          icon={getRedHatIcon('AlertCircle')} 
          size="medium" 
          className="text-rh-accent-base mr-3" 
          accessibleLabel="Analysis and reasoning"
        />
          <h3 className="text-2xl font-semibold text-gray-900 font-heading">Analysis & reasoning</h3>
        </div>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed text-lg">
            {comparison.reasoning}
          </p>
        </div>
      </div>

      {/* Detailed Analysis Breakdown */}
      {(comparison.design_a_analysis || comparison.design_b_analysis) && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 font-heading">Detailed analysis breakdown</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Design A Analysis */}
            {comparison.design_a_analysis && (
              <DesignAnalysisCard 
                title="Design A" 
                analysis={comparison.design_a_analysis} 
                score={comparison.design_a_score}
                isWinner={comparison.winner === 'design_a'}
              />
            )}
            
            {/* Design B Analysis */}
            {comparison.design_b_analysis && (
              <DesignAnalysisCard 
                title="Design B" 
                analysis={comparison.design_b_analysis} 
                score={comparison.design_b_score}
                isWinner={comparison.winner === 'design_b'}
              />
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center mb-6">
          <RhIcon 
          icon={getRedHatIcon('Target')} 
          size="medium" 
          className="text-rh-status-success mr-3" 
          accessibleLabel="Recommendations"
        />
          <h3 className="text-2xl font-semibold text-gray-900 font-heading">Recommendations</h3>
        </div>
        <div className="space-y-4">
          {comparison.recommendations.map((recommendation, index) => (
            <div key={index} className="border-l-4 border-rh-status-success pl-4 py-2">
              <div className="flex items-start">
                <div className="bg-rh-status-success/20 text-rh-status-success text-sm font-medium px-3 py-1 rounded-full mr-4 flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-700 leading-relaxed">{recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-rh-surface-lighter rounded-xl p-6 border border-rh-accent-base">
        <h4 className="font-semibold text-rh-text-primary mb-3">Next Steps</h4>
        <div className="space-y-2 text-rh-text-secondary text-sm">
          <p>• Focus on improving the {comparison.winner === 'tie' ? 'shared weaknesses' : 'losing design'} based on the recommendations above</p>
          <p>• Consider A/B testing with real users to validate these findings</p>
          <p>• Iterate on the {comparison.winner === 'tie' ? 'both designs' : 'winning design'} to further enhance user experience</p>
          <p>• Document the insights from this comparison for future design decisions</p>
        </div>
      </div>
    </div>
  );
};

export default ComparisonResult;