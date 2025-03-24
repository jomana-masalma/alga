import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API route handler for serving the CSV file
 * This allows client-side code to access the local CSV file
 */
export async function GET() {
  try {
    // Get the path to the CSV file
    const csvPath = path.join(process.cwd(), 'data', 'algae-species.csv');
    
    // Read the file
    const csvData = fs.readFileSync(csvPath, 'utf8');
    
    // Return the CSV data with appropriate headers
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error reading CSV file:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to read CSV file' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
