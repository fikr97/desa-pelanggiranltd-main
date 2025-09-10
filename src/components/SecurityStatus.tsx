import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SecurityStatus = () => {
  const criticalFixesApplied = [
    'Citizen personal data (NIK, addresses) no longer publicly accessible',
    'Government staff sensitive data (NIP) protected from public access',
    'Privilege escalation vulnerability fixed - users cannot change their own roles',
    'Secure public statistics function implemented',
    'Audit logging system created for security monitoring',
    'Database function security paths properly configured'
  ];

  const remainingActions = [
    {
      level: 'warning',
      title: 'OTP Expiry Settings',
      description: 'OTP (One-Time Password) expiry time exceeds recommended security thresholds',
      action: 'Reduce OTP expiry time in Supabase Auth settings',
      dashboardLink: 'https://supabase.com/dashboard/project/bzivgwvreceohmqmtvqe/auth/providers'
    },
    {
      level: 'warning', 
      title: 'Password Protection',
      description: 'Leaked password protection is currently disabled',
      action: 'Enable leaked password protection in Auth settings',
      dashboardLink: 'https://supabase.com/dashboard/project/bzivgwvreceohmqmtvqe/auth/providers'
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Security Status</span>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              Critical Issues Resolved
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Critical Security Vulnerabilities Fixed</AlertTitle>
            <AlertDescription className="text-green-700">
              All critical data exposure and privilege escalation vulnerabilities have been successfully resolved.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-semibold text-green-800">✅ Security Improvements Applied:</h4>
            <ul className="space-y-1">
              {criticalFixesApplied.map((fix, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-green-700">
                  <CheckCircle className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>{fix}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {remainingActions.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span>Remaining Security Actions</span>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                {remainingActions.length} items
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Configuration Required</AlertTitle>
              <AlertDescription className="text-yellow-700">
                These settings require manual configuration in your Supabase dashboard.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {remainingActions.map((action, index) => (
                <div key={index} className="p-4 border border-yellow-200 rounded-lg bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-800">{action.title}</h4>
                      <p className="text-sm text-yellow-700 mb-2">{action.description}</p>
                      <p className="text-sm font-medium text-yellow-800">Action needed: {action.action}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                      onClick={() => window.open(action.dashboardLink, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open Dashboard
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-700">
                <strong>Note:</strong> While these remaining items are important for production security, 
                they are configuration warnings rather than critical vulnerabilities. Your application 
                is now secure from the major data exposure risks that were identified.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Security Monitoring</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <p className="text-sm">
            An audit logging system has been implemented to track sensitive operations. 
            Administrators can monitor security events and user activities through the admin dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityStatus;