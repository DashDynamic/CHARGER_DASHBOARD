
// ////////////////////////starting new//////////////////////////////////////////////

// "use client";

// import WaveCharging from "@/components/WaveCharging";
// import { motion } from "framer-motion";
// import React, { useEffect, useState } from "react";
// import Image from "next/image";
// import { Poppins } from "next/font/google";
// import { useBMSData } from "@/hooks/useBMSData";
// import { useChargingTimer } from "@/hooks/useChargingTimer";
// import { useRouter } from "next/navigation";
// import { useChargingStatus } from "@/hooks/useChargingStatus";
// import { onValue, ref, set } from "firebase/database";
// import { database } from "@/config/firebase";
// import EmergencyStop from "@/components/EmergencyStop";
// import ChargingPadWarning from "@/components/FodDialog";
// import MisalignmentDialog from "@/components/MisalignmentDialog";

// const poppins = Poppins({
//   subsets: ["latin"],
//   weight: ["500"],
// });

// const Charge = () => {
//   const router = useRouter();
//   const { voltage, current, SOC, isReceiverCoilDetected, loading, error } = useBMSData();
//   const { 
//     status, 
//     resetChargingStatus, 
//     fodTriggered, 
//     misalignmentTriggered, 
//     emergencyStop,
//     updateChargingStatus 
//   } = useChargingStatus();
  
//   const [isScootyParked, setIsScootyParked] = useState(true);
//   const {
//     timeLeft,
//     setTimeLeft,
//     pauseTimer,
//     resumeTimer,
//     pauseTimerOnly,
//     isPaused,
//     setPausedTimeLeft,
//     setPauseTimestamp,

//   } = useChargingTimer();
//   console.log("timeleft", timeLeft);
  
//   const [power, setPower] = useState<number>(0);
//   const [energy, setEnergy] = useState<number>(0);
//   const [isChargingInitialized, setIsChargingInitialized] = useState(false);
//   const [unparkStartTime, setUnparkStartTime] = useState<number | null>(null);
//   const [parkCountdown, setParkCountdown] = useState<number>(60);

//   // Effect for Firebase listeners
//   useEffect(() => {
//     try {
//       const coilRef = ref(database, "IsReceiverCoilDetected");
//       const unsubscribeCoil = onValue(coilRef, (coilSnapshot) => {
//         const isCoilDetected = coilSnapshot.val();
//         setIsScootyParked(isCoilDetected);
//       });

//       return () => {
//         unsubscribeCoil();
//       };
//     } catch (error) {
//       console.error("Error setting up Firebase listeners:", error);
//     }
//   }, []);

//   // Effect for handling charging time
//   useEffect(() => {
//     let interval: NodeJS.Timeout;

//     if (status?.isChargingInitialized && status?.duration?.endTime && !isPaused) {
//       interval = setInterval(() => {
//         const now = Date.now();
//         const endTime = status.duration.endTime!;
//         const difference = endTime - now;

//         if (difference <= 0) {
//           clearInterval(interval);
//           resetChargingStatus();
//           setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
//           setPausedTimeLeft(null);
//           setPauseTimestamp(null);
//           router.push("/done");
//           return;
//         }

//         const hours = Math.floor(difference / (1000 * 60 * 60));
//         const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
//         const seconds = Math.floor((difference % (1000 * 60)) / 1000);

//         setTimeLeft({ hours, minutes, seconds });

//         // Only calculate energy if all safety conditions are met
//         if (isChargingInitialized && !fodTriggered && !misalignmentTriggered && !emergencyStop && current > 0) {
//           const calculatedPower = Number((voltage * current).toFixed(2));
//           const powerInKW = calculatedPower / 1000;
//           const calculatedEnergy = powerInKW / 3600;
//           setEnergy((prev) => Number((prev + calculatedEnergy).toFixed(6)));
//         }
//       }, 1000);
//     }

//     return () => {
//       if (interval) {
//         clearInterval(interval);
//       }
//     };
//   }, [
//     status?.isChargingInitialized,
//     status?.duration?.endTime,
//     resetChargingStatus,
//     isPaused,
//     isChargingInitialized,
//     fodTriggered,
//     misalignmentTriggered,
//     emergencyStop,
//     current,
//     voltage,
//   ]);

//   // Effect for power calculations
//   useEffect(() => {
//     setPower(0);
//     if (loading || error || !voltage || !current || SOC === undefined) {
//       return;
//     }

//     // Only initialize charging if safety conditions are met
//     if (current > 0.001 && !fodTriggered && !misalignmentTriggered && !emergencyStop) {
//       updateChargingStatus(true);
//       setIsChargingInitialized(true);
//     } else {
//       setPower(0);
//     }

//     try {
//       const calculatedPower = Number((voltage * current).toFixed(2));
//       setPower(calculatedPower);
//     } catch (err) {
//       console.error("Calculation error:", err);
//       setPower(0);
//     }
//   }, [voltage, current, SOC, loading, error, fodTriggered, misalignmentTriggered, emergencyStop]);

//   // Effect for handling safety conditions
//   useEffect(() => {
//     if (!isScootyParked || fodTriggered || misalignmentTriggered || emergencyStop) {
//       pauseTimer();
//       setIsChargingInitialized(false);
//       setPower(0);
//       updateChargingStatus(false);
//     } else if (current <= 0) {
//       pauseTimerOnly();
//     } else {
//       resumeTimer();
//     }
//   }, [isScootyParked, fodTriggered, misalignmentTriggered, emergencyStop]);

//   // Effect for resetting energy when safety conditions are triggered
//   useEffect(() => {
//     if (fodTriggered || misalignmentTriggered || emergencyStop) {
//       setEnergy(0);
//       set(ref(database, "chargingStatus"), false);
//     }
//   }, [fodTriggered, misalignmentTriggered, emergencyStop]);

//   // Effect for handling unpark countdown
//   useEffect(() => {
//     let countdownInterval: NodeJS.Timeout;

//     if (!isScootyParked) {
//       if (!unparkStartTime) {
//         setUnparkStartTime(Date.now());
//       }

//       countdownInterval = setInterval(() => {
//         setParkCountdown((prev) => {
//           if (prev <= 1) {
//             resetChargingStatus();
//             setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
//             setPausedTimeLeft(null);
//             setPauseTimestamp(null);
//             setIsChargingInitialized(false);
//             setEnergy(0);
//             router.push("/");
//             return 0;
//           }
//           return prev - 1;
//         });
//       }, 1000);
//     } else {
//       setUnparkStartTime(null);
//       setParkCountdown(60);
//     }

//     return () => {
//       if (countdownInterval) {
//         clearInterval(countdownInterval);
//       }
//     };
//   }, [isScootyParked, unparkStartTime, resetChargingStatus, router]);

//   if (loading) {
//     return <div className="w-[768px] h-[1024px] flex items-center justify-center bg-[#2A2D32]">Loading...</div>;
//   }

//   if (error) {
//     return <div className="w-[768px] h-[1024px] flex items-center justify-center bg-[#2A2D32]">Error: {error}</div>;
//   }
// //jayam test
//   const formatTime = (value: number): string => {
//     return value.toString().padStart(2, "0");
//   };

//   return (

//     <div
//       className="w-[768px] h-[1024px] overflow-hidden bg-[#2A2D32] font-sans pt-7"
//       style={{
//         backgroundImage: "url(/main-bg.png)",
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//       }}
//     >


    

     
//       <div className="flex justify-center items-center p-1 pt-20 w-full px-8">
//         <motion.div
//           className="text-left flex-col gap-2 mb-12 relative"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.3 }}
//         >
//           <motion.div
//             className="text-white/90 text-5xl font-medium tracking-wider relative group"
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.5, delay: 0.6 }}
//           >
//             <span
//               className={`${poppins.className} relative ${
//                 isScootyParked ? "" : "text-white"
//               }`}
//             >
//               {isScootyParked ? (
//                 isChargingInitialized ? (
//                   current <= 0 ? (
//                     "Charging Paused"
//                   ) : (
//                     "Charging"
//                   )
//                 ) : (
//                   "Initializing Charging"
//                 )
//               ) : (
//                 <div className="flex items-center gap-3">
//                   <span>Park your vehicle</span>
//                   <span className="text-red-400 font-mono bg-red-500/10 px-3 py-0.5 rounded-md border border-red-500/20">
//                     {Math.floor(parkCountdown / 60)}:
//                     {(parkCountdown % 60).toString().padStart(2, "0")}
//                   </span>
//                 </div>
//               )}
//             </span>
//           </motion.div>
//         </motion.div>
//       </div>

//       <ChargingPadWarning isFodThere={fodTriggered} />
    
//       {/* misalignment */}
//       <MisalignmentDialog isMisaligned={misalignmentTriggered} />

      
      
//       {/* /misalignmentSnapshot */}
    

//       <div className="flex flex-col items-center gap-6 mb-12 scale-150">
//         <motion.div
//           className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/5 shadow-lg shadow-cyan-500/10"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.8 }}
//         >
//           <button
//     onClick={() => {
//       setIsChargingInitialized(false); // Stop the charging process
//       set(ref(database, "chargingStatus"), false); // Update Firebase charging status
//       router.push("/"); // Navigate to the home page
//     }}
//     className="text-white/90 text-sm font-medium flex items-center"
//   >
//     {SOC + "% "}Charged
//   </button>
//           <svg
//             width="14"
//             height="14"
//             viewBox="0 0 24 24"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//             className="text-cyan-400"
//           >
//             <path
//               d="M13 2L4.09347 12.6879C3.74466 13.1064 3.57026 13.3157 3.56759 13.4925C3.56526 13.6461 3.63373 13.7923 3.75326 13.8889C3.89075 14 4.16318 14 4.70803 14H12L11 22L19.9065 11.3121C20.2553 10.8936 20.4297 10.6843 20.4324 10.5075C20.4347 10.3539 20.3663 10.2077 20.2467 10.1111C20.1092 10 19.8368 10 19.292 10H12L13 2Z"
//               stroke="currentColor"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             />
//           </svg>
//         </motion.div>
//       </div>

//       <WaveCharging isChargeInit={isChargingInitialized} percentage={SOC} />

//       <div className="flex w-full justify-center items-center mb-4">
//         <div className="flex-col justify-center items-center gap-36">
//           <motion.div
//             initial={{ x: 768 }}
//             animate={{ x: 0 }}
//             key={isScootyParked ? "parked" : "not-parked"}
//             transition={{
//               duration: 5,
//               type: "spring",
//               stiffness: 100,
//               damping: 100,
//               repeat: isScootyParked ? 0 : Infinity,
//             }}
//           >
          
//               <Image
//                 src="/charge-bike.png"
//                 alt="Charger pad"
//                 width={500}
//                 height={300}
//                 className="drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]"
//               />
//           </motion.div>
           
//           <div className="flex w-full items-center justify-center">
//             <Image
//               src="/charge-pad.png"
//               alt="Charger pad"
//               width={200}
//               height={100}
//               className="drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]"
//             />
//           </div>
//         </div>
//       </div>

//       <div className="w-full px-12 mt-7">
//         <div className="grid grid-cols-2 gap-6">
//           <motion.div
//             className="group shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] px-8 py-4 bg-black/20 backdrop-blur-sm rounded-lg text-gray-400 text-xl font-bold w-full text-center hover:shadow-[0_0_0_1px_rgba(6,182,212,0.2)_inset] transition-all duration-300 hover:bg-black/30"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 1.0 }}
//           >
//             <span className="text-nowrap">Energy: </span>
//             <span className="group-hover:text-cyan-400/90 transition-colors duration-300 text-nowrap">
//               {energy.toFixed(5)} kWh
//             </span>
//           </motion.div>

//           <motion.div
//             className="group shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] px-8 py-4 bg-black/20 backdrop-blur-sm rounded-lg text-gray-400 text-xl font-bold w-full text-center hover:shadow-[0_0_0_1px_rgba(6,182,212,0.2)_inset] transition-all duration-300 hover:bg-black/30"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 1.2 }}
//           >
            
            
//             Time Remaining:{" "}
//             <span className="group-hover:text-cyan-400/90 transition-colors duration-300">
//               {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:
//               {formatTime(timeLeft.seconds)}
//             </span> 
//           </motion.div>

//           <motion.div
//             className="group shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] px-8 py-4 bg-black/20 backdrop-blur-sm rounded-lg text-gray-400 text-xl font-bold w-full text-center hover:shadow-[0_0_0_1px_rgba(6,182,212,0.2)_inset] transition-all duration-300 hover:bg-black/30"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 1.4 }}
//           >
//             Charging Current:{" "}
//             <span className="group-hover:text-cyan-400/90 transition-colors duration-300">
//               {current.toFixed(2)} A
//             </span>
//           </motion.div>

//           <motion.div
//             className="group shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] px-8 py-4 bg-black/20 backdrop-blur-sm rounded-lg text-gray-400 text-xl font-bold w-full text-center hover:shadow-[0_0_0_1px_rgba(6,182,212,0.2)_inset] transition-all duration-300 hover:bg-black/30"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 1.6 }}
//           >
//             Power:{" "}
//             <span className="group-hover:text-cyan-400/90 transition-colors duration-300">
//               {power} W
//             </span>
//           </motion.div>
//         </div>
//       </div>
//       {emergencyStop && <EmergencyStop isEmergencyStop={emergencyStop} />}
//     </div>
//   );
  
// };

// export default Charge;

"use client";

import WaveCharging from "@/components/WaveCharging";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Poppins } from "next/font/google";
import { useBMSData } from "@/hooks/useBMSData";
import { useChargingTimer } from "@/hooks/useChargingTimer";
import { useRouter } from "next/navigation";
import { useChargingStatus } from "@/hooks/useChargingStatus";
import { onValue, ref, set } from "firebase/database";
import { database } from "@/config/firebase";
import EmergencyStop from "@/components/EmergencyStop";
import ChargingPadWarning from "@/components/FodDialog";
import MisalignmentDialog from "@/components/MisalignmentDialog";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500"],
});

const Charge = () => {
  const router = useRouter();
  const { voltage, current, SOC, isReceiverCoilDetected, loading, error } = useBMSData();
  const { 
    status, 
    resetChargingStatus, 
    fodTriggered, 
    misalignmentTriggered, 
    emergencyStop,
    updateChargingStatus 
  } = useChargingStatus();
  
  const [isScootyParked, setIsScootyParked] = useState(true);
  const {
    timeLeft,
    setTimeLeft,
    pauseTimer,
    resumeTimer,
    pauseTimerOnly,
    isPaused,
    setPausedTimeLeft,
    setPauseTimestamp,
  } = useChargingTimer();
  
  const [power, setPower] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(0);
  const [isChargingInitialized, setIsChargingInitialized] = useState(false);
  const [unparkStartTime, setUnparkStartTime] = useState<number | null>(null);
  const [parkCountdown, setParkCountdown] = useState<number>(60);

  // Effect for Firebase listeners
  useEffect(() => {
    try {
      const coilRef = ref(database, "IsReceiverCoilDetected");
      const unsubscribeCoil = onValue(coilRef, (coilSnapshot) => {
        const isCoilDetected = coilSnapshot.val();
        setIsScootyParked(isCoilDetected);
      });

      return () => {
        unsubscribeCoil();
      };
    } catch (error) {
      console.error("Error setting up Firebase listeners:", error);
    }
  }, []);

  // Effect for handling charging time
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status?.isChargingInitialized && status?.duration?.endTime && !isPaused) {
      interval = setInterval(() => {
        const now = Date.now();
        const endTime = status.duration.endTime!;
        const difference = endTime - now;

        if (difference <= 0) {
          clearInterval(interval);
          resetChargingStatus();
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
          setPausedTimeLeft(null);
          setPauseTimestamp(null);
          router.push("/done");
          return;
        }

        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });

        // Calculate energy if all safety conditions are met
        if (isChargingInitialized && !fodTriggered && !misalignmentTriggered && !emergencyStop && current > 0) {
          const calculatedPower = Number((voltage * current).toFixed(2));
          const powerInKW = calculatedPower / 1000;
          const calculatedEnergy = powerInKW / 3600;
          setEnergy((prev) => Number((prev + calculatedEnergy).toFixed(6)));
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    status?.isChargingInitialized,
    status?.duration?.endTime,
    resetChargingStatus,
    isPaused,
    isChargingInitialized,
    fodTriggered,
    misalignmentTriggered,
    emergencyStop,
    current,
    voltage,
  ]);

  // Updated effect for power calculations with auto-resume
  useEffect(() => {
    if (loading || error || !voltage || !current || SOC === undefined) {
      setPower(0);
      return;
    }

    // Calculate power regardless of safety state
    try {
      const calculatedPower = Number((voltage * current).toFixed(2));
      setPower(calculatedPower);
    } catch (err) {
      console.error("Calculation error:", err);
      setPower(0);
    }

    // Handle charging initialization and safety conditions
    if (current > 0.001 && !fodTriggered && !misalignmentTriggered && !emergencyStop && isScootyParked) {
      setIsChargingInitialized(true);
      updateChargingStatus(true);
    }
  }, [voltage, current, SOC, loading, error, fodTriggered, misalignmentTriggered, emergencyStop, isScootyParked]);

  // Separate effect for handling safety conditions with auto-resume
  useEffect(() => {
    const hasSafetyTrigger = fodTriggered || misalignmentTriggered || emergencyStop || !isScootyParked;

    if (hasSafetyTrigger) {
      // Pause charging during safety trigger
      pauseTimer();
      setIsChargingInitialized(false);
      setPower(0);
      updateChargingStatus(false);
      set(ref(database, "chargingStatus"), false);
    } else {
      // Auto-resume when safety triggers clear
      if (current > 0.001) {
        setIsChargingInitialized(true);
        updateChargingStatus(true);
        set(ref(database, "chargingStatus"), true);
        resumeTimer();
      } else {
        // Keep timer paused if no current flowing
        pauseTimerOnly();
      }
    }
  }, [fodTriggered, misalignmentTriggered, emergencyStop, isScootyParked, current]);

  // Effect for resetting energy when safety conditions are triggered
  useEffect(() => {
    // Check if any triggers are active
    if (fodTriggered || misalignmentTriggered || emergencyStop) {
      // Turn off charging
      setEnergy(0);
      set(ref(database, "charging_status/duration/isChargingInitialized"), false);
    } else {
      // Turn on charging
      set(ref(database, "charging_status/duration/isChargingInitialized"), true);
    }
  }, [fodTriggered, misalignmentTriggered, emergencyStop]);

  // Effect for handling unpark countdown
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;

    if (!isScootyParked) {
      if (!unparkStartTime) {
        setUnparkStartTime(Date.now());
      }

      countdownInterval = setInterval(() => {
        setParkCountdown((prev) => {
          if (prev <= 1) {
            resetChargingStatus();
            setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            setPausedTimeLeft(null);
            setPauseTimestamp(null);
            setIsChargingInitialized(false);
            setEnergy(0);
            router.push("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setUnparkStartTime(null);
      setParkCountdown(60);
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [isScootyParked, unparkStartTime, resetChargingStatus, router]);

  if (loading) {
    return <div className="w-[768px] h-[1024px] flex items-center justify-center bg-[#2A2D32]">Loading...</div>;
  }

  if (error) {
    return <div className="w-[768px] h-[1024px] flex items-center justify-center bg-[#2A2D32]">Error: {error}</div>;
  }

  const formatTime = (value: number): string => {
    return value.toString().padStart(2, "0");
  };

  return (
    <div
      className="w-[768px] h-[1024px] overflow-hidden bg-[#2A2D32] font-sans pt-7"
      style={{
        backgroundImage: "url(/main-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex justify-center items-center p-1 pt-20 w-full px-8">
        <motion.div
          className="text-left flex-col gap-2 mb-12 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="text-white/90 text-5xl font-medium tracking-wider relative group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <span
              className={`${poppins.className} relative ${
                isScootyParked ? "" : "text-white"
              }`}
            >
              {isScootyParked ? (
                isChargingInitialized ? (
                  current <= 0 ? (
                    "Charging Paused"
                  ) : (
                    "Charging"
                  )
                ) : (
                  "Initializing Charging"
                )
              ) : (
                <div className="flex items-center gap-3">
                  <span>Park your vehicle</span>
                  <span className="text-red-400 font-mono bg-red-500/10 px-3 py-0.5 rounded-md border border-red-500/20">
                    {Math.floor(parkCountdown / 60)}:
                    {(parkCountdown % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              )}
            </span>
          </motion.div>
        </motion.div>
      </div>

      <ChargingPadWarning isFodThere={fodTriggered} />
      <MisalignmentDialog isMisaligned={misalignmentTriggered} />

      <div className="flex flex-col items-center gap-6 mb-12 scale-150">
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/5 shadow-lg shadow-cyan-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <button
            onClick={() => {
              setIsChargingInitialized(false);
              set(ref(database, "chargingStatus"), false);
              router.push("/");
            }}
            className="text-white/90 text-sm font-medium flex items-center"
          >
            {SOC + "% "}Charged
          </button>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-cyan-400"
          >
            <path
              d="M13 2L4.09347 12.6879C3.74466 13.1064 3.57026 13.3157 3.56759 13.4925C3.56526 13.6461 3.63373 13.7923 3.75326 13.8889C3.89075 14 4.16318 14 4.70803 14H12L11 22L19.9065 11.3121C20.2553 10.8936 20.4297 10.6843 20.4324 10.5075C20.4347 10.3539 20.3663 10.2077 20.2467 10.1111C20.1092 10 19.8368 10 19.292 10H12L13 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </div>

      <WaveCharging isChargeInit={isChargingInitialized} percentage={SOC} />

      <div className="flex w-full justify-center items-center mb-4">
        <div className="flex-col justify-center items-center gap-36">
          <motion.div
            initial={{ x: 768 }}
            animate={{ x: 0 }}
            key={isScootyParked ? "parked" : "not-parked"}
            transition={{
              duration: 5,
              type: "spring",
              stiffness: 100,
              damping: 100,
              repeat: isScootyParked ? 0 : Infinity,
            }}
          >
            <Image
              src="/charge-bike.png"
              alt="Charger pad"
              width={500}
              height={300}
              className="drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            />
          </motion.div>
           
          <div className="flex w-full items-center justify-center">
            <Image
              src="/charge-pad.png"
              alt="Charger pad"
              width={200}
              height={100}
              className="drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            />
          </div>
        </div>
      </div>

      <div className="w-full px-12 mt-7">
        <div className="grid grid-cols-2 gap-6">
          <motion.div
            className="group shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] px-8 py-4 bg-black/20 backdrop-blur-sm rounded-lg text-gray-400 text-xl font-bold w-full text-center hover:shadow-[0_0_0_1px_rgba(6,182,212,0.2)_inset] transition-all duration-300 hover:bg-black/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <span className="text-nowrap">Energy: </span>
            <span className="group-hover:text-cyan-400/90 transition-colors duration-300 text-nowrap">
              {energy.toFixed(5)} kWh
            </span>
          </motion.div>

          <motion.div
            className="group shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] px-8 py-4 bg-black/20 backdrop-blur-sm rounded-lg text-gray-400 text-xl font-bold w-full text-center hover:shadow-[0_0_0_1px_rgba(6,182,212,0.2)_inset] transition-all duration-300 hover:bg-black/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <span className="text-nowrap">Energy: </span>
            <span className="group-hover:text-cyan-400/90 transition-colors duration-300 text-nowrap">
              {energy.toFixed(5)} kWh
            </span>
          </motion.div>

          <motion.div
            className="group shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] px-8 py-4 bg-black/20 backdrop-blur-sm rounded-lg text-gray-400 text-xl font-bold w-full text-center hover:shadow-[0_0_0_1px_rgba(6,182,212,0.2)_inset] transition-all duration-300 hover:bg-black/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            
            
            Time Remaining:{" "}
            <span className="group-hover:text-cyan-400/90 transition-colors duration-300">
              {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:
              {formatTime(timeLeft.seconds)}
            </span>
          </motion.div>

          <motion.div
            className="group shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] px-8 py-4 bg-black/20 backdrop-blur-sm rounded-lg text-gray-400 text-xl font-bold w-full text-center hover:shadow-[0_0_0_1px_rgba(6,182,212,0.2)_inset] transition-all duration-300 hover:bg-black/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            Charging Current:{" "}
            <span className="group-hover:text-cyan-400/90 transition-colors duration-300">
              {current.toFixed(2)} A
            </span>
          </motion.div>

          <motion.div
            className="group shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] px-8 py-4 bg-black/20 backdrop-blur-sm rounded-lg text-gray-400 text-xl font-bold w-full text-center hover:shadow-[0_0_0_1px_rgba(6,182,212,0.2)_inset] transition-all duration-300 hover:bg-black/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.6 }}
          >
            Power:{" "}
            <span className="group-hover:text-cyan-400/90 transition-colors duration-300">
              {power} W
            </span>
          </motion.div>
        </div>
      </div>
      {emergencyStop && <EmergencyStop isEmergencyStop={emergencyStop} />}
    </div>
  );
  
};

export default Charge;
