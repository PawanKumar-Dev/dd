'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayoutNew';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Settings, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface PromotionalPricingSetting {
  enabled: boolean;
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export default function PromotionalPricingSettingsPage() {
  const [setting, setSetting] = useState<PromotionalPricingSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchSetting();
  }, []);

  const fetchSetting = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/api/admin/settings/promotional-pricing', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setSetting(data);
      } else {
        toast.error('Failed to fetch promotional pricing setting');
      }
    } catch (error) {
      console.error('Error fetching setting:', error);
      toast.error('Failed to fetch promotional pricing setting');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (enabled: boolean) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/api/admin/settings/promotional-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });

      const data = await response.json();

      if (data.success) {
        setSetting(data);
        toast.success(`Promotional pricing ${enabled ? 'enabled' : 'disabled'} successfully`);
      } else {
        toast.error(data.error || 'Failed to update setting');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update promotional pricing setting');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Promotional Pricing Settings</h1>
            <p className="text-gray-600 mt-1">
              Control how promotional pricing is displayed in domain search results
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Promotional Pricing Control
              </CardTitle>
              <CardDescription>
                Enable or disable the display of promotional pricing in domain search results.
                When disabled, only regular pricing will be shown.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading setting...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">Promotional Pricing Display</h3>
                        <Badge variant={setting?.enabled ? "default" : "secondary"}>
                          {setting?.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {setting?.enabled
                          ? "Promotional prices will be shown with strikethrough original prices and PROMO badges"
                          : "Only regular pricing will be displayed, promotional offers will be hidden"
                        }
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={setting?.enabled || false}
                        onCheckedChange={updateSetting}
                        disabled={saving}
                        className="scale-110"
                      />
                      <div className="flex items-center space-x-1">
                        {setting?.enabled ? (
                          <ToggleRight className="h-5 w-5 text-blue-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {setting?.enabled ? "ON" : "OFF"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {setting && (
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Last updated: {new Date(setting.updatedAt).toLocaleString()}</p>
                      <p>Updated by: {setting.updatedBy}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-900">How it works:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• <strong>Enabled:</strong> Shows promotional prices with original prices crossed out and "PROMO" badges</li>
                          <li>• <strong>Disabled:</strong> Only displays regular pricing, hiding all promotional offers</li>
                          <li>• Changes take effect immediately for new domain searches</li>
                          <li>• Existing cached pricing data will be refreshed on next search</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
