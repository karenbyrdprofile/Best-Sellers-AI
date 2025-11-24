
import React from 'react';

export const Terms: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8 text-gray-700 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
      
      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800">1. Acceptance of Terms</h2>
        <p>
          By using Black Friday AI, you agree to follow these rules and terms.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800">2. Affiliate Disclosure</h2>
        <p>
          Black Friday AI is part of the Amazon Associates Program. We earn a small commission if you buy something through our links (Store ID: samsulalam08-20). This does not change the price you pay.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800">3. Disclaimer</h2>
        <p>
          Our AI suggestions are based on general data. We can't promise that prices or products on Amazon will be exactly the same as shown here. Always check the details on Amazon before you buy.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800">4. Liability</h2>
        <p>
          Black Friday AI is not responsible for any issues or damages that happen from using this service.
        </p>
      </section>
    </div>
  );
};
