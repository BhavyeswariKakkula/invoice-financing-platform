import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineBell,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineUserGroup,
  HiOutlineClipboardCheck,
  HiOutlineDocumentReport,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineTag,
} from 'react-icons/hi';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const businessLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/invoices', label: 'Invoices', icon: HiOutlineDocumentText },
    { path: '/financing', label: 'Financing', icon: HiOutlineCurrencyDollar },
    { path: '/repayments', label: 'Repayments', icon: HiOutlineClipboardCheck },
    { path: '/profile', label: 'Company Profile', icon: HiOutlineCog },
    { path: '/notifications', label: 'Notifications', icon: HiOutlineBell },
    { path: '/reports', label: 'Reports', icon: HiOutlineDocumentReport },
  ];

  const adminLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/admin/businesses', label: 'Businesses', icon: HiOutlineUserGroup },
    { path: '/admin/invoices', label: 'Invoices', icon: HiOutlineDocumentText },
    { path: '/admin/verifications', label: 'Verifications', icon: HiOutlineClipboardCheck },
    { path: '/admin/financing', label: 'Financing', icon: HiOutlineCurrencyDollar },
    { path: '/admin/repayments', label: 'Repayments', icon: HiOutlineClipboardCheck },
    { path: '/admin/tax-config', label: 'Tax Management', icon: HiOutlineTag },
    { path: '/notifications', label: 'Notifications', icon: HiOutlineBell },
    { path: '/reports', label: 'Reports', icon: HiOutlineDocumentReport },
  ];

  const links = user?.role === 'admin' ? adminLinks : businessLinks;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">InvoiceFin</h1>
          <p className="text-xs text-gray-500 mt-1">{user?.role === 'admin' ? 'Admin Panel' : 'Business Portal'}</p>
        </div>

        <nav className="p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user?.fullName?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.companyName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <HiOutlineLogout className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
