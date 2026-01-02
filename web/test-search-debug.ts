
import { fetchTranscript, searchTranscript } from './src/lib/transcript';

async function main() {
  console.log('Starting transcript test (using Python subprocess)...');
  
  try {
    const videoId = 'M7lc1UVf-VE';
    
    console.log(`\nFetching transcript for video ${videoId}...`);
    const segments = await fetchTranscript(videoId);
    
    console.log(`Got ${segments.length} segments`);
    if (segments.length > 0) {
      console.log('First 3 segments:');
      segments.slice(0, 3).forEach((s, i) => {
        console.log(`  ${i+1}. [${s.start.toFixed(1)}s] ${s.text}`);
      });
      
      // Search for 'youtube' in segments
      const keywords = ['youtube', 'player'];
      console.log(`\nSearching for keywords: ${keywords.join(', ')}`);
      const matches = searchTranscript(segments, keywords);
      console.log(`Found ${matches.length} matches`);
      matches.slice(0, 5).forEach((m) => {
        console.log(`  [${m.timestamp.toFixed(1)}s] "${m.keyword}": ${m.text}`);
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();
