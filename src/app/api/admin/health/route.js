import { NextResponse } from 'next/server';
import { isDatabaseConnected, getDatabase } from '../../../../lib/database';

export async function POST(request) {
  try {
    const { password } = await request.json();
    

    if (password !== 'happyfood2024') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const dbConnected = isDatabaseConnected();
    let dbStats = null;
    let dishCount = 0;

    if (dbConnected) {
      try {
        const db = getDatabase();
        dishCount = await db.collection('dishes').countDocuments();
        

        const stats = await db.stats();
        dbStats = {
          collections: stats.collections,
          dataSize: Math.round(stats.dataSize / 1024 / 1024 * 100) / 100, // MB
          storageSize: Math.round(stats.storageSize / 1024 / 1024 * 100) / 100, // MB
          indexes: stats.indexes,
        };
      } catch (error) {
        console.error('Database stats error:', error);
      }
    }

    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    return NextResponse.json({
      success: true,
      message: 'Health check completed',
      data: {
        database: {
          connected: dbConnected,
          dishCount,
          stats: dbStats,
        },
        system: systemInfo,
      }
    });
  } catch (error) {
    console.error('Admin health check error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Health check failed' 
    }, { status: 500 });
  }
} 
