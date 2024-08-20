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

    if (type === 'result') {
      backgroundColor = result === 'correct' ? '#4caf50' : '#f44336';
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
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: textColor,
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 60, marginBottom: 20 }}>
            {lines[0]}
          </div>
          {lines[1] && (
            <div style={{ fontSize: 40, marginBottom: 20 }}>
              {lines[1]}
            </div>
          )}
          <div style={{ fontSize: 50 }}>
            {lines.slice(2).map((line, index) => (
              <div key={index} style={{ fontSize: 30 }}>
                {line}
              </div>
            ))}
          </div>
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
