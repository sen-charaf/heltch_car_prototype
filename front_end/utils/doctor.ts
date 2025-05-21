// utils/doctor.ts
import api from "@/api/api";

export const fetchAllDoctors = async () => {
  try {
    const res = await api.get(`/doctors`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw error; // Important to throw so react-query can catch it
  }
};