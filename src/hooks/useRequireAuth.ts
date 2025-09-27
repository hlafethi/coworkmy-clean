import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRequireAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        toast.error("Vous devez être connecté pour accéder à cette page");
        navigate("/auth/login");
      }
    };
    checkSession();
  }, [navigate]);
} 