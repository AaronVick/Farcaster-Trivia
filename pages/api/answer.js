import axios from 'axios';

const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;

function decodeHtmlEntities(text) {
  return text.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#039;/g, "'");
}

function optimizeAnswerText(text) {
  return text.trim().toLowerCase().replace(/^(the|a|an) /, '');
}

async function handleAnswerSelection(buttonIndex, res, currentQuestion) {
  try {
    if (!currentQuestion) {
      console.error("Current question is not set.");
      return res.status(500).json({ error: "Current question is not available." });
    }

    const selectedAnswer = optimizeAnswerText(decodeHtmlEntities(currentQuestion.incorrect_answers[buttonIndex - 1]));
    const correctAnswer = optimizeAnswerText(decodeHtmlEntities(currentQuestion.correct_answer));
    const isCorrect = selectedAnswer === correctAnswer;
    const resultText = isCorrect ? "Correct!" : `Incorrect! The correct answer was: ${correctAnswer}`;
    const ogImageUrl = `${VERCEL_OG_API}?text=${encodeURIComponent(resultText)}&result=${isCorrect ? 'correct' : 'incorrect'}`;

    const shareText = encodeURIComponent("Take a break and play some trivia!\n\nFrame by @aaronv\n\nhttps://farcaster-trivia-one.vercel.app/");
    const shareLink = `https://warpcast.com/~/compose?text=${shareText}`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          <meta property="fc:frame:button:1" content="Next Question" />
          <meta property="fc:frame:post_url" content="https://farcaster-trivia-one.vercel.app/api/triviaFrame" />
          <meta property="fc:frame:button:2" content="Share Game" />
          <meta property="fc:frame:button:2:action" content="link" />
          <meta property="fc:frame:button:2:target" content="${shareLink}" />
        </head>
      </html>
    `);
  } catch (error) {
    console.error("Error in handleAnswerSelection:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export default async function handler(req, res) {
  console.log('Received request to answer handler');
  console.log('Request method:', req.method);

  try {
    if (req.method === 'POST') {
      const untrustedData = req.body?.untrustedData;

      if (!untrustedData) {
        console.error('No untrustedData in request body');
        return res.status(400).json({ error: 'Invalid request: missing untrustedData' });
      }

      const buttonIndex = untrustedData.buttonIndex;
      const currentQuestion = untrustedData.currentQuestion;  // Retrieve the current question
      console.log('Button index:', buttonIndex);

      // Handle answer selection (buttons 1, 2, 3, 4)
      return handleAnswerSelection(buttonIndex, res, currentQuestion);
    } else {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
