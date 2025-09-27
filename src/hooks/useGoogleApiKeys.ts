import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GoogleApiKeys {
  id: string;
  api_key: string;
  place_id: string;
  created_at: string;
  updated_at: string;
}

export function useGoogleApiKeys() {
  const queryClient = useQueryClient();

  const { data: keys, isLoading, error } = useQuery<GoogleApiKeys | null>({
    queryKey: ["google-api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_api_keys")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { mutate: updateKeys } = useMutation({
    mutationFn: async (newKeys: { api_key: string; place_id: string }) => {
      const { data, error } = await supabase
        .from("google_api_keys")
        .upsert(newKeys)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-api-keys"] });
    },
  });

  return {
    keys,
    isLoading,
    error,
    updateKeys,
  };
} 