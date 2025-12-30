'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useMail } from '@/contexts/MailContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { useState } from 'react';
import CartSidebar from './CartSidebar';
import InboxSidebar from './InboxSidebar';

export default function Navbar() {
  const { cartCount } = useCart();
  const { unreadCount } = useMail();
  const { isLoggedIn, logout, employee } = useAuth();
  const { isClient, client, setClient } = useClient();
  const [showCart, setShowCart] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              YATES INC.
            </Link>
            <div className="flex space-x-6 items-center">
              <Link
                href="/products"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Products
              </Link>
              <Link
                href="/contact"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Contact
              </Link>
              <Link
                href="/employees"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Employees
              </Link>
              <Link
                href="/el"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                EL
              </Link>
              
              {/* Inbox button - visible for EVERYONE */}
              <button
                onClick={() => setShowInbox(true)}
                className="relative text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                title="Inbox"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                {unreadCount > 0 && (isLoggedIn || isClient) && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowCart(true)}
                className="relative text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Shop
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Logout button - visible when logged in as employee or client */}
              {(isLoggedIn || isClient) && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {isLoggedIn && employee 
                      ? employee.name.split(' ')[0] 
                      : client?.username}
                  </span>
                  <button
                    onClick={() => {
                      if (isLoggedIn) logout();
                      if (isClient) setClient(null);
                    }}
                    className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm flex items-center gap-1"
                    title="Log out"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <CartSidebar isOpen={showCart} onClose={() => setShowCart(false)} />
      <InboxSidebar isOpen={showInbox} onClose={() => setShowInbox(false)} />
    </>
  );
}
