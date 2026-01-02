
// @ts-ignore
import { getSubtitles } from 'youtube-caption-scraper';
// Try default import if named fails
// @ts-ignore
import scraper from 'youtube-caption-scraper';

async function main() {
  const videoId = 'dQw4w9WgXcQ';
  console.log(`Fetching transcript for ${videoId}...`);
  try {
    const fetcher = scraper?.getSubtitles || getSubtitles || scraper;
    if (typeof fetcher !== 'function') {
        console.error('Could not find getSubtitles function');
        console.log('scraper:', scraper);
        console.log('getSubtitles:', getSubtitles);
        return;
    }

    const transcript = await fetcher({ videoID: videoId, lang: 'en' });
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
