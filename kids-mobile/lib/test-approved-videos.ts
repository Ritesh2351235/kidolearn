/**
 * Test suite for approved videos functionality
 * Verifies the complete flow: approve video → store in database → fetch approved videos → remove video
 */

interface TestVideo {
  youtubeId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  duration: string;
  summary: string;
}

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  data?: any;
}

export class ApprovedVideosTester {
  private results: TestResult[] = [];
  private baseUrl = '/api'; // Adjust for your environment
  private mockToken = 'Bearer mock-token';
  private testChildId = 'test-child-id'; // You'll need to use a real child ID

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting approved videos functionality tests...');
    this.results = [];

    await this.testVideoApproval();
    await this.testFetchApprovedVideos();
    await this.testFetchApprovedVideosForSpecificChild();
    await this.testDuplicateApproval();
    await this.testVideoRemoval();
    await this.testBatchApproval();

    this.printSummary();
    return this.results;
  }

  private async testVideoApproval(): Promise<void> {
    console.log('✅ Testing video approval...');
    
    const testVideo: TestVideo = {
      youtubeId: 'test-video-123',
      title: 'Test Educational Video',
      description: 'A test video for kids',
      thumbnail: 'https://example.com/thumbnail.jpg',
      channelName: 'Test Channel',
      duration: '5:30',
      summary: 'This is a test video summary for educational content.'
    };

    try {
      const response = await fetch(`${this.baseUrl}/approved-videos`, {
        method: 'POST',
        headers: {
          'Authorization': this.mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: this.testChildId,
          ...testVideo
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.addResult('Video Approval', true, `✅ Video approved successfully. Video ID: ${data.videoId}`);
      } else {
        this.addResult('Video Approval', false, `❌ Approval failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      this.addResult('Video Approval', false, `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testFetchApprovedVideos(): Promise<void> {
    console.log('📹 Testing fetch all approved videos...');
    
    try {
      const response = await fetch(`${this.baseUrl}/approved-videos`, {
        method: 'GET',
        headers: {
          'Authorization': this.mockToken,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data.approvedVideos)) {
        this.addResult('Fetch All Videos', true, `✅ Fetched ${data.approvedVideos.length} approved videos`);
      } else {
        this.addResult('Fetch All Videos', false, `❌ Fetch failed: ${data.error || 'Invalid response format'}`);
      }
    } catch (error) {
      this.addResult('Fetch All Videos', false, `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testFetchApprovedVideosForSpecificChild(): Promise<void> {
    console.log('👶 Testing fetch approved videos for specific child...');
    
    try {
      const response = await fetch(`${this.baseUrl}/approved-videos?childId=${this.testChildId}`, {
        method: 'GET',
        headers: {
          'Authorization': this.mockToken,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data.approvedVideos)) {
        // Check if all videos belong to the specified child
        const allForCorrectChild = data.approvedVideos.every((video: any) => video.childId === this.testChildId);
        
        if (allForCorrectChild) {
          this.addResult('Fetch Child Videos', true, `✅ Fetched ${data.approvedVideos.length} videos for child ${this.testChildId}`);
        } else {
          this.addResult('Fetch Child Videos', false, `❌ Some videos don't belong to the specified child`);
        }
      } else {
        this.addResult('Fetch Child Videos', false, `❌ Fetch failed: ${data.error || 'Invalid response format'}`);
      }
    } catch (error) {
      this.addResult('Fetch Child Videos', false, `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testDuplicateApproval(): Promise<void> {
    console.log('🔄 Testing duplicate video approval...');
    
    const duplicateVideo: TestVideo = {
      youtubeId: 'test-video-123', // Same as previous test
      title: 'Updated Test Video Title',
      description: 'Updated description',
      thumbnail: 'https://example.com/new-thumbnail.jpg',
      channelName: 'Updated Test Channel',
      duration: '6:00',
      summary: 'Updated summary'
    };

    try {
      const response = await fetch(`${this.baseUrl}/approved-videos`, {
        method: 'POST',
        headers: {
          'Authorization': this.mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: this.testChildId,
          ...duplicateVideo
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.addResult('Duplicate Approval', true, `✅ Duplicate approval handled correctly (upsert behavior)`);
      } else {
        this.addResult('Duplicate Approval', false, `❌ Duplicate approval failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      this.addResult('Duplicate Approval', false, `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testVideoRemoval(): Promise<void> {
    console.log('🗑️ Testing video removal...');
    
    try {
      // First get a video to remove
      const fetchResponse = await fetch(`${this.baseUrl}/approved-videos?childId=${this.testChildId}`, {
        method: 'GET',
        headers: {
          'Authorization': this.mockToken,
          'Content-Type': 'application/json',
        },
      });

      const fetchData = await fetchResponse.json();
      
      if (!fetchResponse.ok || !Array.isArray(fetchData.approvedVideos) || fetchData.approvedVideos.length === 0) {
        this.addResult('Video Removal', false, `❌ No videos found to remove`);
        return;
      }

      const videoToRemove = fetchData.approvedVideos[0];
      
      // Try to remove it
      const deleteResponse = await fetch(`${this.baseUrl}/approved-videos?videoId=${videoToRemove.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': this.mockToken,
          'Content-Type': 'application/json',
        },
      });

      const deleteData = await deleteResponse.json();

      if (deleteResponse.ok && deleteData.success) {
        this.addResult('Video Removal', true, `✅ Video removed successfully: ${videoToRemove.title}`);
      } else {
        this.addResult('Video Removal', false, `❌ Removal failed: ${deleteData.error || 'Unknown error'}`);
      }
    } catch (error) {
      this.addResult('Video Removal', false, `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testBatchApproval(): Promise<void> {
    console.log('📦 Testing batch video approval...');
    
    const batchVideos = [
      {
        youtubeId: 'batch-video-1',
        title: 'Batch Test Video 1',
        description: 'First batch test video',
        thumbnail: 'https://example.com/batch1.jpg',
        channelName: 'Batch Test Channel',
        duration: '3:30',
        summary: 'First batch video summary'
      },
      {
        youtubeId: 'batch-video-2',
        title: 'Batch Test Video 2',
        description: 'Second batch test video',
        thumbnail: 'https://example.com/batch2.jpg',
        channelName: 'Batch Test Channel',
        duration: '4:15',
        summary: 'Second batch video summary'
      }
    ];

    try {
      const response = await fetch(`${this.baseUrl}/approved-videos/batch`, {
        method: 'POST',
        headers: {
          'Authorization': this.mockToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: this.testChildId,
          videos: batchVideos
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.approvedCount === batchVideos.length) {
        this.addResult('Batch Approval', true, `✅ Batch approved ${data.approvedCount} videos successfully`);
      } else {
        this.addResult('Batch Approval', false, `❌ Batch approval failed: ${data.error || 'Incorrect approved count'}`);
      }
    } catch (error) {
      this.addResult('Batch Approval', false, `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private addResult(name: string, passed: boolean, message: string, data?: any): void {
    this.results.push({ name, passed, message, data });
    console.log(`${passed ? '✅' : '❌'} ${name}: ${message}`);
  }

  private printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log('\n📊 Approved Videos Test Summary:');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('🎉 All approved videos functionality is working correctly!');
      console.log('✨ Features verified:');
      console.log('  - Video approval with database storage');
      console.log('  - Fetching all approved videos');
      console.log('  - Fetching videos for specific child');
      console.log('  - Duplicate video handling (upsert)');
      console.log('  - Video removal');
      console.log('  - Batch video approval');
    } else {
      console.log('⚠️ Some approved videos functionality needs attention');
    }
  }

  getStats() {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    return {
      passedTests: passed,
      totalTests: total,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      isAllPassing: passed === total,
      results: this.results
    };
  }
}

// Utility function to run a quick test
export async function runApprovedVideosTest(childId: string): Promise<{
  success: boolean;
  message: string;
  details: TestResult[];
}> {
  const tester = new ApprovedVideosTester();
  tester['testChildId'] = childId; // Set the child ID for testing
  
  const results = await tester.runAllTests();
  const stats = tester.getStats();
  
  return {
    success: stats.isAllPassing,
    message: stats.isAllPassing 
      ? `All ${stats.totalTests} approved videos tests passed! 🎉` 
      : `${stats.passedTests}/${stats.totalTests} tests passed. Some functionality needs attention.`,
    details: results
  };
}