import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import Button from "~/components/Button";

export const meta: MetaFunction = () => {
  return [
    { title: "Payment Method - Spot Canvas" },
    { name: "description", content: "Set up your payment method for Spot Canvas" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const selectedPlan = url.searchParams.get("plan") || "Pro";
  
  return json({ selectedPlan });
}

export default function PaymentMethodPage() {
  const { selectedPlan } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-20 p-6 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pricing-green rounded-sm"></div>
            <span className="text-white font-bold text-xl">Spot Canvas</span>
          </div>
          <button
            onClick={() => navigate("/pricing")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Back to Pricing
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-12 pb-20">
        <div className="bg-black/60 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Payment Method</h1>
          <p className="text-gray-400 mb-8">
            You selected the <span className="text-pricing-green font-semibold">{selectedPlan}</span> plan
          </p>
          
          <div className="space-y-6">
            <div className="bg-black/40 rounded-lg p-6 border border-gray-800">
              <p className="text-center text-gray-500">
                Stripe payment integration will be implemented here
              </p>
            </div>
            
            <div className="flex gap-4">
              <Button
                onClick={() => navigate("/pricing")}
                variant="secondary"
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pricing-green/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pricing-green/5 rounded-full blur-3xl"></div>
    </div>
  );
}