'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  HardDrive,
  Cloud,
  Trash2,
  Download,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useAppStore } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppShell } from '@/components/shell';
import { type Locale } from '@/i18n';
import { cn } from '@/lib/utils';

interface PageProps {
  params: { locale: Locale };
}

type ThemeOption = 'light' | 'dark' | 'system';

export default function SettingsPage({ params: { locale } }: PageProps) {
  const t = useTranslations();
  const { profile, isAuthenticated } = useAuth();
  const { theme, setTheme, currency, country } = useAppStore();
  
  const [name, setName] = useState(profile?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement save to Supabase
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleExportData = async () => {
    // TODO: Implement data export
    console.log('Exporting data...');
  };

  const handleDeleteAllData = async () => {
    if (confirm('Are you sure you want to delete all local data? This cannot be undone.')) {
      // TODO: Implement delete
      console.log('Deleting all data...');
    }
  };

  return (
    <AppShell locale={locale}>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/account`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        </div>

        {/* Profile Settings */}
        {isAuthenticated && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-neutral-500" />
                <h3 className="text-lg font-semibold text-neutral-900">Profile</h3>
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Display Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
                
                <Input
                  label="Email"
                  value={profile?.email || ''}
                  disabled
                  hint="Email cannot be changed"
                />
                
                <Button
                  variant="primary"
                  onClick={handleSave}
                  isLoading={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appearance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-neutral-500" />
              <h3 className="text-lg font-semibold text-neutral-900">Appearance</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'system'] as ThemeOption[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => setTheme(option)}
                      className={cn(
                        'flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all',
                        theme === option
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 hover:border-neutral-300'
                      )}
                    >
                      {option === 'light' && <Sun className="w-4 h-4" />}
                      {option === 'dark' && <Moon className="w-4 h-4" />}
                      {option === 'system' && <Monitor className="w-4 h-4" />}
                      <span className="text-sm font-medium capitalize">{option}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-neutral-500" />
              <h3 className="text-lg font-semibold text-neutral-900">Regional</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                <div>
                  <p className="font-medium text-neutral-900">Currency</p>
                  <p className="text-sm text-neutral-500">Default currency for new transactions</p>
                </div>
                <span className="font-mono text-neutral-700">{currency}</span>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-neutral-900">Country</p>
                  <p className="text-sm text-neutral-500">Used for tax calculations</p>
                </div>
                <span className="text-neutral-700">{country}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-neutral-500" />
              <h3 className="text-lg font-semibold text-neutral-900">Data Management</h3>
            </div>
            
            <div className="space-y-4">
              {/* Storage Info */}
              <div className="p-4 bg-neutral-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm font-medium text-neutral-900">Local Storage</span>
                  </div>
                  <span className="text-sm text-green-600">Active</span>
                </div>
                <p className="text-xs text-neutral-500">
                  Your data is stored locally on this device using IndexedDB.
                </p>
              </div>

              {profile && ['plus', 'pro', 'founding'].includes(profile.tier) && (
                <div className="p-4 bg-primary-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-primary-600" />
                      <span className="text-sm font-medium text-primary-900">Cloud Sync</span>
                    </div>
                    <span className="text-sm text-primary-600">Enabled</span>
                  </div>
                  <p className="text-xs text-primary-700">
                    Your data is automatically synced across all your devices.
                  </p>
                </div>
              )}

              {/* Export */}
              <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                <div>
                  <p className="font-medium text-neutral-900">Export All Data</p>
                  <p className="text-sm text-neutral-500">Download your data as JSON</p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Delete */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-red-700">Delete Local Data</p>
                  <p className="text-sm text-neutral-500">Remove all data from this device</p>
                </div>
                <Button variant="danger" size="sm" onClick={handleDeleteAllData}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-neutral-500" />
              <h3 className="text-lg font-semibold text-neutral-900">Notifications</h3>
            </div>
            
            <div className="space-y-4">
              <ToggleSetting
                label="Budget Alerts"
                description="Get notified when you're close to budget limits"
                defaultChecked
              />
              <ToggleSetting
                label="Weekly Summary"
                description="Receive a weekly summary of your activities"
                defaultChecked={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Version Info */}
        <div className="text-center py-4">
          <p className="text-sm text-neutral-500">
            Breath of Now v1.0.0
          </p>
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} M21 Global, Lda
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function ToggleSetting({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [isChecked, setIsChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-neutral-900">{label}</p>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
      <button
        onClick={() => setIsChecked(!isChecked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          isChecked ? 'bg-primary-500' : 'bg-neutral-300'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
            isChecked && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}
