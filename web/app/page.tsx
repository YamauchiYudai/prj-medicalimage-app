'use client';

import { useState, useCallback } from 'react';
import { Upload, FileUp, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
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
import History from '@/components/History';
import { createClient } from '@/lib/supabase/client';

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
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  const handleSelectLog = (log: any) => {
    setResult(log.result_json);
    setPreviewUrl(null); // Clear preview when viewing history to avoid confusion
    setFile(null);
    setSuccess(`Viewing analysis from ${new Date(log.created_at).toLocaleString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClear = () => {
    setResult(null);
    setPreviewUrl(null);
    setFile(null);
    setError(null);
    setSuccess(null);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
      setSuccess(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to run analysis.');

      // 2. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('xray-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Call Inference API
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data: PredictionResult = await response.json();
      setResult(data);
      
      // 4. Log to Supabase Database
      const { error: logError } = await supabase
        .from('inference_logs')
        .insert({
          user_id: user.id,
          image_path: filePath,
          result_json: data,
        });

      if (logError) {
        console.error('Failed to save log:', logError);
        // We don't throw here to still show results to user
      } else {
        setSuccess('Analysis complete and saved to history.');
      }

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
        probability: Number((value * 100).toFixed(1)),
        val: value
      })).sort((a, b) => b.val - a.val)
    : [];

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto">
        <Header />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Left Column: Upload & Preview */}
            <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2 text-blue-900">
              <Upload className="w-6 h-6 text-blue-600" />
              Upload X-ray Image
            </h2>
            
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer min-h-[400px] flex flex-col items-center justify-center
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}
                ${previewUrl ? 'border-solid' : 'border-dashed'}`}
            >
              <input {...getInputProps()} />
              {previewUrl ? (
                <div className="space-y-4">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-80 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm text-gray-500 italic">Click or drag to change image</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <FileUp className="w-10 h-10 text-blue-500" />
                  </div>
                  <p className="text-lg font-medium text-gray-600">Drag & drop X-ray image here</p>
                  <p className="text-sm">or click to browse files</p>
                  <p className="text-xs mt-4 text-gray-400">Supported formats: JPG, PNG, JPEG</p>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg transition-all transform active:scale-95
                ${!file || loading 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Analysis...
                </span>
              ) : 'Run AI Analysis'}
            </button>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}
          </div>

          {/* History Section */}
          <History onSelectLog={handleSelectLog} />
        </div>

        {/* Right Column: Results */}
          <div className="space-y-6">
             {result ? (
               <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                 {/* Main Prediction Card */}
                 <div className="bg-white p-6 rounded-xl shadow-md border-l-8 border-blue-600 mb-6 relative group">
                   <button 
                     onClick={handleClear}
                     className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1"
                   >
                     Reset View
                   </button>
                   <h2 className="text-sm uppercase tracking-wider font-bold text-gray-500 mb-1">Primary Detection</h2>
                   <div className="flex items-end justify-between">
                     <div className="text-4xl font-black text-blue-900">{result.prediction}</div>
                     <div className="text-right">
                       <span className="text-sm font-bold text-blue-600 block">CONFIDENCE</span>
                       <span className="text-2xl font-bold text-gray-800">
                         {(result.probabilities[result.prediction] * 100).toFixed(1)}%
                       </span>
                     </div>
                   </div>
                 </div>

                 {/* Grad-CAM Visualization */}
                 <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-bold text-gray-800">Visual Evidence (Grad-CAM)</h3>
                     <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">AI FOCUS</span>
                   </div>
                   <div className="aspect-square relative rounded-lg overflow-hidden bg-slate-900 border border-gray-200">
                     <img 
                       src={`data:image/png;base64,${result.gradcam_image}`} 
                       alt="Grad-CAM"
                       className="w-full h-full object-contain"
                     />
                   </div>
                   <p className="text-sm text-gray-500 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                     <span className="font-semibold text-gray-700">How to read:</span> The heatmap highlights regions that most strongly influenced the AI's classification. Red areas indicate high influence.
                   </p>
                 </div>

                 {/* Probability Graph */}
                 <div className="bg-white p-6 rounded-xl shadow-md h-96">
                   <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                     <Activity className="w-5 h-5 text-blue-600" />
                     Confidence Distribution
                   </h3>
                   <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis type="number" domain={[0, 100]} unit="%" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 600}} />
                        <Tooltip 
                          formatter={(value: any) => [`${value}%`, 'Confidence']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="probability" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.name === result.prediction ? '#1d4ed8' : '#cbd5e1'} />
                            ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="h-full min-h-[600px] bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-12 text-center">
                 <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                   <Activity className="w-12 h-12 mb-0 opacity-20" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-600 mb-2">Ready for Analysis</h3>
                 <p className="max-w-xs mx-auto">Upload a medical X-ray image on the left to begin the automated diagnostic process.</p>
               </div>
             )}
          </div>
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>© 2026 Medical Image Analysis AI. For research purposes only.</p>
          <p className="mt-2 max-w-2xl mx-auto">
            Disclaimer: This AI-powered tool is designed to assist researchers and healthcare professionals. 
            It is not a substitute for professional medical advice, diagnosis, or treatment. 
            Always seek the advice of a qualified health provider with any questions you may have regarding a medical condition.
          </p>
        </footer>
      </div>
    </main>
  );
}