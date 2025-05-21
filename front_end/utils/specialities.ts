// utils/Specialities.ts
import api from "@/api/api";

export const getSpecialities = async (conditionIds: string[]) => {
  try {
    // Convert array to comma-separated string or use array format
    const params = new URLSearchParams();
    conditionIds.forEach(id => params.append('conditions', id));
    
    const res = await api.get(`/specialties?${params.toString()}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching specialties:", error);
    throw error;
  }
};