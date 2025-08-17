#!/usr/bin/env node

const { networkInterfaces } = require('os');

function getLocalIpAddress() {
  const interfaces = networkInterfaces();
  
  for (const interfaceName of Object.keys(interfaces)) {
    const interfaceInfo = interfaces[interfaceName];
    
    for (const alias of interfaceInfo) {
      // Skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (alias.family === 'IPv4' && !alias.internal) {
        console.log(`Found IP address: ${alias.address}`);
        return alias.address;
      }
    }
  }
  
  console.log('No external IPv4 address found');
  return 'localhost';
}

const ip = getLocalIpAddress();
console.log(`\nTo use this IP in your mobile app, update your .env file:`);
console.log(`EXPO_PUBLIC_API_URL=http://${ip}:3000`);
console.log(`\nMake sure your development server is running on port 3000`);