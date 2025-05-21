import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import HealthCondition from '../models/HealthCondition.js';
import { BaseService } from './BaseService.js';

export class AppointmentService extends BaseService<any> {
  constructor() {
    super(Appointment);
  }
  
  async createAppointment(appointmentData: {
    doctorId: string;
    patientId: string;
    date: string;
    startTime: string;
    endTime: string;
    conditionIds?: string[];
    notes?: string;
  }) {
    try {
      const { doctorId, patientId, date, startTime, endTime, conditionIds, notes } = appointmentData;
      
      // Vérifier si le médecin existe
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error("Doctor not found");
      }
      
      // Vérifier si le créneau est disponible
      const isAvailable = await this.checkSlotAvailability(
        doctorId,
        new Date(date),
        startTime,
        endTime
      );
      
      if (!isAvailable) {
        throw new Error("This time slot is not available");
      }
      
      // Extraire les raisons de la visite à partir des conditions
      let reason = { name: "", reasonType: "physic" };
      
      if (conditionIds && conditionIds.length > 0) {
        const conditions = await HealthCondition.find({
          _id: { $in: conditionIds },
        });
        
        if (conditions.length > 0) {
          // Utiliser le premier comme raison principale
          reason.name = conditions[0].name;
          reason.reasonType =
            conditions[0].category === "Mental Health" ? "mental" : "physic";
        }
      }
      
      // Créer le rendez-vous
      const appointment = new Appointment({
        patient: patientId,
        doctor: doctor.user._id, // L'ID utilisateur du médecin (pas l'ID du docteur)
        date: new Date(date),
        startTime,
        endTime,
        status: "scheduled",
        reason,
        notes: notes ? [notes] : [],
        payment: {
          amount: doctor.consultationFee,
          status: "pending",
        },
      });
      
      return await appointment.save();
    } catch (error) {
      throw error;
    }
  }
  
  async cancelAppointment(appointmentId: string, userId: string, userRole: string, reason?: string) {
    try {
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        throw new Error("Appointment not found");
      }
      
      // Vérifier que l'utilisateur est autorisé à annuler ce rendez-vous
      if (
        appointment.patient.toString() !== userId.toString() &&
        appointment.doctor.toString() !== userId.toString() &&
        userRole !== "admin"
      ) {
        throw new Error("Not authorized to cancel this appointment");
      }
      
      // Vérifier que le rendez-vous peut être annulé
      if (["completed", "cancelled", "no-show"].includes(appointment.status)) {
        throw new Error(`Cannot cancel an appointment with status: ${appointment.status}`);
      }
      
      // Mettre à jour le statut et ajouter une note si fournie
      appointment.status = "cancelled";
      if (reason) {
        appointment.notes.push(`Cancelled: ${reason}`);
      }
      
      return await appointment.save();
    } catch (error) {
      throw error;
    }
  }
  
  async getAppointmentDetails(appointmentId: string, userId: string, userRole: string) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate("patient", "firstName lastName email profileImage")
        .populate("doctor", "firstName lastName email profileImage");
      
      if (!appointment) {
        throw new Error("Appointment not found");
      }
      
      // Vérifier que l'utilisateur est autorisé à accéder à ce rendez-vous
      if (
        appointment.patient._id.toString() !== userId.toString() &&
        appointment.doctor._id.toString() !== userId.toString() &&
        userRole !== "admin"
      ) {
        throw new Error("Not authorized to access this appointment");
      }
      
      return appointment;
    } catch (error) {
      throw error;
    }
  }
  
  async findByPatient(patientId: string, populate?: string | string[]): Promise<any[]> {
    try {
      let query = Appointment.find({ patient: patientId });
      
      if (populate) {
        if (Array.isArray(populate)) {
          populate.forEach(field => {
            query = query.populate(field);
          });
        } else {
          query = query.populate(populate);
        }
      }
      
      return await query.exec();
    } catch (error) {
      throw error;
    }
  }
  
  async findByDoctor(doctorId: string, populate?: string | string[]): Promise<any[]> {
    try {
      let query = Appointment.find({ doctor: doctorId });
      
      if (populate) {
        if (Array.isArray(populate)) {
          populate.forEach(field => {
            query = query.populate(field);
          });
        } else {
          query = query.populate(populate);
        }
      }
      
      return await query.exec();
    } catch (error) {
      throw error;
    }
  }
  
  async getHealthCategories(): Promise<any[]> {
    try {
      return await HealthCondition.aggregate([
        { $group: { _id: "$category" } },
        { $project: { _id: 0, name: "$_id" } },
        { $sort: { name: 1 } }
      ]);
    } catch (error) {
      throw error;
    }
  }
  
  async checkSlotAvailability(doctorId: string, date: Date, startTime: string, endTime: string): Promise<boolean> {
    try {
      // Obtenir le jour de la semaine
      const dayNames = [
        "Sunday", "Monday", "Tuesday", "Wednesday", 
        "Thursday", "Friday", "Saturday"
      ];
      const dayName = dayNames[date.getDay()];
      
      // Vérifier si le médecin est disponible ce jour-là
      const doctor = await Doctor.findById(doctorId);
      if (!doctor || !doctor.availabilitySchedule) {
        return false;
      }
      
      const daySchedule = doctor.availabilitySchedule.find(
        (schedule: { day: string; isAvailable: boolean }) => 
          schedule.day === dayName && schedule.isAvailable
      );
      
      if (!daySchedule) {
        return false; // Le médecin n'est pas disponible ce jour-là
      }
      
      // Convertir les heures en minutes
      const convertTimeToMinutes = (time: string): number => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
      };
      
      const scheduleStart = convertTimeToMinutes(daySchedule.startTime);
      const scheduleEnd = convertTimeToMinutes(daySchedule.endTime);
      const slotStart = convertTimeToMinutes(startTime);
      const slotEnd = convertTimeToMinutes(endTime);
      
      // Vérifier si le créneau est dans l'horaire du médecin
      if (slotStart < scheduleStart || slotEnd > scheduleEnd) {
        return false; // Le créneau n'est pas dans l'horaire du médecin
      }
      
      // Obtenir les rendez-vous existants pour ce jour
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const existingAppointments = await Appointment.find({
        doctor: doctor.user, // L'ID utilisateur du médecin
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ["cancelled", "no-show"] },
      });
      
      // Vérifier si le créneau est déjà réservé
      const isBooked = existingAppointments.some((appointment) => {
        const apptStart = convertTimeToMinutes(appointment.startTime);
        const apptEnd = convertTimeToMinutes(appointment.endTime);
        return (
          (slotStart >= apptStart && slotStart < apptEnd) ||
          (slotEnd > apptStart && slotEnd <= apptEnd) ||
          (slotStart <= apptStart && slotEnd >= apptEnd)
        );
      });
      
      return !isBooked;
    } catch (error) {
      console.error("Error checking slot availability:", error);
      return false;
    }
  }
  
  async getAvailableSlotsForDay(
    doctorId: string, 
    date: Date, 
    startTime: string, 
    endTime: string
  ): Promise<any[]> {
    try {
      // Convertir les heures en minutes depuis minuit
      const convertTimeToMinutes = (time: string): number => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
      };
      
      const formatTimeToAmPm = (time: string): string => {
        const [hours, minutes] = time.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
      };
      
      const start = convertTimeToMinutes(startTime);
      const end = convertTimeToMinutes(endTime);
      
      // Obtenir les rendez-vous existants pour ce jour
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return [];
      }
      
      const existingAppointments = await Appointment.find({
        doctor: doctor.user, // L'ID utilisateur du médecin
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ["cancelled", "no-show"] },
      });
      
      // Créer des créneaux de 30 minutes
      const slots = [];
      const SLOT_DURATION = 30; // en minutes
      
      for (let i = start; i < end; i += SLOT_DURATION) {
        const slotStart = `${Math.floor(i / 60)
          .toString()
          .padStart(2, "0")}:${(i % 60).toString().padStart(2, "0")}`;
        const slotEnd = `${Math.floor((i + SLOT_DURATION) / 60)
          .toString()
          .padStart(2, "0")}:${((i + SLOT_DURATION) % 60)
          .toString()
          .padStart(2, "0")}`;
        
        // Vérifier si ce créneau est déjà réservé
        const isBooked = existingAppointments.some((appointment) => {
          const apptStart = convertTimeToMinutes(appointment.startTime);
          const apptEnd = convertTimeToMinutes(appointment.endTime);
          return (
            (i >= apptStart && i < apptEnd) ||
            (i + SLOT_DURATION > apptStart && i + SLOT_DURATION <= apptEnd) ||
            (i <= apptStart && i + SLOT_DURATION >= apptEnd)
          );
        });
        
        if (!isBooked) {
          slots.push({
            start: slotStart,
            end: slotEnd,
            formattedStart: formatTimeToAmPm(slotStart),
            duration: SLOT_DURATION,
          });
        }
      }
      
      return slots;
    } catch (error) {
      console.error("Error getting available slots:", error);
      return [];
    }
  }
}

export default new AppointmentService();