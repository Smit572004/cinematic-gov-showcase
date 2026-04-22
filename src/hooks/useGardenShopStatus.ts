import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useGardenShopStatus = () => {
  return useQuery({
    queryKey: ["garden-shop-status"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("value_de")
        .eq("content_key", "garden_shop_open")
        .single();
      return data?.value_de === "true";
    },
    staleTime: 30_000,
  });
};
