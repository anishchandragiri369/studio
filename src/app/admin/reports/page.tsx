"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, FileSpreadsheet, Mail, Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminReportsPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [lastReportTime, setLastReportTime] = useState<string | null>(null);
  const handleDownloadReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin-download-report', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Elixr_Subscription_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setLastReportTime(new Date().toLocaleString());
      toast({
        title: "Report Downloaded",
        description: "Subscription report has been downloaded successfully.",
        variant: "default",
      });

    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate and download the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmailReport = async () => {
    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/admin-send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Report Sent",
          description: "Subscription report has been emailed successfully.",
          variant: "default",
        });
      } else {
        throw new Error(result.message || 'Failed to send email');
      }

    } catch (error: any) {
      console.error('Error sending email report:', error);
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>Please log in to access admin features.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Admin Access Required</AlertTitle>
          <AlertDescription>You don't have permission to access this page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Admin Reports</h1>
          <p className="text-muted-foreground">Generate and manage subscription reports</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Download Report Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Report
              </CardTitle>
              <CardDescription>
                Generate and download Excel report with all subscription data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Report includes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All subscription details and status</li>
                  <li>• Customer information and addresses</li>
                  <li>• Selected juices with quantities</li>
                  <li>• Delivery schedules and dates</li>
                  <li>• Revenue summary and analytics</li>
                </ul>
              </div>
              
              <Button 
                onClick={handleDownloadReport}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <FileSpreadsheet className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel Report
                  </>
                )}
              </Button>

              {lastReportTime && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Last downloaded: {lastReportTime}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Report Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Report
              </CardTitle>
              <CardDescription>
                Send report via email to admin and configured recipients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Email details:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Professional HTML email format</li>
                  <li>• Excel file as attachment</li>
                  <li>• Sent to admin and CC recipients</li>
                  <li>• Subscription summary included</li>
                  <li>• Same format as daily automated reports</li>
                </ul>
              </div>
              
              <Button 
                onClick={handleEmailReport}
                disabled={isSendingEmail}
                variant="outline"
                className="w-full"
              >
                {isSendingEmail ? (
                  <>
                    <Mail className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Automated Schedule Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Automated Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium">Daily Reports</h4>
                <p className="text-sm text-muted-foreground">Automatically sent every day at 6 PM</p>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium">Excel Format</h4>
                <p className="text-sm text-muted-foreground">Comprehensive data in spreadsheet format</p>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-medium">Email Delivery</h4>
                <p className="text-sm text-muted-foreground">Sent to admin email with attachments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Info */}
        <Alert className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Admin Access</AlertTitle>
          <AlertDescription>
            These reports contain sensitive customer data. Use responsibly and ensure proper data protection measures.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
