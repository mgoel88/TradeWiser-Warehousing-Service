import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string, currency = "INR"): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "N/A";
  
  // For Indian Rupees (INR), use the special notation
  if (currency === "INR") {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    });
    return formatter.format(numValue);
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  });
  return formatter.format(numValue);
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(dateObj);
}

export function formatDateTime(date: Date | string | undefined): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

export function getChannelClass(channel: string): string {
  switch (channel.toLowerCase()) {
    case 'green':
      return 'bg-primary-50 text-primary-800 border-l-4 border-primary-500';
    case 'orange':
      return 'bg-secondary-50 text-secondary-800 border-l-4 border-secondary-500';
    case 'red':
      return 'bg-red-50 text-red-800 border-l-4 border-red-500';
    default:
      return 'bg-gray-50 text-gray-800 border-l-4 border-gray-500';
  }
}

export function getStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'withdrawn':
      return 'bg-gray-100 text-gray-800';
    case 'transferred':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getCommodityIconColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'wheat':
    case 'grain':
      return 'bg-primary-100 text-primary-700';
    case 'rice':
      return 'bg-yellow-100 text-yellow-700';
    case 'pulses':
    case 'legume':
      return 'bg-orange-100 text-orange-700';
    case 'oilseed':
      return 'bg-amber-100 text-amber-700';
    case 'cotton':
      return 'bg-gray-100 text-gray-700';
    case 'spice':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getCommodityFirstLetter(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
