const { exec } = require('child_process');

console.log('Setting up database...');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('username:password')) {
  console.error('❌ Please set your DATABASE_URL in .env.local');
  console.log('Instructions:');
  console.log('1. Create a Neon database at https://neon.tech');
  console.log('2. Copy the connection string');
  console.log('3. Replace DATABASE_URL in .env.local');
  process.exit(1);
}

// Run Prisma commands
exec('npx prisma db push', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Database setup failed:', error);
    return;
  }
  
  console.log('✅ Database setup complete!');
  console.log(stdout);
  
  if (stderr) {
    console.log('Warnings:', stderr);
  }
});