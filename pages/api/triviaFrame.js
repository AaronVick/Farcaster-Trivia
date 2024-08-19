import axios from 'axios';

const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;
let questionCache = [];
let currentQuestion = null;

async function fetchTriviaQuestions() {
  if (questionCache.length > 0) {
    return questionCache.pop();
  }

  try {
    const response = await axios.get('https://opentdb.com/api.php?amount=5&type=multiple');
    questionCache = response.data.results;
    return questionCache.pop();
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw new Error('Failed to fetch trivia questions');
  }
}

async function getValidQuestion() {
  for (let i = 0; i < 3; i++) {
    const question = await fetchTriviaQuestions();
    const allAnswers = [question.correct_answer, ...question.incorrect_answers];
    if (allAnswers.every(answer => optimizeAnswerText(decodeHtmlEntities(answer)).length <= 15)) {
      return question;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Could not find a suitable question');
}

function generateOgImageUrl(text, isQuestion = true, isCorrect = null) {
  const params = new URLSearchParams({
    text: text,
    type: isQuestion ? 'question' : 'result',
    result: isCorrect === null ? '' : isCorrect ? 'correct' : 'incorrect'
  });
  return `${VERCEL_OG_API}?${params.toString()}`;
}

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

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const ogImageUrl = generateOgImageUrl("Welcome to Farcaster Trivia!");
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${ogImageUrl}" />
            <meta property="fc:frame:button:1" content="Start Trivia" />
          </head>
          <body></body>
        </html>
      `);
    } else if (req.method === 'POST') {
      const { untrustedData } = req.body;
      const buttonIndex = untrustedData?.buttonIndex;

      if (!currentQuestion || buttonIndex === 1) {
        currentQuestion = await getValidQuestion();
        const answers = [currentQuestion.correct_answer, ...currentQuestion.incorrect_answers].sort(() => Math.random() - 0.5);
        const decodedQuestion = decodeHtmlEntities(currentQuestion.question);
        const ogImageUrl = generateOgImageUrl(decodedQuestion);

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${ogImageUrl}" />
              <meta property="fc:frame:button:1" content="${optimizeAnswerText(decodeHtmlEntities(answers[0]))}" />
              <meta property="fc:frame:button:2" content="${optimizeAnswerText(decodeHtmlEntities(answers[1]))}" />
              <meta property="fc:frame:button:3" content="${optimizeAnswerText(decodeHtmlEntities(answers[2]))}" />
              <meta property="fc:frame:button:4" content="${optimizeAnswerText(decodeHtmlEntities(answers[3]))}" />
            </head>
            <body></body>
          </html>
        `);
      } else if (currentQuestion && buttonIndex > 1 && buttonIndex <= 4) {
        const userAnswer = currentQuestion.incorrect_answers[buttonIndex - 2] || currentQuestion.correct_answer;
        const isCorrect = userAnswer === currentQuestion.correct_answer;

        const resultText = isCorrect 
          ? "Correct! Well done!" 
          : `Sorry, that's incorrect. The correct answer was: ${decodeHtmlEntities(currentQuestion.correct_answer)}`;

        const ogImageUrl = generateOgImageUrl(resultText, false, isCorrect);

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(`
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
            <body></body>
          </html>
        `);
      } else {
        res.setHeader('Content-Type', 'text/html');
        return res.status(400).send('Invalid request');
      }
    } else {
      res.setHeader('Content-Type', 'text/html');
      return res.status(405).send(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in handler:', error);
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send('Internal Server Error: ' + error.message);
  }
}