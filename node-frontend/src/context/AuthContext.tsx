// import React, { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';

// interface User {
//   id: string;
//   email: string;
//   name?: string;
//   gender?: string;
//   age?: number;
//   height?: number;
//   weight?: number;
// }

// interface AuthContextProps {
//   user: User | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   login: (email: string, password: string) => Promise<void>;
//   register: (
//     email: string,
//     password: string,
//     name: string,
//     gender: string,
//     age: number,
//     height: number,
//     weight: number
//   ) => Promise<void>;

//   logout: () => void;
//   updateProfile: (data: Partial<User>) => Promise<void>;
// }

// const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// // Set up axios interceptors for authentication
// const setupAxiosInterceptors = () => {
//   axios.interceptors.request.use(
//     (config) => {
//       const token = localStorage.getItem('token');
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//       return config;
//     },
//     (error) => Promise.reject(error)
//   );
// };

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true); // Start with loading true

//   // Setup axios interceptors when the component mounts
//   useEffect(() => {
//     setupAxiosInterceptors();
//   }, []);

//   // Check for existing token when component mounts
//   // Check for existing token when component mounts
//   useEffect(() => {
//     const verifyToken = async () => {
//       console.log('Checking for token in local storage...');
//       const token = localStorage.getItem('token');

//       if (!token) {
//         console.log('No token found in local storage');
//         setIsLoading(false);
//         return;
//       }

//       console.log('Token found, verifying with backend...');

//       try {
//         // Configure axios with the token
//         const response = await axios.get('http://localhost:5000/api/auth/me', {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         });

//         console.log('Backend response:', response.data);

//         if (response.data.success) {
//           console.log('Token verified successfully, setting user data');
//           setUser(response.data.user);
//         } else {
//           console.log('Token verification failed: Invalid response');
//           localStorage.removeItem('token');
//         }
//       } catch (error: unknown) {
//         const err = error as { response?: { status?: number }; message?: string };
//         console.error('Token verification failed:', err.message || error);

//         // Only remove token if unauthorized or token is invalid
//         if (err.response && err.response.status === 401) {
//           localStorage.removeItem('token');
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     verifyToken();
//   }, []);


//   const login = async (email: string, password: string) => {
//     setIsLoading(true);
//     try {
//       const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
//       const { token, user } = res.data;

//       localStorage.setItem('token', token);
//       setUser(user);
//     } catch (error: any) {
//       console.error('Login failed:', error.response?.data?.error || error.message);
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const register = async (
//     email: string,
//     password: string,
//     name: string,
//     gender: string,
//     age: number,
//     height: number,
//     weight: number
//   ) => {
//     setIsLoading(true);
//     try {
//       const res = await axios.post('http://localhost:5000/api/auth/register', {
//         name,
//         email,
//         password,
//         gender,
//         age,
//         height,
//         weight
//       });

//       const { token, user } = res.data;

//       localStorage.setItem('token', token);
//       setUser(user);
//     } catch (error: any) {
//       console.error('Registration failed:', error.response?.data?.error || error.message);
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     setUser(null);
//   };

//   const updateProfile = async (data: Partial<User>) => {
//     setIsLoading(true);
//     try {
//       // First, update the profile on the server
//       await axios.put('http://localhost:5000/api/auth/profile', data);

//       // Then get the updated user data
//       const res = await axios.get('http://localhost:5000/api/auth/profile');

//       setUser(res.data.user);
//     } catch (error: any) {
//       console.error('Update profile failed:', error.response?.data?.error || error.message);
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const value: AuthContextProps = {
//     user,
//     isAuthenticated: !!user,
//     isLoading,
//     login,
//     register,
//     logout,
//     updateProfile,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name?: string;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
}

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // New field to track if auth check is complete
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    gender: string,
    age: number,
    height: number,
    weight: number
  ) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // Track initialization

  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

 // In your AuthContext (auth.tsx), modify the verifyToken function:
useEffect(() => {
  const verifyToken = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user'); // NEW: Get stored user

    if (!token) {
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }

    try {
      // If we have stored user data, use it immediately
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Then verify with backend
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData)); // NEW: Store user
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // NEW: Clear user on error
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
    }
  };

  verifyToken();
}, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user)); // NEW: Store user
      setUser(user);
    } catch (error: any) {
      console.error('Login failed:', error.response?.data?.error || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    gender: string,
    age: number,
    height: number,
    weight: number
  ) => {
    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password,
        gender,
        age,
        height,
        weight
      });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setUser(user);
    } catch (error: any) {
      console.error('Registration failed:', error.response?.data?.error || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // NEW: Clear user data
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      await axios.put('http://localhost:5000/api/auth/profile', data);
      const res = await axios.get('http://localhost:5000/api/auth/profile');
      setUser(res.data.user);
    } catch (error: any) {
      console.error('Update profile failed:', error.response?.data?.error || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextProps = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};