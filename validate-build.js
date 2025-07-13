#!/usr/bin/env node
/**
 * TradeWiser Platform - Build Validation Script
 * Validates that the build process will work in Docker
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🧪 TradeWiser Build Validation');
console.log('==============================');

// Check if package.json exists
console.log('1. Checking package.json...');
if (!fs.existsSync('package.json')) {
    console.error('❌ package.json not found');
    process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log('✅ package.json found');

// Check build script
console.log('2. Checking build script...');
if (!packageJson.scripts || !packageJson.scripts.build) {
    console.error('❌ Build script not found in package.json');
    process.exit(1);
}
console.log('✅ Build script found:', packageJson.scripts.build);

// Check if vite and esbuild are in dependencies
console.log('3. Checking build dependencies...');
const devDeps = packageJson.devDependencies || {};
const deps = packageJson.dependencies || {};

const requiredBuildDeps = ['vite', 'esbuild'];
const missingDeps = requiredBuildDeps.filter(dep => !devDeps[dep] && !deps[dep]);

if (missingDeps.length > 0) {
    console.error('❌ Missing build dependencies:', missingDeps.join(', '));
    process.exit(1);
}
console.log('✅ Build dependencies found');

// Check if TypeScript config exists
console.log('4. Checking TypeScript configuration...');
if (!fs.existsSync('tsconfig.json')) {
    console.error('❌ tsconfig.json not found');
    process.exit(1);
}
console.log('✅ tsconfig.json found');

// Check if vite config exists
console.log('5. Checking Vite configuration...');
if (!fs.existsSync('vite.config.ts')) {
    console.error('❌ vite.config.ts not found');
    process.exit(1);
}
console.log('✅ vite.config.ts found');

// Check key source files
console.log('6. Checking source files...');
const requiredFiles = [
    'server/index.ts',
    'client/src/main.tsx',
    'client/src/App.tsx',
    'shared/schema.ts'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
if (missingFiles.length > 0) {
    console.error('❌ Missing source files:', missingFiles.join(', '));
    process.exit(1);
}
console.log('✅ Source files found');

// Check Docker files
console.log('7. Checking Docker configuration...');
if (!fs.existsSync('Dockerfile')) {
    console.error('❌ Dockerfile not found');
    process.exit(1);
}
if (!fs.existsSync('docker-compose.yml')) {
    console.error('❌ docker-compose.yml not found');
    process.exit(1);
}
if (!fs.existsSync('.env.docker')) {
    console.error('❌ .env.docker template not found');
    process.exit(1);
}
console.log('✅ Docker configuration files found');

// Test build process (if dependencies are installed)
console.log('8. Testing build process...');
try {
    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
        console.log('⚠️  node_modules not found, skipping build test');
        console.log('   Run "npm install" to install dependencies');
    } else {
        console.log('   Running build test...');
        execSync('npm run build', { stdio: 'pipe' });
        console.log('✅ Build test successful');
        
        // Check if build outputs exist
        if (fs.existsSync('dist') && fs.existsSync('client/dist')) {
            console.log('✅ Build outputs created successfully');
        } else {
            console.log('⚠️  Build outputs not found, but build command succeeded');
        }
    }
} catch (error) {
    console.error('❌ Build test failed:', error.message);
    process.exit(1);
}

console.log('');
console.log('🎉 Build validation complete!');
console.log('============================');
console.log('');
console.log('Your TradeWiser platform is ready for Docker deployment:');
console.log('');
console.log('1. Make sure Docker is installed');
console.log('2. Run: cp .env.docker .env');
console.log('3. Run: docker compose up --build -d');
console.log('   (or: docker-compose up --build -d)');
console.log('4. Wait for services to start (2-3 minutes)');
console.log('5. Access: http://localhost:5000');
console.log('6. Login: testuser / password123');
console.log('');
console.log('For troubleshooting, check SETUP_GUIDE.md');