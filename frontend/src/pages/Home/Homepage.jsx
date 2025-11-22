import React, { useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import UniversitySelector from "./UniversitySelector";
import { Link } from "react-router-dom";

export default function Homepage() {
  const [backgroundImage, setBackgroundImage] = useState("/images/KU.jpg");

  return (
    <section className="max-w-[1350px] mx-auto px-4 pt-12">
      <div className="bg-[#eaf4e6] rounded-[36px] p-6 md:p-8 shadow-sm">
        <div className="rounded-[80px] overflow-hidden shadow-xl relative h-[600px] transition-all duration-500">
          <img
            src={backgroundImage}
            alt="University"
            className="w-full h-full object-cover transition-transform duration-500"
          />

          {/* overlay */}
          <div className="absolute inset-y-0 left-0 w-[33%] bg-black/50 flex flex-col justify-center pl-10 md:pl-12">
            <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-3">
              Hubersity
            </h1>
            <p className="text-xl md:text-2xl font-medium text-gray-200 drop-shadow-lg">
              A Place to Talk About Anything
            </p>
          </div>

          {/* Right button */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-10 md:pr-12">
         <Link
              to="/signin"
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-md transition-all duration-300"
          >
              Join Now
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-green-700">
              <FiArrowUpRight className="text-xl" />
              </span>
         </Link>
         </div>

          {/* University selection button */}
          <div className="absolute bottom-[50px] left-1/2 -translate-x-1/2 z-20 w-full flex justify-center">
            <UniversitySelector setBackgroundImage={setBackgroundImage} />
          </div>
        </div>
      </div>
    </section>
  );
}
