/**
 * Development page to verify guided inspection types
 * This page can be temporarily added to routes for verification
 */

import { runAllVerifications } from '@/lib/guided-inspection-verification';
import { VehicleModel, VEHICLE_MODEL_LABELS, getStepsForModel } from '@/types/guided-inspection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function VerifyTypes() {
  const verificationResults = runAllVerifications();
  const allPassed = Object.values(verificationResults).every(r => r);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Guided Inspection Types Verification</h1>
        <p className="text-muted-foreground">
          Verification of data structures and constants for Requirements 6.1, 6.2, 6.3, 6.4
        </p>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={allPassed ? "default" : "destructive"} className="text-lg px-4 py-2">
            {allPassed ? '✓ All Verifications Passed' : '✗ Some Verifications Failed'}
          </Badge>
        </CardContent>
      </Card>

      {/* Verification Results */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Results</CardTitle>
          <CardDescription>Individual test results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(verificationResults).map(([test, passed]) => (
              <div key={test} className="flex items-center gap-2">
                <Badge variant={passed ? "default" : "destructive"}>
                  {passed ? '✓' : '✗'}
                </Badge>
                <span>{test}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Models */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Models</CardTitle>
          <CardDescription>Available vehicle models (should be 5)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(VehicleModel).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <Badge variant="outline">{key}</Badge>
                <span className="text-sm text-muted-foreground">{value}</span>
                <span className="text-sm">→ {VEHICLE_MODEL_LABELS[value]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Sequences */}
      {Object.values(VehicleModel).map(model => {
        const steps = getStepsForModel(model);
        return (
          <Card key={model}>
            <CardHeader>
              <CardTitle>{VEHICLE_MODEL_LABELS[model]}</CardTitle>
              <CardDescription>
                {steps.length} step{steps.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {steps.length === 0 ? (
                <p className="text-muted-foreground">No predefined steps (free mode)</p>
              ) : (
                <ol className="space-y-3">
                  {steps.map((step, index) => (
                    <li key={step.id} className="border-l-2 border-primary pl-4">
                      <div className="font-medium">{index + 1}. {step.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {step.instruction}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Required: {step.isRequired ? 'Yes' : 'No'}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
