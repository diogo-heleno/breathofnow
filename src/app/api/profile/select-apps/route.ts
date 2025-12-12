import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getMaxAppsForTier, type AppId, type PlanTier } from '@/types/pricing';

interface SelectAppsRequest {
  appId: AppId;
  action: 'select' | 'deselect' | 'make-primary';
}

interface ProfileData {
  subscription_tier: PlanTier | null;
  selected_apps: string[] | null;
  last_app_change: string | null;
}

// Days required between app changes for free tier
const FREE_TIER_CHANGE_DAYS = 30;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as SelectAppsRequest;
    const { appId, action } = body;

    if (!appId || !action) {
      return NextResponse.json(
        { error: 'Missing appId or action' },
        { status: 400 }
      );
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, selected_apps, last_app_change')
      .eq('id', user.id)
      .single() as { data: ProfileData | null; error: { message: string } | null };

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const tier = (profile.subscription_tier || 'free') as PlanTier;
    const currentApps = (profile.selected_apps || []) as string[];
    const maxApps = getMaxAppsForTier(tier);

    // Pro and Founding have all apps - no selection needed
    if (maxApps === 'all') {
      return NextResponse.json(
        { error: 'Your tier has access to all apps' },
        { status: 400 }
      );
    }

    // Handle SELECT action
    if (action === 'select') {
      // Check if already selected
      if (currentApps.includes(appId)) {
        return NextResponse.json(
          { error: 'App already selected' },
          { status: 400 }
        );
      }

      // Check if user has room for more apps
      if (currentApps.length >= maxApps) {
        return NextResponse.json(
          { error: 'Maximum apps reached for your tier. Upgrade or deselect an app first.' },
          { status: 400 }
        );
      }

      // Add app to selection
      const updatedApps = [...currentApps, appId];
      const updateData: Record<string, unknown> = {
        selected_apps: updatedApps,
      };

      // For free tier on first selection, record the change date
      if (tier === 'free' && currentApps.length === 0) {
        updateData.last_app_change = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        selectedApps: updatedApps,
        message: `${appId} has been selected`,
      });
    }

    // Handle DESELECT action
    if (action === 'deselect') {
      // Free tier cannot deselect (must use make-primary instead)
      if (tier === 'free') {
        return NextResponse.json(
          { error: 'Free tier cannot deselect apps. Use make-primary to change your app.' },
          { status: 400 }
        );
      }

      // Check if app is selected
      if (!currentApps.includes(appId)) {
        return NextResponse.json(
          { error: 'App is not selected' },
          { status: 400 }
        );
      }

      // Remove app from selection
      const updatedApps = currentApps.filter((id) => id !== appId);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ selected_apps: updatedApps })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        selectedApps: updatedApps,
        message: `${appId} has been deselected`,
      });
    }

    // Handle MAKE-PRIMARY action (for free tier changing their app)
    if (action === 'make-primary') {
      // Only free tier uses this action
      if (tier !== 'free') {
        return NextResponse.json(
          { error: 'Only free tier uses make-primary action' },
          { status: 400 }
        );
      }

      // Check if trying to select the same app
      if (currentApps.includes(appId)) {
        return NextResponse.json(
          { error: 'This app is already your primary app' },
          { status: 400 }
        );
      }

      // Check if user can change (once per 30 days)
      if (profile.last_app_change && currentApps.length > 0) {
        const lastChange = new Date(profile.last_app_change);
        const now = new Date();
        const daysSinceChange = Math.floor(
          (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceChange < FREE_TIER_CHANGE_DAYS) {
          const daysRemaining = FREE_TIER_CHANGE_DAYS - daysSinceChange;
          return NextResponse.json(
            {
              error: `You can only change your app once per ${FREE_TIER_CHANGE_DAYS} days`,
              daysRemaining,
            },
            { status: 400 }
          );
        }
      }

      // Replace the selected app
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          selected_apps: [appId],
          last_app_change: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        selectedApps: [appId],
        message: `${appId} is now your primary app`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in select-apps API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check current selection status
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, selected_apps, last_app_change')
      .eq('id', user.id)
      .single() as { data: ProfileData | null; error: { message: string } | null };

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const tier = (profile.subscription_tier || 'free') as PlanTier;
    const maxApps = getMaxAppsForTier(tier);

    // Calculate days until next change for free tier
    let daysUntilChange = 0;
    let canChange = true;

    if (tier === 'free' && profile.last_app_change && profile.selected_apps && profile.selected_apps.length > 0) {
      const lastChange = new Date(profile.last_app_change);
      const now = new Date();
      const daysSinceChange = Math.floor(
        (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceChange < FREE_TIER_CHANGE_DAYS) {
        canChange = false;
        daysUntilChange = FREE_TIER_CHANGE_DAYS - daysSinceChange;
      }
    }

    return NextResponse.json({
      tier,
      selectedApps: profile.selected_apps || [],
      maxApps,
      lastAppChange: profile.last_app_change,
      canChange,
      daysUntilChange,
    });
  } catch (error) {
    console.error('Error in select-apps GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
