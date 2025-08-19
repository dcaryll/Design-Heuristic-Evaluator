import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import RhIcon from './RhIcon';
import { getRedHatIcon } from '../utils/iconMapping';
import { DesignAnalysis, ComparisonAnalysis, UploadedImage } from '../types/analysis';

interface ImageUploadProps {
  mode: 'single' | 'comparison';
  onAnalysisComplete: (result: DesignAnalysis, images: UploadedImage[]) => void;
  onComparisonComplete: (result: ComparisonAnalysis, images: UploadedImage[]) => void;
  onAnalysisStart: () => void;
  isAnalyzing: boolean;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const ImageUpload: React.FC<ImageUploadProps> = ({
  mode,
  onAnalysisComplete,
  onComparisonComplete,
  onAnalysisStart,
  isAnalyzing
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('');
    
    if (mode === 'single' && acceptedFiles.length > 1) {
      setError('Please upload only one image for single design analysis');
      return;
    }
    
    if (mode === 'comparison' && images.length + acceptedFiles.length > 2) {
      setError('Please upload only two images for comparison');
      return;
    }

    const newImages: UploadedImage[] = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    if (mode === 'single') {
      // Replace existing image
      setImages(newImages.slice(0, 1));
    } else {
      // Add up to 2 images for comparison
      setImages(prev => [...prev, ...newImages].slice(0, 2));
    }
  }, [mode, images.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: mode === 'comparison'
  });

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setError('');
  };

  const canAnalyze = () => {
    if (mode === 'single') return images.length === 1;
    if (mode === 'comparison') return images.length === 2;
    return false;
  };

  const handleAnalysis = async () => {
    if (!canAnalyze() || isAnalyzing) return;

    onAnalysisStart();
    setError('');

    try {
      if (mode === 'single') {
        const formData = new FormData();
        formData.append('file', images[0].file);

        const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 second timeout
        });

        onAnalysisComplete(response.data, images);
      } else {
        const formData = new FormData();
        formData.append('design_a', images[0].file);
        formData.append('design_b', images[1].file);

        const response = await axios.post(`${API_BASE_URL}/compare`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 second timeout
        });

        onComparisonComplete(response.data, images);
      }
    } catch (err: any) {
      let errorMessage = 'Analysis failed. Please try again.';
      
      if (err.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to the analysis server. Make sure the backend is running.';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  const maxImages = mode === 'single' ? 1 : 2;
  const needsMoreImages = images.length < maxImages;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {needsMoreImages && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-rh-accent-base bg-rh-surface-lighter'
              : 'border-gray-300 hover:border-rh-interactive-blue-hover hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
                      <RhIcon 
              icon={getRedHatIcon('Upload')} 
              size="large" 
              className="text-gray-400 mx-auto mb-4" 
              accessibleLabel="Upload files"
            />
          <h3 className="text-lg font-medium text-gray-900 mb-2 font-heading">
            {mode === 'single' ? 'Upload your design' : `Upload design ${images.length + 1}`}
          </h3>
          <p className="text-gray-600 mb-4">
            {isDragActive
              ? 'Drop the image here...'
              : 'Drag and drop an image here, or click to select. Do not include any sensitive data.'}
          </p>
          <p className="text-sm text-rh-text-secondary">
            Supports: JPEG, PNG, GIF, BMP, WebP (max 10MB)
          </p>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className={`gap-4 ${mode === 'single' && images.length === 1 ? 'flex justify-center' : 'grid md:grid-cols-2'}`}>
          {images.map((image, index) => (
            <div key={index} className={`relative bg-white rounded-lg shadow-md overflow-hidden ${mode === 'single' && images.length === 1 ? 'max-w-md w-full' : ''}`}>
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <img
                  src={image.preview}
                  alt={`Design ${index + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <RhIcon 
            icon={getRedHatIcon('Image')} 
            size="small" 
            className="text-gray-500 mr-2" 
            accessibleLabel="Image"
          />
                    <span className="text-sm font-medium text-gray-700">
                      {mode === 'comparison' ? `Design ${String.fromCharCode(65 + index)}` : 'Design'}
                    </span>
                  </div>
                  <button
                    onClick={() => removeImage(index)}
                    className="p-1 text-rh-status-danger hover:text-rh-status-danger transition-colors"
                    disabled={isAnalyzing}
                  >
                    <RhIcon 
              icon={getRedHatIcon('X')} 
              size="small" 
              accessibleLabel="Remove image"
            />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {image.file.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-rh-status-danger/10 border border-rh-status-danger/30 rounded-lg p-4 flex items-start">
          <RhIcon 
          icon={getRedHatIcon('AlertCircle')} 
          size="medium" 
                      className="text-rh-status-danger mr-3 mt-0.5 flex-shrink-0" 
          accessibleLabel="Error"
        />
          <div>
            <h4 className="text-rh-status-danger font-medium font-heading">Error</h4>
            <p className="text-rh-status-danger text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis Button */}
      {images.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={handleAnalysis}
            disabled={!canAnalyze() || isAnalyzing}
            className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
              canAnalyze() && !isAnalyzing
                ? 'bg-rh-accent-base text-white hover:bg-rh-interactive-blue-hover shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAnalyzing
              ? 'Analyzing...'
              : mode === 'single'
              ? 'Analyze design'
              : 'Compare designs'}
          </button>
        </div>
      )}

      {/* Instructions */}
      {images.length > 0 && images.length < maxImages && mode === 'comparison' && (
        <div className="text-center text-gray-600">
          <p>Upload one more design to start the comparison</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;