'use client';

import { Suspense } from 'react';
import TransferMarketplace from '@/components/subscriptions/TransferMarketplace';

export default function TransferMarketplacePage() {
  // In a real app, get this from authentication context
  const currentUserId = 'current-user-id';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }>
        <TransferMarketplace currentUserId={currentUserId} />
      </Suspense>
    </div>
  );
}
