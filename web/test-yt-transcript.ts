
// @ts-ignore
import { getSubtitles } from 'youtube-caption-scraper';

async function main() {
  const videoId = 'dQw4w9WgXcQ';
  console.log(`Fetching transcript for ${videoId}...`);
  try {
    const transcript = await getSubtitles({ videoID: videoId, lang: 'en' });
    console.log('Transcript length:', transcript.length);
    if (transcript.length > 0) {
      console.log('First item:', transcript[0]);
    } else {
      console.log('Transcript is empty array');
    }
  } catch (e) {
    console.error('Error fetching transcript:', e);
  }
}

main();
