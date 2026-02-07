import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read the existing banners data file
    const bannersDataPath = path.join(process.cwd(), 'public', 'assets', 'banners', 'banners-data.json');
    const bannersData = JSON.parse(fs.readFileSync(bannersDataPath, 'utf8'));
    
    // Filter only active banners and map to the expected format
    const banners = bannersData
      .filter((banner: any) => banner.is_active !== false)
      .map((banner: any) => ({
        image: banner.image_url,
        title: banner.title,
        text: banner.text,
        cta_label: banner.cta_label,
        cta_link: banner.cta_link,
        is_active: banner.is_active
      }));

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}