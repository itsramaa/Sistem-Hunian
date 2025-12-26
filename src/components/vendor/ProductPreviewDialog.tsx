import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, Package, Tag, CheckCircle, Eye, Smartphone, Monitor } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProductData {
  name: string;
  description?: string;
  category: string;
  price: string;
  unit: string;
  is_available: boolean;
  min_order: string;
  estimated_duration?: string;
  photos: string[];
  stock?: string;
  promo_price?: string;
  promo_start?: string;
  promo_end?: string;
}

interface ProductPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductData;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function ProductPreviewDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
  isSubmitting,
}: ProductPreviewDialogProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  const hasPromo = product.promo_price && parseFloat(product.promo_price) > 0;
  const regularPrice = parseFloat(product.price) || 0;
  const promoPrice = parseFloat(product.promo_price || '0');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Product Preview
          </DialogTitle>
          <DialogDescription>
            This is how your product will appear to customers
          </DialogDescription>
        </DialogHeader>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 justify-center pb-4">
          <Button
            variant={viewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('desktop')}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Desktop
          </Button>
          <Button
            variant={viewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile
          </Button>
        </div>

        {/* Preview Card */}
        <div className={cn(
          'mx-auto border rounded-lg overflow-hidden bg-background transition-all',
          viewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'
        )}>
          {/* Product Images */}
          {product.photos.length > 0 ? (
            <div className="relative aspect-video bg-muted overflow-hidden">
              <img
                src={product.photos[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.photos.length > 1 && (
                <Badge className="absolute bottom-2 right-2 bg-background/80 text-foreground">
                  +{product.photos.length - 1} photos
                </Badge>
              )}
              {hasPromo && (
                <Badge variant="destructive" className="absolute top-2 left-2">
                  PROMO
                </Badge>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-muted flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* Product Info */}
          <div className="p-4 space-y-4">
            {/* Title & Category */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl font-semibold">{product.name || 'Product Name'}</h3>
                <Badge variant={product.is_available ? 'default' : 'secondary'}>
                  {product.is_available ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
              <Badge variant="outline" className="mt-2">
                <Tag className="h-3 w-3 mr-1" />
                {product.category || 'Category'}
              </Badge>
            </div>

            {/* Price */}
            <div className="space-y-1">
              {hasPromo ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-destructive">
                      {formatCurrency(promoPrice)}
                    </span>
                    <span className="text-sm text-muted-foreground">/{product.unit}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-through">
                    {formatCurrency(regularPrice)}
                  </p>
                  {product.promo_start && product.promo_end && (
                    <p className="text-xs text-muted-foreground">
                      Promo: {new Date(product.promo_start).toLocaleDateString()} - {new Date(product.promo_end).toLocaleDateString()}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatCurrency(regularPrice)}</span>
                  <span className="text-sm text-muted-foreground">/{product.unit}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            {product.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.estimated_duration && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {product.estimated_duration}
                </div>
              )}
              {product.min_order && parseInt(product.min_order) > 1 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  Min. order: {product.min_order}
                </div>
              )}
              {product.stock && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  Stock: {product.stock}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Edit
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              'Publishing...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish Product
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
