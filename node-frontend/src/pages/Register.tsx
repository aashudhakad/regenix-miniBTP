// import React, { useState } from 'react';
// import { Link, Navigate } from 'react-router-dom';
// import { Eye, EyeOff, UserPlus, Loader } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
// import Button from '../components/Button';
// import Card, { CardContent, CardHeader, CardFooter } from '../components/Card';

// const Register: React.FC = () => {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const { register, isAuthenticated } = useAuth();


// const [gender, setGender] = useState('');
// const [age, setAge] = useState<number | ''>('');
// const [height, setHeight] = useState<number | ''>('');
// const [weight, setWeight] = useState<number | ''>('');


//   // Redirect if already authenticated
//   if (isAuthenticated) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');

//     // Validate passwords match
//     if (password !== confirmPassword) {
//       setError('Passwords do not match');
//       return;
//     }

//     if (!gender || !age || !height || !weight) {
//       setError('Please fill out all required fields.');
//       return;
//     }
    

//     // Validate password strength
//     if (password.length < 8) {
//       setError('Password must be at least 8 characters long');
//       return;
//     }

//     setIsLoading(true);

//     try {
//       // await register(email, password, name);
//       await register(email, password, name, gender, Number(age), Number(height), Number(weight));

//     } catch (err: any) {
//       setError(
//         err.response?.data?.message || 
//         'Registration failed. Please try again later.'
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const toggleShowPassword = () => setShowPassword(!showPassword);

//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-dark-950">
//       <div className="w-full max-w-md">
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
//             Create Your Account
//           </h1>
//           <p className="text-dark-300 mt-2">
//             Start your rehabilitation journey today
//           </p>
//         </div>

//         <Card>
//           <CardHeader>
//             <h2 className="text-xl font-semibold text-center">Sign Up</h2>
//           </CardHeader>

//           <CardContent>
//             {error && (
//               <div className="mb-4 p-3 bg-error-900/30 border border-error-700 rounded-md text-error-400">
//                 {error}
//               </div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div>
//                 <label htmlFor="name" className="block text-sm font-medium text-dark-200 mb-1">
//                   Full Name
//                 </label>
//                 <input
//                   id="name"
//                   type="text"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                   className="input"
//                   placeholder="John Doe"
//                   required
//                   disabled={isLoading}
//                 />
//               </div>

//               <div>
//                 <label htmlFor="email" className="block text-sm font-medium text-dark-200 mb-1">
//                   Email
//                 </label>
//                 <input
//                   id="email"
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="input"
//                   placeholder="your@email.com"
//                   required
//                   disabled={isLoading}
//                 />
//               </div>


//               <div>
//   <label htmlFor="gender" className="block text-sm font-medium text-dark-200 mb-1">
//     Gender<span className="text-error-400">*</span>
//   </label>
//   <select
//     id="gender"
//     value={gender}
//     onChange={(e) => setGender(e.target.value)}
//     className="input"
//     required
//     disabled={isLoading}
//   >
//     <option value="">Select Gender</option>
//     <option value="male">male</option>
//     <option value="female">female</option>
//     <option value="Other">Other</option>
//   </select>
// </div>

// <div>
//   <label htmlFor="age" className="block text-sm font-medium text-dark-200 mb-1">
//     Age<span className="text-error-400">*</span>
//   </label>
//   <input
//     id="age"
//     type="number"
//     value={age}
//     onChange={(e) => setAge(Number(e.target.value))}
//     className="input"
//     placeholder="Enter your age"
//     required
//     disabled={isLoading}
//   />
// </div>

// <div>
//   <label htmlFor="height" className="block text-sm font-medium text-dark-200 mb-1">
//     Height (cm)<span className="text-error-400">*</span>
//   </label>
//   <input
//     id="height"
//     type="number"
//     value={height}
//     onChange={(e) => setHeight(Number(e.target.value))}
//     className="input"
//     placeholder="Enter your height"
//     required
//     disabled={isLoading}
//   />
// </div>

// <div>
//   <label htmlFor="weight" className="block text-sm font-medium text-dark-200 mb-1">
//     Weight (kg)<span className="text-error-400">*</span>
//   </label>
//   <input
//     id="weight"
//     type="number"
//     value={weight}
//     onChange={(e) => setWeight(Number(e.target.value))}
//     className="input"
//     placeholder="Enter your weight"
//     required
//     disabled={isLoading}
//   />
// </div>


//               <div>
//                 <label htmlFor="password" className="block text-sm font-medium text-dark-200 mb-1">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <input
//                     id="password"
//                     type={showPassword ? 'text' : 'password'}
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="input pr-10"
//                     placeholder="••••••••"
//                     required
//                     disabled={isLoading}
//                   />
//                   <button
//                     type="button"
//                     onClick={toggleShowPassword}
//                     className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-400 hover:text-dark-300"
//                     tabIndex={-1}
//                   >
//                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                   </button>
//                 </div>
//                 <p className="text-xs text-dark-400 mt-1">
//                   Must be at least 8 characters long
//                 </p>
//               </div>

//               <div>
//                 <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-200 mb-1">
//                   Confirm Password
//                 </label>
//                 <input
//                   id="confirmPassword"
//                   type={showPassword ? 'text' : 'password'}
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   className="input"
//                   placeholder="••••••••"
//                   required
//                   disabled={isLoading}
//                 />
//               </div>

//               <Button
//                 type="submit"
//                 variant="primary"
//                 className="w-full"
//                 isLoading={isLoading}
//                 icon={isLoading ? <Loader className="animate-spin" /> : <UserPlus />}
//                 iconPosition="left"
//                 disabled={isLoading}
//               >
//                 Create Account
//               </Button>
//             </form>
//           </CardContent>

//           <CardFooter className="text-center">
//             <p className="text-dark-300">
//               Already have an account?{' '}
//               <Link to="/login" className="text-primary-400 hover:text-primary-300">
//                 Log in
//               </Link>
//             </p>
//           </CardFooter>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default Register;

import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card, { CardContent, CardHeader, CardFooter } from '../components/Card';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    age: '',
    height: '',
    weight: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, password, confirmPassword, gender, age, height, weight } = formData;

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!gender || !age || !height || !weight) {
      setError('Please fill out all required fields.');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name, gender, Number(age), Number(height), Number(weight));
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Registration failed. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen flex items-center justify-center px-2 py-4 bg-dark-950">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
            Create Your Account
          </h1>
          <p className="text-dark-300 text-sm">Start your rehabilitation journey today</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-center">Sign Up</h2>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-3 p-2 bg-error-900/30 border border-error-700 rounded-md text-error-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Personal Information Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-dark-200 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
                    placeholder="John Doe"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-dark-200 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
                    placeholder="your@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Demographics Section - 4 items in one row on larger screens, stacked on mobile */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label htmlFor="gender" className="block text-xs font-medium text-dark-200 mb-1">
                    Gender<span className="text-error-400">*</span>
                  </label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="input text-sm py-1"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="age" className="block text-xs font-medium text-dark-200 mb-1">
                    Age<span className="text-error-400">*</span>
                  </label>
                  <input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    className="input text-sm py-1"
                    placeholder="Age"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="height" className="block text-xs font-medium text-dark-200 mb-1">
                    Height (cm)<span className="text-error-400">*</span>
                  </label>
                  <input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={handleChange}
                    className="input text-sm py-1"
                    placeholder="Height"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="weight" className="block text-xs font-medium text-dark-200 mb-1">
                    Weight (kg)<span className="text-error-400">*</span>
                  </label>
                  <input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={handleChange}
                    className="input text-sm py-1"
                    placeholder="Weight"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-dark-200 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className="input pr-8"
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={toggleShowPassword}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-dark-400 hover:text-dark-300"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">Min. 8 characters</p>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-dark-200 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2"
                isLoading={isLoading}
                icon={isLoading ? <Loader className="animate-spin" /> : <UserPlus />}
                iconPosition="left"
                disabled={isLoading}
              >
                Create Account
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center py-2">
            <p className="text-dark-300 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;