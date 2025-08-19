import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export async function generateVideoSummary(
  title: string, 
  description: string, 
  _childAge?: number,
  _childInterests?: string[]
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a content summarizer that creates neutral, descriptive summaries of videos based solely on their title and description. Be objective and informative without being educational-focused unless the content is explicitly educational.`
        },
        {
          role: "user",
          content: `Create a brief, neutral summary (2-3 sentences) describing what this video is about based on the title and description provided.

Video Title: ${title}
Video Description: ${description.slice(0, 500)}...

Simply describe what the video contains and what viewers can expect to see. Don't assume educational intent unless explicitly stated. Keep it factual and concise.`
        }
      ],
      max_tokens: 120,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content || 'Video content suitable for viewing.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'This video contains content that may be of interest.';
  }
}

export async function generateBulkSummaries(
  videos: Array<{
    title: string;
    description: string;
  }>,
  childAge: number,
  childInterests: string[]
): Promise<string[]> {
  const summaries = await Promise.allSettled(
    videos.map(video => 
      generateVideoSummary(video.title, video.description, childAge, childInterests)
    )
  );

  return summaries.map(result => 
    result.status === 'fulfilled' 
      ? result.value 
      : 'Educational video content suitable for children.'
  );
}