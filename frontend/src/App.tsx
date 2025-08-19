import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import AnalysisResult from './components/AnalysisResult';
import ComparisonResult from './components/ComparisonResult';
import { DesignAnalysis, ComparisonAnalysis, UploadedImage } from './types/analysis';
import RhIcon from './components/RhIcon';
import { getRedHatIcon, getIconSize } from './utils/iconMapping';

import './App.css';

type AnalysisMode = 'single' | 'comparison';

function App() {
  const [mode, setMode] = useState<AnalysisMode>('single');
  const [analysisResult, setAnalysisResult] = useState<DesignAnalysis | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonAnalysis | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalysisComplete = (result: DesignAnalysis, images: UploadedImage[]) => {
    setAnalysisResult(result);
    setUploadedImages(images);
    setComparisonResult(null);
    setIsAnalyzing(false);
  };

  const handleComparisonComplete = (result: ComparisonAnalysis, images: UploadedImage[]) => {
    setComparisonResult(result);
    setUploadedImages(images);
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
    <div className="min-h-screen bg-gradient-to-br from-rh-surface-lightest to-rh-surface-lighter font-body">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <RhIcon 
              icon={getRedHatIcon('Sparkles')} 
              size="large" 
              className="text-rh-brand-red mr-3" 
              accessibleLabel="Design Evaluator icon"
              loading="eager"
            />
            <h1 className="text-4xl font-bold text-rh-text-primary font-heading">Design heuristic evaluator</h1>
          </div>
          <p className="text-xl text-rh-text-secondary max-w-2xl mx-auto">
            AI-powered heuristic evaluation for UX designers. Get instant feedback on your designs
            and compare alternatives with actionable recommendations.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center mb-12">
          <div className="bg-rh-surface-lightest rounded-lg p-2 shadow-md flex">
            <button
              onClick={() => {
                setMode('single');
                resetResults();
              }}
              className={`px-6 py-3 rounded-md font-medium transition-all justify-center duration-200 flex items-center ${
                mode === 'single'
                  ? 'bg-rh-accent-base text-white shadow-md hover:bg-rh-interactive-blue-hover'
                  : 'text-rh-text-secondary hover:text-rh-accent-base'
              }`}
            >
              <RhIcon 
                icon={getRedHatIcon('Analysis')} 
                size={getIconSize('button')} 
                className="mr-2" 
                accessibleLabel="Upload icon"
                loading="eager"
              />
              Single design analysis
            </button>
            <button
              onClick={() => {
                setMode('comparison');
                resetResults();
              }}
              className={`px-6 py-3 rounded-md justify-center font-medium transition-all duration-200 flex items-center ${
                mode === 'comparison'
                  ? 'bg-rh-accent-base text-white shadow-md hover:bg-rh-interactive-blue-hover'
                  : 'text-rh-text-secondary hover:text-rh-accent-base'
              }`}
            >
              <RhIcon 
                icon={getRedHatIcon('GitCompare')} 
                size={getIconSize('button')} 
                className="mr-2" 
                accessibleLabel="Compare icon"
                loading="eager"
              />
              Heuristic A/B test
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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-rh-accent-base border-t-transparent"></div>
              <p className="mt-4 text-lg text-rh-text-secondary">
                {mode === 'single' ? 'Analyzing your design...' : 'Comparing your designs...'}
              </p>
              <p className="text-sm text-rh-text-secondary mt-2">
                This may take 10-20 seconds while our AI examines the visual elements
              </p>
            </div>
          )}

          {/* Results Section */}
          {analysisResult && !isAnalyzing && (
            <AnalysisResult analysis={analysisResult} images={uploadedImages} />
          )}

          {comparisonResult && !isAnalyzing && (
            <ComparisonResult comparison={comparisonResult} images={uploadedImages} />
          )}

          {/* Instructions */}
          {!analysisResult && !comparisonResult && !isAnalyzing && (
            <div className="bg-rh-surface-lightest rounded-lg shadow-md p-8 text-center">
              <h3 className="text-2xl font-semibold text-rh-text-primary mb-4 font-heading">
                {mode === 'single' ? 'Analyze your design' : 'Compare two designs'}
              </h3>
              <p className="text-rh-text-secondary mb-6">
                {mode === 'single'
                  ? 'Upload an image of your design to receive AI-powered feedback based on established UX heuristics.'
                  : 'Upload two design alternatives to see which performs better and get recommendations for improvement.'}
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="bg-rh-surface-lighter rounded-lg p-6">
                  <h4 className="font-semibold text-rh-text-primary mb-3 font-heading">What we analyze:</h4>
                  <ul className="text-rh-text-secondary space-y-2">
                    <li>• Visual hierarchy and clarity</li>
                    <li>• User interface consistency</li>
                    <li>• Accessibility considerations</li>
                    <li>• Modern design principles</li>
                  </ul>
                </div>
                <div className="bg-rh-surface-lighter rounded-lg p-6">
                  <h4 className="font-semibold text-rh-text-primary mb-3 font-heading">You'll receive:</h4>
                  <ul className="text-rh-text-secondary space-y-2">
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