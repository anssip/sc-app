interface FeatureCardProps {
  title: string;
  description: string;
  timeline: string;
  icon?: React.ReactNode;
  backgroundImage?: string;
}

export default function FeatureCard({ title, description, timeline, icon, backgroundImage }: FeatureCardProps) {
  if (backgroundImage) {
    return (
      <div className="relative bg-gray-900 rounded-lg border border-gray-800 hover:border-purple-500/50 transition-all duration-300 group overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-gray-900/30 pointer-events-none" />
        <div className="relative z-10 p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="px-3 py-1 bg-purple-500/30 backdrop-blur-sm text-purple-400 rounded-full text-sm">{timeline}</div>
            {icon && <div className="text-purple-400/60 group-hover:text-purple-400 transition-colors">{icon}</div>}
          </div>
          <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-400 transition-colors drop-shadow-lg">{title}</h3>
          <p className="text-gray-300 leading-relaxed drop-shadow-lg">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-8 hover:border-purple-500/50 transition-all duration-300 group overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">{timeline}</div>
          {icon && <div className="text-purple-400/60 group-hover:text-purple-400 transition-colors">{icon}</div>}
        </div>
        <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-400 transition-colors">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}