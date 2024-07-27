import axios from 'axios';

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const API_URL = 'https://api.anthropic.com/v1/messages';

export const getClaudeResponse = async (userMessage) => {
  try {
    const response = await axios.post(API_URL, {
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides brief and informative descriptions of locations."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userMessage
            }
          ]
        }
      ]
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching response from Claude:', error);
    throw error;
  }
};
