import { Award, CheckCircle } from 'lucide-react';

const BADGE_SYSTEM = [
  { type: 'consistent', name: 'Consistent Learner', emoji: '🔥', requirement: '7-day study streak', description: 'Study every day for 7 days in a row', maxProgress: 7 },
  { type: 'explorer', name: 'Explorer', emoji: '🔍', requirement: '15+ downloads', description: 'Download 15 or more study materials from the library', maxProgress: 15 },
  { type: 'helpful', name: 'Helpful', emoji: '🤝', requirement: '3+ referrals', description: 'Refer 3 friends to Rankers Star using your referral link', maxProgress: 3 },
  { type: 'topper', name: 'Topper', emoji: '🏆', requirement: '90%+ in a test', description: 'Score 90% or above in any AI-generated test', maxProgress: 90 },
  { type: 'veteran', name: 'Veteran', emoji: '⭐', requirement: '30+ tests', description: 'Complete 30 or more AI tests', maxProgress: 30 },
];

interface BadgeChartProps {
  earnedBadges: { badge_type: string; earned_at: string }[];
  progress?: Record<string, number>;
}

function ProgressRing({ progress, earned, size = 56, strokeWidth = 4 }: { progress: number; earned: boolean; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = earned ? 100 : Math.min(progress, 100);
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={earned ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.5)'}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {earned ? (
          <CheckCircle className="w-5 h-5 text-primary" />
        ) : (
          <span className="text-[11px] font-bold text-muted-foreground">{Math.round(pct)}%</span>
        )}
      </div>
    </div>
  );
}

export default function BadgeChart({ earnedBadges, progress = {} }: BadgeChartProps) {
  const earnedTypes = new Set(earnedBadges.map(b => b.badge_type));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="font-bold font-display">Badge System</h3>
        <span className="text-xs text-muted-foreground ml-auto">{earnedTypes.size}/{BADGE_SYSTEM.length} earned</span>
      </div>

      {/* Overall progress bar */}
      <div className="w-full bg-muted rounded-full h-2.5">
        <div className="bg-primary h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${(earnedTypes.size / BADGE_SYSTEM.length) * 100}%` }} />
      </div>

      {/* Badge cards with progress rings */}
      <div className="space-y-3">
        {BADGE_SYSTEM.map(badge => {
          const earned = earnedTypes.has(badge.type);
          const earnedData = earnedBadges.find(b => b.badge_type === badge.type);
          const current = progress[badge.type] ?? 0;
          const pct = earned ? 100 : Math.min((current / badge.maxProgress) * 100, 99);

          return (
            <div key={badge.type} className={`flex items-center gap-4 rounded-xl px-4 py-3 border transition-all ${earned ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'}`}>
              <ProgressRing progress={pct} earned={earned} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{badge.emoji}</span>
                  <p className="font-medium text-sm">{badge.name}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                <p className="text-[10px] text-primary font-medium mt-0.5">
                  {earned
                    ? `Earned on ${new Date(earnedData!.earned_at).toLocaleDateString()}`
                    : `Progress: ${current}/${badge.maxProgress}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
