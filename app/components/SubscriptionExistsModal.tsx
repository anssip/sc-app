import { useNavigate } from "@remix-run/react";
import Button from "./Button";

interface SubscriptionExistsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionStatus: string;
  currentPlan: string;
}

export default function SubscriptionExistsModal({
  isOpen,
  onClose,
  subscriptionStatus,
  currentPlan,
}: SubscriptionExistsModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getStatusMessage = () => {
    switch (subscriptionStatus) {
      case 'trialing':
        return `You're currently on a free trial of the ${currentPlan} plan.`;
      case 'active':
        return `You already have an active ${currentPlan} subscription.`;
      case 'past_due':
        return `Your ${currentPlan} subscription has a payment issue.`;
      case 'canceled':
        return `Your ${currentPlan} subscription is canceled but still active until the end of the billing period.`;
      default:
        return `You already have a ${currentPlan} subscription.`;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Existing Subscription</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              {getStatusMessage()}
            </p>
            <p className="text-gray-400 text-sm">
              You can manage your subscription, change plans, or update payment methods from your billing page.
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/billing')}
              variant="primary"
              fullWidth
            >
              Manage Subscription
            </Button>
            <Button
              onClick={onClose}
              variant="secondary"
              fullWidth
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}