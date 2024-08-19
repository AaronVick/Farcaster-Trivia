import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Farcaster Trivia Challenge</title>
        <meta property="og:title" content="Farcaster Trivia Challenge" />
        <meta property="og:image" content="https://farcaster-trivia-one.vercel.app/trivia.png" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://farcaster-trivia-one.vercel.app/trivia.png" />
        <meta property="fc:frame:button:1" content="Start Trivia Game" />
        <meta property="fc:frame:post_url" content="https://farcaster-trivia-one.vercel.app/api/triviaFrame" />
      </Head>
      <main>
        <h1>Farcaster Trivia Challenge</h1>
        <p>Welcome to the Farcaster Trivia Challenge! Click the button in your Farcaster client to start playing.</p>
        <img src="https://farcaster-trivia-one.vercel.app/trivia.png" alt="Trivia Challenge" style={{ maxWidth: '100%', height: 'auto' }} />
      </main>
    </div>
  );
}