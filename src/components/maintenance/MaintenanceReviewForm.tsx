import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Star, Loader2 } from 'lucide-react';

interface MaintenanceReviewFormProps {
  maintenanceRequestId: string;
  vendorId: string;
  vendorName: string;
  tenantUserId: string;
  onSuccess?: () => void;
}

export function MaintenanceReviewForm({
  maintenanceRequestId,
  vendorId,
  vendorName,
  tenantUserId,
  onSuccess,
}: MaintenanceReviewFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (rating === 0) {
        throw new Error('Please select a rating');
      }

      // Insert review
      const { error: reviewError } = await supabase
        .from('maintenance_reviews')
        .insert({
          maintenance_request_id: maintenanceRequestId,
          vendor_id: vendorId,
          tenant_user_id: tenantUserId,
          rating,
          review_text: reviewText || null,
        });

      if (reviewError) throw reviewError;

      // Insert timeline entry
      await supabase.from('maintenance_timeline').insert({
        maintenance_request_id: maintenanceRequestId,
        status: 'reviewed',
        message: `Tenant submitted a ${rating}-star review`,
        actor_id: tenantUserId,
        actor_role: 'tenant',
      });

      // Create notification for vendor
      const { data: vendor } = await supabase
        .from('vendors')
        .select('user_id')
        .eq('id', vendorId)
        .single();

      if (vendor) {
        await supabase.from('notifications').insert({
          user_id: vendor.user_id,
          title: 'New Review Received',
          message: `You received a ${rating}-star review for a maintenance job`,
          type: 'info',
          link: '/vendor/jobs',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-request'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-review'] });
      toast({ title: 'Review submitted', description: 'Thank you for your feedback!' });
      onSuccess?.();
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to submit review', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Rate the Service</CardTitle>
        <CardDescription>
          How was your experience with {vendorName}?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div className="space-y-2">
          <Label>Rating</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-muted-foreground">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          )}
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <Label>Your Review (Optional)</Label>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this vendor..."
            rows={3}
          />
        </div>

        <Button
          onClick={() => submitMutation.mutate()}
          disabled={rating === 0 || submitMutation.isPending}
          className="w-full"
        >
          {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Submit Review
        </Button>
      </CardContent>
    </Card>
  );
}
