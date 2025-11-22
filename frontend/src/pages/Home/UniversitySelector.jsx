import React from "react";

const universities = [
  { name: "Kasetsart", image: "/images/KU.jpg" },
  { name: "Thammasat", image: "/images/TU.jpg" },
  { name: "Mahidol", image: "/images/MU.jpg" },
  { name: "Chiang Mai", image: "/images/CMU.jpg" },
  { name: "Chulalongkorn", image: "/images/CU.jpg" },
];

function UniversitySelector({ setBackgroundImage }) {
  return (
    <div className="flex justify-center gap-6 w-full">
      {universities.map((uni) => (
        <button
          key={uni.name}
          onMouseEnter={() => setBackgroundImage(uni.image)}
          className="px-8 py-4 rounded-full text-lg font-semibold shadow-lg bg-white text-black 
                     hover:bg-green-200 hover:scale-110 transition-all duration-300 whitespace-nowrap"
        >
          {uni.name}
        </button>
      ))}
    </div>
  );
}
export default UniversitySelector;
