import { useState } from 'react';
import { Check, Home, MapPin, Image as ImageIcon, Wifi, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { UnitPhotoUpload } from '@/components/merchant/UnitPhotoUpload';
import { CustomAmenities } from '@/components/merchant/CustomAmenities';
import { ProvincesCitiesSelect } from '@/components/merchant/ProvincesCitiesSelect';
import { LocationPicker } from '@/components/merchant/LocationPicker';

interface PropertySetupWizardProps {
  onComplete: (data: PropertyData) => void;
  onCancel: () => void;
  initialData?: Partial<PropertyData>;
}

export interface PropertyData {
  name: string;
  property_type: string;
  province: string;
  city: string;
  address: string;
  postal_code: string;
  description: string;
  images: string[];
  amenities: string[];
}

const STEPS = [
  { id: 'basic', title: 'Basic Info', icon: Home, description: 'Property name and type' },
  { id: 'location', title: 'Location', icon: MapPin, description: 'Address and area' },
  { id: 'photos', title: 'Photos', icon: ImageIcon, description: 'Upload property images' },
  { id: 'amenities', title: 'Amenities', icon: Wifi, description: 'Available facilities' },
];

const propertyTypes = [
  { value: 'kost', label: 'Kost' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'kontrakan', label: 'Kontrakan' },
  { value: 'ruko', label: 'Ruko' },
];

export function PropertySetupWizard({ onComplete, onCancel, initialData }: PropertySetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<PropertyData>({
    name: initialData?.name || '',
    property_type: initialData?.property_type || 'kost',
    province: initialData?.province || '',
    city: initialData?.city || '',
    address: initialData?.address || '',
    postal_code: initialData?.postal_code || '',
    description: initialData?.description || '',
    images: initialData?.images || [],
    amenities: initialData?.amenities || [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 0: // Basic Info
        if (!formData.name.trim()) newErrors.name = 'Property name is required';
        if (formData.name.length > 100) newErrors.name = 'Name must be less than 100 characters';
        break;
      case 1: // Location
        if (!formData.province) newErrors.province = 'Province is required';
        if (!formData.city) newErrors.city = 'City is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        break;
      case 2: // Photos - optional
        break;
      case 3: // Amenities - optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete(formData);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateField = <K extends keyof PropertyData>(field: K, value: PropertyData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Step {currentStep + 1} of {STEPS.length}</span>
          <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Step indicators */}
        <div className="flex justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center gap-2",
                  isCurrent ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    isCompleted && "bg-success border-success text-success-foreground",
                    isCurrent && "border-primary bg-primary/10",
                    !isCompleted && !isCurrent && "border-muted"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="text-center hidden sm:block">
                  <p className="text-xs font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground hidden md:block">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Kost Harmoni"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Property Type *</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(v) => updateField('property_type', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your property..."
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <ProvincesCitiesSelect
                provinceValue={formData.province}
                cityValue={formData.city}
                onProvinceChange={(v) => updateField('province', v)}
                onCityChange={(v) => updateField('city', v)}
                provinceError={errors.province}
                cityError={errors.city}
              />
              <div className="space-y-2">
                <Label>Address *</Label>
                <LocationPicker
                  value={formData.address}
                  onChange={(v) => updateField('address', v)}
                  placeholder="Search or click map..."
                  province={formData.province}
                  city={formData.city}
                />
                {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal">Postal Code (optional)</Label>
                <Input
                  id="postal"
                  placeholder="12345"
                  value={formData.postal_code}
                  onChange={(e) => updateField('postal_code', e.target.value)}
                  maxLength={10}
                />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <div className="space-y-2">
              <Label>Property Photos</Label>
              <p className="text-sm text-muted-foreground">Upload up to 10 photos of your property</p>
              <UnitPhotoUpload
                photos={formData.images}
                onPhotosChange={(photos) => updateField('images', photos)}
                maxPhotos={10}
              />
            </div>
          )}

          {currentStep === 3 && (
            <CustomAmenities
              selectedAmenities={formData.amenities}
              onAmenitiesChange={(amenities) => updateField('amenities', amenities)}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 0 ? onCancel : handlePrev}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </Button>
        <Button onClick={handleNext}>
          {currentStep === STEPS.length - 1 ? 'Create Property' : 'Next'}
          {currentStep < STEPS.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
