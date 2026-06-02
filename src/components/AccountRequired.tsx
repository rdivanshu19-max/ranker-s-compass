import { LockKeyhole, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

type AccountRequiredProps = {
  title: string;
  description: string;
};

export default function AccountRequired({ title, description }: AccountRequiredProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[55vh] grid place-items-center">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center shadow-lg shadow-primary/5">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold font-display">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <Button className="mt-5 gap-2" onClick={() => navigate('/auth')}>
          <LogIn className="h-4 w-4" /> Sign in / Create account
        </Button>
      </div>
    </div>
  );
}