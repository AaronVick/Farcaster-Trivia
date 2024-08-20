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

async function handleAnswerSelection(buttonIndex, res, currentQuestion, buttonMapping) {
  try {
    console.log("Received currentQuestion and buttonMapping from answer_Value:", { currentQuestion, buttonMapping });

    if (!currentQuestion || !buttonMapping) {
      console.error("Current question or button mapping is not set.");
      return res.status(500).json({ error: "Current question or button mapping is not available." });
    }

    const selectedAnswer = buttonMapping[buttonIndex];
    const correctAnswer = optimizeAnswerText(decodeHtmlEntities(currentQuestion.correct_answer));
    const isCorrect = selectedAnswer === correctAnswer;

    // Track correct and incorrect answers
    process.env.GameWins = parseInt(process.env.GameWins || '0') + (isCorrect ? 1 : 0);
    process.env.GameLoss = parseInt(process.env.GameLoss || '0') + (!isCorrect ? 1 : 0);

    // Track total questions answered
    process.env.gameTally = parseInt(process.env.gameTally || '0') + 1;

    const resultText = isCorrect ? "Correct!" : `Incorrect!\n\nThe correct answer was: ${correctAnswer}`;
    const tallyText = `Correct: ${process.env.GameWins}\nIncorrect: ${process.env.GameLoss}\nTotal Answered: ${process.env.gameTally}`;
    const fullText = `${resultText}\n\n${tallyText}`;
    
    const ogImageUrl = `${VERCEL_OG_API}?text=${encodeURIComponent(fullText)}&result=${isCorrect ? 'correct' : 'incorrect'}`;

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
      const { currentQuestion, buttonMapping } = JSON.parse(process.env.answer_Value || '{}');  // Retrieve the current question and button mapping from the environment variable

      console.log('Button index:', buttonIndex);

      // Handle answer selection (buttons 1, 2, 3, 4)
      const response = await handleAnswerSelection(buttonIndex, res, currentQuestion, buttonMapping);

      if (buttonIndex === 1) {
        process.env.answer_Value = null; // Reset the environment variable if "Next Question" is clicked
      }

      return response;
    } else {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
