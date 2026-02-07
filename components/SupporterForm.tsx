'use client';

import React, { useState } from 'react';

interface SupporterFormProps {
  onSubmit?: (data: SupporterFormData) => void;
  className?: string;
}

interface SupporterFormData {
  // Personal Details Section
  shareDetails: boolean;
  fullName: string;
  email: string;
  city: string;
  country: string;
  
  // Cause Preferences Section
  supportSpecificCause: boolean;
}

const SupporterForm: React.FC<SupporterFormProps> = ({ onSubmit, className = '' }) => {
  const [formData, setFormData] = useState<SupporterFormData>({
    shareDetails: false,
    fullName: '',
    email: '',
    city: '',
    country: '',
    supportSpecificCause: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof SupporterFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      if (onSubmit) {
        onSubmit(formData);
      }
      setIsSubmitting(false);
    }, 1000);
  };

  // Validation: Form is valid if specific cause option is selected
  const isFormValid = formData.supportSpecificCause;

  return (
    <div className={`supporter-form ${className}`}>
      <style jsx>{`
        .supporter-form {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .form-header {
          background: linear-gradient(135deg, #0B4422 0%, #1a6b3a 100%);
          color: white;
          padding: 40px;
          text-align: center;
        }

        .form-title {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .form-subtitle {
          font-size: 1.1rem;
          opacity: 0.9;
          line-height: 1.6;
        }

        .form-content {
          padding: 40px;
        }

        .section {
          margin-bottom: 40px;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #0B4422;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #0B4422;
          box-shadow: 0 0 0 3px rgba(11, 68, 34, 0.1);
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .checkbox-input {
          width: 20px;
          height: 20px;
          accent-color: #0B4422;
        }

        .checkbox-label {
          font-weight: 500;
          color: #333;
          cursor: pointer;
        }

        .submit-section {
          text-align: center;
          padding-top: 20px;
        }

        .submit-button {
          background: #0B4422;
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 25px;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 200px;
        }

        .submit-button:hover {
          background: #1a6b3a;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(11, 68, 34, 0.3);
        }

        .submit-button:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .submit-button.active {
          background: #0B4422;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
          
          .form-header {
            padding: 30px 20px;
          }
          
          .form-content {
            padding: 30px 20px;
          }
          
          .form-title {
            font-size: 2rem;
          }
        }
      `}</style>

      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h2 className="form-title">🌉 Support DrishiQ</h2>
          <p className="form-subtitle">
            Join our mission to help people see through their challenges. Your support creates opportunities for those who need guidance, clarity, and hope. Every contribution matters - whether it's helping a student struggling with exam pressure, a professional facing career confusion, or someone dealing with personal challenges.
          </p>
        </div>

        <div className="form-content">
          {/* Personal Details Section */}
          <div className="section">
            <h3 className="section-title">👤 Personal Details</h3>
            
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="shareDetails"
                className="checkbox-input"
                checked={formData.shareDetails}
                onChange={(e) => handleInputChange('shareDetails', e.target.checked)}
              />
              <label htmlFor="shareDetails" className="checkbox-label">
                I prefer to make this a silent contribution (anonymous)
              </label>
            </div>

            {!formData.shareDetails && (
              <div className="grid-2">
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    className="form-input"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city" className="form-label">City</label>
                  <input
                    type="text"
                    id="city"
                    className="form-input"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter your city"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country" className="form-label">Country</label>
                  <input
                    type="text"
                    id="country"
                    className="form-input"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Enter your country"
                    required
                  />
                </div>
              </div>
            )}

            {/* Show message when "silent contribution" is selected */}
            {formData.shareDetails && (
              <div className="text-center text-gray-500 italic py-8">
                You've chosen to make this a silent contribution. Your personal details are now hidden.
              </div>
            )}
          </div>

          {/* Cause Preferences Section */}
          <div className="section">
            <h3 className="section-title">🎯 Specific Cause</h3>
            
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="supportSpecificCause"
                className="checkbox-input"
                checked={formData.supportSpecificCause}
                onChange={(e) => handleInputChange('supportSpecificCause', e.target.checked)}
              />
              <label htmlFor="supportSpecificCause" className="checkbox-label">
                Open to support anyone who needs it
              </label>
            </div>


            {/* Show message when "Open to support anyone" is selected */}
            {formData.supportSpecificCause && (
              <div className="text-center text-gray-500 italic py-8">
                You've chosen to support anyone who needs it. The specific cause fields are now hidden.
              </div>
            )}
          </div>
        </div>

        {/* Submit Button - Only active when specific cause details are provided OR when "Open to support anyone" is selected */}
        <div className="submit-section">
          <button
            type="submit"
            className={`submit-button ${isFormValid ? 'active' : 'disabled'}`}
            disabled={!isFormValid}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Submitting...' : 'Pledge Your Support'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupporterForm; 
