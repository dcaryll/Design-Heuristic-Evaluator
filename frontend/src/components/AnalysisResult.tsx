import React, { useState } from 'react';
import { DesignAnalysis, HEURISTIC_LABELS, HEURISTIC_DESCRIPTIONS } from '../types/analysis';
import { CheckCircle, AlertTriangle, TrendingUp, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface AnalysisResultProps {
  analysis: DesignAnalysis;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis }) => {
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

  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const toggleHeuristic = (heuristicKey: string) => {
    setExpandedHeuristic(expandedHeuristic === heuristicKey ? null : heuristicKey);
  };

  return (
    <div className="space-y-8">
      {/* Overall Score */}
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Design Analysis Results</h2>
        <div className="inline-flex items-center justify-center">
          <div className="text-6xl font-bold mr-4">
            <span className={getOverallScoreColor(analysis.overall_score)}>
              {analysis.overall_score.toFixed(0)}
            </span>
            <span className="text-gray-400 text-3xl">/100</span>
          </div>
        </div>
        <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
          {analysis.summary}
        </p>
      </div>

      {/* Heuristic Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6">Heuristic Evaluation</h3>
        <div className="grid gap-4">
          {Object.entries(analysis.heuristic_scores).map(([key, score]) => (
            <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleHeuristic(key)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-12 h-12 rounded-lg ${getScoreBgColor(score)} flex items-center justify-center`}>
                    <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                      {score.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">
                      {HEURISTIC_LABELS[key as keyof typeof HEURISTIC_LABELS]}
                    </h4>
                    <div className="flex items-center mt-1">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(score / 10) * 100}%` }}
                        />
                      </div>
                      <span className="ml-3 text-sm text-gray-500">{score.toFixed(1)}/10</span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  {expandedHeuristic === key ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>
              
              {expandedHeuristic === key && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                  {/* AI-specific reasoning for this design */}
                  {analysis.heuristic_reasoning && analysis.heuristic_reasoning[key] && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <h5 className="font-medium text-blue-900 mb-2">Analysis for your design:</h5>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {analysis.heuristic_reasoning[key]}
                      </p>
                    </div>
                  )}
                  
                  {/* General heuristic description */}
                  <div className="p-3 bg-gray-100 rounded">
                    <h5 className="font-medium text-gray-700 mb-2">About this heuristic:</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {HEURISTIC_DESCRIPTIONS[key as keyof typeof HEURISTIC_DESCRIPTIONS]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Strengths */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Strengths</h3>
          </div>
          <ul className="space-y-3">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-yellow-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Areas for Improvement</h3>
          </div>
          <ul className="space-y-3">
            {analysis.areas_for_improvement.map((area, index) => (
              <li key={index} className="flex items-start">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center mb-6">
          <AlertTriangle className="h-6 w-6 text-indigo-600 mr-3" />
          <h3 className="text-2xl font-semibold text-gray-900">Actionable Recommendations</h3>
        </div>
        <div className="space-y-4">
          {analysis.recommendations.map((recommendation, index) => (
            <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2">
              <div className="flex items-start">
                <div className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full mr-4 flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-gray-700 leading-relaxed">{recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">About This Analysis</h4>
            <p className="text-blue-800 text-sm leading-relaxed">
              This evaluation is based on Jakob Nielsen's 10 usability heuristics and modern UX principles. 
              The AI analyzes visual hierarchy, consistency, accessibility, and user experience patterns to 
              provide actionable feedback for improving your design.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;