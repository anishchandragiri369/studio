'use client';

import { Suspense } from 'react';
import FamilySharingManager from '@/components/subscriptions/FamilySharingManager';

export default function FamilySharingPage() {
  // In a real app, get this from authentication context
  const currentUserId = 'current-user-id';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }>
        <FamilySharingManager currentUserId={currentUserId} />
      </Suspense>
    </div>
  );
}
