
// @ts-ignore
import * as scraperModule from 'youtube-caption-scraper';

async function main() {
  const videoId = 'dQw4w9WgXcQ';
  console.log(`Fetching transcript for ${videoId}...`);
  try {
    console.log('Module keys:', Object.keys(scraperModule));
    // @ts-ignore
    console.log('Module default keys:', Object.keys(scraperModule.default));
    // @ts-ignore
    const getSubtitles = scraperModule.getSubtitles || scraperModule.default?.getSubtitles;
    
    if (getSubtitles) {
        const transcript = await getSubtitles({ videoID: videoId, lang: 'en' });
        console.log('Transcript length:', transcript.length);
        if (transcript.length > 0) {
            console.log('First item:', transcript[0]);
        }
    } else {
        console.log('getSubtitles not found');
    }

  } catch (e) {
    console.error('Error fetching transcript:', e);
  }
}

main();
