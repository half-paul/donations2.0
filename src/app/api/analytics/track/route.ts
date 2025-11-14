/**
 * Analytics Tracking API Route
 *
 * POST /api/analytics/track
 *
 * Receives analytics events from client and stores them in the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../server/api/trpc';
import { handleAnalyticsTrack } from '../../../../server/analytics/logger';

export async function POST(request: NextRequest) {
  try {
    // Convert NextRequest to standard Request
    const req = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const response = await handleAnalyticsTrack(req, db);

    // Convert Response to NextResponse
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disable body parsing since we handle it ourselves
export const config = {
  api: {
    bodyParser: false,
  },
};
