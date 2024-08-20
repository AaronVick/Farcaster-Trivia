import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const type = searchParams.get('type');
    const result = searchParams.get('result');

    let backgroundColor = '#1a1a1a';
    let textColor = '#ffffff';
    let fontSize = 60;
    let isResult = false;

    // Check if the text starts with "Correct" or "Incorrect"
    if (text.startsWith("Correct") || text.startsWith("Incorrect")) {
      isResult = true;
      backgroundColor = text.startsWith("Correct") ? '#4caf50' : '#f44336';
      fontSize = 50;  // Smaller font size for results
    }

    // Split the text into lines to control line breaks
    const lines = text.split('\n');

    return new ImageResponse(
      (
        <div
          style={{
            background: backgroundColor,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: textColor,
            padding: '40px',
            textAlign: 'center',
          }}
        >
          {lines.map((line, index) => (
            <div
              key={index}
              style={{
                fontSize: isResult && index > 0 ? fontSize - 20 : fontSize,
                marginBottom: isResult && index > 0 ? '10px' : '20px',
              }}
            >
              {line}
            </div>
          ))}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}
