import { Award, CheckCircle, Circle } from 'lucide-react';

const BADGE_SYSTEM = [
  { type: 'consistent', name: 'Consistent Learner', emoji: '🔥', requirement: '7-day study streak', description: 'Study every day for 7 days in a row' },
  { type: 'explorer', name: 'Explorer', emoji: '🔍', requirement: '15+ downloads', description: 'Download 15 or more study materials from the library' },
  { type: 'helpful', name: 'Helpful', emoji: '🤝', requirement: '3+ referrals', description: 'Refer 3 friends to Rankers Star using your referral link' },
  { type: 'topper', name: 'Topper', emoji: '🏆', requirement: '90%+ in a test', description: 'Score 90% or above in any AI-generated test' },
  { type: 'veteran', name: 'Veteran', emoji: '⭐', requirement: '30+ tests', description: 'Complete 30 or more AI tests' },
];

interface BadgeChartProps {
  earnedBadges: { badge_type: string; earned_at: string }[];
}

export default function BadgeChart({ earnedBadges }: BadgeChartProps) {
  const earnedTypes = new Set(earnedBadges.map(b => b.badge_type));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="font-bold font-display">Badge System</h3>
        <span className="text-xs text-muted-foreground ml-auto">{earnedTypes.size}/{BADGE_SYSTEM.length} earned</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2.5">
        <div className="bg-primary h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${(earnedTypes.size / BADGE_SYSTEM.length) * 100}%` }} />
      </div>

      {/* Badge list */}
      <div className="space-y-3">
        {BADGE_SYSTEM.map(badge => {
          const earned = earnedTypes.has(badge.type);
          const earnedData = earnedBadges.find(b => b.badge_type === badge.type);
          return (
            <div key={badge.type} className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${earned ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border opacity-60'}`}>
              <span className="text-2xl">{badge.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{badge.name}</p>
                  {earned ? (
                    <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
                <p className="text-[10px] text-primary font-medium mt-0.5">Requirement: {badge.requirement}</p>
              </div>
              {earned && earnedData && (
                <p className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(earnedData.earned_at).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
