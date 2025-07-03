'use client';

import { useState, useEffect } from 'react';
import { ArrowRightLeft, Clock, DollarSign, Package, User, MessageSquare, Filter, Search } from 'lucide-react';

interface SubscriptionTransfer {
  id: string;
  subscription_id: string;
  seller_user_id: string;
  asking_price: number;
  remaining_deliveries: number;
  original_price: number;
  transfer_reason?: string;
  title: string;
  description?: string;
  is_negotiable: boolean;
  status: string;
  expires_at: string;
  created_at: string;
  user_subscriptions?: {
    plan_id: string;
    delivery_frequency: string;
    selected_juices?: any;
    subscription_duration: number;
  };
}

interface TransferMarketplaceProps {
  currentUserId: string;
}

export default function TransferMarketplace({ currentUserId }: TransferMarketplaceProps) {
  const [transfers, setTransfers] = useState<SubscriptionTransfer[]>([]);
  const [myTransfers, setMyTransfers] = useState<SubscriptionTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-listings'>('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<SubscriptionTransfer | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  useEffect(() => {
    fetchTransfers();
    fetchMyTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const response = await fetch('/api/subscription-transfers');
      const result = await response.json();
      
      if (response.ok) {
        setTransfers(result.transfers || []);
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyTransfers = async () => {
    try {
      const response = await fetch(`/api/subscription-transfers?user_id=${currentUserId}`);
      const result = await response.json();
      
      if (response.ok) {
        setMyTransfers(result.selling_transfers || []);
      }
    } catch (err) {
      console.error('Error fetching my transfers:', err);
    }
  };

  const handleMakeOffer = async () => {
    if (!selectedTransfer || !offerPrice) return;

    setIsSubmittingOffer(true);
    try {
      const response = await fetch('/api/subscription-transfers/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transfer_id: selectedTransfer.id,
          buyer_user_id: currentUserId,
          offered_price: parseFloat(offerPrice),
          message: offerMessage
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowOfferModal(false);
        setOfferPrice('');
        setOfferMessage('');
        alert('Offer submitted successfully!');
      } else {
        alert(result.error || 'Failed to submit offer');
      }
    } catch (err) {
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = transfer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transfer.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrice = !priceFilter || 
                        (priceFilter === 'under-1000' && transfer.asking_price < 1000) ||
                        (priceFilter === '1000-3000' && transfer.asking_price >= 1000 && transfer.asking_price <= 3000) ||
                        (priceFilter === 'above-3000' && transfer.asking_price > 3000);
    
    const matchesFrequency = !frequencyFilter || 
                            transfer.user_subscriptions?.delivery_frequency === frequencyFilter;
    
    return matchesSearch && matchesPrice && matchesFrequency;
  });

  const calculateSavings = (transfer: SubscriptionTransfer) => {
    const totalOriginalValue = transfer.original_price * (transfer.remaining_deliveries / (transfer.user_subscriptions?.subscription_duration || 1));
    return totalOriginalValue - transfer.asking_price;
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-600">Loading marketplace...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 text-white">
          <h1 className="text-2xl font-bold flex items-center">
            <ArrowRightLeft className="mr-3" />
            Subscription Transfer Marketplace
          </h1>
          <p className="mt-2 text-green-100">
            Buy and sell subscription transfers with other users
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Browse Transfers ({filteredTransfers.length})
            </button>
            <button
              onClick={() => setActiveTab('my-listings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-listings'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Listings ({myTransfers.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'browse' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transfers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All Prices</option>
                    <option value="under-1000">Under ₹1,000</option>
                    <option value="1000-3000">₹1,000 - ₹3,000</option>
                    <option value="above-3000">Above ₹3,000</option>
                  </select>
                  
                  <select
                    value={frequencyFilter}
                    onChange={(e) => setFrequencyFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All Frequencies</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center">
                    <Filter className="mr-2" size={16} />
                    Filter
                  </button>
                </div>
              </div>

              {/* Transfer Listings */}
              {filteredTransfers.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No transfers available</h3>
                  <p className="text-gray-600">Check back later for new subscription transfers.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTransfers.map((transfer) => (
                    <div key={transfer.id} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-gray-800 text-lg">{transfer.title}</h3>
                        {isExpiringSoon(transfer.expires_at) && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            Expires Soon
                          </span>
                        )}
                      </div>

                      {/* Plan Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Package className="mr-2" size={16} />
                          {transfer.user_subscriptions?.plan_id} • {transfer.user_subscriptions?.delivery_frequency}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="mr-2" size={16} />
                          {transfer.remaining_deliveries} deliveries remaining
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="mr-2" size={16} />
                          Duration: {transfer.user_subscriptions?.subscription_duration} months
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Asking Price</span>
                          <span className="text-xl font-bold text-green-600">₹{transfer.asking_price}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Original Value</span>
                          <span className="text-sm text-gray-800">₹{transfer.original_price}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">You Save</span>
                          <span className="text-sm font-semibold text-green-600">
                            ₹{calculateSavings(transfer).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {transfer.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {transfer.description}
                        </p>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {transfer.is_negotiable && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            Negotiable
                          </span>
                        )}
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          {transfer.user_subscriptions?.delivery_frequency}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setSelectedTransfer(transfer);
                            setShowOfferModal(true);
                          }}
                          disabled={transfer.seller_user_id === currentUserId}
                          className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {transfer.seller_user_id === currentUserId ? 'Your Listing' : 'Make Offer'}
                        </button>
                        <button className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'my-listings' && (
            <div className="space-y-6">
              {myTransfers.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowRightLeft className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No active listings</h3>
                  <p className="text-gray-600 mb-6">You haven't listed any subscriptions for transfer yet.</p>
                  <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    List a Subscription
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myTransfers.map((transfer) => (
                    <div key={transfer.id} className="bg-white border rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg mb-2">{transfer.title}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Asking Price:</span>
                              <p className="font-semibold text-green-600">₹{transfer.asking_price}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Remaining:</span>
                              <p className="font-semibold">{transfer.remaining_deliveries} deliveries</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <p className="font-semibold capitalize">{transfer.status}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Expires:</span>
                              <p className="font-semibold">
                                {new Date(transfer.expires_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            View Offers
                          </button>
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Make Offer Modal */}
      {showOfferModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Make an Offer</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-800">{selectedTransfer.title}</h3>
                <p className="text-sm text-gray-600">Asking Price: ₹{selectedTransfer.asking_price}</p>
                {selectedTransfer.is_negotiable && (
                  <p className="text-xs text-green-600">This seller accepts negotiations</p>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Offer (₹) *
                  </label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your offer amount"
                    min="1"
                    max={selectedTransfer.asking_price}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum offer: ₹{Math.round(selectedTransfer.asking_price * 0.3)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Add a message to your offer..."
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMakeOffer}
                  disabled={isSubmittingOffer || !offerPrice}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmittingOffer ? 'Submitting...' : 'Submit Offer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
