#!/usr/bin/env node

const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 YouTube API Key Test Script');
console.log('================================\n');

// Check if API key is set
const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) {
  console.error('❌ YOUTUBE_API_KEY not found in .env.local');
  console.log('\n📝 Instructions:');
  console.log('1. Make sure you have a .env.local file');
  console.log('2. Add: YOUTUBE_API_KEY=your_api_key_here');
  process.exit(1);
}

console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');

// Initialize YouTube API
const youtube = google.youtube({
  version: 'v3',
  auth: apiKey,
});

async function testYouTubeAPI() {
  try {
    console.log('\n🔍 Testing YouTube API with a simple search...');
    
    // Test 1: Simple search
    const searchResponse = await youtube.search.list({
      part: ['id', 'snippet'],
      q: 'science for kids educational',
      type: ['video'],
      maxResults: 5,
      safeSearch: 'strict',
      order: 'relevance',
    });

    console.log('📊 Search Response Status:', searchResponse.status);
    console.log('📝 Items Found:', searchResponse.data.items?.length || 0);
    
    if (searchResponse.data.items && searchResponse.data.items.length > 0) {
      console.log('✅ Search successful! Sample video:');
      const firstVideo = searchResponse.data.items[0];
      console.log('  Title:', firstVideo.snippet?.title);
      console.log('  Channel:', firstVideo.snippet?.channelTitle);
      console.log('  Video ID:', firstVideo.id?.videoId);
      
      // Test 2: Get video details
      if (firstVideo.id?.videoId) {
        console.log('\n🎥 Testing video details fetch...');
        const videoDetails = await youtube.videos.list({
          part: ['snippet', 'contentDetails', 'statistics'],
          id: [firstVideo.id.videoId],
        });
        
        console.log('📊 Video Details Status:', videoDetails.status);
        console.log('📝 Details Found:', videoDetails.data.items?.length || 0);
        
        if (videoDetails.data.items && videoDetails.data.items.length > 0) {
          const video = videoDetails.data.items[0];
          console.log('✅ Video details successful!');
          console.log('  Duration:', video.contentDetails?.duration);
          console.log('  View Count:', video.statistics?.viewCount);
          console.log('  Description Length:', video.snippet?.description?.length || 0);
        }
      }
      
      // Test 3: Check API quota usage
      console.log('\n📈 API Quota Check:');
      console.log('  Search API call: ~100 units');
      console.log('  Video details API call: ~1 unit per video');
      console.log('  Daily quota limit: 10,000 units (default)');
      console.log('  Estimated usage in this test: ~105 units');
      
      console.log('\n🎉 All tests passed! Your YouTube API key is working correctly.');
      
    } else {
      console.log('⚠️ Search returned no results. This might indicate:');
      console.log('  - API key has restricted access');
      console.log('  - Quota limits reached');
      console.log('  - Service restrictions');
    }
    
  } catch (error) {
    console.error('\n❌ YouTube API Test Failed:');
    console.error('Error Message:', error.message);
    
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Error Details:', error.response.data);
      
      // Specific error guidance
      switch (error.response.status) {
        case 400:
          console.log('\n🔧 Fix: Bad Request - Check your query parameters');
          break;
        case 403:
          console.log('\n🔧 Fix: Forbidden - Check these issues:');
          console.log('  1. Invalid API key');
          console.log('  2. API key restrictions (HTTP referrers, IP addresses)');
          console.log('  3. YouTube Data API v3 not enabled');
          console.log('  4. Quota exceeded');
          break;
        case 404:
          console.log('\n🔧 Fix: Not Found - API endpoint issue');
          break;
        default:
          console.log('\n🔧 Check Google Cloud Console for more details');
      }
    }
    
    console.log('\n📋 Troubleshooting Steps:');
    console.log('1. Verify API key in Google Cloud Console');
    console.log('2. Ensure YouTube Data API v3 is enabled');
    console.log('3. Check API key restrictions');
    console.log('4. Verify billing is set up (required for API usage)');
    console.log('5. Check quota limits and usage');
  }
}

// Run the test
testYouTubeAPI();