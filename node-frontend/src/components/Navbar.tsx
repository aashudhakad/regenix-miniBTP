import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Calendar, BarChart2, ClipboardList, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home size={20} /> },
    ...(isAuthenticated
      ? [
        { name: 'Dashboard', path: '/dashboard', icon: <BarChart2 size={20} /> },
        { name: 'Exercises', path: '/planner', icon: <Calendar size={20} /> },
        { name: 'History', path: '/record', icon: <ClipboardList size={20} /> },
        { name: 'Profile', path: '/profile', icon: <User size={20} /> },
      ]
      : []),
  ];

  return (
    <nav className="bg-dark-900 border-b border-dark-700 sticky top-0 z-50 shadow-md">
      <div className="container flex mx-auto px-2">
        <div className="flex justify-between space-x-4 w-full items-center h-16 lg:text-sm xl:text-lg">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full p-1">
              <BarChart2 size={24} className="text-dark-950" />
            </div>
            <span className="text-xl font-bold text-white">ReGeniX</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-1 py-2 rounded-md transition-colors duration-200 ${isActive(link.path)
                  ? 'bg-dark-700 text-primary-400'
                  : 'text-dark-300 hover:bg-dark-800 hover:text-primary-300'
                  }`}
              >
                <span className="mr-2">{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            ))}

            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  navigate('/'); // Add navigation here
                }}

                className="flex items-center px-3 py-2 text-dark-300 hover:bg-dark-800 hover:text-primary-300 rounded-md transition-colors duration-200"
              >
                <span className="mr-2">
                  <LogOut size={20} />
                </span>
                <span>Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="text-dark-300 hover:text-primary-400 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`lg:hidden bg-dark-900 border-b border-dark-700 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen py-2' : 'max-h-0'
          }`}
      >
        <div className="container mx-auto px-4 space-y-2 pb-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center px-3 py-2 rounded-md transition-colors duration-200 ${isActive(link.path)
                ? 'bg-dark-700 text-primary-400'
                : 'text-dark-300 hover:bg-dark-800 hover:text-primary-300'
                }`}
              onClick={closeMenu}
            >
              <span className="mr-3">{link.icon}</span>
              <span>{link.name}</span>
            </Link>
          ))}

          {isAuthenticated ? (
            <button
              onClick={() => {
                closeMenu();
                logout();
              }}
              className="w-full flex items-center px-3 py-2 text-dark-300 hover:bg-dark-800 hover:text-primary-300 rounded-md transition-colors duration-200"
            >
              <span className="mr-3">
                <LogOut size={20} />
              </span>
              <span>Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="block bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors duration-200 text-center"
              onClick={closeMenu}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

//////////////////////////////////////////////////////////////////////

// import React, { useState } from 'react';
// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { Menu, X, Home, Calendar, BarChart2, ClipboardList, User, LogOut, History } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';

// const Navbar: React.FC = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const { isAuthenticated, logout } = useAuth();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const toggleMenu = () => setIsOpen(!isOpen);
//   const closeMenu = () => setIsOpen(false);

//   const isActive = (path: string) => location.pathname === path;

//   const navLinks = [
//     { name: 'Home', path: '/', icon: <Home size={20} /> },
//     ...(isAuthenticated
//       ? [
//           { name: 'Dashboard', path: '/dashboard', icon: <BarChart2 size={20} /> },
//           { name: 'Exercises', path: '/planner', icon: <Calendar size={20} /> },
//           { name: 'History', path: '/record', icon: <ClipboardList size={20} /> },
//           { name: 'Session History', path: '/sessions', icon: <History size={20} /> },
//           { name: 'Profile', path: '/profile', icon: <User size={20} /> },
//         ]
//       : []),
//   ];

//   return (
//     <nav className="bg-dark-900 border-b border-dark-700 sticky top-0 z-50 shadow-md">
//       <div className="container mx-auto px-4">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo */}
//           <Link to="/" className="flex items-center space-x-2">
//             <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full p-1">
//               <BarChart2 size={24} className="text-dark-950" />
//             </div>
//             <span className="text-xl font-bold text-white">PosturePro</span>
//           </Link>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex items-center space-x-4">
//             {navLinks.map((link) => (
//               <Link
//                 key={link.path}
//                 to={link.path}
//                 className={`flex items-center px-3 py-2 rounded-md transition-colors duration-200 ${
//                   isActive(link.path)
//                     ? 'bg-dark-700 text-primary-400'
//                     : 'text-dark-300 hover:bg-dark-800 hover:text-primary-300'
//                 }`}
//               >
//                 <span className="mr-2">{link.icon}</span>
//                 <span>{link.name}</span>
//               </Link>
//             ))}

//             {isAuthenticated ? (
//               <button
//                 onClick={() => {
//                   logout();
//                   navigate('/'); // Add navigation here
//                 }}
//                 className="flex items-center px-3 py-2 text-dark-300 hover:bg-dark-800 hover:text-primary-300 rounded-md transition-colors duration-200"
//               >
//                 <span className="mr-2">
//                   <LogOut size={20} />
//                 </span>
//                 <span>Logout</span>
//               </button>
//             ) : (
//               <Link
//                 to="/login"
//                 className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
//               >
//                 Login
//               </Link>
//             )}
//           </div>

//           {/* Mobile Menu Button */}
//           <div className="md:hidden">
//             <button
//               onClick={toggleMenu}
//               className="text-dark-300 hover:text-primary-400 focus:outline-none"
//             >
//               {isOpen ? <X size={24} /> : <Menu size={24} />}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Navigation */}
//       <div
//         className={`md:hidden bg-dark-900 border-b border-dark-700 overflow-hidden transition-all duration-300 ease-in-out ${
//           isOpen ? 'max-h-screen py-2' : 'max-h-0'
//         }`}
//       >
//         <div className="container mx-auto px-4 space-y-2 pb-3">
//           {navLinks.map((link) => (
//             <Link
//               key={link.path}
//               to={link.path}
//               className={`flex items-center px-3 py-2 rounded-md transition-colors duration-200 ${
//                 isActive(link.path)
//                   ? 'bg-dark-700 text-primary-400'
//                   : 'text-dark-300 hover:bg-dark-800 hover:text-primary-300'
//               }`}
//               onClick={closeMenu}
//             >
//               <span className="mr-3">{link.icon}</span>
//               <span>{link.name}</span>
//             </Link>
//           ))}

//           {isAuthenticated ? (
//             <button
//               onClick={() => {
//                 closeMenu();
//                 logout();
//               }}
//               className="w-full flex items-center px-3 py-2 text-dark-300 hover:bg-dark-800 hover:text-primary-300 rounded-md transition-colors duration-200"
//             >
//               <span className="mr-3">
//                 <LogOut size={20} />
//               </span>
//               <span>Logout</span>
//             </button>
//           ) : (
//             <Link
//               to="/login"
//               className="block bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors duration-200 text-center"
//               onClick={closeMenu}
//             >
//               Login
//             </Link>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;