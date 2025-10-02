import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || 'your_gemini_api_key_here';
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateWellnessAdvice = async (weatherData, userMessage = '') => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const weatherContext = formatWeatherForPrompt(weatherData);
    
    const prompt = `
あなたは日本語を話すウェルネスアシスタントです。天気情報を基に、健康と生活に関するアドバイスを自然な日本語で提供してください。

現在の天気情報:
${weatherContext}

ユーザーからのメッセージ: ${userMessage || '今日の健康アドバイスをお願いします'}

以下の観点から、具体的で実用的なアドバイスを日本語で提供してください：

1. **健康管理**: 気温、湿度、紫外線に基づく健康上の注意点
2. **服装提案**: 天気に適した服装の具体的な提案
3. **食事・栄養**: 日本の食文化に合った、天気に応じた食事提案
4. **心の健康**: 天気による心理的影響への対処法
5. **生活のアドバイス**: 通勤、洗濯、園芸など日常生活への影響

レスポンスは親しみやすく、150-300文字程度の自然な日本語でお願いします。絵文字も適度に使用してください。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'すみません、ウェルネスアドバイスの生成中にエラーが発生しました。もう一度お試しください。🙇‍♀️';
  }
};

const formatWeatherForPrompt = (weatherData) => {
  if (!weatherData) return '天気情報が利用できません';
  
  const {
    main: { temp, feels_like, humidity, pressure } = {},
    weather: [{ description, main: weatherMain }] = [{}],
    wind: { speed } = {},
    visibility,
    sys: { sunrise, sunset } = {},
    name: cityName
  } = weatherData;

  const uvIndex = weatherData.uvi || 'データなし';
  
  return `
場所: ${cityName}
気温: ${temp}°C (体感温度: ${feels_like}°C)
天気: ${description} (${weatherMain})
湿度: ${humidity}%
気圧: ${pressure}hPa
風速: ${speed}m/s
視界: ${visibility ? `${visibility/1000}km` : 'データなし'}
紫外線指数: ${uvIndex}
日の出: ${sunrise ? new Date(sunrise * 1000).toLocaleTimeString('ja-JP') : 'データなし'}
日の入り: ${sunset ? new Date(sunset * 1000).toLocaleTimeString('ja-JP') : 'データなし'}
`;
};

export const generateResponseToUserInput = async (userInput, weatherData, conversationHistory = []) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const weatherContext = formatWeatherForPrompt(weatherData);
    const historyContext = conversationHistory.length > 0 
      ? conversationHistory.slice(-4).map(msg => `${msg.sender}: ${msg.text}`).join('\n')
      : '';

    const prompt = `
あなたは日本語を話すウェルネスアシスタントです。ユーザーの質問や発言に対して、天気情報を考慮した健康・ウェルネスの観点から適切に応答してください。

現在の天気情報:
${weatherContext}

${historyContext ? `最近の会話:\n${historyContext}\n` : ''}

ユーザーの発言: ${userInput}

以下の点を考慮して応答してください：
- 天気と関連付けた健康・ウェルネスのアドバイス
- 日本の文化や習慣に適した提案
- 親しみやすく自然な日本語
- 具体的で実用的な内容
- 150-300文字程度

応答には適度に絵文字を使用し、温かみのある口調でお願いします。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'すみません、お返事の生成中にエラーが発生しました。もう一度お試しください。🙇‍♀️';
  }
};
