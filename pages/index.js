import Head from 'next/head'

export default function Home() {
  return (
    <div>
      <Head>
        <title>Farcaster Trivia</title>
        <meta property="og:title" content="Farcaster Trivia" />
        <meta property="og:image" content="https://farcaster-trivia-one.vercel.app/trivia.png" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://farcaster-trivia-one.vercel.app/trivia.png" />
        <meta property="fc:frame:button:1" content="Start Trivia" />
        <meta property="fc:frame:post_url" content="https://farcaster-trivia-one.vercel.app/api/triviaFrame" />
      </Head>
      <main>
        <h1>Welcome to Farcaster Trivia!</h1>
        <p>To play, open this page in a Farcaster client that supports Frames.</p>
      </main>
    </div>
  )
}