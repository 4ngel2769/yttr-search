
from youtube_transcript_api import YouTubeTranscriptApi

try:
    print("Instantiating...")
    api = YouTubeTranscriptApi()
    print("Calling list...")
    transcript_list = api.list("M7lc1UVf-VE")
    
    print("Fetching English transcript...")
    # Assuming transcript_list is iterable or has find_transcript
    # Based on output, it looks like the standard TranscriptList object but maybe methods are different?
    # Let's try to iterate
    for transcript in transcript_list:
        print(f"Language: {transcript.language_code}")
        if transcript.language_code == 'en':
            print("Fetching...")
            result = transcript.fetch()
            print("First segment:", result[0])
            break
            
except Exception as e:
    print("Error:", e)
