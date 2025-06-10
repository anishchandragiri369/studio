"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/lib/supabaseClient"; // Assuming you have this client configured
import { useAuth } from "@/context/AuthContext"; // Assuming you have this hook

// Assuming addProductSchema is defined in "@/lib/zod-schemas"
const addProductSchema = z.object({
  name: z.string().min(1, { message: "Product name is required." }),
  description: z.string().optional(),
  flavor: z.string().optional(),
  price: z.number().positive({ message: "Price must be a positive number." }),
  imageUrl: z.string().optional(),
  dataAiHint: z.string().optional(),
  category: z.string().min(1, { message: "Category is required." }),
  tags: z.string().optional(),
  stock: z.number().int().nonnegative({ message: "Stock must be a non-negative integer." }),
});

type AddProductFormData = z.infer<typeof addProductSchema>;

export default function AddProductPage() {
  const { user, isAdmin, loading } = useAuth(); // Assuming useAuth provides user, isAdmin, and loading
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
    }
  }, [loading, isAdmin, router]);

  const form = useForm<AddProductFormData>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: "",
      description: "",
      flavor: "",
      price: 0,
      imageUrl: "",
      dataAiHint: "",
      category: "",
      tags: "",
      stock: 0,
    },
  });

  const onSubmit = async (data: AddProductFormData) => {
    setIsSubmitting(true);

    try {
      const { data: newProduct, error } = await supabase
        .from("juices") // Assuming your table name is 'juices'
        .insert([
          {
            name: data.name,
            description: data.description,
            flavor: data.flavor,
            price: data.price,
            image_url: data.imageUrl, // Assuming your column name is 'image_url'
            data_ai_hint: data.dataAiHint, // Assuming your column name is 'data_ai_hint'
            category: data.category,
            tags: data.tags ? data.tags.split(",").map(tag => tag.trim()) : [], // Assuming tags are stored as a string array
            stock: data.stock,
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

  if (loading || !isAdmin) {
    // You might want to show a loading spinner or message here
    return null; // Or a loading component
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Textarea {...field} />
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
                <FormLabel>Flavor</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={event => field.onChange(parseFloat(event.target.value))} />
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
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="dataAiHint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data AI Hint</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                   {/* You could use a Select component here for predefined categories */}
                  <Input {...field} />
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={event => field.onChange(parseInt(event.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding Product..." : "Add Product"}
          </Button>
        </form>
      </Form>
    </div>
  );
}