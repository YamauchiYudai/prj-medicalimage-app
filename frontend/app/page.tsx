'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import { Upload, Activity, AlertCircle } from 'lucide-react';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; gradcam_image: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: selectedImage }),
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-indigo-600 flex items-center justify-center gap-3">
            <Activity className="w-10 h-10" />
            Medical AI Diagnosis
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload a medical image to get an AI-powered analysis with Grad-CAM visualization.
            (Demo: ResNet18 Model)
          </p>
        </header>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-500" />
              Upload Image
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2 pointer-events-none">
                  <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Click or drag and drop to upload
                  </p>
                </div>
              </div>

              {selectedImage && (
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={selectedImage}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedImage || loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Analyzing...' : 'Run Diagnosis'}
              </button>
            </form>
          </div>

          {/* Result Section */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
             <h2 className="text-xl font-semibold mb-4">Analysis Result</h2>
             
             {loading && (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 min-h-[300px]">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                 <p>Processing image...</p>
               </div>
             )}

             {error && (
               <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-3">
                 <AlertCircle className="w-5 h-5" />
                 {error}
               </div>
             )}

             {!loading && !result && !error && (
               <div className="h-full flex items-center justify-center text-gray-400 min-h-[300px]">
                 <p>No results yet. Upload an image to start.</p>
               </div>
             )}

             {result && (
               <div className="space-y-6 animate-in fade-in duration-500">
                 {/* Score */}
                 <div className="p-4 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-500 block mb-1">Diagnosis Score</span>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {(result.score).toFixed(4)}
                      </span>
                      <span className="text-sm text-gray-500 mb-1">confidence</span>
                    </div>
                 </div>

                 {/* Grad-CAM */}
                 <div className="space-y-2">
                   <h3 className="font-medium text-gray-700">Grad-CAM Visualization</h3>
                   <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-gray-200">
                     <Image
                       src={result.gradcam_image}
                       alt="Grad-CAM"
                       fill
                       className="object-contain"
                     />
                   </div>
                   <p className="text-xs text-gray-500 text-center">
                     Heatmap indicates regions influencing the model's decision.
                   </p>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </main>
  );
}
