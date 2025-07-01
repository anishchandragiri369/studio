"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';
import { validatePincode, getContactInfo, serviceablePincodeCodes } from '@/lib/pincodeValidation';

export default function PincodeTestPage() {
  const [testPincode, setTestPincode] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);

  const handlePincodeTest = () => {
    if (testPincode) {
      const result = validatePincode(testPincode);
      setValidationResult(result);
    }
  };

  const testCases = [
    { pincode: '500034', description: 'Banjara Hills (Valid)' },
    { pincode: '500049', description: 'Gachibowli (Valid)' },
    { pincode: '500071', description: 'Hitech City (Valid)' },
    { pincode: '400001', description: 'Mumbai (Invalid)' },
    { pincode: '560001', description: 'Bangalore (Invalid)' },
    { pincode: '110001', description: 'Delhi (Invalid)' },
  ];

  const contactInfo = getContactInfo();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Pincode Validation Test
          </h1>
          <p className="text-muted-foreground">
            Test the pincode-based delivery area validation system
          </p>
        </div>

        {/* Test Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Test Pincode Validation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="testPincode">Enter Pincode</Label>
                <Input
                  id="testPincode"
                  value={testPincode}
                  onChange={(e) => setTestPincode(e.target.value)}
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handlePincodeTest} disabled={!testPincode}>
                  Test Pincode
                </Button>
              </div>
            </div>

            {validationResult && (
              <div className={`p-4 rounded-lg border ${
                validationResult.isServiceable
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {validationResult.isServiceable ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${
                    validationResult.isServiceable ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {validationResult.isServiceable ? 'Serviceable Area' : 'Non-serviceable Area'}
                  </span>
                </div>
                <p className={`text-sm ${
                  validationResult.isServiceable ? 'text-green-700' : 'text-red-700'
                }`}>
                  {validationResult.message}
                </p>
                
                {!validationResult.isServiceable && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-sm text-red-600 mb-2">Contact us for delivery updates:</p>
                    <div className="flex gap-4">
                      <a 
                        href={`https://wa.me/${contactInfo.whatsapp.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                      >
                        <Phone className="w-4 h-4" />
                        WhatsApp
                      </a>
                      <a 
                        href={`mailto:${contactInfo.email}`}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Test Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Test Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testCases.map((testCase, index) => {
                const result = validatePincode(testCase.pincode);
                return (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{testCase.pincode}</span>
                      <Badge variant={result.isServiceable ? "default" : "destructive"}>
                        {result.isServiceable ? "Valid" : "Invalid"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {testCase.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Coverage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{serviceablePincodeCodes.length}</p>
                <p className="text-sm text-muted-foreground">Total Serviceable Pincodes</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">100%</p>
                <p className="text-sm text-muted-foreground">Hyderabad Coverage</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-blue-600">Real-time</p>
                <p className="text-sm text-muted-foreground">Validation Speed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Real-time validation in checkout form</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Server-side validation in API endpoints</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Contact information for non-serviceable areas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Comprehensive Hyderabad pincode coverage</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">Easy to extend with new areas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Pincode Ranges */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Serviceable Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Central Areas</h4>
                <div className="space-y-1 text-sm">
                  <p>500001 - Hyderabad GPO</p>
                  <p>500027 - Charminar</p>
                  <p>500034 - Banjara Hills</p>
                  <p>500035 - Jubilee Hills</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Tech Hub Areas</h4>
                <div className="space-y-1 text-sm">
                  <p>500049 - Gachibowli</p>
                  <p>500070 - Madhapur</p>
                  <p>500071 - Hitech City</p>
                  <p>500084 - Cyberabad</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
