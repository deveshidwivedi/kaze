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
You are an English-speaking wellness assistant. Provide a short welcome message with current weather summary, followed by topics the user can ask about.

Current weather information:
${weatherContext}

User message: ${userMessage || "Please give me today's weather summary"}

Structure your response as follows:
1. Brief current weather summary (2-3 sentences)
2. Then say "You can ask me about:" followed by 4-5 weather-related topics they can inquire about

Keep the entire response under 100 words. Write naturally without formatting symbols. Be conversational and helpful.

Example: "It's currently 20°C with clear skies in your area. The humidity is moderate at 65%. You can ask me about clothing recommendations for today's weather, health tips for this temperature, outdoor activity suggestions, food choices that suit today's conditions, or mental wellness advice for sunny days."
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Sorry, an error occurred while generating wellness advice. Please try again. 🙇‍♀️";
  }
};

const formatWeatherForPrompt = (weatherData) => {
  if (!weatherData) return "Weather information not available";

  const {
    main: { temp, feels_like, humidity, pressure } = {},
    weather: [{ description, main: weatherMain }] = [{}],
    wind: { speed } = {},
    visibility,
    sys: { sunrise, sunset } = {},
    name: cityName,
  } = weatherData;

  const uvIndex = weatherData.uvi || "No data";

  return `
Location: ${cityName}
Temperature: ${temp}°C (feels like: ${feels_like}°C)
Weather: ${description} (${weatherMain})
Humidity: ${humidity}%
Pressure: ${pressure}hPa
Wind speed: ${speed}m/s
Visibility: ${visibility ? `${visibility / 1000}km` : "No data"}
UV Index: ${uvIndex}
Sunrise: ${
    sunrise ? new Date(sunrise * 1000).toLocaleTimeString("en-US") : "No data"
  }
Sunset: ${
    sunset ? new Date(sunset * 1000).toLocaleTimeString("en-US") : "No data"
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
You are an English-speaking wellness assistant. Answer the user's question concisely and naturally.

Current weather information:
${weatherContext}

${historyContext ? `Recent conversation:\n${historyContext}\n` : ""}

User question: ${userInput}

Provide a helpful, concise answer related to their question and the current weather. Keep it under 80 words, be conversational, and avoid any formatting symbols. Focus on practical advice.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Sorry, an error occurred while generating response. Please try again. 🙇‍♀️";
  }
};
