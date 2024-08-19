import axios from 'axios';

const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;
let currentQuestion = null;

async function fetchTriviaQuestion() {
  while (true) {
    const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
    const question = response.data.results[0];
    const allAnswers = [question.correct_answer, ...question.incorrect_answers];
    if (allAnswers.every(answer => optimizeAnswerText(decodeHtmlEntities(answer)).length <= 11)) {
      console.log('Found suitable question:', question);
      return question;
    }
    console.log('Skipping question due to long answers:', question);
  }
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
  console.log('Received request:', req.method, req.url);
  console.log('Request body:', req.body);

  try {
    if (req.method === 'POST') {
      console.log('Handling POST request');
      const { untrustedData } = req.body;
      const buttonIndex = untrustedData.buttonIndex;
      console.log('Button index:', buttonIndex);

      if (!currentQuestion || buttonIndex === 1) { // New question or "Next Question" pressed
        console.log('Fetching new question');
        currentQuestion = await fetchTriviaQuestion();
        const answers = [currentQuestion.correct_answer, ...currentQuestion.incorrect_answers].sort(() => Math.random() - 0.5);
        const decodedQuestion = decodeHtmlEntities(currentQuestion.question);
        const ogImageUrl = generateOgImageUrl(decodedQuestion);
        
        console.log('Sending question frame');
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
          </html>
        `);
      } else if (currentQuestion && buttonIndex > 0 && buttonIndex <= 4) { // Answer selected
        console.log('Processing answer');
        const userAnswer = currentQuestion.incorrect_answers[buttonIndex - 2] || currentQuestion.correct_answer;
        const isCorrect = userAnswer === currentQuestion.correct_answer;
        
        const resultText = isCorrect ? "Correct! Well done!" : `Sorry, that's incorrect. The correct answer was: ${decodeHtmlEntities(currentQuestion.correct_answer)}`;
        const ogImageUrl = generateOgImageUrl(resultText, false, isCorrect);
        
        console.log('Sending result frame');
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
          </html>
        `);
      }
    } else if (req.method === 'GET') {
      console.log('Handling GET request');
      // Handle initial GET request
      const ogImageUrl = generateOgImageUrl("Welcome to Farcaster Trivia!");
      console.log('Sending welcome frame');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${ogImageUrl}" />
            <meta property="fc:frame:button:1" content="Start Trivia" />
          </head>
        </html>
      `);
    } else {
      console.log('Method not allowed:', req.method);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in handler:', error);
    return res.status(500).send('Internal Server Error');
  }
}