import axios from 'axios';
import he from 'he';

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

function optimizeAnswerText(text) {
  const trimmed = text.trim();
  const lowercased = trimmed.toLowerCase();
  const words = lowercased.split(' ');
  const stopWords = ['the', 'a', 'an'];
  if (stopWords.includes(words[0])) {
    return words.slice(1).join(' ');
  }
  return trimmed;
}

export default async function handler(req, res) {
  if (req.method === 'POST' || req.method === 'GET') {
    let buttonIndex = 0;
    if (req.method === 'POST') {
      const { untrustedData } = req.body;
      buttonIndex = untrustedData.buttonIndex;
    }

    if (!currentQuestion || buttonIndex === 5) { // New question or "Next Question" pressed
      currentQuestion = await fetchTriviaQuestion();
      const answers = [currentQuestion.correct_answer, ...currentQuestion.incorrect_answers].sort(() => Math.random() - 0.5);
      const decodedQuestion = he.decode(currentQuestion.question);
      const ogImageUrl = generateOgImageUrl(decodedQuestion);
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${ogImageUrl}" />
            <meta property="fc:frame:button:1" content="${optimizeAnswerText(he.decode(answers[0]))}" />
            <meta property="fc:frame:button:2" content="${optimizeAnswerText(he.decode(answers[1]))}" />
            <meta property="fc:frame:button:3" content="${optimizeAnswerText(he.decode(answers[2]))}" />
            <meta property="fc:frame:button:4" content="${optimizeAnswerText(he.decode(answers[3]))}" />
            <meta property="fc:frame:button:5" content="Next Question" />
          </head>
        </html>
      `;
      
      res.status(200).send(html);
    } else if (currentQuestion && buttonIndex > 0 && buttonIndex < 5) { // Answer selected
      const userAnswer = currentQuestion.incorrect_answers[buttonIndex - 2] || currentQuestion.correct_answer;
      const isCorrect = userAnswer === currentQuestion.correct_answer;
      
      const resultText = isCorrect ? "Correct! Well done!" : `Sorry, that's incorrect. The correct answer was: ${he.decode(currentQuestion.correct_answer)}`;
      const ogImageUrl = generateOgImageUrl(resultText, false, isCorrect);
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${ogImageUrl}" />
            <meta property="fc:frame:button:1" content="Next Question" />
            <meta property="fc:frame:button:2" content="Share" />
            <meta property="fc:frame:button:2:action" content="link" />
            <meta property="fc:frame:button:2:target" content="https://warpcast.com/~/compose?text=I just played Farcaster Trivia! Can you beat my score?%0A%0APlay now: https://farcaster-trivia-one.vercel.app/" />
          </head>
        </html>
      `;
      
      res.status(200).send(html);
    } else {
      // Handle initial GET request or invalid button index
      const ogImageUrl = generateOgImageUrl("Welcome to Farcaster Trivia!");
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${ogImageUrl}" />
            <meta property="fc:frame:button:1" content="Start Trivia" />
          </head>
        </html>
      `;
      res.status(200).send(html);
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}