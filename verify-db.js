#!/usr/bin/env node

/**
 * Database Connection Verification Script
 * Run this to test your Neon database connection before deployment
 */

require('dotenv').config();
const { validateConnection, initDatabase } = require('./db');

async function verifyDatabase() {
    console.log('🔍 Verifying Neon Database Connection...\n');

    // Show environment variables (masked)
    console.log('📋 Environment Variables:');
    const dbVars = Object.keys(process.env).filter(key =>
        key.includes('POSTGRES') || key.includes('DATABASE') || key.startsWith('db_') || key.startsWith('PG')
    );

    if (dbVars.length === 0) {
        console.log('❌ No database environment variables found!');
        console.log('🔧 Make sure your .env file is configured properly.');
        process.exit(1);
    }

    dbVars.forEach(key => {
        const value = process.env[key];
        if (value) {
            // Mask password in logs
            const maskedValue = key.toLowerCase().includes('password') || key.toLowerCase().includes('pass')
                ? value.replace(/:[^:@]+@/, ':***@')
                : value;
            console.log(`   ✓ ${key}: ${maskedValue}`);
        }
    });

    console.log('\n🔗 Testing Connection...');

    try {
        // Test connection
        const isConnected = await validateConnection();

        if (!isConnected) {
            console.log('❌ Connection test failed');
            process.exit(1);
        }

        console.log('\n🏗️  Testing Database Initialization...');

        // Test database initialization
        await initDatabase();
        console.log('✅ Database tables initialized successfully');

        console.log('\n🎉 All tests passed! Your database is ready for deployment.');
        console.log('\n📝 Next steps:');
        console.log('   1. Deploy your application to Vercel');
        console.log('   2. Set the environment variables in Vercel dashboard');
        console.log('   3. Test the /api/health endpoint after deployment');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('   1. Check your .env file has the correct database URL');
        console.log('   2. Verify your Neon database is running');
        console.log('   3. Ensure your IP is whitelisted (if applicable)');
        console.log('   4. Check the database credentials are correct');

        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

verifyDatabase();