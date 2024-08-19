import axios from 'axios';

const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;
let currentQuestion = null;

async function fetchTriviaQuestion() {
  const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
  return response.data.results[0];
}

function generateOgImageUrl(text, isQuestion = true, isCorrect = null) {
  const params = new URLSearchParams({
    text: text,
    type: isQuestion ? 'question' : 'result',
    result: isCorrect === null ? '' : isCorrect ? 'correct' : 'incorrect'
  });
  return `${VERCEL_OG_API}?${params.toString()}`;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    const buttonIndex = untrustedData.buttonIndex;

    if (!currentQuestion || buttonIndex === 2) { // New question or "Next Question" pressed
      currentQuestion = await fetchTriviaQuestion();
      const answers = [currentQuestion.correct_answer, ...currentQuestion.incorrect_answers].sort(() => Math.random() - 0.5);
      const ogImageUrl = generateOgImageUrl(currentQuestion.question);
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${ogImageUrl}" />
            <meta property="fc:frame:button:1" content="${answers[0]}" />
            <meta property="fc:frame:button:2" content="${answers[1]}" />
            <meta property="fc:frame:button:3" content="${answers[2]}" />
            <meta property="fc:frame:button:4" content="${answers[3]}" />
          </head>
        </html>
      `;
      
      res.status(200).send(html);
    } else if (buttonIndex === 1 && currentQuestion) { // Share button pressed after answering
      const shareUrl = "https://warpcast.com/~/compose?text=Take a break and play some trivia!%0A%0AFrame by @aaronv%0A%0Ahttps://analyze-me.vercel.app/";
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL}/trivia.png" />
            <meta property="fc:frame:button:1" content="Play Trivia" />
            <meta property="fc:frame:button:1:action" content="post" />
            <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/triviaFrame" />
          </head>
        </html>
      `;
      
      res.status(200).send(html);
    } else if (currentQuestion) { // Answer selected
      const userAnswer = currentQuestion.incorrect_answers[buttonIndex - 1] || currentQuestion.correct_answer;
      const isCorrect = userAnswer === currentQuestion.correct_answer;
      
      const resultText = isCorrect ? "Correct! Well done!" : `Sorry, that's incorrect. The correct answer was: ${currentQuestion.correct_answer}`;
      const ogImageUrl = generateOgImageUrl(resultText, false, isCorrect);
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${ogImageUrl}" />
            <meta property="fc:frame:button:1" content="Share" />
            <meta property="fc:frame:button:1:action" content="link" />
            <meta property="fc:frame:button:1:target" content="https://warpcast.com/~/compose?text=Take a break and play some trivia!%0A%0AFrame by @aaronv%0A%0Ahttps://analyze-me.vercel.app/" />
            <meta property="fc:frame:button:2" content="Next Question" />
          </head>
        </html>
      `;
      
      res.status(200).send(html);
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}