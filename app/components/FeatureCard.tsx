interface FeatureCardProps {
  title: string;
  description: string;
  timeline: string;
  icon?: React.ReactNode;
}

export default function FeatureCard({ title, description, timeline, icon }: FeatureCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 hover:border-purple-500/50 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">{timeline}</div>
        {icon && <div className="text-purple-400/60 group-hover:text-purple-400 transition-colors">{icon}</div>}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-400 transition-colors">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}