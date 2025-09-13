// src/components/Footer.jsx
import React from "react";
import { FiGithub } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="bg-[#eaf4e6] py-12 mt-20 shadow-inner">
      <div className="max-w-[1350px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-10 text-gray-800">
        
        {/* LEFT SIDE */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <FiGithub className="text-3xl text-green-700" />
            <a
              href="https://github.com/Hubersity/Hubersity.git"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 hover:text-green-900 font-bold text-lg transition-all hover:scale-105"
            >
              GitHub Repository
            </a>
          </div>

          <ul className="space-y-3 text-gray-700 font-medium">
            <li className="hover:text-green-700 transition-transform hover:translate-x-2">
            Karnpon Poochitkanon — 6710545458 — <span className="text-gray-800">karnpon.p@ku.th</span>
            </li>
            <li className="hover:text-green-700 transition-transform hover:translate-x-2">
            Patthiaon Panitanont — 6710545792 — <span className="text-gray-800">patthiaon.p@ku.th</span>
            </li>
            <li className="hover:text-green-700 transition-transform hover:translate-x-2">
            Khittitaj Bunupuradah — 6710545466 — <span className="text-gray-800">khittitaj.b@ku.th</span>
            </li>
            <li className="hover:text-green-700 transition-transform hover:translate-x-2">
            Watcharapat Pathanutpong — 6710545881 — <span className="text-gray-800">watcharapat.p@ku.th</span>
            </li>
          </ul>
        </div>

        {/* RIGHT SIDE */}
        <div className="md:text-right">
          <h3 className="text-xl font-bold mb-4 text-green-800">Subject</h3>
          <p className="text-gray-700 mb-2">
            <strong>Individual Software Development Process</strong>
          </p>
          <p className="text-gray-700 mb-6">
            <strong>Code:</strong> 01219241-65
          </p>

          <h3 className="text-xl font-bold mb-4 text-green-800">Instructors</h3>
          <ul className="space-y-2">
            <li className="hover:text-green-700 transition-all hover:translate-x-2">
              Dr. Kundjanasith Thonglek
            </li>
            <li className="hover:text-green-700 transition-all hover:translate-x-2">
              Dr. Piya Limcharoen
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom line */}
      <div className="mt-10 text-center text-sm text-gray-500 border-t border-gray-300 pt-4">
        © {new Date().getFullYear()} Hubersity Project. All rights reserved.
      </div>
    </footer>
  );
}