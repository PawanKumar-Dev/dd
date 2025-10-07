'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User, UserPlus, Phone, MapPin, MapPinIcon, Loader2 } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import Logo from './Logo';
import toast from 'react-hot-toast';

interface RegisterFormProps {
  className?: string;
}

export default function RegisterForm({ className = '' }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
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
        return !!(formData.firstName && formData.lastName && formData.email);
      case 2: // Contact Info
        return !!(formData.phone);
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
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes (excluding passwords)
  useEffect(() => {
    const dataToSave = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      // Don't save passwords for security
    };
    localStorage.setItem('registerFormData', JSON.stringify(dataToSave));
  }, [formData.firstName, formData.lastName, formData.email, formData.phone, formData.address]);

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
          address: formData.address,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Store token in cookie for server-side access
        document.cookie = `token=${data.token}; path=/; max-age=${24 * 60 * 60}`;

        // Clear saved form data on successful registration
        localStorage.removeItem('registerFormData');

        toast.success('Registration successful!');

        // Small delay to ensure cookie is set
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (error) {
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
        toast.error('Location access denied. Please enable location permissions.');
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

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <a href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your existing account
            </a>
          </p>
        </div>

        <Card>
          <form className="space-y-6" onSubmit={handleSubmit}>
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
              label="Phone number"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
              required
              fullWidth
              icon={<Phone className="h-4 w-4 text-gray-400" />}
              helperText="Include country code (e.g., +91 for India)"
            />


            {/* Address Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                  Address Information
                </h3>
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

            <div className="relative">
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
                helperText="Must be at least 6 characters long"
                rightIcon={
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </div>

            <div className="relative">
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
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              loading={isLoading}
              fullWidth
              icon={<UserPlus className="h-4 w-4" />}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
