
import React from 'react';

export const Privacy: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8 text-gray-700 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      
      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800">1. Data Collection</h2>
        <p>
          We do not collect personal information like your name, email, or address. 
          Your chat history and reviews are saved only in your browser. We don't keep them on our servers.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800">2. AI Interaction</h2>
        <p>
          When you chat with our bot, your text is sent to Google's AI to create a response. 
          Please do not share private info in the chat.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800">3. Third-Party Links</h2>
        <p>
          Our site has links to Amazon.com. If you click a link, you will go to Amazon's website. 
          We do not run Amazon, so please check their privacy policy too.
        </p>
      </section>
      
      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800">4. Cookies</h2>
        <p>
          We use local storage to save your settings. Amazon may use cookies when you visit their site through our links.
        </p>
      </section>
    </div>
  );
};
