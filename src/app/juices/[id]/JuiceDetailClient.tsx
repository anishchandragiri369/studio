'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Juice } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { getAvailabilityClasses } from '@/lib/utils'; // Assuming this utility function is defined

interface JuiceDetailClientProps {
  juiceId: string;
}

const JuiceDetailClient: React.FC<JuiceDetailClientProps> = ({ juiceId }) => {
  const [juice, setJuice] = useState<Juice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const fetchJuice = async () => {
      try {
        const juiceDocRef = doc(db, 'juices', juiceId);
        const juiceDocSnap = await getDoc(juiceDocRef);

        if (juiceDocSnap.exists()) {
          setJuice({ id: juiceDocSnap.id, ...juiceDocSnap.data() } as Juice);
        } else {
          setError('Juice not found.');
        }
      } catch (err) {
        setError('Failed to fetch juice details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJuice();
  }, [juiceId]);

  const handleAddToCart = () => {
    if (juice) {
      addToCart({ ...juice, quantity });
      toast({
        title: 'Added to cart',
        description: `${quantity} x ${juice.name} added to your cart.`,
      });
    }
  };

  const incrementQuantity = () => {
    setQuantity(prevQuantity => prevQuantity + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prevQuantity => (prevQuantity > 1 ? prevQuantity - 1 : 1));
  };

  const isEffectivelyOutOfStock = juice && juice.stock === 0;

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!juice) {
    return <div className="container mx-auto p-4 text-center">Juice not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <div className="relative w-full h-64 md:h-96 rounded-md overflow-hidden">
            <Image
              src={juice.imageUrl}
              alt={juice.name}
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-md"
            />
          </div>
        </div>
        <div className="md:w-1/2 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-2">{juice.name}</h1>
          <p className="text-gray-600 text-lg mb-4">{juice.description}</p>
          <div className="text-2xl font-semibold text-green-600 mb-4">${juice.price.toFixed(2)}</div>

          <div className="flex items-center mb-4">
            <Button onClick={decrementQuantity} variant="outline" size="sm">
              -
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-16 text-center mx-2"
              min="1"
            />
            <Button onClick={incrementQuantity} variant="outline" size="sm">
              +
            </Button>
          </div>

          <div className={`text-sm font-medium ${getAvailabilityClasses(juice.stock)} mb-4`}>
            Availability: {juice.stock > 0 ? `${juice.stock} in stock` : 'Out of stock'}
          </div>

          <Button
            onClick={handleAddToCart}
            className="w-full"
            disabled={isEffectivelyOutOfStock}
          >
            {isEffectivelyOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JuiceDetailClient;