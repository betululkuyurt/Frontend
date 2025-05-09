// lib/services.ts (NOT services.tsx)
import { toast } from "@/components/ui/use-toast"
import Cookies from "js-cookie"

export const deleteMiniService = async (id: number): Promise<boolean> => {
  try {
    const userId = Cookies.get("user_id");
    const token = Cookies.get("accessToken") || localStorage.getItem("accessToken");

    if (!userId || !token) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to delete a service.",
      });
      return false;
    }

    const response = await fetch(
      `http://127.0.0.1:8000/api/v1/mini-services/${id}?current_user_id=${userId}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: 'include',
      }
    );

    if (response.status === 404) {
      toast({
        variant: "destructive",
        title: "Service Not Found",
        description: "This service may have been already deleted or doesn't exist.",
      });
      return true;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to delete service";
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }

      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: errorMessage,
      });
      return false;
    }

    toast({
      title: "Success",
      description: "Service has been successfully deleted.",
    });

    // Dispatch event for cache invalidation
    window.dispatchEvent(new CustomEvent("serviceDeleted", { 
      detail: { 
        id, 
        timestamp: Date.now(),
        shouldInvalidateCache: true
      } 
    }));

    return true;

  } catch (error) {
    console.error("Error in delete operation:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "An unexpected error occurred while deleting the service.",
    });
    return false;
  }
};