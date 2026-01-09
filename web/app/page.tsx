'use client';

import { useState } from 'react';
import { Upload, FileUp, Activity, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import Header from '@/components/Header';

interface PredictionResult {
  probabilities: Record<string, number>;
  gradcam_image: string;
  prediction: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Upload to Supabase Storage (Future implementation)
      // ...

      // 2. Call Inference API
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      
      // 3. Log to Supabase Database (Future implementation)
      // ...

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = result
    ? Object.entries(result.probabilities).map(([name, value]) => ({
        name,
        probability: (value * 100).toFixed(1),
        val: value
      })).sort((a, b) => b.val - a.val)
    : [];

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        <Header />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Upload & Preview */}
          <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-600" />
              Upload Image
            </h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-h-96 mx-auto rounded-lg shadow-sm"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <FileUp className="w-16 h-16 mb-4" />
                  <p>Drag & drop or click to upload X-ray</p>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all
                ${!file || loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }`}
            >
              {loading ? 'Analyzing...' : 'Run Diagnosis'}
            </button>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
             {result ? (
               <>
                 {/* Main Prediction Card */}
                 <div className="bg-white p-6 rounded-xl shadow-md border-l-8 border-blue-600">
                   <h2 className="text-xl font-semibold text-gray-700 mb-2">Primary Diagnosis</h2>
                   <div className="text-4xl font-bold text-blue-900">{result.prediction}</div>
                 </div>

                 {/* Grad-CAM Visualization */}
                 <div className="bg-white p-6 rounded-xl shadow-md">
                   <h3 className="text-lg font-semibold mb-4">Gradient-weighted Class Activation Mapping (Grad-CAM)</h3>
                   <div className="aspect-square relative rounded-lg overflow-hidden bg-black">
                     <img 
                       src={`data:image/png;base64,${result.gradcam_image}`} 
                       alt="Grad-CAM"
                       className="w-full h-full object-contain"
                     />
                   </div>
                   <p className="text-sm text-gray-500 mt-2 text-center">
                     Heatmap highlights regions influencing the model's decision.
                   </p>
                 </div>

                 {/* Probability Graph */}
                 <div className="bg-white p-6 rounded-xl shadow-md h-96">
                   <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                     <Activity className="w-5 h-5 text-blue-600" />
                     Confidence Scores
                   </h3>
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                       <XAxis type="number" domain={[0, 100]} unit="%" />
                       <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                       <Tooltip 
                         formatter={(value: any) => [`${value}%`, 'Probability']}
                         contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       />
                       <Bar dataKey="val" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === result.prediction ? '#2563eb' : '#93c5fd'} />
                          ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </>
             ) : (
               <div className="h-full bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8">
                 <Activity className="w-16 h-16 mb-4 opacity-20" />
                 <p>Analysis results will appear here</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </main>
  );
}