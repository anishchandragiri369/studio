
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured as isSupabaseReady } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Loader2, AlertTriangle, PackagePlus } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { addProductFormSchema } from "@/lib/zod-schemas";
import type { AddProductFormData } from "@/lib/types";

export default function AddProductPage() {
  const { user, isAdmin, loading: authLoading, isSupabaseConfigured: isAuthContextReady } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use the canonical schema from lib
  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductFormSchema),
    defaultValues: {
      name: "",
      description: "",
      flavor: "",
      price: 0,
      imageUrl: "",
      dataAiHint: "",
      category: "",
      tags: "",
      stockQuantity: 0,
    },
  });

  useEffect(() => {
    // Redirect non-admins or if auth is not ready/configured
    if (!authLoading && isAuthContextReady && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page.",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [authLoading, isAuthContextReady, isAdmin, router, toast, user]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'Add New Product - Elixr Admin';
    }
  }, []);


  const onSubmit = async (data: AddProductFormData) => {
    if (!isSupabaseReady || !supabase) {
        toast({ title: "Database Error", description: "Supabase client is not configured.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    try {
      // Determine the final image URL: use provided URL, or generate placeholder
      let finalImageUrl = data.imageUrl;
      if (!finalImageUrl || finalImageUrl.trim() === '') {
        finalImageUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(data.name)}`;
      }

      const { error } = await supabase
        .from("juices")
        .insert([
          {
            name: data.name,
            description: data.description,
            flavor: data.flavor,
            price: data.price,
            image_url: finalImageUrl,
            data_ai_hint: data.dataAiHint || data.name.toLowerCase().split(" ").slice(0,2).join(" "),
            category: data.category,
            tags: data.tags ? data.tags.split(",").map(tag => tag.trim()).filter(Boolean) : [],
            stock_quantity: data.stockQuantity,
          },
        ]);

      if (error) {
        throw error;
      }

      toast({
        title: "Product added successfully!",
        description: `"${data.name}" has been added to the menu.`,
      });
      form.reset(); 
    } catch (error: any) {
      toast({
        title: "Error adding product",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthContextReady) {
     return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Admin Feature Unavailable</AlertTitle>
          <AlertDescription>
            Admin functionalities are currently disabled because authentication services are not ready. Please check configuration.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!isSupabaseReady && isAuthContextReady) { // Auth might be ready, but Supabase client for DB isn't
     return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Database Connection Issue</AlertTitle>
          <AlertDescription>
            Cannot connect to the product database. Admin functionalities related to products are disabled. Please check Supabase configuration.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-4 py-12 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You are not authorized to access this page.</p>
        <Button asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-3">
          <PackagePlus className="inline-block h-10 w-10 mr-2" /> Add New Product
        </h1>
        <p className="text-lg text-muted-foreground">Fill in the details for the new juice or product.</p>
      </section>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto p-6 sm:p-8 bg-card shadow-xl rounded-lg">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Sunrise Orange" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Describe the product..." disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="flavor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Flavor Profile</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Sweet, tangy, with notes of ginger" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (Rs.) *</FormLabel>
                <FormControl>
                   <Input type="number" {...field} step="0.01" placeholder="e.g., 99.99" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL or Path</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., /images/sunrise.png OR https://example.com/image.png" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a full URL (https://...) or a path to an image in your `public/images/` folder (e.g., `/images/my-juice.jpg`). 
                  If left blank, a placeholder will be generated.
                </p>
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="dataAiHint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image AI Hint (max 2 words)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., orange juice" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
                 <p className="text-xs text-muted-foreground mt-1">Keywords for Unsplash search if placeholder/external image fails. Defaults to product name if blank.</p>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Fruit Blast, Green Power" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (comma-separated)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., energizing, vitamin c, morning" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stockQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity *</FormLabel>
                <FormControl>
                  <Input type="number" {...field} placeholder="e.g., 100" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting || !isSupabaseReady} className="w-full text-lg py-3">
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PackagePlus className="mr-2 h-5 w-5" />}
            Add Product to Menu
          </Button>
        </form>
      </Form>
    </div>
  );
}

    