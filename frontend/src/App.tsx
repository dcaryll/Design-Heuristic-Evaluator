import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import AnalysisResult from './components/AnalysisResult';
import ComparisonResult from './components/ComparisonResult';
import { DesignAnalysis, ComparisonAnalysis } from './types/analysis';
import { Upload, GitCompare, Sparkles } from 'lucide-react';
import './App.css';

type AnalysisMode = 'single' | 'comparison';

function App() {
  const [mode, setMode] = useState<AnalysisMode>('single');
  const [analysisResult, setAnalysisResult] = useState<DesignAnalysis | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalysisComplete = (result: DesignAnalysis) => {
    setAnalysisResult(result);
    setComparisonResult(null);
    setIsAnalyzing(false);
  };

  const handleComparisonComplete = (result: ComparisonAnalysis) => {
    setComparisonResult(result);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setComparisonResult(null);
  };

  const resetResults = () => {
    setAnalysisResult(null);
    setComparisonResult(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Design Evaluator</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered heuristic evaluation for UX designers. Get instant feedback on your designs
            and compare alternatives with actionable recommendations.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-2 shadow-md">
            <button
              onClick={() => {
                setMode('single');
                resetResults();
              }}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center ${
                mode === 'single'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              <Upload className="h-5 w-5 mr-2" />
              Single Design Analysis
            </button>
            <button
              onClick={() => {
                setMode('comparison');
                resetResults();
              }}
              className={`px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center ${
                mode === 'comparison'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              <GitCompare className="h-5 w-5 mr-2" />
              Design Comparison
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {/* Upload Section */}
          <div className="mb-8">
            <ImageUpload
              mode={mode}
              onAnalysisComplete={handleAnalysisComplete}
              onComparisonComplete={handleComparisonComplete}
              onAnalysisStart={handleAnalysisStart}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Loading State */}
          {isAnalyzing && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
              <p className="mt-4 text-lg text-gray-600">
                {mode === 'single' ? 'Analyzing your design...' : 'Comparing your designs...'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This may take 10-20 seconds while our AI examines the visual elements
              </p>
            </div>
          )}

          {/* Results Section */}
          {analysisResult && !isAnalyzing && (
            <AnalysisResult analysis={analysisResult} />
          )}

          {comparisonResult && !isAnalyzing && (
            <ComparisonResult comparison={comparisonResult} />
          )}

          {/* Instructions */}
          {!analysisResult && !comparisonResult && !isAnalyzing && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                {mode === 'single' ? 'Analyze Your Design' : 'Compare Two Designs'}
              </h3>
              <p className="text-gray-600 mb-6">
                {mode === 'single'
                  ? 'Upload an image of your design to receive AI-powered feedback based on established UX heuristics.'
                  : 'Upload two design alternatives to see which performs better and get recommendations for improvement.'}
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-3">What we analyze:</h4>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Visual hierarchy and clarity</li>
                    <li>• User interface consistency</li>
                    <li>• Accessibility considerations</li>
                    <li>• Modern design principles</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-3">You'll receive:</h4>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Detailed heuristic scores</li>
                    <li>• Actionable recommendations</li>
                    <li>• Strengths and improvements</li>
                    <li>• Overall assessment summary</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;