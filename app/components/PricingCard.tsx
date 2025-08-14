import { Check } from "lucide-react";
import Button from "~/components/Button";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  popular?: boolean;
  onGetStarted: () => void;
}

export default function PricingCard({
  name,
  price,
  period,
  features,
  buttonText,
  popular = false,
  onGetStarted,
}: PricingCardProps) {
  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 hover:scale-105 bg-black/60 backdrop-blur-sm border rounded-2xl p-8 flex flex-col h-full ${
        popular ? "border-highlight shadow-glow-green" : "border-gray-500/30"
      }`}
    >
      {popular && (
        <div className="absolute top-0 left-0 z-10">
          <div className="relative w-0 h-0 border-t-[90px] border-r-[90px] border-t-gray-500 border-r-transparent">
            <div className="absolute top-[-82px] left-[12px] transform -rotate-45 text-black text-center">
              <div className="text-sm leading-tight">Most</div>
              <div className="text-sm leading-tight">Popular</div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center pb-6">
        <h3 className="text-2xl font-bold text-white mb-6">{name}</h3>
        <div>
          <span className="text-5xl font-bold text-pricing-green">{price}</span>
          <p className="text-sm mt-2 text-gray-400">{period}</p>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-800 flex-1 flex flex-col">
        <ul className="space-y-4 mb-8 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 mt-0.5 text-pricing-green flex-shrink-0" />
              <span className="text-sm text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={onGetStarted}
          variant={popular ? "primary" : "secondary"}
          fullWidth
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
}
