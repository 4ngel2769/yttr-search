
import { Innertube } from 'youtubei.js';

async function main() {
  const videoId = 'dQw4w9WgXcQ';
  console.log(`Fetching transcript for ${videoId}...`);
  try {
    const youtube = await Innertube.create();
    const info = await youtube.getInfo(videoId);
    const transcriptData = await info.getTranscript();
    
    if (transcriptData && transcriptData.transcript) {
        console.log('Transcript found!');
        console.log('Segments:', transcriptData.transcript.content?.body?.initial_segments.length);
        const firstSegment = transcriptData.transcript.content?.body?.initial_segments[0];
        console.log('First segment:', JSON.stringify(firstSegment, null, 2));
    } else {
        console.log('No transcript found.');
    }

  } catch (e) {
    console.error('Error fetching transcript:', e);
  }
}

main();
