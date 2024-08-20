import axios from 'axios';

const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;
let questionCache = [];

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

async function handleNextQuestion(res) {
  const currentQuestion = await getValidQuestion();
  const answers = [currentQuestion.correct_answer, ...currentQuestion.incorrect_answers].sort(() => Math.random() - 0.5);
  const decodedQuestion = decodeHtmlEntities(currentQuestion.question);
  const ogImageUrl = `${VERCEL_OG_API}?text=${encodeURIComponent(decodedQuestion)}`;

  console.log("Setting currentQuestion:", JSON.stringify(currentQuestion)); // Debugging: Log currentQuestion

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
        <meta property="fc:frame:post_url" content="https://farcaster-trivia-one.vercel.app/api/answer" />
        <meta property="fc:frame:button:untrustedData" content='${JSON.stringify({ currentQuestion })}' />
      </head>
    </html>
  `);
}

export default async function handler(req, res) {
  console.log('Received request to triviaFrame handler');
  console.log('Request method:', req.method);

  try {
    if (req.method === 'POST') {
      const untrustedData = req.body?.untrustedData;

      if (!untrustedData) {
        console.error('No untrustedData in request body');
        return res.status(400).json({ error: 'Invalid request: missing untrustedData' });
      }

      return handleNextQuestion(res);
    } else {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
