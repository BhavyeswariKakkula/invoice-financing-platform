import React from 'react';
import { useAppSelector } from '../store/hooks';
import { HiOutlineBell } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome, {user?.fullName?.split(' ')[0]}
          </h2>
          <p className="text-sm text-gray-500">{user?.companyName}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/notifications"
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiOutlineBell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user?.fullName?.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
