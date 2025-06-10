import type { Juice } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { JUICES as FALLBACK_JUICES } from '@/lib/constants'; // Import fallback juices
import JuiceDetailClient from './JuiceDetailClient';

interface JuiceDetailPageProps {
  params: { id: string };
}

// Required for static export with dynamic routes
export async function generateStaticParams() {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("generateStaticParams (juices): Supabase not configured. Falling back to local constants for juice IDs.");
    return FALLBACK_JUICES.map(juice => ({
      id: juice.id.toString(),
    }));
  }

  try {
    const { data, error } = await supabase.from('juices').select('id');
    if (error) {
      console.error("generateStaticParams (juices): Error fetching juice IDs from Supabase, falling back to constants.", error);
      return FALLBACK_JUICES.map(juice => ({
        id: juice.id.toString(),
      }));
    }
    if (data) {
      return data.map(juice => ({
        id: juice.id.toString(),
      }));
    }
    return FALLBACK_JUICES.map(juice => ({ // Fallback if data is null but no error
      id: juice.id.toString(),
    }));
  } catch (e) {
    console.error("generateStaticParams (juices): Unexpected error, falling back to constants.", e);
    return FALLBACK_JUICES.map(juice => ({
      id: juice.id.toString(),
    }));
  }
}


export default function JuiceDetailPage() {
  const params = useParams();
  const juiceId = params.id as string;
  const router = useRouter();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [juice, setJuice] = useState<Juice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [availabilityStatus, setAvailabilityStatus] = useState<'In Stock' | 'Low Stock' | 'Out of Stock'>('In Stock');

  useEffect(() => {
    if (!juiceId) {
      setError("Juice ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchJuice = async () => {
      if (!isSupabaseConfigured || !supabase) {
        // Attempt to find in fallback if Supabase isn't configured
        const fallbackJuice = FALLBACK_JUICES.find(j => j.id.toString() === juiceId);
        if (fallbackJuice) {
          setJuice(fallbackJuice);
          document.title = `${fallbackJuice.name} - Elixr`;
           const currentStock = fallbackJuice.stockQuantity || 0;
            if (currentStock <= 0) setAvailabilityStatus('Out of Stock');
            else if (currentStock <= 10) setAvailabilityStatus('Low Stock');
            else setAvailabilityStatus('In Stock');
        } else {
          setError("Database connection is not configured and juice not found in fallback data.");
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: dbError } = await supabase
          .from('juices')
          .select('*')
          .eq('id', juiceId)
          .single();

        if (dbError) {
          console.error("Error fetching juice details:", dbError);
          if (dbError.code === 'PGRST116') { 
            setError("Juice not found in database.");
          } else {
            setError(`Failed to load juice details: ${dbError.message}`);
          }
        } else if (data) {
          const typedData: Juice = {
             ...data,
             price: Number(data.price) || 0,
             stockQuantity: Number(data.stock_quantity) ?? Number(data.stockQuantity) ?? 0,
             tags: Array.isArray(data.tags) ? data.tags : (typeof data.tags === 'string' ? data.tags.split(',') : []),
             image: data.image_url || data.image || 'https://placehold.co/600x400.png',
             dataAiHint: data.data_ai_hint || data.dataAiHint,
             name: data.name || "Unnamed Juice",
             flavor: data.flavor || "N/A",
          };
          setJuice(typedData);
          document.title = `${typedData.name} - Elixr`;

           const currentStock = typedData.stockQuantity || 0;
            if (currentStock <= 0) {
                setAvailabilityStatus('Out of Stock');
            } else if (currentStock <= 10) {
                setAvailabilityStatus('Low Stock');
            } else {
                setAvailabilityStatus('In Stock');
            }

        } else {
          setError("Juice not found in database.");
        }
      } catch (e: any) {
        console.error("Unexpected error fetching juice:", e);
        setError(`An unexpected error occurred: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJuice();
  }, [juiceId]);

  const handleAddToCart = () => {
    if (!juice) return;

     if (availabilityStatus === 'Out of Stock' || (juice.stockQuantity || 0) < quantity) {
      toast({
        title: "Cannot Add to Cart",
        description: "This item is out of stock or has insufficient quantity.",
        variant: "destructive",
      });
      return;
    }
    const imageToUse = juice.image_url || juice.image || 'https://placehold.co/80x80.png';
    const dataAiHintToUse = juice.data_ai_hint || juice.dataAiHint;

    addToCart({ ...juice, image: imageToUse, dataAiHint: dataAiHintToUse }, quantity);
    setQuantity(1); 
    toast({
      title: "Added to Cart!",
      description: `${quantity} x ${juice.name} added to your cart.`,
    });
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

   const isEffectivelyOutOfStock = availabilityStatus === 'Out of Stock';

   const getAvailabilityClasses = () => {
    switch (availabilityStatus) {
      case 'In Stock':
        return 'text-green-600 dark:text-green-400';
      case 'Low Stock':
        return 'text-orange-500 dark:text-orange-400';
      case 'Out of Stock':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-10">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading juice details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild>
           <Link href="/menu">
             <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
           </Link>
         </Button>
      </div>
    );
  }

  if (!juice) {
     return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-orange-500 mb-4">Juice Not Found</h2>
        <p className="text-muted-foreground mb-6">The juice you are looking for could not be found.</p>
         <Button asChild>
           <Link href="/menu">
             <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
           </Link>
         </Button>
      </div>
     );
  }

  const displayImage = juice.image_url || juice.image || 'https://placehold.co/600x400.png';
  const displayDataAiHint = juice.data_ai_hint || juice.dataAiHint || juice.name.toLowerCase().split(" ").slice(0,2).join(" ");


  return (
    <div className="container mx-auto px-4 py-8">
        <Button variant="outline" asChild className="mb-8">
          <Link href="/menu">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Link>
        </Button>
      <Card className="flex flex-col md:flex-row overflow-hidden shadow-lg rounded-lg">
        <div className={cn(
            "relative w-full md:w-1/2",
             (juice.category === 'Fruit Bowls' || juice.category === 'Detox Plans') ? "aspect-[4/3] md:aspect-auto md:h-auto" : "h-64 md:h-auto aspect-video md:aspect-auto" 
          )}>
          <Image
            src={displayImage}
            alt={juice.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
            className={cn(
                 "object-cover",
                isEffectivelyOutOfStock && "grayscale"
            )}
            priority={true} 
            data-ai-hint={displayDataAiHint}
            unoptimized={displayImage.startsWith('https://placehold.co') || displayImage.startsWith('/')}
            onError={(e) => e.currentTarget.src = 'https://placehold.co/600x400.png'}
          />
           {isEffectivelyOutOfStock && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <p className="text-white text-2xl font-bold">Out of Stock</p>
              </div>
            )}
        </div>
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
          <div>
            <CardTitle className="font-headline text-3xl mb-2 text-primary">{juice.name}</CardTitle>
            <CardDescription className="text-lg text-muted-foreground mb-4">{juice.flavor}</CardDescription>
            <p className="text-foreground/80 mb-6">{juice.description}</p>

            <div className="flex items-center justify-between mb-4">
              <p className="text-2xl font-bold text-accent">Rs.{juice.price.toFixed(2)}</p>
              <p className={cn("text-sm font-medium", getAvailabilityClasses())}>
                 {availabilityStatus} ({juice.stockQuantity || 0} left)
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-auto">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={decrementQuantity} aria-label="Decrease quantity" disabled={isEffectivelyOutOfStock}>
                <MinusCircle className="h-5 w-5" />
              </Button>
              <span className="w-12 text-center text-xl font-medium">{quantity}</span>
              <Button variant="outline" size="icon" onClick={incrementQuantity} aria-label="Increase quantity" disabled={isEffectivelyOutOfStock || quantity >= (juice.stockQuantity || 0)}>
                <PlusCircle className="h-5 w-5" />
              </Button>
            </div>
            <Button
              onClick={handleAddToCart}
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-6 py-3"
               disabled={isEffectivelyOutOfStock || quantity > (juice.stockQuantity || 0)}
               aria-disabled={isEffectivelyOutOfStock || quantity > (juice.stockQuantity || 0)}
            >
              <ShoppingCart className="mr-3 h-5 w-5" />
               {isEffectivelyOutOfStock ? 'Out of Stock' : (quantity > (juice.stockQuantity || 0) ? 'Not Enough Stock' : 'Add to Cart')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

