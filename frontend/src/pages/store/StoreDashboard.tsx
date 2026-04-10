import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Star, MessageSquare } from 'lucide-react';

interface RatingItem {
  id: string;
  value: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface StoreDashboardData {
  averageRating: string | number;
  totalRatings: number;
  ratings: RatingItem[];
}

const StoreDashboard = () => {
  const [data, setData] = useState<StoreDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/store-dashboard');
      setData(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading your store dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Store Dashboard</h1>
        <p className="text-slate-500 mt-1">View your ratings and customer feedback</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-amber-100 p-4 rounded-xl text-amber-600">
            <Star className="w-8 h-8 fill-current" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Average Rating</p>
            <p className="text-3xl font-bold text-slate-800">{data?.averageRating}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Ratings</p>
            <p className="text-3xl font-bold text-slate-800">{data?.totalRatings}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800">Recent Ratings</h3>
        </div>
        
        <div className="p-0">
          {data?.ratings && data.ratings.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {data.ratings.map(rating => (
                <li key={rating.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-slate-800">{rating.user.name}</h4>
                      <p className="text-sm text-slate-500">{rating.user.email}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                      <span className="font-bold text-amber-700">{rating.value}.0</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-slate-500">
              No ratings received yet. Share your store link to start gathering feedback!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreDashboard;
