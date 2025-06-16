"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ManageStockPage() {
  const { user, isAdmin, loading: authLoading, isSupabaseConfigured: isAuthContextReady } = useAuth();
  const { toast } = useToast();
  const [juices, setJuices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stockInputs, setStockInputs] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    if (!authLoading && isAuthContextReady && isAdmin && isSupabaseConfigured) {
      fetchJuices();
    }
  }, [authLoading, isAuthContextReady, isAdmin]);

  async function fetchJuices() {
    if (!isSupabaseConfigured || !supabase) {
      toast({ title: "Error", description: "Supabase is not configured.", variant: "destructive" });
      setJuices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from("juices").select("id, name, stock_quantity");
    if (error) {
      toast({ title: "Error", description: "Failed to fetch juices.", variant: "destructive" });
      setJuices([]);
    } else {
      setJuices(data || []);
    }
    setLoading(false);
  }

  async function handleUpdateStock(id: string, delta: number) {
    if (!isSupabaseConfigured || !supabase) {
      toast({ title: "Error", description: "Supabase is not configured.", variant: "destructive" });
      return;
    }
    setUpdatingId(id);
    const juice = juices.find(j => j.id === id);
    if (!juice) return;
    const newStock = Math.max(0, (juice.stock_quantity || 0) + delta);
    const { error } = await supabase.from("juices").update({ stock_quantity: newStock }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Stock Updated", description: `Stock for ${juice.name} is now ${newStock}.` });
      setJuices(juices.map(j => j.id === id ? { ...j, stock_quantity: newStock } : j));
      setStockInputs({ ...stockInputs, [id]: "" });
    }
    setUpdatingId(null);
  }

  function handleInputChange(id: string, value: string) {
    if (/^-?\d*$/.test(value)) {
      setStockInputs({ ...stockInputs, [id]: value });
    }
  }

  if (authLoading || loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh] text-center"><AlertTriangle className="h-12 w-12 text-destructive mb-4" /><h2 className="text-xl font-semibold mb-2">Access Denied</h2><p className="text-muted-foreground mb-6">You are not authorized to access this page.</p><Button asChild><Link href="/">Go to Homepage</Link></Button></div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-primary">Manage Juice Stock</h1>
      <div className="space-y-6">
        {juices.map(juice => (
          <div key={juice.id} className="flex items-center gap-4 border p-4 rounded-lg bg-muted/30">
            <div className="flex-1">
              <div className="font-semibold">{juice.name}</div>
              <div className="text-sm text-muted-foreground">Current Stock: {juice.stock_quantity}</div>
            </div>
            <Input
              type="number"
              className="w-24"
              value={stockInputs[juice.id] ?? ""}
              onChange={e => handleInputChange(juice.id, e.target.value)}
              placeholder="+/-"
              disabled={updatingId === juice.id}
            />
            <Button
              variant="outline"
              disabled={updatingId === juice.id || !stockInputs[juice.id] || stockInputs[juice.id] === "0"}
              onClick={() => handleUpdateStock(juice.id, Number(stockInputs[juice.id]))}
            >
              {updatingId === juice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
