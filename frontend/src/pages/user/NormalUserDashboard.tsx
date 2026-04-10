import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Star, Search, MapPin, Loader2, Check, Store } from 'lucide-react';

interface StoreData {
  id: string;
  name: string;
  address: string;
  overallRating: string | number;
  ratingCount: number;
  myRating: number | null;
}

const NormalUserDashboard = () => {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Rating modal state
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async (search?: string) => {
    try {
      setLoading(true);
      const url = search ? `/stores?search=${encodeURIComponent(search)}` : '/stores';
      const response = await api.get(url);
      setStores(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStores(searchTerm);
  };

  const openRatingModal = (store: StoreData) => {
    setSelectedStore(store);
    setRatingValue(store.myRating || 0);
    setHoverRating(0);
  };

  const submitRating = async () => {
    if (!selectedStore || ratingValue === 0) return;
    
    try {
      setSubmittingRating(true);
      await api.post('/ratings', {
        storeId: selectedStore.id,
        value: ratingValue
      });
      
      // Update local state smoothly
      setStores(stores.map(s => {
        if (s.id === selectedStore.id) {
          // Approximation since we don't return the exact new overall immediately, 
          // but we can just re-fetch for accuracy.
          return { ...s, myRating: ratingValue };
        }
        return s;
      }));
      
      setSelectedStore(null);
      setSubmittingRating(false);
      fetchStores(searchTerm); // Refresh to get precise new averages
    } catch (err) {
      console.error('Failed to submit rating', err);
      setSubmittingRating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Discover Stores</h1>
          <p className="text-slate-500 mt-1">Find and rate your favorite places</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-80 shadow-sm group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-shadow bg-white"
          />
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No stores found</h3>
          <p className="text-slate-500">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map(store => (
            <div key={store.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group">
              <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </div>
              <div className="p-6 flex-1 flex flex-col relative -mt-10">
                <div className="bg-white p-2 rounded-xl shadow-sm inline-block w-fit mb-3 border border-slate-100">
                  <Store className="w-8 h-8 text-blue-600" />
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{store.name}</h3>
                <p className="text-sm text-slate-500 flex flex-col mb-4 bg-slate-50 p-2 rounded-lg gap-1 border border-slate-100">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {store.address}</span>
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                      <Star className="w-4 h-4 text-amber-500 fill-current mr-1" />
                      <span className="font-bold text-amber-700 text-sm">{store.overallRating}</span>
                    </div>
                    <span className="text-xs text-slate-400">({store.ratingCount})</span>
                  </div>
                  
                  <button
                    onClick={() => openRatingModal(store)}
                    className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
                      store.myRating 
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                    }`}
                  >
                    {store.myRating ? (
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5"/> Rated: {store.myRating}</span>
                    ) : 'Rate Store'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      {selectedStore && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">{selectedStore.name}</h3>
              <p className="text-slate-500 text-sm mt-1">Tap a star to rate</p>
            </div>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRatingValue(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-10 h-10 transition-colors ${
                      (hoverRating || ratingValue) >= star 
                        ? 'text-amber-400 fill-current' 
                        : 'text-slate-200'
                    }`} 
                  />
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedStore(null)}
                className="flex-1 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                disabled={submittingRating}
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                disabled={ratingValue === 0 || submittingRating}
                className="flex-1 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-blue-500/20"
              >
                {submittingRating ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NormalUserDashboard;
