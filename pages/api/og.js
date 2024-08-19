import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');
  const type = searchParams.get('type');
  const result = searchParams.get('result');

  let backgroundColor = '#1a1a1a';
  let textColor = '#ffffff';

  if (type === 'result') {
    backgroundColor = result === 'correct' ? '#4caf50' : '#f44336';
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: backgroundColor,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial',
          fontSize: 60,
          fontWeight: 'bold',
          textAlign: 'center',
          padding: '40px',
          color: textColor,
        }}
      >
        {text}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}