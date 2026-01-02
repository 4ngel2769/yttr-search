
import { performSearch } from './src/lib/search';

async function main() {
  console.log('Starting search test...');
  
  try {
    // Test with a known video ID and keyword
    // Video: "YouTube Developers" - M7lc1UVf-VE
    const videoId = 'M7lc1UVf-VE';
    const keyword = 'youtube';
    
    console.log(`Searching for '${keyword}' in video ${videoId}`);
    
    const result = await performSearch({
      mode: 'video',
      keywords: keyword,
      target: `https://www.youtube.com/watch?v=${videoId}`,
      userId: null,
      ipAddress: undefined
    });
    
    console.log('Search completed.');
    console.log('Total matches:', result.totalMatches);
    console.log('Videos scanned:', result.videosScanned);
    
    if (result.results.length > 0) {
      console.log('First result matches:', JSON.stringify(result.results[0].matches, null, 2));
    } else {
      console.log('No results found.');
    }
    
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();
