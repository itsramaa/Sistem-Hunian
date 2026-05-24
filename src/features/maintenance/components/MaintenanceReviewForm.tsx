import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { useToast } from '@/shared/hooks/use-toast';
import { Star, Loader2 } from 'lucide-react';

interface MaintenanceReviewFormProps {
  maintenanceRequestId: string;
  vendorId: string;
  vendorName: string;
  tenantUserId: string;
  onSuccess?: () => void;
}

export function MaintenanceReviewForm({ maintenanceRequestId, vendorId, vendorName, tenantUserId, onSuccess }: MaintenanceReviewFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (rating === 0) throw new Error('Please select a rating');
      // TODO: Go endpoint not yet implemented — was: supabase.from('maintenance_reviews').insert(...)
      // TODO: Go endpoint not yet implemented — was: supabase.from('maintenance_timeline').insert(...)
      // TODO: Go endpoint not yet implemented — was: supabase.from('vendors').select(...) + supabase.from('notifications').insert(...)
      // No-op stub
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-request'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-review'] });
      toast({ title: 'Review submitted', description: 'Thank you for your feedback!' });
      onSuccess?.();
    },
    onError: (error) => { toast({ title: 'Failed to submit review', description: error.message, variant: 'destructive' }); },
  });

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/40 p-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Rate the Service</h3>
        <p className="text-sm text-muted-foreground">How was your experience with {vendorName}?</p>
      </div>

      <div className="space-y-2">
        <Label>Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star} type="button"
              className="p-1 transition-all hover:scale-125 focus:outline-none"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
            >
              <Star className={`h-8 w-8 transition-colors ${
                star <= (hoveredRating || rating) ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]' : 'text-muted-foreground/40'
              }`} />
            </button>
          ))}
        </div>
        {rating > 0 && <p className="text-sm text-muted-foreground">{ratingLabels[rating]}</p>}
      </div>

      <div className="space-y-2">
        <Label>Your Review (Optional)</Label>
        <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your experience with this vendor..." rows={3} className="rounded-xl bg-background/60 border-border/50" />
      </div>

      <Button onClick={() => submitMutation.mutate()} disabled={rating === 0 || submitMutation.isPending} className="w-full gradient-cta text-primary-foreground rounded-xl">
        {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Submit Review
      </Button>
    </div>
  );
}