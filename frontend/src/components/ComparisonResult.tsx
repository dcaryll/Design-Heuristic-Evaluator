import React, { useState } from 'react';
import { ComparisonAnalysis, HeuristicScores, HEURISTIC_LABELS } from '../types/analysis';
import { Trophy, Target, TrendingUp, AlertCircle, Crown, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ComparisonResultProps {
  comparison: ComparisonAnalysis;
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
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-semibold text-gray-900">{title}</h4>
        {isWinner && <Trophy className="h-5 w-5 text-yellow-500" />}
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
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
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
                    <div className={`w-8 h-8 rounded ${getScoreBgColor(score)} flex items-center justify-center mr-2`}>
                      <span className={`text-xs font-bold ${getScoreColor(score)}`}>
                        {score.toFixed(1)}
                      </span>
                    </div>
                    {expandedHeuristic === key ? 
                      <ChevronUp className="h-3 w-3 text-gray-400" /> : 
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    }
                  </div>
                </button>
                
                {expandedHeuristic === key && analysis.heuristic_reasoning && analysis.heuristic_reasoning[key] && (
                  <div className="px-2 pb-2 border-t border-gray-200 bg-blue-50">
                    <p className="text-xs text-blue-800 leading-relaxed mt-2">
                      {analysis.heuristic_reasoning[key]}
                    </p>
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
          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
          <span className="font-medium text-green-800">Strengths</span>
        </div>
        <ul className="space-y-1">
          {analysis.strengths.slice(0, 3).map((strength, index) => (
            <li key={index} className="text-sm text-gray-700 flex items-start">
              <div className="w-1 h-1 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
              {strength}
            </li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <TrendingUp className="h-4 w-4 text-yellow-600 mr-2" />
          <span className="font-medium text-yellow-800">Areas for Improvement</span>
        </div>
        <ul className="space-y-1">
          {analysis.areas_for_improvement.slice(0, 3).map((area, index) => (
            <li key={index} className="text-sm text-gray-700 flex items-start">
              <div className="w-1 h-1 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0" />
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

const ComparisonResult: React.FC<ComparisonResultProps> = ({ comparison }) => {
  const getWinnerDisplay = () => {
    switch (comparison.winner) {
      case 'design_a':
        return { label: 'Design A', color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'design_b':
        return { label: 'Design B', color: 'text-blue-600', bgColor: 'bg-blue-100' };
      default:
        return { label: 'Tie', color: 'text-purple-600', bgColor: 'bg-purple-100' };
    }
  };

  const winner = getWinnerDisplay();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-8">
      {/* Winner Announcement */}
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className={`p-3 rounded-full ${winner.bgColor} mr-4`}>
            {comparison.winner === 'tie' ? (
              <Target className={`h-8 w-8 ${winner.color}`} />
            ) : (
              <Crown className={`h-8 w-8 ${winner.color}`} />
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {comparison.winner === 'tie' ? 'It\'s a Tie!' : `${winner.label} Wins!`}
            </h2>
            <p className="text-lg text-gray-600">
              {comparison.winner === 'tie' 
                ? 'Both designs have similar strengths' 
                : `${winner.label} performs better overall`}
            </p>
          </div>
        </div>
      </div>

      {/* Score Comparison */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Score Comparison</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Design A Score */}
          <div className={`p-6 rounded-xl border-2 ${getScoreBgColor(comparison.design_a_score)} ${comparison.winner === 'design_a' ? 'ring-2 ring-green-500 ring-opacity-50' : ''}`}>
            <div className="text-center">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Design A</h4>
              <div className="text-4xl font-bold mb-2">
                <span className={getScoreColor(comparison.design_a_score)}>
                  {comparison.design_a_score.toFixed(0)}
                </span>
                <span className="text-gray-400 text-2xl">/100</span>
              </div>
              {comparison.winner === 'design_a' && (
                <div className="flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-green-600 font-medium">Winner</span>
                </div>
              )}
            </div>
          </div>

          {/* Design B Score */}
          <div className={`p-6 rounded-xl border-2 ${getScoreBgColor(comparison.design_b_score)} ${comparison.winner === 'design_b' ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
            <div className="text-center">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Design B</h4>
              <div className="text-4xl font-bold mb-2">
                <span className={getScoreColor(comparison.design_b_score)}>
                  {comparison.design_b_score.toFixed(0)}
                </span>
                <span className="text-gray-400 text-2xl">/100</span>
              </div>
              {comparison.winner === 'design_b' && (
                <div className="flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-blue-600 font-medium">Winner</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Score Difference */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center bg-gray-100 rounded-full px-4 py-2">
            <TrendingUp className="h-4 w-4 text-gray-600 mr-2" />
            <span className="text-sm text-gray-700">
              Score difference: {Math.abs(comparison.design_a_score - comparison.design_b_score).toFixed(1)} points
            </span>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center mb-6">
          <AlertCircle className="h-6 w-6 text-indigo-600 mr-3" />
          <h3 className="text-2xl font-semibold text-gray-900">Analysis & Reasoning</h3>
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
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Detailed Analysis Breakdown</h3>
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
          <Target className="h-6 w-6 text-green-600 mr-3" />
          <h3 className="text-2xl font-semibold text-gray-900">Recommendations</h3>
        </div>
        <div className="space-y-4">
          {comparison.recommendations.map((recommendation, index) => (
            <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
              <div className="flex items-start">
                <div className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full mr-4 flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-700 leading-relaxed">{recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
        <h4 className="font-semibold text-indigo-900 mb-3">Next Steps</h4>
        <div className="space-y-2 text-indigo-800 text-sm">
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