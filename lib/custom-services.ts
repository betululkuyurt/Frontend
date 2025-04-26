// Helper functions for managing custom services
/**
 * Custom Services Utility Module
 * 
 * Bu modül, kullanıcıların oluşturduğu özel AI servislerinin yönetimi için
 * yardımcı fonksiyonlar sağlar. localStorage tabanlı veri yönetimi kullanır.
 * 
 * Özellikler:
 * - Özel servislerin tanımlanması ve tiplerinin belirlenmesi
 * - localStorage'dan servis verilerinin okunması ve kaydedilmesi
 * - ID bazlı servis sorgulama ve filtreleme
 * - Yeni servisler için benzersiz ID oluşturma
 * - Servis güncelleme ve silme işlevleri
 * - Kullanıcıya özel ve herkese açık servislerin filtrelenmesi
 * - Sekmelerde eş zamanlı veri güncellemesi için olay tetikleme
 */
// Define the service type
export interface CustomService {
    id: number
    type: string
    name: string
    description: string
    icon: string
    inputType: string
    outputType: string
    placeholder: string
    buttonText: string
    color: string
    isPublic: boolean
    apiEndpoint?: string
    apiKey?: string
    createdBy: string
    createdAt: string
  }
  
  // Get all custom services from localStorage
  export function getCustomServices(): CustomService[] {
    if (typeof window === "undefined") return []
  
    try {
      const servicesJson = localStorage.getItem("customServices")
      return servicesJson ? JSON.parse(servicesJson) : []
    } catch (error) {
      console.error("Error loading custom services:", error)
      return []
    }
  }
  
  // Get a specific custom service by ID
  export function getCustomServiceById(id: number): CustomService | null {
    const services = getCustomServices()
    return services.find((service) => service.id === id) || null
  }
  
  // Save a custom service to localStorage
  export function saveCustomService(service: CustomService): void {
    const services = getCustomServices()
  
    // Check if service with this ID already exists
    const existingIndex = services.findIndex((s) => s.id === service.id)
  
    if (existingIndex >= 0) {
      // Update existing service
      services[existingIndex] = service
    } else {
      // Add new service
      services.push(service)
    }
  
    localStorage.setItem("customServices", JSON.stringify(services))
  
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event("storage"))
  
    // Also dispatch a custom event for the current tab
    window.dispatchEvent(new CustomEvent("customServiceChange"))
  }
  
  // Delete a custom service
  export function deleteCustomService(id: number): void {
    const services = getCustomServices()
    const updatedServices = services.filter((service) => service.id !== id)
    localStorage.setItem("customServices", JSON.stringify(updatedServices))
  
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event("storage"))
  
    // Also dispatch a custom event for the current tab
    window.dispatchEvent(new CustomEvent("customServiceChange"))
  }
  
  // Generate a new unique ID for a service
  export function generateNewServiceId(): number {
    const services = getCustomServices()
  
    // Find the highest ID among built-in and custom services
    const builtInHighestId = 10 // Highest ID from built-in services
  
    const customHighestId = services.length > 0 ? Math.max(...services.map((service) => service.id)) : 0
  
    // Return a new ID that's higher than both
    return Math.max(builtInHighestId, customHighestId) + 1
  }
  
  // Get user-specific services
  export function getUserServices(userId: string): CustomService[] {
    const services = getCustomServices()
    return services.filter((service) => service.createdBy === userId)
  }
  
  // Get public services
  export function getPublicServices(): CustomService[] {
    const services = getCustomServices()
    return services.filter((service) => service.isPublic)
  }
  
  