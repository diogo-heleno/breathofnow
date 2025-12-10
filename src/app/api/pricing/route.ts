// app/api/pricing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllPrices, getTierByCountry } from '@/lib/fair-pricing';

export async function GET(request: NextRequest) {
  // Vercel injects the country in the header automatically
  const country = request.headers.get('x-vercel-ip-country') || 'US';
  
  const prices = getAllPrices(country);
  const tier = getTierByCountry(country);
  
  return NextResponse.json({
    country,
    tier: {
      id: tier.id,
      name: tier.name,
      factor: tier.factor,
    },
    prices,
  });
}
