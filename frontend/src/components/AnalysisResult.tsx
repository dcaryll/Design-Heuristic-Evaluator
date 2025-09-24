import React, { useState } from 'react';
import { DesignAnalysis, UploadedImage, HEURISTIC_LABELS, HEURISTIC_DESCRIPTIONS, HEURISTIC_SOURCES } from '../types/analysis';
import RhIcon from './RhIcon';
import { getRedHatIcon } from '../utils/iconMapping';
import { generateSingleAnalysisPDF, downloadPDF, sharePDF } from '../utils/pdfGenerator';

interface AnalysisResultProps {
  analysis: DesignAnalysis;
  images?: UploadedImage[];
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, images }) => {
  const [expandedHeuristic, setExpandedHeuristic] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-rh-status-success';
    if (score >= 6) return 'text-rh-yellow-50';
    return 'text-rh-status-danger';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-rh-status-success/10'; // Light success background
    if (score >= 6) return 'bg-rh-status-warning/10'; // Light warning background
    return 'bg-rh-status-danger/10'; // Light danger background
  };

  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return 'text-rh-status-success';
    if (score >= 60) return 'text-rh-yellow-50';
    return 'text-rh-status-danger';
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

  const toggleHeuristic = (heuristicKey: string) => {
    setExpandedHeuristic(expandedHeuristic === heuristicKey ? null : heuristicKey);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdfBlob = await generateSingleAnalysisPDF(analysis, {
        title: 'Design Heuristic Analysis',
        subtitle: `Generated on ${new Date().toLocaleDateString()}`,
        images: images
      });
      const filename = `design-analysis-${Date.now()}.pdf`;
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
      const pdfBlob = await generateSingleAnalysisPDF(analysis, {
        title: 'Design Heuristic Analysis',
        subtitle: `Generated on ${new Date().toLocaleDateString()}`,
        images: images
      });
      const filename = `design-analysis-${Date.now()}.pdf`;
      const shared = await sharePDF(pdfBlob, filename, 'Design Heuristic Analysis');
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
      {/* Overall Score */}
      <div className="bg-rh-surface-lightest rounded-xl shadow-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-rh-text-primary mb-4 font-heading">Design analysis results</h2>
        <div className="inline-flex items-center justify-center">
          <div className="text-6xl font-bold mr-4">
            <span className={getOverallScoreColor(analysis.overall_score)}>
              {analysis.overall_score.toFixed(0)}
            </span>
            <span className="text-rh-text-secondary text-3xl">/100</span>
          </div>
        </div>
        <p className="text-lg text-rh-text-secondary mt-4 max-w-2xl mx-auto">
          {analysis.summary}
        </p>
        
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

      {/* Heuristic Breakdown */}
      <div className="bg-rh-surface-lightest rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-semibold text-rh-text-primary mb-6 font-heading">Heuristic Evaluation</h3>
        <div className="grid gap-4">
          {Object.entries(analysis.heuristic_scores).map(([key, score]) => (
            <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleHeuristic(key)}
                className="w-full p-4 flex items-center justify-between hover:bg-rh-surface-lighter transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-12 h-12 rounded-lg ${getScoreBgColor(score)} border-2 ${getAnalysisBorderColor(score)} shadow-sm flex items-center justify-center`}>
                    <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                      {score.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-rh-text-primary">
                      {HEURISTIC_LABELS[key as keyof typeof HEURISTIC_LABELS]}
                    </h4>
                    <div className="flex items-center mt-1">
                      <div className="w-32 h-2 bg-rh-surface-lighter rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            score >= 8 ? 'bg-rh-status-success' : score >= 6 ? 'bg-rh-status-warning' : 'bg-rh-status-danger'
                          }`}
                          style={{ width: `${(score / 10) * 100}%` }}
                        />
                      </div>
                      <span className="ml-3 text-sm text-rh-text-secondary">{score.toFixed(1)}/10</span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  {expandedHeuristic === key ? (
                    <RhIcon 
              icon={getRedHatIcon('ChevronUp')} 
              size="medium" 
              className="text-rh-text-secondary" 
              accessibleLabel="Collapse"
            />
                  ) : (
                    <RhIcon 
              icon={getRedHatIcon('ChevronDown')} 
              size="medium" 
              className="text-rh-text-secondary" 
              accessibleLabel="Expand"
            />
                  )}
                </div>
              </button>
              
              {expandedHeuristic === key && (
                <div className="px-4 pb-4 bg-rh-surface-lightest border-t border-gray-200">
                  {/* General heuristic description - now first */}
                  <div className="p-3 mb-3 bg-rh-surface-lightest rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-rh-text-primary">About this heuristic:</h5>
                      <a 
                        href={HEURISTIC_SOURCES[key as keyof typeof HEURISTIC_SOURCES]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rh-accent-base hover:text-rh-interactive-blue-hover text-sm font-medium transition-colors flex items-center"
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
                    <p className="text-sm text-rh-text-secondary leading-relaxed">
                      {HEURISTIC_DESCRIPTIONS[key as keyof typeof HEURISTIC_DESCRIPTIONS]}
                    </p>
                  </div>

                  {/* AI-specific reasoning for this design - now second */}
                  {analysis.heuristic_reasoning && analysis.heuristic_reasoning[key] && (
                    <div className={`p-4 ${getAnalysisBgColor(score)} border-2 ${getAnalysisBorderColor(score)} rounded-lg shadow-sm`}>
                      <h5 className={`font-medium ${getAnalysisTextColor(score)} mb-2`}>Specific analysis of your design elements:</h5>
                      <p className={`text-sm font-bold ${getAnalysisTextColor(score)} leading-relaxed`}>
                        {analysis.heuristic_reasoning[key]}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Strengths */}
        <div className="bg-rh-surface-lightest rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <RhIcon 
            icon={getRedHatIcon('CheckCircle')} 
            size="medium" 
            className="text-rh-status-success mr-3" 
            accessibleLabel="Strengths"
          />
            <h3 className="text-xl font-semibold text-rh-text-primary font-heading">Strengths</h3>
          </div>
          <ul className="space-y-3">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-rh-status-success rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-rh-text-secondary">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-rh-surface-lightest rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <RhIcon 
            icon={getRedHatIcon('TrendingUp')} 
            size="medium" 
            className="text-rh-yellow-50 mr-3" 
            accessibleLabel="Areas for improvement"
          />
            <h3 className="text-xl font-semibold text-rh-text-primary font-heading">Areas for improvement</h3>
          </div>
          <ul className="space-y-3">
            {analysis.areas_for_improvement.map((area, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-rh-status-warning rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-rh-text-secondary">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-rh-surface-lightest rounded-xl shadow-lg p-8">
        <div className="flex items-center mb-6">
          <RhIcon 
          icon={getRedHatIcon('AlertTriangle')} 
          size="medium" 
          className="text-rh-brand-red mr-3" 
          accessibleLabel="Recommendations"
        />
          <h3 className="text-2xl font-semibold text-rh-text-primary font-heading">Actionable recommendations</h3>
        </div>
        <div className="space-y-4">
          {analysis.recommendations.map((recommendation, index) => (
            <div key={index} className="border-l-4 border-rh-accent-base pl-4 py-2">
              <div className="flex items-start">
                <div className="bg-rh-surface-lighter text-rh-accent-base text-sm font-medium px-3 py-1 rounded-full mr-4 flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-rh-text-secondary leading-relaxed">{recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-rh-surface-lighter rounded-xl p-6 border border-rh-status-info/20">
        <div className="flex items-start">
          <RhIcon 
            icon={getRedHatIcon('Info')} 
            size="small" 
            className="text-rh-status-info mr-3 mt-0.5 flex-shrink-0" 
            accessibleLabel="Tip"
          />
          <div>
            <h4 className="font-medium text-rh-status-info mb-2">About this analysis</h4>
            <p className="text-rh-text-primary text-sm leading-relaxed mb-3">
              This evaluation is based on Jakob Nielsen's 10 usability heuristics and modern UX principles. 
              The AI analyzes visual hierarchy, consistency, accessibility, and user experience patterns to 
              provide actionable feedback for improving your design.
            </p>
            <div className="text-xs text-rh-text-secondary space-y-1">
              <p>
                <strong>Usability heuristics:</strong> Based on research from <a 
                  href="https://www.nngroup.com/articles/ten-usability-heuristics/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-rh-accent-base hover:underline"
                >
                  Nielsen Norman Group
                </a>
              </p>
              <p>
                <strong>Design system principles:</strong> Based on <a 
                  href="https://ux.redhat.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-rh-accent-base hover:underline"
                >
                  Red Hat Design System
                </a> guidelines
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;