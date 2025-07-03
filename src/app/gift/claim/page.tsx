'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import GiftClaimPage from '@/components/subscriptions/GiftClaimPage';

function GiftClaimContent() {
  const searchParams = useSearchParams();
  const giftCode = searchParams.get('code') || '';

  if (!giftCode) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Gift Code</h1>
          <p className="text-gray-600 mb-6">No gift code was provided in the URL.</p>
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  return <GiftClaimPage giftCode={giftCode} />;
}

export default function GiftClaimPageWrapper() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }>
        <GiftClaimContent />
      </Suspense>
    </div>
  );
}
