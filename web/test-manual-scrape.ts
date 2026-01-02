
import axios from 'axios';

import { XMLParser } from 'fast-xml-parser';

async function main() {
  const videoId = 'dQw4w9WgXcQ';
  console.log(`Fetching page for ${videoId}...`);
  try {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    const pageResponse = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, { headers });
    const data = pageResponse.data;
    const cookies = pageResponse.headers['set-cookie'];
    
    if (data.includes('captionTracks')) {
        console.log('Found captionTracks!');
        const match = data.match(/"captionTracks":(\[.*?\])/);
        if (match) {
            const tracks = JSON.parse(match[1]);
            console.log('Tracks count:', tracks.length);
            
            const trackUrl = tracks[0].baseUrl;
            console.log('Fetching transcript from:', trackUrl);
            
            const cookieHeader = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';
            console.log('Cookies:', cookieHeader);

            const response = await fetch(trackUrl, { 
                headers: {
                    ...headers,
                    'Cookie': cookieHeader
                }
            });
            console.log('Status:', response.status);
            console.log('Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
            const text = await response.text();
            console.log('Text length:', text.length);
            
            if (text.length > 0) {
                const parser = new XMLParser({ ignoreAttributes: false });
                const result = parser.parse(text);
                console.log('Parsed XML:', JSON.stringify(result, null, 2).substring(0, 200));
            }
        }
    } else {
        console.log('No captionTracks found in page source.');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
