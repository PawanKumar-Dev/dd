'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, User, UserPlus, Phone, MapPin, MapPinIcon, Loader2, CheckCircle, Building } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import Logo from './Logo';
import toast from 'react-hot-toast';

interface RegisterFormProps {
  className?: string;
}

export default function MultiStageRegisterForm({ className = '' }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    phoneCc: '+91',
    companyName: '',
    address: {
      line1: '',
      city: '',
      state: '',
      country: 'IN',
      zipcode: '',
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const router = useRouter();

  const totalSteps = 4;

  // Step validation functions
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Info
        return !!(formData.firstName && formData.lastName && formData.email && formData.companyName);
      case 2: // Contact Info
        return !!(formData.phone && formData.phoneCc);
      case 3: // Address Info
        return !!(formData.address.line1 && formData.address.city && formData.address.state && formData.address.zipcode);
      case 4: // Password
        return !!(formData.password && formData.confirmPassword && formData.password === formData.confirmPassword);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast.error('Please fill in all required fields before proceeding');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || completedSteps.includes(step - 1)) {
      setCurrentStep(step);
    }
  };

  // Load form data from localStorage on component mount (excluding passwords)
  useEffect(() => {
    const savedData = localStorage.getItem('registerFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(prev => ({
          ...prev,
          firstName: parsedData.firstName || '',
          lastName: parsedData.lastName || '',
          email: parsedData.email || '',
          phone: parsedData.phone || '',
          phoneCc: parsedData.phoneCc || '+91',
          companyName: parsedData.companyName || '',
          address: parsedData.address || {
            line1: '',
            city: '',
            state: '',
            country: 'IN',
            zipcode: '',
          },
          // Don't restore passwords for security
          password: '',
          confirmPassword: '',
        }));
      } catch (error) {
        console.error('Failed to load saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage when it changes (excluding passwords)
  useEffect(() => {
    const dataToSave = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      phoneCc: formData.phoneCc,
      companyName: formData.companyName,
      address: formData.address,
      // Don't save passwords for security
    };
    localStorage.setItem('registerFormData', JSON.stringify(dataToSave));
  }, [formData.firstName, formData.lastName, formData.email, formData.phone, formData.phoneCc, formData.companyName, formData.address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If not on final step, go to next step
    if (currentStep < totalSteps) {
      nextStep();
      return;
    }

    // Final step - submit the form
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          phoneCc: formData.phoneCc,
          companyName: formData.companyName,
          address: formData.address,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear saved form data
        localStorage.removeItem('registerFormData');

        if (data.requiresActivation) {
          toast.success('Account created successfully! Please check your email to activate your account.');
          router.push('/login?message=Account created successfully. Please check your email to activate your account.');
        } else {
          toast.success('Account created successfully!');
          router.push('/login');
        }
      } else {
        toast.error(data.error || 'An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    // Check if we're on a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      toast.error('Location detection requires HTTPS. Please fill the address manually or use a secure connection.');
      return;
    }

    setIsDetectingLocation(true);

    try {
      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;

      // Use reverse geocoding to get address details
      // Try multiple geocoding services for better reliability
      let data: any;
      try {
        // Primary service: BigDataCloud (free, no API key required)
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );

        if (!response.ok) {
          throw new Error('Primary geocoding service failed');
        }

        data = await response.json();
      } catch (primaryError) {
        console.warn('Primary geocoding failed, trying fallback:', primaryError);

        // Fallback service: OpenStreetMap Nominatim (free, no API key required)
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`
        );

        if (!fallbackResponse.ok) {
          throw new Error('All geocoding services failed');
        }

        const fallbackData = await fallbackResponse.json();

        // Convert Nominatim format to our expected format
        data = {
          city: fallbackData.address?.city || fallbackData.address?.town || fallbackData.address?.village,
          locality: fallbackData.address?.city || fallbackData.address?.town || fallbackData.address?.village,
          principalSubdivision: fallbackData.address?.state,
          administrativeAreaLevel1: fallbackData.address?.state,
          countryCode: fallbackData.address?.country_code?.toUpperCase(),
          postcode: fallbackData.address?.postcode,
          localityInfo: {
            administrative: [{
              name: fallbackData.address?.city || fallbackData.address?.town || fallbackData.address?.village
            }]
          }
        };
      }

      // Update form with detected location
      setFormData(prev => ({
        ...prev,
        address: {
          line1: data.localityInfo?.administrative?.[0]?.name || data.principalSubdivision || '',
          city: data.city || data.locality || '',
          state: data.principalSubdivision || data.administrativeAreaLevel1 || '',
          country: data.countryCode || 'IN',
          zipcode: data.postcode || '',
        }
      }));

      toast.success('Location detected and address filled automatically!');
    } catch (error: any) {
      console.error('Location detection error:', error);

      if (error.code === 1) {
        if (error.message.includes('secure origins')) {
          toast.error('Location detection requires HTTPS. Please use a secure connection or fill the address manually.');
        } else {
          toast.error('Location access denied. Please enable location permissions.');
        }
      } else if (error.code === 2) {
        toast.error('Location unavailable. Please check your internet connection.');
      } else if (error.code === 3) {
        toast.error('Location request timed out. Please try again.');
      } else {
        toast.error('Failed to detect location. Please fill the address manually.');
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Step content components
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
              <p className="text-gray-600">Tell us about yourself</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                name="firstName"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleChange}
                required
                fullWidth
                icon={<User className="h-4 w-4 text-gray-400" />}
              />
              <Input
                label="Last name"
                name="lastName"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={handleChange}
                required
                fullWidth
                icon={<User className="h-4 w-4 text-gray-400" />}
              />
            </div>

            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
              icon={<Mail className="h-4 w-4 text-gray-400" />}
            />

            <Input
              label="Company name"
              name="companyName"
              placeholder="Enter your company name"
              value={formData.companyName}
              onChange={handleChange}
              required
              fullWidth
              icon={<Building className="h-4 w-4 text-gray-400" />}
              helperText="Required for ResellerClub registration"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Contact Information</h3>
              <p className="text-gray-600">How can we reach you?</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country Code
                </label>
                <select
                  name="phoneCc"
                  value={formData.phoneCc}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="+91">🇮🇳 +91 (India)</option>
                  <option value="+1">🇺🇸 +1 (USA)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+61">🇦🇺 +61 (Australia)</option>
                  <option value="+49">🇩🇪 +49 (Germany)</option>
                  <option value="+33">🇫🇷 +33 (France)</option>
                  <option value="+65">🇸🇬 +65 (Singapore)</option>
                  <option value="+971">🇦🇪 +971 (UAE)</option>
                  <option value="+81">🇯🇵 +81 (Japan)</option>
                  <option value="+86">🇨🇳 +86 (China)</option>
                </select>
              </div>
              <div className="col-span-2">
                <Input
                  label="Phone number"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  fullWidth
                  icon={<Phone className="h-4 w-4 text-gray-400" />}
                  helperText="Enter phone number without country code"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Address Information</h3>
              <p className="text-gray-600">Where are you located?</p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Auto-fill your address</span>
              <button
                type="button"
                onClick={detectLocation}
                disabled={isDetectingLocation}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDetectingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPinIcon className="h-4 w-4" />
                )}
                {isDetectingLocation ? 'Detecting...' : 'Auto-fill'}
              </button>
            </div>

            <Input
              label="Address Line 1"
              name="address.line1"
              placeholder="Street address, P.O. box"
              value={formData.address.line1}
              onChange={handleChange}
              required
              fullWidth
              icon={<MapPin className="h-4 w-4 text-gray-400" />}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                name="address.city"
                placeholder="Enter city"
                value={formData.address.city}
                onChange={handleChange}
                required
                fullWidth
              />
              <Input
                label="State/Province"
                name="address.state"
                placeholder="Enter state"
                value={formData.address.state}
                onChange={handleChange}
                required
                fullWidth
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="SG">Singapore</option>
                  <option value="AE">United Arab Emirates</option>
                  <option value="JP">Japan</option>
                </select>
              </div>
              <Input
                label="ZIP/Postal Code"
                name="address.zipcode"
                placeholder="Enter ZIP code"
                value={formData.address.zipcode}
                onChange={handleChange}
                required
                fullWidth
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Create Password</h3>
              <p className="text-gray-600">Secure your account</p>
            </div>

            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
              icon={<Lock className="h-4 w-4 text-gray-400" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              helperText="Must be at least 6 characters long"
            />

            <Input
              label="Confirm password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              fullWidth
              icon={<Lock className="h-4 w-4 text-gray-400" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size="lg" showText={false} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card className="p-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => goToStep(step)}
                    disabled={step > currentStep && !completedSteps.includes(step - 1)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step === currentStep
                      ? 'bg-blue-600 text-white'
                      : completedSteps.includes(step)
                        ? 'bg-green-500 text-white'
                        : step <= currentStep || completedSteps.includes(step - 1)
                          ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {completedSteps.includes(step) ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step
                    )}
                  </button>
                  {step < totalSteps && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${completedSteps.includes(step) ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Personal</span>
              <span>Contact</span>
              <span>Address</span>
              <span>Password</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <Button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : currentStep === totalSteps ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </>
                ) : (
                  'Next'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
