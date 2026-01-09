'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { History as HistoryIcon, Clock, ChevronRight, ExternalLink } from 'lucide-react';

interface InferenceLog {
  id: string;
  created_at: string;
  image_path: string;
  result_json: {
    prediction: string;
    probabilities: Record<string, number>;
    gradcam_image: string;
  };
}

interface HistoryProps {
  onSelectLog: (log: InferenceLog) => void;
}

export default function History({ onSelectLog }: HistoryProps) {
  const [logs, setLogs] = useState<InferenceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('inference_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setLogs(data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <HistoryIcon className="w-5 h-5 text-blue-600" />
          Recent History
        </h2>
        <button 
          onClick={fetchHistory}
          className="text-sm text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>No analysis history yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div 
              key={log.id} 
              onClick={() => onSelectLog(log)}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded flex items-center justify-center text-blue-600 font-bold">
                  {log.result_json.prediction[0]}
                </div>
                <div>
                  <div className="font-bold text-gray-800">{log.result_json.prediction}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
          ))}
        </div>
      )}
      
      <p className="mt-4 text-xs text-gray-400 text-center italic">
        Showing last 10 diagnosis results
      </p>
    </div>
  );
}
