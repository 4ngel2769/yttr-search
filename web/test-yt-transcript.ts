
// @ts-ignore
import * as scraperModule from 'youtube-caption-scraper';

async function main() {
  const videoId = 'dQw4w9WgXcQ';
  console.log(`Fetching transcript for ${videoId}...`);
  try {
    console.log('Module keys:', Object.keys(scraperModule));
    // @ts-ignore
    console.log('Module default type:', typeof scraperModule.default);
    
    // @ts-ignore
    const ScraperClass = scraperModule.default;
    // @ts-ignore
    const getSubtitles = ScraperClass.getSubtitles;

    if (typeof getSubtitles === 'function') {
         const transcript = await getSubtitles({ videoID: videoId, lang: 'en' });
         console.log('Transcript length:', transcript.length);
         if (transcript.length > 0) {
             console.log('First item:', transcript[0]);
         }
    } else {
        console.log('getSubtitles is not a static method. Trying instantiation.');
        try {
            const scraper = new ScraperClass();
            // @ts-ignore
            const transcript = await scraper.getSubtitles({ videoID: videoId, lang: 'en' });
             console.log('Transcript length:', transcript.length);
             if (transcript.length > 0) {
                 console.log('First item:', transcript[0]);
             }
        } catch (e) {
            console.error('Instantiation failed:', e);
        }
    }

  } catch (e) {
    console.error('Error fetching transcript:', e);
  }
}

main();
