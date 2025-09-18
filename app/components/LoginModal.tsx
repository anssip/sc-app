import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, LogIn } from 'lucide-react';
import { Link } from '@remix-run/react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function LoginModal({
  isOpen,
  onClose,
  title = "Sign in to continue",
  description = "You need to be signed in to use this feature."
}: LoginModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[400]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-gray-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-white"
                  >
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-400">
                    {description}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    to="/signin"
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    onClick={onClose}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>

                  <div className="text-center">
                    <p className="text-sm text-gray-400">
                      Don't have an account?{' '}
                      <Link
                        to="/signup"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        onClick={onClose}
                      >
                        Sign up for free
                      </Link>
                    </p>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}