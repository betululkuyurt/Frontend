/**
 * Deletes a custom mini service by ID
 * 
 * @param service_id - The ID of the custom service to delete
 * @returns Promise<boolean> - True if deletion was successful
 */

import Cookies from "js-cookie"
export async function deleteMiniService(service_id: number): Promise<boolean> {
  try {
    console.log(`Attempting to delete service with ID: ${service_id}`);
    
    // Prepare headers with authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Try to get the auth token - adjust key name as needed for your application
    const token = Cookies.get("accessToken");
    const currentUserId = Cookies.get("user_id") || "0";
                  
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Call your API endpoint to delete the service
    const response = await fetch(`http://127.0.0.1:8000/api/v1/mini-services/${service_id}?current_user_id=${currentUserId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include', // Include cookies for session-based auth
    });
    
    console.log(`Delete response status: ${response.status}`);
    
    // For 204 No Content responses (success with no body)
    if (response.status === 204) {
      console.log('Service deleted successfully (204 No Content)');
      return true;
    }
    
    // Check if the request was successful but not 204
    if (response.ok) {
      console.log('Service deleted successfully');
      return true;
    }
    
    // Handle error responses
    if (response.status === 401) {
      console.error('Authentication failed. Please log in again.');
      // You might want to redirect to login page or refresh token here
      return false;
    }
    
    try {
      const errorData = await response.json();
      console.error('Delete service failed:', errorData);
      
      // If we have specific error handling logic based on error types:
      if (response.status === 404) {
        console.error('Service not found or already deleted');
      } else if (response.status === 403) {
        console.error('Not authorized to delete this service');
      }
      
      return false;
    } catch (parseError) {
      // Error response had no valid JSON body
      console.error(`Delete service failed with status ${response.status}`, parseError);
      return false;
    }
  } catch (networkError) {
    // Network error when trying to make the request
    console.error('Network error when deleting service:', networkError);
    return false;
  }
}