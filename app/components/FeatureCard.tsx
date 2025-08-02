interface FeatureCardProps {
  title: string;
  description: string;
  timeline: string;
  icon?: React.ReactNode;
}

export default function FeatureCard({ title, description, timeline, icon }: FeatureCardProps) {
  return (
    <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800 p-8 hover:border-accent-1/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="text-accent-1 text-sm font-medium">{timeline}</div>
        {icon && <div className="text-accent-1/60 group-hover:text-accent-1 transition-colors">{icon}</div>}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
}