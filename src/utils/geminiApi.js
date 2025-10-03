import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY =
  process.env.REACT_APP_GEMINI_API_KEY || "your_gemini_api_key_here";
const genAI = new GoogleGenerativeAI(API_KEY);

// cache resolved model to avoid repeated discovery calls
let resolvedModelId = null;

//  discover an available model that supports generateContent
async function resolveModelId() {
  if (resolvedModelId) return resolvedModelId;

  // preferred models
  const preference = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro",
    "gemini-pro",
  ];

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`
    );
    if (!resp.ok) throw new Error(`ListModels failed: ${resp.status}`);
    const data = await resp.json();
    const models = Array.isArray(data.models) ? data.models : [];

    //  only models that support generateContent
    const supported = models.filter(
      (m) =>
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes("generateContent")
    );

    // match preferences first
    for (const pref of preference) {
      const match = supported.find(
        (m) =>
          m.name?.endsWith(pref) || m.displayName?.toLowerCase().includes(pref)
      );
      if (match) {
        resolvedModelId = match.name.replace("models/", "");
        return resolvedModelId;
      }
    }

    // fallback to first supported model
    if (supported.length > 0) {
      resolvedModelId = supported[0].name.replace("models/", "");
      return resolvedModelId;
    }
  } catch (err) {
    console.warn(
      "Model discovery failed, will try preference list directly:",
      err
    );
  }

  resolvedModelId = "gemini-1.5-flash";
  return resolvedModelId;
}

export const generateWellnessAdvice = async (weatherData, userMessage = "") => {
  try {
    const modelId = await resolveModelId();
    const model = genAI.getGenerativeModel({ model: modelId });

    const weatherContext = formatWeatherForPrompt(weatherData);

    const prompt = `
あなたは日本語を話すウェルネスアシスタントです。現在の天気の要約と、ユーザーが質問できるトピックを含む短い歓迎メッセージを提供してください。

現在の天気情報:
${weatherContext}

ユーザーからのメッセージ: ${userMessage || "今日の天気の概要を教えてください"}

以下の構造で応答してください：
1. 簡潔な現在の天気の要約（2-3文）
2. 「以下についてお聞きいただけます：」と言って、4-5個の天気関連のトピックを続ける

応答全体を100単語以内に収めてください。フォーマット記号を使わず、自然に書いてください。会話的で親しみやすくしてください。

例: "現在、お住まいの地域は20°Cで晴天です。湿度は65%と適度です。以下についてお聞きいただけます：今日の天気に適した服装のおすすめ、この気温での健康のコツ、屋外活動の提案、今日の状況に適した食べ物の選択、または晴れた日のメンタルウェルネスアドバイス。"
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    return "すみません、ウェルネスアドバイスの生成中にエラーが発生しました。もう一度お試しください。🙇‍♀️";
  }
};

const formatWeatherForPrompt = (weatherData) => {
  if (!weatherData) return "天気情報が利用できません";

  const {
    main: { temp, feels_like, humidity, pressure } = {},
    weather: [{ description, main: weatherMain }] = [{}],
    wind: { speed } = {},
    visibility,
    sys: { sunrise, sunset } = {},
    name: cityName,
  } = weatherData;

  const uvIndex = weatherData.uvi || "データなし";

  return `
場所: ${cityName}
気温: ${temp}°C (体感温度: ${feels_like}°C)
天気: ${description} (${weatherMain})
湿度: ${humidity}%
気圧: ${pressure}hPa
風速: ${speed}m/s
視界: ${visibility ? `${visibility / 1000}km` : "データなし"}
紫外線指数: ${uvIndex}
日の出: ${
    sunrise
      ? new Date(sunrise * 1000).toLocaleTimeString("ja-JP")
      : "データなし"
  }
日の入り: ${
    sunset ? new Date(sunset * 1000).toLocaleTimeString("ja-JP") : "データなし"
  }
`;
};

export const generateResponseToUserInput = async (
  userInput,
  weatherData,
  conversationHistory = []
) => {
  try {
    const modelId = await resolveModelId();
    const model = genAI.getGenerativeModel({ model: modelId });

    const weatherContext = formatWeatherForPrompt(weatherData);
    const historyContext =
      conversationHistory.length > 0
        ? conversationHistory
            .slice(-4)
            .map((msg) => `${msg.sender}: ${msg.text}`)
            .join("\n")
        : "";

    const prompt = `
あなたは日本語を話すウェルネスアシスタントです。ユーザーの質問に簡潔で自然に答えてください。

現在の天気情報:
${weatherContext}

${historyContext ? `最近の会話:\n${historyContext}\n` : ""}

ユーザーの質問: ${userInput}

ユーザーの質問と現在の天気に関連した役立つ簡潔な回答を提供してください。80語以内に収め、会話的にし、フォーマット記号は避けてください。実用的なアドバイスに焦点を当ててください。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    return "すみません、お返事の生成中にエラーが発生しました。もう一度お試しください。🙇‍♀️";
  }
};
