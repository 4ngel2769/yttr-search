
import sys
import json

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    print(json.dumps({"error": f"ImportError: youtube_transcript_api not installed"}))
    sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No video ID provided"}))
        sys.exit(1)

    video_id = sys.argv[1]
    
    try:
        # Create API instance
        api = YouTubeTranscriptApi()
        
        # List available transcripts
        transcript_list = api.list(video_id)
            
        # Try to find English or auto-generated English
        transcript = None
        
        # Iterate to find 'en'
        for t in transcript_list:
            if t.language_code == 'en':
                transcript = t
                break
        
        # If no 'en', take the first one
        if not transcript:
            for t in transcript_list:
                transcript = t
                break
                
        if not transcript:
            print(json.dumps({"error": "No transcript found"}))
            sys.exit(1)
            
        # Fetch
        result = transcript.fetch()
        
        # Convert objects to dicts
        json_result = []
        for item in result:
            if hasattr(item, 'text'):
                json_result.append({
                    'text': item.text,
                    'start': item.start,
                    'duration': item.duration
                })
            else:
                json_result.append(item)
        
        # Output as JSON
        print(json.dumps(json_result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
