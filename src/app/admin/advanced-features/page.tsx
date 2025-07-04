'use client';

import { useState, useEffect } from 'react';
import { 
  Gift, 
  Users, 
  Building, 
  ArrowRightLeft, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  BarChart3
} from 'lucide-react';
import SubscriptionAnalyticsDashboard from '@/components/admin/SubscriptionAnalyticsDashboard';
import DeliveryWindowManagement from '@/components/admin/DeliveryWindowManagement';

interface DashboardStats {
  giftSubscriptions: {
    total: number;
    pending: number;
    claimed: number;
    revenue: number;
  };
  familyGroups: {
    total: number;
    activeMembers: number;
    sharedSubscriptions: number;
  };
  corporateAccounts: {
    total: number;
    activeEmployees: number;
    monthlyRevenue: number;
  };
  transfers: {
    total: number;
    completed: number;
    platformFees: number;
  };
}

export default function AdvancedFeaturesAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'gifts' | 'family' | 'corporate' | 'transfers' | 'delivery'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Mock data - replace with actual API calls
      setStats({
        giftSubscriptions: {
          total: 145,
          pending: 23,
          claimed: 122,
          revenue: 186500
        },
        familyGroups: {
          total: 78,
          activeMembers: 234,
          sharedSubscriptions: 156
        },
        corporateAccounts: {
          total: 12,
          activeEmployees: 456,
          monthlyRevenue: 567800
        },
        transfers: {
          total: 89,
          completed: 67,
          platformFees: 15670
        }
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white rounded-t-lg">
          <h1 className="text-3xl font-bold">Advanced Features Dashboard</h1>
          <p className="mt-2 text-purple-100">
            Manage gift subscriptions, family sharing, corporate accounts, and transfers
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'gifts', label: 'Gift Subscriptions', icon: Gift },
              { id: 'family', label: 'Family Groups', icon: Users },
              { id: 'corporate', label: 'Corporate Accounts', icon: Building },
              { id: 'transfers', label: 'Transfer Marketplace', icon: ArrowRightLeft },
              { id: 'delivery', label: 'Delivery Windows', icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="mr-2" size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Gift className="h-6 w-6 text-pink-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Gift Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.giftSubscriptions.total}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Claimed: {stats.giftSubscriptions.claimed}</span>
                  <span className="text-yellow-600">Pending: {stats.giftSubscriptions.pending}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Family Groups</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.familyGroups.total}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {stats.familyGroups.activeMembers} active members
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Corporate Accounts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.corporateAccounts.total}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {stats.corporateAccounts.activeEmployees} employees enrolled
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ArrowRightLeft className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Transfers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.transfers.total}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {stats.transfers.completed} completed
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <DollarSign className="mx-auto h-8 w-8 text-pink-600 mb-2" />
                <p className="text-sm text-gray-600">Gift Revenue</p>
                <p className="text-xl font-bold text-pink-600">₹{stats.giftSubscriptions.revenue.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <DollarSign className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <p className="text-sm text-gray-600">Corporate Revenue</p>
                <p className="text-xl font-bold text-green-600">₹{stats.corporateAccounts.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <DollarSign className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                <p className="text-sm text-gray-600">Transfer Fees</p>
                <p className="text-xl font-bold text-purple-600">₹{stats.transfers.platformFees.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Gift subscription claimed</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">New family group created</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <ArrowRightLeft className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Subscription transfer completed</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Corporate account pending approval</p>
                  <p className="text-xs text-gray-500">3 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gift Subscriptions Tab */}
      {activeTab === 'gifts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Gift Subscriptions Management</h3>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Export Data
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                    Send Reminders
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gift Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan & Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Mock data rows */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        GIFT12345678
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <p className="font-medium">John Doe</p>
                          <p className="text-gray-500">john@example.com</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Weekly Kickstarter • 3 months
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Claimed
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹2,697
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                    {/* Add more rows as needed */}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs would be implemented similarly */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Subscription Analytics</h3>
            <p className="text-gray-600 mt-1">Comprehensive insights into subscription performance</p>
          </div>
          <div className="p-6">
            <SubscriptionAnalyticsDashboard />
          </div>
        </div>
      )}

      {activeTab === 'delivery' && (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Delivery Window Management</h3>
            <p className="text-gray-600 mt-1">Manage delivery time slots, capacity, and scheduling</p>
          </div>
          <div className="p-6">
            <DeliveryWindowManagement />
          </div>
        </div>
      )}

      {activeTab === 'family' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Family Groups Management</h3>
          <p className="text-gray-600">Family groups management interface coming soon...</p>
        </div>
      )}

      {activeTab === 'corporate' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Corporate Accounts Management</h3>
          <p className="text-gray-600">Corporate accounts management interface coming soon...</p>
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Transfer Marketplace Management</h3>
          <p className="text-gray-600">Transfer marketplace management interface coming soon...</p>
        </div>
      )}
    </div>
  );
}
