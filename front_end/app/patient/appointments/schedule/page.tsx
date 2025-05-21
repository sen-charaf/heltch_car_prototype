"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

// Import components
import StepOne from "./components/StepOne";
import StepTwo from "./components/StepTwo";
import StepThree from "./components/StepThree";
import StepFour from "./components/StepFour";
import ProgressSteps from "./components/ProgressSteps";
import DoctorDetails from "./components/DoctorDetails";

// Import types and data
import { Reason, Doctor } from "./types";
import { doctorTypes } from "./data";
import { fetchAllDoctors } from "@/utils/doctor";
import { getHealthCategories, getHealthConditions } from "@/utils/HealthCondition";
import { getSpecialities } from "@/utils/specialities";

export default function AppointmentBooking() {
  // Doctor Hooks to fetch the data
  // const { data: doctors = [], isLoading, isError } = useDoctors();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [categories, setCategories] = useState<String[]>([]);
  const [conditions, setConditions] = useState<String[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);


  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await fetchAllDoctors();
        setDoctors(data);
        setIsLoading(false);
        // console.log("data: ", data);

      } catch (error) {
        console.error("Error fetching doctors:", error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Fetch All Health Categories
  useEffect(() => {
    const fetchHealthCategories = async () => {
      try {
        const data = await getHealthCategories();
        setCategories(data);
        console.log("Categories data: ", data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchHealthCategories();
  }, []);

  // Fetch All Health Conditions
  useEffect(() => {
    const fetchHealthConditions = async () => {
      try {
        const data = await getHealthConditions();
        setConditions(data);
        console.log("Conditions data: ", data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchHealthConditions();
  }, []);



  // State for the booking process
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedReasons, setSelectedReasons] = useState<Reason[]>([]);
  const [selectedDoctorType, setSelectedDoctorType] = useState<string | null>(
    null
  );
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [showTimeSlots, setShowTimeSlots] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"rating" | "availability">(
    "availability"
  );
  const [viewingDoctorDetails, setViewingDoctorDetails] = useState<
    string | null
  >(null);

  // Add ref for scrolling to top when step changes
  const contentRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Add to your state declarations
  const [specialities, setSpecialities] = useState<any[]>([]);

  // Fetch Specialities
  useEffect(() => {
    const fetchSpecialities = async () => {
      if (selectedReasons.length === 0) {
        setSpecialities([]);
        return;
      }

      // Extract Ids from selectedReasons
      const selectedIds = selectedReasons.map(reason => reason.id);

      try {
        const data = await getSpecialities(selectedIds);
        setSpecialities(data);
        console.log("data =========> ", data);
        
      } catch (error) {
        console.error("Error fetching specialties:", error);
        setSpecialities([]);
      }
    };

    fetchSpecialities();
  }, [selectedReasons]);

  // Fetch Specialities
  useEffect(() => {
    const fetchSpecialities = async () => {
      // console.log("selectedReasons: ", selectedReasons);
      // Extract Ids from selectedReasons
      const selectedIds = selectedReasons.map(reason => reason.id);
      console.log("selectedIds: ", selectedIds);

      try {
        const data = await getSpecialities(

        );
        setSpecialities(data);
        console.log("Specialities data: ", data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchSpecialities();
  }, [selectedReasons]);

  const handleReasonSelect = (reason: Reason) => {
    // Check if the reason is already selected
    if (selectedReasons.some((item) => item.id === reason.id)) {
      // If selected, remove it
      setSelectedReasons(
        selectedReasons.filter((item) => item.id !== reason.id)
      );
    } else {
      // If not selected and less than 3 items are selected, add it
      if (selectedReasons.length < 3) {
        setSelectedReasons([...selectedReasons, reason]);
      }
    }
  };

  const isSelected = (id: string) => {
    return selectedReasons.some((item) => item.id === id);
  };

  const handleContinue = () => {
    if (currentStep === 1 && selectedReasons.length > 0) {
      setCurrentStep(2);
      // Ensure scroll to top happens after state update
      setTimeout(() => {
        if (mainContainerRef.current) {
          window.scrollTo({
            top: mainContainerRef.current.offsetTop,
            behavior: "smooth",
          });
        }
      }, 100);
    } else if (currentStep === 2 && selectedDoctorType) {
      setCurrentStep(3);
      setTimeout(() => {
        if (mainContainerRef.current) {
          window.scrollTo({
            top: mainContainerRef.current.offsetTop,
            behavior: "smooth",
          });
        }
      }, 100);
    } else if (currentStep === 3 && selectedDoctor && selectedTimeSlot) {
      setCurrentStep(4);
      setTimeout(() => {
        if (mainContainerRef.current) {
          window.scrollTo({
            top: mainContainerRef.current.offsetTop,
            behavior: "smooth",
          });
        }
      }, 100);
    } else if (currentStep === 4) {
      // Submit the Appointment
      console.log("Submit the Appointment")

      console.log("selectedDoctor : ", selectedDoctor)

      const appointmentData = {
        doctorId: selectedDoctor, // ID of the selected doctor
        date: selectedDoctor, // Date of the appointment
        startTime: selectedTimeSlot?.split(' - ')[0], // Start time from the selected slot
        endTime: selectedTimeSlot?.split(' - ')[1], // End time from the selected slot
        conditionIds: selectedReasons.map(reason => reason.id), // Array of condition IDs
        notes: "Appointment booked via patient portal" // Optional notes
      };

      // console.log("appointmentData : ", appointmentData)

    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);

      // Reset selections when going back
      if (currentStep === 3) {
        setSelectedDoctor(null);
        setSelectedTimeSlot(null);
        setShowTimeSlots(null);
      }
    }
  };

  const toggleTimeSlots = (doctorId: string) => {
    if (showTimeSlots === doctorId) {
      setShowTimeSlots(null);
    } else {
      setShowTimeSlots(doctorId);
      setSelectedDoctor(doctorId);
    }
  };

  const selectTimeSlot = (slot: string) => {
    setSelectedTimeSlot(slot);
  };

  const viewDoctorDetails = (doctorId: string) => {
    setViewingDoctorDetails(doctorId);
  };

  const closeDoctorDetails = () => {
    setViewingDoctorDetails(null);
  };

  // Filter doctor types based on selected reasons
  const getRecommendedDoctorTypes = () => {
    if (selectedReasons.length === 0) return doctorTypes;

    const selectedTitles = selectedReasons.map((reason) => reason.title);

    return doctorTypes
      .map((doctorType) => {
        const matchCount = doctorType.specialties.filter((speciality) =>
          selectedTitles.includes(speciality)
        ).length;

        return {
          ...doctorType,
          matchCount,
        };
      })
      .sort((a, b) => b.matchCount - a.matchCount);
  };

  // Filter doctors based on selected doctor type
  const getFilteredDoctors = () => {
    if (!selectedDoctorType) return [];

    // Map the API data to match the expected Doctor type
    const mappedDoctors = doctors.map((doctor: any) => ({
      id: doctor._id,
      name: `${doctor.user.firstName} ${doctor.user.lastName}`,
      speciality: doctor.speciality,
      rating: doctor.averageRating,
      reviews: doctor.reviewsCount,
      experience: doctor.experience.length > 0
        ? new Date().getFullYear() - doctor.experience[0].startYear
        : 0,
      distance: "5 miles", // You might want to calculate this or get from API
      image: doctor.user.profileImage || "/placeholder.svg",
      availability: doctor.availabilitySchedule
        .filter((avail: any) => avail.isAvailable)
        .map((avail: any) => ({
          day: avail.day,
          slots: generateTimeSlots(avail.startTime, avail.endTime) // Helper function needed
        }))
    }));

    // console.log("doctor.speciality: ", doctors[1].speciality);

    // generateTimeSlots
    function generateTimeSlots(startTime: string, endTime: string): string[] {
      const slots = [];
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      let currentHour = startHour;
      let currentMinute = startMinute;

      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const nextHour = currentMinute + 30 >= 60 ? currentHour + 1 : currentHour;
        const nextMinute = (currentMinute + 30) % 60;

        const endHourFormatted = nextHour.toString().padStart(2, '0');
        const endMinuteFormatted = nextMinute.toString().padStart(2, '0');

        slots.push(
          `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')} - ${endHourFormatted}:${endMinuteFormatted}`
        );

        currentHour = nextHour;
        currentMinute = nextMinute;
      }

      return slots;
    }

    // Filter by selected doctor type
    const filtered = mappedDoctors.filter(
      (doctor: any) => doctor.speciality.toLowerCase() === selectedDoctorType.toLowerCase()
    );

    // Sort doctors based on the selected sort criteria
    if (sortBy === "rating") {
      return filtered.sort((a: any, b: any) => b.rating - a.rating);
    } else {
      // Sort by availability (doctors with today slots first)
      return filtered.sort((a: any, b: any) => {
        const aHasToday = a.availability.some((avail: any) => avail.day === "Today");
        const bHasToday = b.availability.some((avail: any) => avail.day === "Today");

        if (aHasToday && !bHasToday) return -1;
        if (!aHasToday && bHasToday) return 1;
        return b.rating - a.rating; // If tie, sort by rating
      });
    }
  };

  const recommendedDoctorTypes = getRecommendedDoctorTypes();
  const filteredDoctors = getFilteredDoctors();

  // Get the selected doctor type title
  const getSelectedDoctorTypeTitle = () => {
    if (!selectedDoctorType) return "";
    const doctorType = doctorTypes.find((dt) => dt.id === selectedDoctorType);
    return doctorType ? doctorType.title : "";
  };

  // Get the selected doctor object
  const getSelectedDoctorObject = (): Doctor | null => {
    if (!selectedDoctor) return null;
    return doctors.find((doc) => doc.id === selectedDoctor) || null;
  };

  // If viewing doctor details, show that component
  if (viewingDoctorDetails) {
    return (
      <DoctorDetails
        doctorId={viewingDoctorDetails}
        onBack={closeDoctorDetails}
        onBookAppointment={() => {
          closeDoctorDetails();
          // You could also set the selected doctor here if needed
          // setSelectedDoctor(viewingDoctorDetails);
        }}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-white overflow-x-hidden"
      ref={mainContainerRef}
    >
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div
          ref={contentRef}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="inline-block px-3 py-1 bg-[#e6f7f2] text-[#0d9488] text-sm font-medium rounded-full mb-4">
                Premium Healthcare Anywhere
              </div>
              <h1 className="text-2xl font-bold text-[#1e3a8a]">
                Book an Appointment
              </h1>
            </div>
            <ProgressSteps currentStep={currentStep} />
          </div>

          <div className="max-h-[calc(100vh-250px)] overflow-y-auto px-2 pb-4">
            {currentStep === 1 && (
              <StepOne
                selectedReasons={selectedReasons}
                onReasonSelect={handleReasonSelect}
                isSelected={isSelected}
                categories={categories}
                conditions={conditions}
              />
            )}

            {currentStep === 2 && (
              <StepTwo
                selectedReasons={selectedReasons}
                recommendedDoctorTypes={[...recommendedDoctorTypes]}
                selectedDoctorType={selectedDoctorType}
                setSelectedDoctorType={setSelectedDoctorType}
                specialities={specialities}
              />
            )}

            {currentStep === 3 && (
              <StepThree
                selectedDoctorTypeTitle={getSelectedDoctorTypeTitle()}
                selectedReasons={selectedReasons}
                sortBy={sortBy}
                setSortBy={setSortBy}
                filteredDoctors={filteredDoctors}
                selectedDoctor={selectedDoctor}
                showTimeSlots={showTimeSlots}
                toggleTimeSlots={toggleTimeSlots}
                selectedTimeSlot={selectedTimeSlot}
                selectTimeSlot={selectTimeSlot}
                viewDoctorDetails={viewDoctorDetails}
              />
            )}

            {currentStep === 4 && (
              <StepFour
                selectedDoctor={getSelectedDoctorObject()}
                selectedTimeSlot={selectedTimeSlot}
                selectedReasons={selectedReasons}
              />
            )}
          </div>

          {/* Navigation buttons - fixed at the bottom */}
          <div className="mt-6 flex justify-between items-center border-t border-gray-100 pt-6">
            <button
              onClick={handleBack}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 ${currentStep === 1
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-50"
                }`}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={handleContinue}
              disabled={
                (currentStep === 1 && selectedReasons.length === 0) ||
                (currentStep === 2 && !selectedDoctorType) ||
                (currentStep === 3 && (!selectedDoctor || !selectedTimeSlot))
              }
              className={`px-6 py-2 rounded-lg ${(currentStep === 1 && selectedReasons.length === 0) ||
                (currentStep === 2 && !selectedDoctorType) ||
                (currentStep === 3 && (!selectedDoctor || !selectedTimeSlot))
                ? "opacity-50 cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-[#1e3a8a] text-white hover:bg-[#1e40af]"
                }`}
            >
              {currentStep === 4 ? "Confirm Appointment" : "Continue"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
