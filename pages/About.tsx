
import React from 'react';
import { ShieldCheck, Zap, Heart } from 'lucide-react';
import { APP_NAME } from '../constants';

export const About: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-12 animate-fade-in text-gray-800">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">About {APP_NAME}</h1>
        <p className="text-xl text-gray-500">
          Changing how you find Amazon's best deals using smart AI.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="p-6 bg-white border border-gray-200 rounded-xl text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <Zap size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Super Fast</h3>
          <p className="text-sm text-gray-500">
            Powered by Gemini 2.5 Flash for instant, accurate results based on real data.
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-xl text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Trusted Links</h3>
          <p className="text-sm text-gray-500">
            We send you straight to Amazon's official search results and product pages.
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-xl text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center text-red-500">
            <Heart size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Picked for You</h3>
          <p className="text-sm text-gray-500">
            Our AI cuts through the noise to find highly-rated, best-selling items.
          </p>
        </div>
      </div>

      <div className="space-y-4 text-gray-700 leading-relaxed bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
        <p>
          {APP_NAME} was built to make online shopping easier. 
          With millions of products out there, finding the right one can be tiring. 
          We use advanced AI technology to understand exactly what you need and 
          find the best-selling products from Amazon instantly.
        </p>
        <p>
          Whether you are looking for car parts, cool gadgets, or stuff for your home, 
          our chat tool makes shopping as easy as texting a friend.
        </p>
      </div>
    </div>
  );
};
