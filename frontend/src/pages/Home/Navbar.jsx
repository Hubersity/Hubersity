import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full flex items-center justify-between px-8 py-3 bg-white shadow-md h-20 z-50">
      {/* Logo */}
      <div className="flex items-center">
        <img
          src="/images/horizontal-logo.png"
          alt="Hubersity Logo"
          className="h-40 w-auto object-contain"
        />
      </div>

      {/* Menu Items */}
      <div className="space-x-16 text-gray-700 font-medium hidden md:flex text-lg">
        <a href="#home" className="hover:text-green-600">Home</a>
        <a href="#about" className="hover:text-green-600">About</a>
        <a href="#feature" className="hover:text-green-600">Feature</a>
        <a href="#contact" className="hover:text-green-600">Contact</a>
      </div>

      {/* Auth Buttons */}
      <div className="space-x-8">
        <Link
          to="/signup"
          className="text-sm font-semibold hover:text-green-700"
        >
          Sign up
        </Link>
        <Link
          to="/login"
          className="bg-green-700 text-white px-8 py-1.5 rounded-full text-sm hover:bg-green-800 transition"
        >
          Login
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;